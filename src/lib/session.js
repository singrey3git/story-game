const keyFor = (roomCode) => `story-game:session:${roomCode.toUpperCase()}`

export function saveSession(roomCode, session) {
  try {
    localStorage.setItem(keyFor(roomCode), JSON.stringify(session))
  } catch {
    // localStorage may be unavailable (private mode etc.) — reconnect-on-refresh
    // simply won't work, the rest of the game is unaffected.
  }
}

export function loadSession(roomCode) {
  try {
    const raw = localStorage.getItem(keyFor(roomCode))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSession(roomCode) {
  try {
    localStorage.removeItem(keyFor(roomCode))
  } catch {
    // ignore
  }
}
