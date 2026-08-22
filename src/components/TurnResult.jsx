export default function TurnResult({ result, onContinue, isLastTurn }) {
  if (!result) return null
  const { validated = [], notConfirmed = [] } = result

  return (
    <div className="panel result-panel">
      <p className="eyebrow">Turn complete</p>
      <h2 className="result-panel__headline">
        {validated.length} expression{validated.length === 1 ? '' : 's'} confirmed
      </h2>

      {validated.length > 0 && (
        <ul className="result-list result-list--yes">
          {validated.map((card) => (
            <li key={card.id}>
              <span aria-hidden="true">✓</span> {card.text}
            </li>
          ))}
        </ul>
      )}

      {notConfirmed.length > 0 && (
        <>
          <p className="result-panel__subhead">Not confirmed — back in the deck</p>
          <ul className="result-list result-list--no">
            {notConfirmed.map((card) => (
              <li key={card.id}>{card.text}</li>
            ))}
          </ul>
        </>
      )}

      <button type="button" className="btn btn--primary" onClick={onContinue}>
        {isLastTurn ? 'See the final story' : 'Continue'}
      </button>
    </div>
  )
}
