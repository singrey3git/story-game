import { formatElapsed } from '../components/StageTimer'
import StageThread from '../components/StageThread'
import { getPlot, getStages } from '../lib/gameLogic'

function playerVocabStats(player, cards, selections) {
  const unfamiliarIds = new Set(
    selections
      .filter((s) => s.turn_number === 0 && s.selection_type === 'marked_unfamiliar' && s.player_id === player.id)
      .map((s) => s.card_id)
  )

  // "Used" means this player personally tapped the card as speaker during
  // their own turn(s) — not cards they merely marked as heard from their
  // partner, and not cards confirmed only because the partner used them.
  const usedByMeIds = new Set(
    selections
      .filter((s) => s.turn_number >= 1 && s.selection_type === 'speaker_claim' && s.player_id === player.id)
      .map((s) => s.card_id)
  )

  const unfamiliarCount = unfamiliarIds.size
  const familiarCount = cards.length - unfamiliarCount
  const unfamiliarUsed = [...unfamiliarIds].filter((id) => usedByMeIds.has(id)).length
  const familiarUsed = [...usedByMeIds].filter((id) => !unfamiliarIds.has(id)).length

  return {
    unfamiliarCount,
    familiarCount,
    unfamiliarUsed,
    familiarUsed,
    unfamiliarPct: unfamiliarCount > 0 ? Math.round((100 * unfamiliarUsed) / unfamiliarCount) : 0,
    familiarPct: familiarCount > 0 ? Math.round((100 * familiarUsed) / familiarCount) : 0,
  }
}

function StatBar({ label, used, total, pct, tone }) {
  if (total === 0) return null
  return (
    <div className="stat-bar">
      <div className="stat-bar__head">
        <span className="stat-bar__label">{label}</span>
        <span className="stat-bar__value">
          {used} / {total} · {pct}%
        </span>
      </div>
      <div className="stat-bar__track">
        <div className={`stat-bar__fill stat-bar__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Results({
  cards,
  plotId,
  players,
  selections,
  stageDurations,
  onPlayAgain,
  onPracticeAgain,
  busy,
}) {
  const plot = getPlot(plotId)
  const stages = getStages(plotId)
  const validated = cards.filter((c) => c.status === 'validated')
  const remaining = cards.filter((c) => c.status === 'available')
  const total = cards.length
  const complete = remaining.length === 0

  const stats = (players || []).map((p) => ({ player: p, ...playerVocabStats(p, cards, selections || []) }))
  const showStats = stats.some((s) => s.unfamiliarCount > 0)

  const collectedByStage = validated.reduce((acc, c) => {
    const key = c.validated_stage
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const durations = stageDurations || {}
  const totalSeconds = Object.values(durations).reduce((sum, s) => sum + (s || 0), 0)

  return (
    <div className="screen screen--wide">
      <div className="hero hero--compact">
        <p className="eyebrow">{complete ? 'Victory' : 'Story finished'}</p>
        <h1 className="hero__title hero__title--small">
          {complete ? 'Story Complete!' : `${validated.length} / ${total} expressions used`}
        </h1>
        <p className="hero__subtitle">
          {complete
            ? `You completed your ${plot?.name || ''} story together.`
            : `${remaining.length} expression${remaining.length === 1 ? '' : 's'} remained — nice run, no losers here.`}
          {totalSeconds > 0 && ` Total time: ${formatElapsed(totalSeconds)}.`}
        </p>
      </div>

      {stages.length > 0 && (
        <StageThread stages={stages} currentStage={stages.length + 1} collectedByStage={collectedByStage} />
      )}

      <div className="results-layout">
        <div className="results-layout__col">
          <div className="panel">
            <p className="eyebrow">By stage</p>
            {stages.map((stage) => {
              const stageCards = validated.filter((c) => c.validated_stage === stage.number)
              const seconds = durations[stage.number]
              if (stageCards.length === 0 && seconds === undefined) return null
              return (
                <div key={stage.number} className="results-stage">
                  <div className="results-stage__head">
                    <h3>{stage.name}</h3>
                    {seconds !== undefined && <span className="results-stage__time">{formatElapsed(seconds)}</span>}
                  </div>
                  {stageCards.length > 0 ? (
                    <ul className="result-list result-list--yes">
                      {stageCards.map((c) => (
                        <li key={c.id}>
                          <span aria-hidden="true">✓</span> {c.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No cards confirmed on this stage.</p>
                  )}
                </div>
              )
            })}
          </div>

          {remaining.length > 0 && (
            <div className="panel">
              <p className="eyebrow">Left on the table</p>
              <ul className="result-list result-list--no">
                {remaining.map((c) => (
                  <li key={c.id}>{c.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="results-layout__col">
          {showStats && (
            <div className="panel">
              <p className="eyebrow">Vocabulary check-in</p>
              <div className="vocab-stats">
                {stats.map((s) => (
                  <div key={s.player.id} className="vocab-stats__row">
                    <p className="vocab-stats__name">{s.player.display_name}</p>
                    <StatBar
                      label="New words"
                      used={s.unfamiliarUsed}
                      total={s.unfamiliarCount}
                      pct={s.unfamiliarPct}
                      tone="new"
                    />
                    <StatBar
                      label="Already knew"
                      used={s.familiarUsed}
                      total={s.familiarCount}
                      pct={s.familiarPct}
                      tone="known"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-actions">
            <button type="button" className="btn btn--primary btn--large" disabled={busy} onClick={onPracticeAgain}>
              {busy ? 'Starting…' : 'Practice this list with a new story'}
            </button>
            <button type="button" className="btn btn--ghost btn--large" onClick={onPlayAgain}>
              Start a completely new game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
