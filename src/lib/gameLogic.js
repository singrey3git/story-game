// Nine classic plot shapes. Stage names are used verbatim (no shortening) —
// they come straight from the reference table the game is built around.
export const PLOTS = [
  {
    id: 'overcoming-the-monster',
    name: 'Overcoming the Monster',
    description:
      'One of the oldest plot types, rooted in the human experience of confronting a dangerous "other" — a beast, an enemy, or an outsider. At its core is the opposition between "us" and "them": the threat is endowed with power and aggression, and the hero must confront it and restore a safe order.',
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
    description:
      'This plot emerges from an awareness of social inequality and hierarchy. A hero who begins in a disadvantaged or low-status position is given an opportunity to change their fate and move into a higher, freer, or more privileged social position.',
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
    description:
      'The Quest can be seen as a modern development of the Voyage and Return plot, in which the focus shifts from returning home to the task or obstacle itself. The hero moves through a sequence of interconnected challenges, gathers knowledge, solves puzzles, and advances toward a specific goal; the detective story is a characteristic example of this logic.',
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
    description:
      'One of the fundamental plots of early cultures, reflecting rites of initiation for younger members of the community. Necessity forces the hero to leave the familiar world, undergo a series of trials, and eventually return transformed. Returning is as important as leaving: the hero comes back to the point of origin as a different person, having acquired new experience, status, or understanding of the world.',
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
    description:
      'This plot is built around an escalating entanglement of relationships: misunderstandings, coincidences, hidden motives, and accidental actions increasingly confuse the characters and their relations with one another. The absurdity reaches a breaking point, followed by a release: secrets are revealed, misunderstandings are cleared up, and the disrupted order of relationships is restored.',
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
    description:
      'Tragedy reflects on fate, mortality, and the limits of human control over one\u2019s own destiny. The hero acts, hopes, and struggles, yet moves toward an unavoidable collapse: fate, circumstances, or their own mistakes ultimately lead to loss, catastrophe, or death.',
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
    description:
      'A later, more psychological variation of the Voyage and Return plot, in which the central journey is internal rather than external. The hero begins in an unsatisfactory or destructive state, but an encounter, love, a trial, or another significant experience initiates a transformation and leads them toward a new way of being.',
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
    description:
      'This plot explores love through the willingness to give up one\u2019s own well-being for another person. The hero consciously accepts loss, suffering, the surrender of privilege, or even death, placing the value of another person above personal gain; this narrative pattern was developed particularly strongly within the Christian cultural tradition.',
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
    description:
      'At the centre of this plot are free will and the individual\u2019s right to reject an imposed order. The order is flawed from the outset. The hero consciously defies society, authority, fate, or even the structure of the world itself and may ultimately fail, but the meaning of the story lies in their fidelity to their own choice and principle.',
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
