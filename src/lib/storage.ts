import { localDateKey } from './timer.ts'

export type NotifMode = 'sound' | 'popup' | 'both'

export type Prefs = {
  restRatio: number
  sessionMinimumMinutes: number
  sessionThresholdEnabled: boolean
  sessionThresholdMinutes: number
  breakNotifEnabled: boolean
  notifMode: NotifMode
}

const PREFS_KEY = 'flowtimer.prefs'
const COUNT_KEY = 'flowtimer.sessionCount'

export const DEFAULT_PREFS: Prefs = {
  restRatio: 20,
  sessionMinimumMinutes: 5,
  sessionThresholdEnabled: false,
  sessionThresholdMinutes: 50,
  breakNotifEnabled: true,
  notifMode: 'both',
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      ...DEFAULT_PREFS,
      ...p,
      restRatio: clamp(p.restRatio ?? 20, 1, 100),
      sessionMinimumMinutes: Math.max(1, Math.floor(p.sessionMinimumMinutes ?? 5)),
      sessionThresholdMinutes: Math.max(1, Math.floor(p.sessionThresholdMinutes ?? 50)),
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function loadSessionCount(): number {
  try {
    const raw = localStorage.getItem(COUNT_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { date: string; count: number }
    if (parsed.date !== localDateKey()) return 0
    return Math.max(0, Math.floor(parsed.count) || 0)
  } catch {
    return 0
  }
}

export function incrementSessionCount(): number {
  const count = loadSessionCount() + 1
  localStorage.setItem(COUNT_KEY, JSON.stringify({ date: localDateKey(), count }))
  return count
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(n)))
}
