import { useEffect, useState } from 'react'

export function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function StageTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!startedAt) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!startedAt) return null

  const elapsed = Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 1000))

  return (
    <span className="stage-timer" aria-label="Time on this stage">
      ⏱ {formatElapsed(elapsed)}
    </span>
  )
}
