import { useState } from 'react'

export default function Home({ onCreate, onJoinByCode, busy, errorMessage }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  return (
    <div className="screen screen--centered">
      <div className="hero">
        <p className="eyebrow">A two-player speaking &amp; listening game</p>
        <h1 className="hero__title">
          Story <span className="hero__title-accent">Thread</span>
        </h1>
        <p className="hero__subtitle">
          Build one story together, one turn at a time. Speak your half of the vocabulary. Catch your
          partner's. Only the words you both notice make it into the tale.
        </p>
      </div>

      {!mode && (
        <div className="stack stack--center">
          <button type="button" className="btn btn--primary btn--large" onClick={() => setMode('create')}>
            Create Game
          </button>
          <button type="button" className="btn btn--ghost btn--large" onClick={() => setMode('join')}>
            Join Game
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onCreate(name.trim())
          }}
        >
          <label className="field">
            <span>Your name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grei"
              maxLength={40}
            />
          </label>
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setMode(null)}>
              Back
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy || !name.trim()}>
              {busy ? 'Creating…' : 'Create room'}
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.trim()) onJoinByCode(code.trim())
          }}
        >
          <label className="field">
            <span>Room code</span>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7QX3M"
              maxLength={8}
              style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}
            />
          </label>
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setMode(null)}>
              Back
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy || !code.trim()}>
              {busy ? 'Looking…' : 'Find room'}
            </button>
          </div>
        </form>
      )}

      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  )
}
