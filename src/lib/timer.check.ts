import {
  breakDurationMs,
  meetsSessionMinimum,
  formatClock,
  localDateKey,
} from './timer.ts'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(breakDurationMs(25 * 60_000, 20) === 5 * 60_000, '25m @ 20%')
assert(meetsSessionMinimum(5 * 60_000, 5), '5m ok')
assert(!meetsSessionMinimum(5 * 60_000 - 1, 5), 'under 5m')
assert(formatClock(65_000) === '01:05', 'clock')
assert(/^\d{4}-\d{2}-\d{2}$/.test(localDateKey()), 'date')

console.log('timer.check: ok')
