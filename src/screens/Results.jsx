import StageThread from '../components/StageThread'
import { getPlot, getStages } from '../lib/gameLogic'

export default function Results({ cards, plotId, onPlayAgain }) {
  const plot = getPlot(plotId)
  const stages = getStages(plotId)
  const validated = cards.filter((c) => c.status === 'validated')
  const remaining = cards.filter((c) => c.status === 'available')
  const total = cards.length
  const complete = remaining.length === 0

  const collectedByStage = validated.reduce((acc, c) => {
    const key = c.validated_stage
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="screen">
      <div className="hero hero--compact">
        <p className="eyebrow">{complete ? 'Victory' : 'Story finished'}</p>
        <h1 className="hero__title hero__title--small">
          {complete ? 'Story Complete!' : `${validated.length} / ${total} expressions used`}
        </h1>
        <p className="hero__subtitle">
          {complete
            ? `You completed your ${plot?.name || ''} story together.`
            : `${remaining.length} expression${remaining.length === 1 ? '' : 's'} remained — nice run, no losers here.`}
        </p>
      </div>

      {stages.length > 0 && (
        <StageThread stages={stages} currentStage={stages.length + 1} collectedByStage={collectedByStage} />
      )}

      <div className="panel">
        <p className="eyebrow">By stage</p>
        {stages.map((stage) => {
          const stageCards = validated.filter((c) => c.validated_stage === stage.number)
          if (stageCards.length === 0) return null
          return (
            <div key={stage.number} className="results-stage">
              <h3>{stage.name}</h3>
              <ul className="result-list result-list--yes">
                {stageCards.map((c) => (
                  <li key={c.id}>
                    <span aria-hidden="true">✓</span> {c.text}
                  </li>
                ))}
              </ul>
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

      <button type="button" className="btn btn--primary btn--large" onClick={onPlayAgain}>
        Start a new game
      </button>
    </div>
  )
}
