// Finds where a room's vocabulary cards appear inside a block of transcribed
// speech, so the UI can highlight them. Speech-to-text text rarely matches a
// card's written form character-for-character (different tense, plural,
// -ing form, etc.), so this does lightweight stemming rather than a strict
// substring search — "beat" from a transcript will match a "beat up" card,
// as will "beats" or "beating", though not the irregular "beaten".

function stem(word) {
  let w = word.toLowerCase()
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 4 && (w.endsWith('ies') || w.endsWith('ied'))) w = `${w.slice(0, -3)}y`
  else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2)
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  // Drop a trailing silent "e" too (disperse/dispersing/dispersed should all
  // reduce to the same stem), applied after the suffix rules above so it
  // doesn't interfere with them.
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1)
  return w
}

function tokenize(text) {
  const tokens = []
  const re = /[A-Za-z']+/g
  let match
  while ((match = re.exec(text))) {
    tokens.push({ word: match[0], start: match.index, end: match.index + match[0].length })
  }
  return tokens
}

// How many other (unrelated) words are allowed between two words of the
// same phrase — covers separable phrasal verbs like "beat up" showing up
// as "beat the dragon up" in natural speech.
const MAX_GAP = 3

// Returns [{ text, highlighted }] segments covering the whole input string,
// in order, so the caller can render highlighted vs. plain runs.
export function buildHighlightSegments(text, cards) {
  if (!text) return [{ text: '', highlighted: false }]
  if (!cards || cards.length === 0) return [{ text, highlighted: false }]

  const tokens = tokenize(text)
  if (tokens.length === 0) return [{ text, highlighted: false }]

  const matchedTokenIdx = new Set()

  // Match longer phrases first so a short card ("up") doesn't claim a word
  // that's actually part of a longer card's phrase ("beat up").
  const sortedCards = [...cards].sort(
    (a, b) => b.text.trim().split(/\s+/).length - a.text.trim().split(/\s+/).length
  )

  for (const card of sortedCards) {
    const cardWords = card.text.trim().split(/\s+/).filter(Boolean)
    if (cardWords.length === 0) continue
    const cardStems = cardWords.map(stem)

    let searchFrom = 0
    while (searchFrom < tokens.length) {
      let startIdx = -1
      for (let i = searchFrom; i < tokens.length; i++) {
        if (matchedTokenIdx.has(i)) continue
        if (stem(tokens[i].word) === cardStems[0]) {
          startIdx = i
          break
        }
      }
      if (startIdx === -1) break

      if (cardStems.length === 1) {
        matchedTokenIdx.add(startIdx)
        searchFrom = startIdx + 1
        continue
      }

      let cursor = startIdx
      const matchedIndices = [startIdx]
      let success = true
      for (let wi = 1; wi < cardStems.length; wi++) {
        let found = -1
        for (let j = cursor + 1; j <= cursor + 1 + MAX_GAP && j < tokens.length; j++) {
          if (matchedTokenIdx.has(j)) continue
          if (stem(tokens[j].word) === cardStems[wi]) {
            found = j
            break
          }
        }
        if (found === -1) {
          success = false
          break
        }
        matchedIndices.push(found)
        cursor = found
      }

      if (success) {
        matchedIndices.forEach((idx) => matchedTokenIdx.add(idx))
        searchFrom = cursor + 1
      } else {
        searchFrom = startIdx + 1
      }
    }
  }

  if (matchedTokenIdx.size === 0) return [{ text, highlighted: false }]

  const segments = []
  let pos = 0
  const sortedMatched = [...matchedTokenIdx].sort((a, b) => a - b)
  for (const idx of sortedMatched) {
    const tok = tokens[idx]
    if (tok.start > pos) segments.push({ text: text.slice(pos, tok.start), highlighted: false })
    segments.push({ text: text.slice(tok.start, tok.end), highlighted: true })
    pos = tok.end
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), highlighted: false })
  return segments
}
