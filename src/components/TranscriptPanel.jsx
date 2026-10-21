export default function TranscriptPanel({ text, listening, speechError }) {
  return (
    <div className="panel panel--transcript">
      <div className="transcript__head">
        <p className="eyebrow">Live transcript</p>
        {listening && (
          <span className="transcript__dot" aria-hidden="true">
            ●
          </span>
        )}
      </div>
      {speechError ? (
        <p className="muted">Microphone unavailable ({speechError}). The rest of the game still works.</p>
      ) : (
        <p className="transcript__text">{text || (listening ? 'Listening…' : '—')}</p>
      )}
    </div>
  )
}
