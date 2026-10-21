import { buildHighlightSegments } from '../lib/highlightCards'

export default function HighlightedTranscript({ text, cards }) {
  const segments = buildHighlightSegments(text, cards)
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="transcript-highlight">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  )
}
