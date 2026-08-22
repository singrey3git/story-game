export default function StageThread({ stages, currentStage, collectedByStage = {} }) {
  if (!stages.length) return null
  const total = stages.length

  return (
    <div className="thread" role="img" aria-label={`Stage ${Math.min(currentStage, total)} of ${total}`}>
      <svg className="thread__line" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2,4 Q 25,0 50,4 T 98,4" fill="none" />
      </svg>
      <div className="thread__nodes">
        {stages.map((stage) => {
          const status =
            stage.number < currentStage ? 'done' : stage.number === currentStage ? 'active' : 'upcoming'
          const collected = collectedByStage[stage.number] || []
          return (
            <div key={stage.number} className={`thread__node thread__node--${status}`}>
              <span className="thread__dot">{status === 'done' ? '✓' : stage.number}</span>
              <span className="thread__label">{stage.name}</span>
              {collected.length > 0 && (
                <div className="thread__collected">
                  {collected.map((card) => (
                    <span key={card.id} className="thread__chip">
                      {card.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
