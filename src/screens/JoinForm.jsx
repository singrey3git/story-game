import { useState } from 'react'

const HOW_IT_WORKS = [
  'A shared list of words and expressions is waiting for you both to practice.',
  "A wheel picks your story's shape at random — each shape has its own sequence of stages.",
  "Each stage is narrated by one of you in turn, but together you're building a single, continuous story.",
  'On your turn, weave in some of the vocabulary cards, and tap each one you actually use.',
  "While your partner speaks, listen closely and tap every card you hear them use.",
  "A card only counts once you've both tapped it — that's how you know it really made it into the story.",
  'Goal: finish the story together, using every card on the list.',
]

export default function JoinForm({ hostName, onJoin, busy, errorMessage }) {
  const [name, setName] = useState('')

  return (
    <div className="screen">
      <div className="hero hero--compact">
        <p className="eyebrow">You've been invited</p>
        <h1 className="hero__title hero__title--small">Join {hostName ? `${hostName}'s` : 'the'} game</h1>
        <p className="hero__subtitle">
          A cooperative storytelling game for practicing a shared list of words and expressions —
          out loud, together.
        </p>
      </div>

      <div className="join-layout">
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onJoin(name.trim())
          }}
        >
          <label className="field">
            <span>Your name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={40}
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={busy || !name.trim()}>
            {busy ? 'Joining…' : 'Join Game'}
          </button>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </form>

        <div className="panel how-it-works">
          <p className="eyebrow">How this game works</p>
          <ol className="how-it-works__list">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
