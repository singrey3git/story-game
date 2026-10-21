import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// Reliable only in Chrome/Chromium-based browsers today (and only over
// https or localhost — the browser blocks mic access otherwise). Other
// browsers (Safari, Firefox) simply don't expose this API, so we expose
// `supported: false` and the caller shows the rest of the game normally
// without transcription.
export function isSpeechRecognitionSupported() {
  return !!getSpeechRecognitionCtor()
}

// Lightweight live transcription hook. `active` turns listening on/off
// (start it only during the speaker's own turn — never the listener's).
// Calls `onUpdate(text)` every time the accumulated transcript for this
// turn changes, so the caller can persist it (e.g. debounced, to Supabase).
export function useSpeechRecognition(active, onUpdate) {
  const supported = isSpeechRecognitionSupported()
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const finalTextRef = useRef('')
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const stop = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      rec.onend = null // avoid auto-restart firing after an intentional stop
      try {
        rec.stop()
      } catch {
        // ignore — recognizer may already be stopped
      }
    }
    recognitionRef.current = null
    setListening(false)
  }, [])

  useEffect(() => {
    if (!supported) return undefined
    if (!active) {
      stop()
      return undefined
    }

    const Ctor = getSpeechRecognitionCtor()
    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition
    finalTextRef.current = ''
    setError('')

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTextRef.current = `${finalTextRef.current} ${transcript}`.trim()
        } else {
          interim += transcript
        }
      }
      onUpdateRef.current?.(`${finalTextRef.current} ${interim}`.trim())
    }

    recognition.onerror = (event) => {
      // "no-speech" fires often and harmlessly during natural pauses — don't
      // surface it as an error, just let onend restart listening below.
      if (event.error !== 'no-speech') {
        setError(event.error || 'speech recognition error')
      }
    }

    recognition.onend = () => {
      // Chrome auto-stops recognition after a period of silence even while
      // the turn is still active — restart it transparently so the speaker
      // never has to notice or do anything about it.
      if (recognitionRef.current === recognition && active) {
        try {
          recognition.start()
        } catch {
          // ignore — may already be starting
        }
      }
    }

    try {
      recognition.start()
      setListening(true)
    } catch (err) {
      setError(err?.message || 'could not start microphone')
    }

    return () => {
      recognition.onend = null
      try {
        recognition.stop()
      } catch {
        // ignore
      }
      if (recognitionRef.current === recognition) recognitionRef.current = null
      setListening(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, supported, stop])

  return { supported, listening, error }
}
