import { useEffect, useState } from 'react'
import { buildInviteLink, parseWordList } from '../lib/gameLogic'

export default function Lobby({
  room,
  players,
  cards,
  myPlayer,
  isHost,
  partnerOnline,
  onWordsChange,
  onRemoveCard,
  onStart,
  starting,
}) {
  const [rawWords, setRawWords] = useState(() => cards.map((c) => c.text).join('\n'))
  const [copied, setCopied] = useState(false)
  const inviteLink = buildInviteLink(room.room_code)
  const partner = players.find((p) => p.id !== myPlayer.id)
  const twoPlayers = players.length === 2

  // Keep the textarea in sync if cards change from elsewhere (e.g. a chip removal).
  useEffect(() => {
    setRawWords(cards.map((c) => c.text).join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length])

  const previewWords = parseWordList(rawWords)

  function handleCopy() {
    navigator.clipboard?.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="screen">
      <div className="lobby-header">
        <h1 className="section-title">Lobby</h1>
        <div className="player-row">
          {players.map((p) => (
            <span key={p.id} className={`player-chip${p.id === myPlayer.id ? ' player-chip--me' : ''}`}>
              {p.display_name}
              {p.id === partner?.id && (
                <span className={`dot dot--${partnerOnline ? 'online' : 'offline'}`} />
              )}
            </span>
          ))}
        </div>
        <p className="muted">{twoPlayers ? '2 / 2 players connected' : 'Waiting for your partner…'}</p>
      </div>

      {isHost ? (
        <>
          <div className="panel">
            <p className="eyebrow">Invite link</p>
            <div className="invite-row">
              <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn btn--ghost" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Vocabulary</p>
            <label className="field">
              <span>Paste your words or expressions — one per line</span>
              <textarea
                rows={10}
                value={rawWords}
                onChange={(e) => {
                  setRawWords(e.target.value)
                  onWordsChange(e.target.value)
                }}
                placeholder={'run out of\nmake up my mind\non the way\nkeep in touch\nturn out'}
              />
            </label>
            <p className="muted">{previewWords.length} card{previewWords.length === 1 ? '' : 's'}</p>

            {cards.length > 0 && (
              <div className="chip-grid">
                {cards.map((card) => (
                  <span key={card.id} className="chip">
                    {card.text}
                    <button
                      type="button"
                      className="chip__remove"
                      aria-label={`Remove ${card.text}`}
                      onClick={() => onRemoveCard(card)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn--primary btn--large"
            disabled={!twoPlayers || cards.length === 0 || starting}
            onClick={onStart}
          >
            {starting ? 'Starting…' : 'Start Game'}
          </button>
          {!twoPlayers && <p className="muted">Share the invite link above to bring in your partner.</p>}
        </>
      ) : (
        <div className="panel panel--center">
          <p className="eyebrow">Getting ready</p>
          <h2>Waiting for the host to add words and start the game…</h2>
          {cards.length > 0 && (
            <p className="muted">{cards.length} card{cards.length === 1 ? '' : 's'} ready so far.</p>
          )}
        </div>
      )}
    </div>
  )
}
