import { useCallback, useEffect, useRef, useState } from 'react'
import { breakDurationMs, meetsSessionMinimum, type Mode } from './timer.ts'
import type { Prefs } from './storage.ts'

export type Snapshot = {
  mode: Mode
  displayMs: number
  inProgress: boolean
}

export function useTimer(
  getPrefs: () => Prefs,
  hooks: {
    onQualifiedStop: () => void
    onBreakComplete: () => void
    onSessionThreshold: () => void
  },
) {
  const [snap, setSnap] = useState<Snapshot>({
    mode: 'idle',
    displayMs: 0,
    inProgress: false,
  })

  const mode = useRef<Mode>('idle')
  const accum = useRef(0)
  const segmentAt = useRef<number | null>(null)
  const breakTotal = useRef(0)
  const thresholdFired = useRef(false)
  const hooksRef = useRef(hooks)
  const prefsRef = useRef(getPrefs)
  hooksRef.current = hooks
  prefsRef.current = getPrefs

  const read = useCallback((now = Date.now()): Snapshot => {
    const m = mode.current
    let displayMs = 0
    let sessionElapsed = accum.current
    if (m === 'session' && segmentAt.current != null) {
      sessionElapsed = accum.current + (now - segmentAt.current)
      displayMs = sessionElapsed
    } else if (m === 'paused') {
      displayMs = accum.current
    } else if (m === 'break' && segmentAt.current != null) {
      displayMs = Math.max(0, breakTotal.current - (now - segmentAt.current))
    }
    return {
      mode: m,
      displayMs,
      inProgress: m === 'session' || m === 'paused' || m === 'break',
    }
  }, [])

  const publish = useCallback(() => setSnap(read()), [read])

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      if (mode.current === 'session') {
        const prefs = prefsRef.current()
        const elapsed =
          accum.current + (segmentAt.current != null ? now - segmentAt.current : 0)
        if (
          prefs.sessionThresholdEnabled &&
          !thresholdFired.current &&
          elapsed >= prefs.sessionThresholdMinutes * 60_000
        ) {
          thresholdFired.current = true
          hooksRef.current.onSessionThreshold()
        }
      }
      if (mode.current === 'break' && segmentAt.current != null) {
        if (now - segmentAt.current >= breakTotal.current) {
          mode.current = 'idle'
          accum.current = 0
          segmentAt.current = null
          breakTotal.current = 0
          thresholdFired.current = false
          publish()
          hooksRef.current.onBreakComplete()
          return
        }
      }
      if (mode.current !== 'idle') publish()
    }, 250)
    return () => clearInterval(id)
  }, [publish])

  const start = () => {
    if (mode.current !== 'idle') return
    mode.current = 'session'
    accum.current = 0
    segmentAt.current = Date.now()
    breakTotal.current = 0
    thresholdFired.current = false
    publish()
  }

  const pause = () => {
    if (mode.current !== 'session' || segmentAt.current == null) return
    accum.current += Date.now() - segmentAt.current
    segmentAt.current = null
    mode.current = 'paused'
    publish()
  }

  const resume = () => {
    if (mode.current !== 'paused') return
    mode.current = 'session'
    segmentAt.current = Date.now()
    publish()
  }

  const stop = () => {
    if (mode.current !== 'session' && mode.current !== 'paused') return
    let elapsed = accum.current
    if (mode.current === 'session' && segmentAt.current != null) {
      elapsed += Date.now() - segmentAt.current
    }
    accum.current = elapsed
    segmentAt.current = null

    const prefs = prefsRef.current()
    if (!meetsSessionMinimum(elapsed, prefs.sessionMinimumMinutes)) {
      mode.current = 'idle'
      accum.current = 0
      publish()
      return
    }

    hooksRef.current.onQualifiedStop()
    breakTotal.current = breakDurationMs(elapsed, prefs.restRatio)
    mode.current = 'break'
    segmentAt.current = Date.now()
    publish()
  }

  const skipBreak = () => {
    if (mode.current !== 'break') return
    mode.current = 'idle'
    accum.current = 0
    segmentAt.current = null
    breakTotal.current = 0
    thresholdFired.current = false
    publish()
  }

  return { ...snap, start, pause, resume, stop, skipBreak }
}
