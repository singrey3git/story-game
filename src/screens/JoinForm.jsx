import { useState } from 'react'

export default function JoinForm({ hostName, onJoin, busy, errorMessage }) {
  const [name, setName] = useState('')

  return (
    <div className="screen screen--centered">
      <div className="hero hero--compact">
        <p className="eyebrow">You've been invited</p>
        <h1 className="hero__title hero__title--small">Join {hostName ? `${hostName}'s` : 'the'} game</h1>
        <p className="hero__subtitle">
          You'll take turns continuing one story together — speaking, listening, and spotting each
          other's vocabulary.
        </p>
      </div>

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
      </form>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  )
}
