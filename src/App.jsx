import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import { usePresence } from './hooks/usePresence'
import { generateRoomCode, parseWordList, speakerNumberForTurn, getStages, PLOTS } from './lib/gameLogic'
import { saveSession, loadSession, clearSession } from './lib/session'
import Home from './screens/Home'
import JoinForm from './screens/JoinForm'
import Lobby from './screens/Lobby'
import PlotWheel from './components/PlotWheel'
import GameBoard from './screens/GameBoard'
import Results from './screens/Results'

function getRoomCodeFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('room') || ''
}

function setRoomCodeInUrl(code) {
  const url = new URL(window.location.href)
  if (code) url.searchParams.set('room', code)
  else url.searchParams.delete('room')
  window.history.replaceState({}, '', url.toString())
}

// Merge a postgres_changes payload into a list keyed by id.
function applyChange(payload, list) {
  if (payload.eventType === 'INSERT') {
    if (list.some((r) => r.id === payload.new.id)) return list
    return [...list, payload.new]
  }
  if (payload.eventType === 'UPDATE') {
    return list.map((r) => (r.id === payload.new.id ? payload.new : r))
  }
  if (payload.eventType === 'DELETE') {
    return list.filter((r) => r.id !== payload.old.id)
  }
  return list
}

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [userId, setUserId] = useState(null)

  const [roomCode, setRoomCodeState] = useState(getRoomCodeFromUrl)
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [cards, setCards] = useState([])
  const [selections, setSelections] = useState([])

  const [loadingRoom, setLoadingRoom] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Whether the "spin the wheel" reveal screen has been dismissed. Defaults
  // to true (skip it) unless we actually see the plot get decided while this
  // client is mounted — see the effect below.
  const [plotRevealed, setPlotRevealed] = useState(true)
  const prevPlotIdRef = useRef(undefined)
  const prevRoomIdRef = useRef(undefined)

  // --- Auth: anonymous session ------------------------------------------------
  useEffect(() => {
    let cancelled = false

    function withTimeout(promise, ms) {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ])
    }

    async function initAuth() {
      try {
        const { data: sessionData } = await withTimeout(supabase.auth.getSession(), 10000)
        let uid = sessionData?.session?.user?.id
        if (!uid) {
          const { data, error } = await withTimeout(supabase.auth.signInAnonymously(), 10000)
          if (error) throw error
          uid = data?.user?.id
        }
        if (!cancelled) {
          setUserId(uid)
          setAuthReady(true)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setErrorMessage(
            err?.message === 'timeout'
              ? 'Could not reach Supabase. Check your internet connection and your VITE_SUPABASE_URL.'
              : `Could not start a session: ${err?.message || 'unknown error'}. Check your .env values.`
          )
        }
      }
    }
    initAuth()
    return () => {
      cancelled = true
    }
  }, [])

  const navigateToRoom = useCallback((code) => {
    setRoomCodeInUrl(code)
    setRoomCodeState(code)
  }, [])

  // --- Load room + attempt to resume a saved session --------------------------
  useEffect(() => {
    if (!authReady || !roomCode) return
    let cancelled = false

    async function load() {
      setLoadingRoom(true)
      setErrorMessage('')
      const { data: roomRow, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .maybeSingle()

      if (cancelled) return

      if (error || !roomRow) {
        setErrorMessage('This room could not be found. Double-check the invite link.')
        setLoadingRoom(false)
        return
      }

      const [{ data: playerRows }, { data: cardRows }, { data: selectionRows }] = await Promise.all([
        supabase.from('players').select('*').eq('room_id', roomRow.id).order('player_number'),
        supabase.from('cards').select('*').eq('room_id', roomRow.id).order('order_index'),
        supabase.from('turn_selections').select('*').eq('room_id', roomRow.id),
      ])

      if (cancelled) return

      setRoom(roomRow)
      setPlayers(playerRows || [])
      setCards(cardRows || [])
      setSelections(selectionRows || [])
      setLoadingRoom(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authReady, roomCode])

  // --- Realtime subscriptions --------------------------------------------------
  useEffect(() => {
    if (!room?.id) return undefined

    const channel = supabase
      .channel(`room-sync-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => setRoom(payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
        (payload) => setPlayers((prev) => applyChange(payload, prev))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `room_id=eq.${room.id}` },
        (payload) => setCards((prev) => applyChange(payload, prev))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'turn_selections', filter: `room_id=eq.${room.id}` },
        (payload) => setSelections((prev) => applyChange(payload, prev))
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.id])

  const myPlayer = useMemo(
    () => players.find((p) => p.user_id === userId) || null,
    [players, userId]
  )

  const partnerOnline = usePresence(room?.id, userId, myPlayer?.player_number)
  const partnerIsOnline = useMemo(() => {
    if (!myPlayer) return true
    const partner = players.find((p) => p.id !== myPlayer.id)
    if (!partner) return true
    return partnerOnline.includes(partner.player_number)
  }, [partnerOnline, players, myPlayer])

  // --- Actions -----------------------------------------------------------------

  const handleCreate = useCallback(
    async (name) => {
      setBusy(true)
      setErrorMessage('')
      try {
        const code = generateRoomCode()
        const { data: roomRow, error: roomError } = await supabase
          .from('rooms')
          .insert({ room_code: code, host_user_id: userId })
          .select()
          .single()
        if (roomError) throw roomError

        const { data: playerRow, error: playerError } = await supabase
          .from('players')
          .insert({ room_id: roomRow.id, user_id: userId, display_name: name, player_number: 1 })
          .select()
          .single()
        if (playerError) throw playerError

        saveSession(code, { userId, playerId: playerRow.id, playerNumber: 1 })
        setRoom(roomRow)
        setPlayers([playerRow])
        setCards([])
        setSelections([])
        navigateToRoom(code)
      } catch (err) {
        console.error(err)
        setErrorMessage('Could not create the room. Please try again.')
      } finally {
        setBusy(false)
      }
    },
    [userId, navigateToRoom]
  )

  const handleJoinByCode = useCallback(
    (code) => {
      setErrorMessage('')
      navigateToRoom(code.toUpperCase())
    },
    [navigateToRoom]
  )

  const handleJoinAsPlayer = useCallback(
    async (name) => {
      if (!room) return
      setBusy(true)
      setErrorMessage('')
      try {
        const { data: playerRow, error } = await supabase
          .from('players')
          .insert({ room_id: room.id, user_id: userId, display_name: name, player_number: 2 })
          .select()
          .single()
        if (error) throw error
        saveSession(room.room_code, { userId, playerId: playerRow.id, playerNumber: 2 })
        setPlayers((prev) => (prev.some((p) => p.id === playerRow.id) ? prev : [...prev, playerRow]))
      } catch (err) {
        console.error(err)
        setErrorMessage('This spot may have just been taken. Refresh and try again.')
      } finally {
        setBusy(false)
      }
    },
    [room, userId]
  )

  const handleWordsChange = useCallback(
    async (raw) => {
      if (!room || room.status !== 'lobby') return
      const words = parseWordList(raw)
      // Full replace is simple and safe pre-game: delete existing cards, insert the new set.
      const existingIds = cards.map((c) => c.id)
      if (existingIds.length > 0) {
        await supabase.from('cards').delete().in('id', existingIds)
      }
      if (words.length > 0) {
        const rows = words.map((text, i) => ({ room_id: room.id, text, order_index: i }))
        const { data } = await supabase.from('cards').insert(rows).select()
        setCards(data || [])
      } else {
        setCards([])
      }
    },
    [room, cards]
  )

  const handleRemoveCard = useCallback(
    async (card) => {
      await supabase.from('cards').delete().eq('id', card.id)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
    },
    []
  )

  const handleStart = useCallback(async () => {
    if (!room) return
    setBusy(true)
    try {
      const firstSpeaker = Math.random() < 0.5 ? 1 : 2
      const { data, error } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          first_speaker: firstSpeaker,
          current_turn: 1,
          turn_phase: 'active',
          plot_id: null,
        })
        .eq('id', room.id)
        .select()
        .single()
      if (error) throw error
      setRoom(data)
    } catch (err) {
      console.error(err)
      setErrorMessage('Could not start the game. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [room])

  const handleSpinPlot = useCallback(async () => {
    if (!room || room.plot_id) return
    const choice = PLOTS[Math.floor(Math.random() * PLOTS.length)]
    try {
      const { data } = await supabase
        .from('rooms')
        .update({ plot_id: choice.id })
        .eq('id', room.id)
        .is('plot_id', null)
        .select()
        .maybeSingle()
      if (data) {
        setRoom(data)
      } else {
        // Someone else's spin already landed first — pick up their result.
        const { data: fresh } = await supabase.from('rooms').select('*').eq('id', room.id).single()
        if (fresh) setRoom(fresh)
      }
    } catch (err) {
      console.error(err)
    }
  }, [room])

  const handleRespinPlot = useCallback(async () => {
    if (!room) return
    try {
      const { data } = await supabase
        .from('rooms')
        .update({ plot_id: null })
        .eq('id', room.id)
        .select()
        .single()
      if (data) setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }, [room])

  const myUnfamiliarIds = useMemo(
    () =>
      new Set(
        selections
          .filter(
            (s) => s.turn_number === 0 && s.selection_type === 'marked_unfamiliar' && s.player_id === myPlayer?.id
          )
          .map((s) => s.card_id)
      ),
    [selections, myPlayer]
  )

  const handleToggleUnfamiliar = useCallback(
    async (card) => {
      if (!room || !myPlayer) return
      const existing = selections.find(
        (s) =>
          s.turn_number === 0 &&
          s.selection_type === 'marked_unfamiliar' &&
          s.player_id === myPlayer.id &&
          s.card_id === card.id
      )
      if (existing) {
        await supabase.from('turn_selections').delete().eq('id', existing.id)
        setSelections((prev) => prev.filter((s) => s.id !== existing.id))
      } else {
        const { data } = await supabase
          .from('turn_selections')
          .insert({
            room_id: room.id,
            turn_number: 0,
            player_id: myPlayer.id,
            card_id: card.id,
            selection_type: 'marked_unfamiliar',
          })
          .select()
          .single()
        if (data) setSelections((prev) => [...prev, data])
      }
    },
    [room, myPlayer, selections]
  )

  const currentTurnSelections = useMemo(
    () => selections.filter((s) => s.turn_number === room?.current_turn),
    [selections, room?.current_turn]
  )

  const handleToggleSelection = useCallback(
    async (card) => {
      if (!room || !myPlayer) return
      const speakerNumber = speakerNumberForTurn(room.current_turn, room.first_speaker)
      const selectionType = myPlayer.player_number === speakerNumber ? 'speaker_claim' : 'listener_heard'
      const existing = currentTurnSelections.find(
        (s) => s.player_id === myPlayer.id && s.card_id === card.id && s.selection_type === selectionType
      )
      if (existing) {
        await supabase.from('turn_selections').delete().eq('id', existing.id)
        setSelections((prev) => prev.filter((s) => s.id !== existing.id))
      } else {
        const { data } = await supabase
          .from('turn_selections')
          .insert({
            room_id: room.id,
            turn_number: room.current_turn,
            player_id: myPlayer.id,
            card_id: card.id,
            selection_type: selectionType,
          })
          .select()
          .single()
        if (data) setSelections((prev) => [...prev, data])
      }
    },
    [room, myPlayer, currentTurnSelections]
  )

  const handleEndTurn = useCallback(async () => {
    if (!room) return
    const { data } = await supabase
      .from('rooms')
      .update({ turn_phase: 'awaiting_confirm' })
      .eq('id', room.id)
      .select()
      .single()
    if (data) setRoom(data)
  }, [room])

  const handleConfirmHeard = useCallback(async () => {
    if (!room) return
    // Re-fetch the freshest selections for this turn to avoid racing local state.
    const { data: freshSelections } = await supabase
      .from('turn_selections')
      .select('*')
      .eq('room_id', room.id)
      .eq('turn_number', room.current_turn)

    const speakerIds = new Set(
      (freshSelections || []).filter((s) => s.selection_type === 'speaker_claim').map((s) => s.card_id)
    )
    const listenerIds = new Set(
      (freshSelections || []).filter((s) => s.selection_type === 'listener_heard').map((s) => s.card_id)
    )
    const validatedIds = [...speakerIds].filter((id) => listenerIds.has(id))
    const notConfirmedIds = new Set([...speakerIds, ...listenerIds].filter((id) => !validatedIds.includes(id)))

    const cardById = new Map(cards.map((c) => [c.id, c]))
    const stageNumber = room.current_turn // one turn = one stage

    if (validatedIds.length > 0) {
      await supabase
        .from('cards')
        .update({ status: 'validated', validated_stage: stageNumber, validated_turn: room.current_turn })
        .in('id', validatedIds)
    }

    const result = {
      validated: validatedIds.map((id) => ({ id, text: cardById.get(id)?.text || '' })),
      notConfirmed: [...notConfirmedIds].map((id) => ({ id, text: cardById.get(id)?.text || '' })),
    }

    const { data } = await supabase
      .from('rooms')
      .update({ turn_phase: 'reviewing', last_turn_result: result })
      .eq('id', room.id)
      .select()
      .single()
    if (data) setRoom(data)

    if (validatedIds.length > 0) {
      setCards((prev) =>
        prev.map((c) =>
          validatedIds.includes(c.id)
            ? { ...c, status: 'validated', validated_stage: stageNumber, validated_turn: room.current_turn }
            : c
        )
      )
    }
  }, [room, cards])

  const handleContinue = useCallback(async () => {
    if (!room) return
    const totalTurns = getStages(room.plot_id).length
    const elapsedSeconds = room.turn_started_at
      ? Math.max(0, Math.round((Date.now() - new Date(room.turn_started_at).getTime()) / 1000))
      : 0
    const stageDurations = { ...(room.stage_durations || {}), [room.current_turn]: elapsedSeconds }

    if (room.current_turn >= totalTurns) {
      const { data } = await supabase
        .from('rooms')
        .update({ status: 'finished', turn_phase: 'finished', stage_durations: stageDurations })
        .eq('id', room.id)
        .select()
        .single()
      if (data) setRoom(data)
    } else {
      const { data } = await supabase
        .from('rooms')
        .update({
          current_turn: room.current_turn + 1,
          turn_phase: 'active',
          last_turn_result: null,
          stage_durations: stageDurations,
          turn_started_at: new Date().toISOString(),
        })
        .eq('id', room.id)
        .select()
        .single()
      if (data) setRoom(data)
    }
  }, [room])

  const handleBeginStory = useCallback(async () => {
    setPlotRevealed(true)
    if (!room || room.turn_started_at) return
    try {
      const { data } = await supabase
        .from('rooms')
        .update({ turn_started_at: new Date().toISOString() })
        .eq('id', room.id)
        .is('turn_started_at', null)
        .select()
        .maybeSingle()
      if (data) setRoom(data)
    } catch (err) {
      console.error(err)
    }
  }, [room])

  // Show the "spin the wheel" reveal whenever the plot has just been decided
  // while we're here — for either the player who clicked spin, or their
  // partner watching it happen live. If we load into a room that already has
  // a plot (e.g. a refresh mid-game), skip straight past it.
  useEffect(() => {
    if (!room) return
    if (prevRoomIdRef.current !== room.id) {
      // Entered a different room — reset tracking and decide fresh.
      prevRoomIdRef.current = room.id
      prevPlotIdRef.current = room.plot_id
      setPlotRevealed(!!room.plot_id)
      return
    }
    const prevPlotId = prevPlotIdRef.current
    if (prevPlotId === null && room.plot_id) {
      setPlotRevealed(false)
    }
    prevPlotIdRef.current = room.plot_id
  }, [room?.id, room?.plot_id])

  const handlePlayAgain = useCallback(() => {
    if (room) clearSession(room.room_code)
    setRoom(null)
    setPlayers([])
    setCards([])
    setSelections([])
    navigateToRoom('')
  }, [room, navigateToRoom])

  const handlePracticeAgain = useCallback(async () => {
    if (!room) return
    setBusy(true)
    try {
      const cardIds = cards.map((c) => c.id)
      if (cardIds.length > 0) {
        await supabase
          .from('cards')
          .update({ status: 'available', validated_stage: null, validated_turn: null })
          .in('id', cardIds)
      }
      // Clear this room's turn history (gameplay selections and the
      // pre-game "new to me" marks) so the next round starts fresh.
      await supabase.from('turn_selections').delete().eq('room_id', room.id)

      const firstSpeaker = Math.random() < 0.5 ? 1 : 2
      const { data } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          plot_id: null,
          current_turn: 1,
          turn_phase: 'active',
          first_speaker: firstSpeaker,
          last_turn_result: null,
          turn_started_at: null,
          stage_durations: {},
        })
        .eq('id', room.id)
        .select()
        .single()

      if (data) setRoom(data)
      setCards((prev) => prev.map((c) => ({ ...c, status: 'available', validated_stage: null, validated_turn: null })))
      setSelections([])
    } catch (err) {
      console.error(err)
      setErrorMessage('Could not start a new round. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [room, cards])

  // --- Resume a saved session on refresh ---------------------------------------
  useEffect(() => {
    if (!room || !userId || myPlayer) return
    const saved = loadSession(room.room_code)
    if (saved && saved.userId === userId) {
      // Player row should already be in `players` if the session is valid;
      // if it's missing (e.g. room was reset), just clear the stale session.
      const stillExists = players.some((p) => p.id === saved.playerId && p.user_id === userId)
      if (!stillExists && players.length > 0) clearSession(room.room_code)
    }
  }, [room, userId, myPlayer, players])

  // --- Render --------------------------------------------------------------------

  if (!authReady) {
    return (
      <div className="screen screen--centered">
        <p className="muted">Loading…</p>
        {errorMessage && (
          <>
            <p className="error-text">{errorMessage}</p>
            <p className="muted">
              Check that your .env file has your real Supabase URL and key, and that anonymous
              sign-ins are enabled in your Supabase project (Authentication → Providers).
            </p>
          </>
        )}
      </div>
    )
  }

  if (!roomCode) {
    return <Home onCreate={handleCreate} onJoinByCode={handleJoinByCode} busy={busy} errorMessage={errorMessage} />
  }

  if (loadingRoom || !room) {
    if (errorMessage) {
      return (
        <div className="screen screen--centered">
          <p className="error-text">{errorMessage}</p>
          <button type="button" className="btn btn--ghost" onClick={() => navigateToRoom('')}>
            Back to home
          </button>
        </div>
      )
    }
    return (
      <div className="screen screen--centered">
        <p className="muted">Loading room…</p>
      </div>
    )
  }

  if (!myPlayer) {
    if (room.status !== 'lobby' && players.length >= 1) {
      return (
        <div className="screen screen--centered">
          <p className="error-text">This game has already started without you.</p>
        </div>
      )
    }
    if (players.length >= 2) {
      return (
        <div className="screen screen--centered">
          <p className="error-text">This room is already full.</p>
        </div>
      )
    }
    const host = players.find((p) => p.player_number === 1)
    return (
      <JoinForm hostName={host?.display_name} onJoin={handleJoinAsPlayer} busy={busy} errorMessage={errorMessage} />
    )
  }

  if (room.status === 'lobby') {
    return (
      <Lobby
        room={room}
        players={players}
        cards={cards}
        myPlayer={myPlayer}
        isHost={myPlayer.player_number === 1}
        partnerOnline={partnerIsOnline}
        onWordsChange={handleWordsChange}
        onRemoveCard={handleRemoveCard}
        onStart={handleStart}
        starting={busy}
      />
    )
  }

  if (room.status === 'playing' && (!room.plot_id || !plotRevealed)) {
    return (
      <PlotWheel
        plotId={room.plot_id}
        cards={cards}
        onSpin={handleSpinPlot}
        onRespin={handleRespinPlot}
        spinDisabled={busy}
        onContinue={handleBeginStory}
        unfamiliarIds={myUnfamiliarIds}
        onToggleUnfamiliar={handleToggleUnfamiliar}
      />
    )
  }

  if (room.status === 'playing') {
    return (
      <GameBoard
        room={room}
        players={players}
        cards={cards}
        selections={currentTurnSelections}
        myPlayer={myPlayer}
        partnerOnline={partnerIsOnline}
        onToggleSelection={handleToggleSelection}
        onEndTurn={handleEndTurn}
        onConfirmHeard={handleConfirmHeard}
        onContinue={handleContinue}
      />
    )
  }

  return (
    <Results
      cards={cards}
      plotId={room.plot_id}
      players={players}
      selections={selections}
      stageDurations={room.stage_durations}
      onPlayAgain={handlePlayAgain}
      onPracticeAgain={handlePracticeAgain}
      busy={busy}
    />
  )
}
