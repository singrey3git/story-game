// Nine classic plot shapes. Stage names are used verbatim (no shortening) —
// they come straight from the reference table the game is built around.
export const PLOTS = [
  {
    id: 'overcoming-the-monster',
    name: 'Overcoming the Monster',
    stages: [
      'Disruption of Order',
      'Emergence of a Threat',
      'Hero Steps Forward',
      'Struggle',
      'Victory',
      'Restoration of Order',
    ],
  },
  {
    id: 'rags-to-riches',
    name: 'Rags to Riches',
    stages: [
      'Initial Hardship',
      'Good Fortune',
      'Attainment of Happiness',
      'Difficult Period',
      'Threat of Losing Everything',
      'Happy Outcome / New Status',
    ],
  },
  {
    id: 'quest',
    name: 'Quest',
    stages: [
      'Task',
      'Movement Toward the Goal',
      'Obstacles / Adventures',
      'Achievement of the Goal',
      'Turning Point / Transition to a New State',
    ],
  },
  {
    id: 'voyage-and-return',
    name: 'Voyage and Return',
    stages: [
      'Departure from the Familiar World',
      'Other World / Distant Land',
      'Adventures',
      'New Experience',
      'Return',
      'Restoration of Ordinary Life in a New Form',
    ],
  },
  {
    id: 'comedy',
    name: 'Comedy',
    stages: [
      'Initial Relationships',
      'Entanglement',
      'Misunderstandings / Intrigues / Coincidences',
      'Maximum Complication',
      'Resolving Event',
      'Reconciliation / Restoration of Relationships',
    ],
  },
  {
    id: 'tragedy',
    name: 'Tragedy',
    stages: [
      'Doom from the Outset',
      'Hope / Temporary Success',
      'Movement Toward Ruin',
      'Loss of What Was Gained',
      'Final Defeat',
      'Death / Catastrophe',
    ],
  },
  {
    id: 'rebirth',
    name: 'Rebirth',
    stages: [
      'Wretched State',
      'Catalytic Event / Encounter',
      'Inner Turning Point',
      'Revival',
      'Transformation',
      'New State',
    ],
  },
  {
    id: 'self-sacrifice',
    name: 'Self-Sacrifice',
    stages: [
      'Love / Attachment',
      "Another Person's Distress",
      'Choosing the Other Over Oneself',
      'Sacrificial Act',
      'Cost to the Hero',
      'Rescue / Benefit to the Other',
    ],
  },
  {
    id: 'rebellion',
    name: 'Rebellion',
    stages: [
      'Unjust Order',
      'Refusal to Accept It',
      'Challenge to a Superior Power',
      'Attempt to Change the Rules',
      'Struggle / Sacrifice',
      "Defiance / Affirmation of One's Choice",
    ],
  },
]

export function getPlot(plotId) {
  return PLOTS.find((p) => p.id === plotId) || null
}

// Returns [{ number, name }, ...] for the chosen plot, or [] if none chosen yet.
export function getStages(plotId) {
  const plot = getPlot(plotId)
  if (!plot) return []
  return plot.stages.map((name, i) => ({ number: i + 1, name }))
}

// One turn = one stage now: each stage is narrated by exactly one player,
// and speaking alternates every stage.
export function speakerNumberForTurn(turn, firstSpeaker) {
  if (!firstSpeaker) return null
  const otherSpeaker = firstSpeaker === 1 ? 2 : 1
  return turn % 2 === 1 ? firstSpeaker : otherSpeaker
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // skips ambiguous chars (I, O, 0, 1)

export function generateRoomCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export function parseWordList(raw) {
  const seen = new Set()
  const words = []
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const key = line.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        words.push(line)
      }
    })
  return words
}

export function buildInviteLink(roomCode) {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('room', roomCode)
  return url.toString()
}
