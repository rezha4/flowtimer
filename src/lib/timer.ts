export type Mode = 'idle' | 'session' | 'paused' | 'break'

export function breakDurationMs(elapsedMs: number, restRatioPercent: number): number {
  return Math.floor((elapsedMs * restRatioPercent) / 100)
}

export function meetsSessionMinimum(elapsedMs: number, minimumMinutes: number): boolean {
  return elapsedMs >= minimumMinutes * 60_000
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}
