import { speakerNumberForTurn } from '../lib/gameLogic'

export default function TurnSequenceBar({ players, firstSpeaker, currentTurn, totalTurns }) {
  const nameFor = (playerNumber) =>
    players.find((p) => p.player_number === playerNumber)?.display_name || `Player ${playerNumber}`

  const turns = Array.from({ length: totalTurns }, (_, i) => i + 1)

  return (
    <div className="turn-bar" role="list" aria-label="Speaking order">
      {turns.map((turn) => {
        const speaker = speakerNumberForTurn(turn, firstSpeaker)
        const status = turn < currentTurn ? 'done' : turn === currentTurn ? 'active' : 'upcoming'
        return (
          <div key={turn} className={`turn-bar__slot turn-bar__slot--${status}`} role="listitem">
            <span className="turn-bar__name">{nameFor(speaker)}</span>
          </div>
        )
      })}
    </div>
  )
}
