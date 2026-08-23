import { useEffect, useRef, useState } from 'react'
import { PLOTS, getStages } from '../lib/gameLogic'
import { getPlotExamples } from '../lib/plotExamples'
import StageThread from './StageThread'

const SECTOR_ANGLE = 360 / PLOTS.length
const SPIN_MS = 3400
const SPIN_TURNS = 5

// Nine muted, jewel-toned colors that sit comfortably in the app's dark /
// parchment palette rather than a generic bright rainbow.
const SECTOR_COLORS = [
  '#5FA8A0', // teal
  '#E3A23C', // amber
  '#C1666B', // rose
  '#8C6FA0', // plum
  '#6B8F5C', // moss
  '#C97B4A', // terracotta
  '#6D89A8', // slate blue
  '#C9A227', // gold
  '#A8455C', // garnet
]

function pointOnCircle(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

const CX = 150
const CY = 150
const OUTER_R = 140
const HUB_R = 38
const LABEL_INNER_R = HUB_R + 8
const LABEL_OUTER_R = OUTER_R - 8
const LABEL_MID_R = (LABEL_INNER_R + LABEL_OUTER_R) / 2

export default function PlotWheel({
  plotId,
  cards,
  onSpin,
  onRespin,
  spinDisabled,
  onContinue,
  unfamiliarIds,
  onToggleUnfamiliar,
}) {
  const [rotation, setRotation] = useState(0)
  const [animating, setAnimating] = useState(false)
  const hasAnimatedRef = useRef(false)
  const knewOnMountRef = useRef(plotId)
  const prevPlotIdRef = useRef(plotId)

  const selectedIndex = plotId ? PLOTS.findIndex((p) => p.id === plotId) : -1

  // If the plot gets cleared (someone hit "spin again"), arm the animation
  // to play again for the next landing.
  useEffect(() => {
    if (prevPlotIdRef.current && !plotId) {
      hasAnimatedRef.current = false
      knewOnMountRef.current = null
      setRotation((r) => r % 360)
      setAnimating(false)
    }
    prevPlotIdRef.current = plotId
  }, [plotId])

  useEffect(() => {
    if (selectedIndex === -1 || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    const mid = selectedIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2

    if (knewOnMountRef.current) {
      // Someone else already spun before we joined — jump straight to the result.
      const resting = SPIN_TURNS * 360 - mid
      setRotation(((resting % 360) + 360) % 360)
      return
    }

    // Spin forward from wherever the wheel currently sits (handles both the
    // very first spin and any later re-spins) and land with `mid` at the top.
    const targetMod = ((-mid % 360) + 360) % 360
    const extra = ((targetMod - (rotation % 360)) % 360 + 360) % 360
    const target = rotation + SPIN_TURNS * 360 + extra

    setAnimating(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setRotation(target)))
    const timer = setTimeout(() => setAnimating(false), SPIN_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex])

  const landed = plotId && !animating
  const selectedPlot = selectedIndex >= 0 ? PLOTS[selectedIndex] : null
  const stages = landed ? getStages(plotId) : []
  const examples = landed ? getPlotExamples(plotId) : []

  return (
    <div className="screen screen--wide">
      <div className="hero hero--compact">
        <p className="eyebrow">Before you begin</p>
        <h1 className="hero__title hero__title--small">
          {landed ? selectedPlot.name : 'Spin for your story shape'}
        </h1>
        <p className="hero__subtitle">
          {landed
            ? 'This is the shape your story will follow. Take a moment to read the stages below.'
            : 'Nine classic shapes are laid out below — the wheel picks yours at random.'}
        </p>
      </div>

      <div className="plot-layout">
        <div className="plot-layout__wheel">
          <div className="wheel">
            <div className="wheel__pointer" aria-hidden="true" />
            <svg
              className="wheel__svg"
              viewBox="0 0 300 300"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: animating ? `transform ${SPIN_MS}ms cubic-bezier(0.1, 0.86, 0.15, 1)` : 'none',
              }}
            >
              {PLOTS.map((plot, i) => {
                const start = i * SECTOR_ANGLE
                const end = start + SECTOR_ANGLE
                const mid = start + SECTOR_ANGLE / 2
                const p1 = pointOnCircle(CX, CY, OUTER_R, start)
                const p2 = pointOnCircle(CX, CY, OUTER_R, end)

                const displayAngle = ((mid + rotation) % 360 + 360) % 360
                const flip = displayAngle > 90 && displayAngle < 270
                const rotateDeg = flip ? mid + 90 : mid - 90
                const labelPos = pointOnCircle(CX, CY, LABEL_MID_R, mid)
                const availableLength = LABEL_OUTER_R - LABEL_INNER_R - 4
                const fontSize = Math.max(6, Math.min(9.5, availableLength / (plot.name.length * 0.56)))

                return (
                  <g key={plot.id}>
                    <path
                      d={`M ${CX},${CY} L ${p1.x},${p1.y} A ${OUTER_R},${OUTER_R} 0 0,1 ${p2.x},${p2.y} Z`}
                      fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                      stroke="#1e2433"
                      strokeWidth="2"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      transform={`rotate(${rotateDeg}, ${labelPos.x}, ${labelPos.y})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      className="wheel__label"
                    >
                      {plot.name}
                    </text>
                  </g>
                )
              })}
              <circle cx={CX} cy={CY} r={HUB_R} className="wheel__hub" />
            </svg>

            {!plotId && (
              <button
                type="button"
                className="wheel__spin-btn"
                disabled={spinDisabled || animating}
                onClick={onSpin}
              >
                Spin
              </button>
            )}
          </div>

          {landed && (
            <div className="plot-layout__actions">
              <button type="button" className="btn btn--primary btn--large" onClick={onContinue}>
                Begin the story
              </button>
              <button type="button" className="btn-link" onClick={onRespin}>
                Spin again for a different shape
              </button>
            </div>
          )}
        </div>

        <div className="plot-layout__side">
          {landed && (
            <div className="panel plot-info">
              <p className="eyebrow">About this shape</p>
              <p className="plot-info__description">{selectedPlot.description}</p>

              {examples.length > 0 && (
                <>
                  <p className="plot-info__examples-label">Familiar stories that follow it</p>
                  <div className="plot-info__examples">
                    {examples.map((src, i) => (
                      <img key={i} src={src} alt="" className="plot-info__poster" loading="lazy" />
                    ))}
                  </div>
                </>
              )}

              <StageThread stages={stages} currentStage={1} />
            </div>
          )}

          {cards.length > 0 && (
            <div className="panel vocab-preview">
              <p className="eyebrow">Your vocabulary — {cards.length} cards</p>
              <p className="muted">
                Take a look now, and tap anything you don't know yet — we'll check back at the end to see
                how many made it into the story.
              </p>
              <div className="chip-grid">
                {cards.map((card) => {
                  const marked = unfamiliarIds?.has(card.id)
                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={`chip chip--toggle${marked ? ' chip--unfamiliar' : ''}`}
                      onClick={() => onToggleUnfamiliar?.(card)}
                    >
                      {card.text}
                      {marked && <span className="chip__badge">new to me</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
