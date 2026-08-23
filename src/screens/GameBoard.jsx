import Card from '../components/Card'
import StageThread from '../components/StageThread'
import StageTimer from '../components/StageTimer'
import TurnResult from '../components/TurnResult'
import TurnSequenceBar from '../components/TurnSequenceBar'
import { getPlot, getStages, speakerNumberForTurn } from '../lib/gameLogic'

function tiltFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000
  return (hash % 7) - 3 // -3..3 degrees
}

export default function GameBoard({
  room,
  players,
  cards,
  selections,
  myPlayer,
  partnerOnline,
  onToggleSelection,
  onEndTurn,
  onConfirmHeard,
  onContinue,
}) {
  const partner = players.find((p) => p.id !== myPlayer.id)
  const plot = getPlot(room.plot_id)
  const stages = getStages(room.plot_id)
  const totalTurns = stages.length
  const stageNumber = room.current_turn // one turn = one stage
  const stageInfo = stages[stageNumber - 1]
  const speakerNumber = speakerNumberForTurn(room.current_turn, room.first_speaker)
  const amISpeaker = myPlayer.player_number === speakerNumber
  const phase = room.turn_phase

  const availableCards = cards.filter((c) => c.status === 'available')
  const mySelectionType = amISpeaker ? 'speaker_claim' : 'listener_heard'
  const mySelectedIds = new Set(
    selections
      .filter((s) => s.player_id === myPlayer.id && s.selection_type === mySelectionType)
      .map((s) => s.card_id)
  )

  const canToggle =
    (amISpeaker && phase === 'active') || (!amISpeaker && (phase === 'active' || phase === 'awaiting_confirm'))

  const collectedByStage = cards
    .filter((c) => c.status === 'validated')
    .reduce((acc, c) => {
      const key = c.validated_stage
      if (!acc[key]) acc[key] = []
      acc[key].push(c)
      return acc
    }, {})

  if (!stageInfo) return null

  return (
    <div className="screen screen--wide">
      <TurnSequenceBar
        players={players}
        firstSpeaker={room.first_speaker}
        currentTurn={room.current_turn}
        totalTurns={totalTurns}
      />
      <StageThread stages={stages} currentStage={stageNumber} collectedByStage={collectedByStage} />

      <div className="board-status">
        <p className="board-status__stage">
          {plot?.name} — Stage {stageNumber} of {totalTurns}
        </p>
        <div className="board-status__right">
          {phase !== 'reviewing' && <StageTimer startedAt={room.turn_started_at} />}
          <p className="board-status__count">
            {availableCards.length} card{availableCards.length === 1 ? '' : 's'} remaining
            {stageNumber === totalTurns ? ' · final stage' : ''}
          </p>
        </div>
      </div>

      {!partnerOnline && (
        <div className="banner">
          Partner disconnected. Waiting for them to reconnect…
        </div>
      )}

      {phase === 'reviewing' ? (
        <TurnResult
          result={room.last_turn_result}
          onContinue={onContinue}
          isLastTurn={room.current_turn >= totalTurns}
        />
      ) : (
        <>
          <div className="panel panel--turn">
            {amISpeaker ? (
              <>
                <p className="eyebrow">Your turn</p>
                <h2>{stageInfo.name}</h2>
                <p className="muted">Continue what your partner created. Do not restart the story.</p>
                <p className="muted">Try to use at least 2 expressions while you speak.</p>
              </>
            ) : (
              <>
                <p className="eyebrow">{partner?.display_name || 'Your partner'} is speaking</p>
                <h2>Listen carefully and mark every expression you hear.</h2>
                {phase === 'active' && (
                  <p className="muted">You can keep marking until they finish their turn.</p>
                )}
              </>
            )}
          </div>

          <div className="card-grid">
            {cards.map((card) => {
              const isValidated = card.status === 'validated'
              const isSelected = mySelectedIds.has(card.id)
              const state = isValidated ? 'validated' : isSelected ? 'selected' : 'idle'
              return (
                <Card
                  key={card.id}
                  text={card.text}
                  rotation={tiltFor(card.id)}
                  state={state}
                  disabled={isValidated || !canToggle}
                  onClick={() => onToggleSelection(card)}
                />
              )
            })}
          </div>

          <div className="board-actions">
            {amISpeaker && phase === 'active' && (
              <button type="button" className="btn btn--primary btn--large" onClick={onEndTurn}>
                End Turn
              </button>
            )}
            {amISpeaker && phase === 'awaiting_confirm' && (
              <p className="muted">Waiting for {partner?.display_name || 'your partner'} to confirm what they heard…</p>
            )}
            {!amISpeaker && phase === 'active' && (
              <p className="muted">Waiting for {partner?.display_name || 'your partner'} to finish speaking…</p>
            )}
            {!amISpeaker && phase === 'awaiting_confirm' && (
              <button type="button" className="btn btn--primary btn--large" onClick={onConfirmHeard}>
                Confirm what I heard
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
