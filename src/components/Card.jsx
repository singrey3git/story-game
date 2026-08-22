export default function Card({ text, state = 'idle', onClick, disabled, rotation = 0 }) {
  const classes = ['card', `card--${state}`]
  if (disabled) classes.push('card--disabled')

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={{ '--tilt': `${rotation}deg` }}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="card__text">{text}</span>
      {state === 'selected' && <span className="card__mark" aria-hidden="true">✓</span>}
      {state === 'validated' && <span className="card__mark" aria-hidden="true">✓</span>}
    </button>
  )
}
