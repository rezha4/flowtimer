import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureNotifPermission,
  gateActiveTab,
  notify,
  setPresence,
} from './lib/browser.ts'
import {
  incrementSessionCount,
  loadPrefs,
  loadSessionCount,
  savePrefs,
  type Prefs,
} from './lib/storage.ts'
import { formatClock, type Mode } from './lib/timer.ts'
import { useTimer } from './lib/useTimer.ts'

const MODE_LABEL: Record<Mode, string> = {
  idle: 'Idle',
  session: 'Session',
  paused: 'Paused',
  break: 'Break',
}

const btn =
  'inline-flex h-11 min-w-28 items-center justify-center rounded-full px-6 text-[15px] font-medium transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 md:h-14 md:min-w-40 md:px-10 md:text-xl'
const btnPrimary = `${btn} bg-accent text-white`
const btnGhost = `${btn} bg-fill text-ink`
const btnDanger = `${btn} bg-fill text-danger`

export default function App() {
  const [active, setActive] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())
  const [count, setCount] = useState(() => loadSessionCount())

  const timer = useTimer(
    () => prefs,
    {
      onQualifiedStop: () => setCount(incrementSessionCount()),
      onBreakComplete: () => {
        if (prefs.breakNotifEnabled) {
          notify("Let's continue focusing!", 'Break over — start when ready.', prefs.notifMode)
        }
      },
      onSessionThreshold: () => {
        notify(
          'Still focusing',
          `${prefs.sessionThresholdMinutes} minutes on this Session.`,
          prefs.notifMode,
        )
      },
    },
  )

  useEffect(() => {
    return gateActiveTab(
      () => setActive(true),
      () => setActive(false),
    )
  }, [])

  useEffect(() => {
    setPresence(timer.mode, formatClock(timer.displayMs))
  }, [timer.mode, timer.displayMs])

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (active && timer.inProgress) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [active, timer.inProgress])

  const updatePrefs = useCallback((next: Prefs) => {
    setPrefs(next)
    savePrefs(next)
  }, [])

  if (!active) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-xs text-center">
          <p className="text-[13px] font-medium text-muted">Flowtimer</p>
          <p className="mt-3 text-[17px] leading-snug text-ink">
            Already open in another tab. Close that tab to use Flowtimer here.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full flex-col items-center px-6">
      <div className="min-h-16 flex-1" />
      <header className="text-center">
        <p className="text-[13px] font-medium text-muted md:text-2xl">Flowtimer</p>
        <p className="mt-6 text-[5.25rem] leading-none font-light tracking-[-0.04em] tabular-nums md:mt-8 md:text-[9rem] lg:text-[11rem]">
          {formatClock(timer.displayMs)}
        </p>
        <p className="mt-5 text-[17px] text-ink md:mt-8 md:text-3xl">{MODE_LABEL[timer.mode]}</p>
        <p className="mt-1 text-[13px] text-muted md:mt-2 md:text-xl">
          {count} focus session{count === 1 ? '' : 's'} done today
        </p>
      </header>

      <div className="mt-10 flex flex-wrap justify-center gap-3 md:mt-12">
        {timer.mode === 'idle' && (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              void ensureNotifPermission()
              timer.start()
            }}
          >
            Start
          </button>
        )}
        {timer.mode === 'session' && (
          <>
            <button type="button" className={btnGhost} onClick={timer.pause}>
              Pause
            </button>
            <button type="button" className={btnDanger} onClick={timer.stop}>
              Stop
            </button>
          </>
        )}
        {timer.mode === 'paused' && (
          <>
            <button type="button" className={btnPrimary} onClick={timer.resume}>
              Resume
            </button>
            <button type="button" className={btnDanger} onClick={timer.stop}>
              Stop
            </button>
          </>
        )}
        {timer.mode === 'break' && (
          <button type="button" className={btnGhost} onClick={timer.skipBreak}>
            Skip break
          </button>
        )}
      </div>

      <Settings prefs={prefs} onChange={updatePrefs} />
      <div className="min-h-16 flex-1" />
    </main>
  )
}

function Settings({ prefs, onChange }: { prefs: Prefs; onChange: (p: Prefs) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    onChange({ ...prefs, [key]: value })

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        className="fixed top-6 right-6 grid size-11 place-items-center rounded-full text-muted transition hover:bg-fill hover:text-ink md:top-8 md:right-8 md:size-14"
        onClick={() => dialogRef.current?.showModal()}
      >
        <CogIcon />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="settings-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-0 bg-page p-5 text-ink shadow-2xl backdrop:bg-black/30"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const inside =
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          if (!inside) e.currentTarget.close()
        }}
      >
        <div className="mb-3 flex items-center justify-between px-4">
          <h2 id="settings-title" className="text-[17px] font-medium">
            Settings
          </h2>
          <button
            type="button"
            className="text-[15px] font-medium text-accent"
            onClick={() => dialogRef.current?.close()}
          >
            Done
          </button>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <NumRow
          label="Rest ratio"
          suffix="%"
          value={prefs.restRatio}
          min={1}
          max={100}
          onChange={(n) => set('restRatio', n)}
        />
        <NumRow
          label="Session minimum"
          suffix="min"
          value={prefs.sessionMinimumMinutes}
          min={1}
          onChange={(n) => set('sessionMinimumMinutes', n)}
        />
        <Toggle
          label="Mid-Session ping"
          checked={prefs.sessionThresholdEnabled}
          onChange={(v) => set('sessionThresholdEnabled', v)}
        />
        <NumRow
          label="Ping after"
          suffix="min"
          value={prefs.sessionThresholdMinutes}
          min={1}
          onChange={(n) => set('sessionThresholdMinutes', n)}
        />
        <Toggle
          label="Break-over ping"
          checked={prefs.breakNotifEnabled}
          onChange={(v) => set('breakNotifEnabled', v)}
        />
        <div className="px-4 py-3">
          <p className="text-[15px]">Ping style</p>
          <div className="mt-2 grid grid-cols-3 gap-0.5 rounded-[10px] bg-page p-0.5 text-[13px]">
            {(
              [
                ['both', 'Both'],
                ['sound', 'Sound'],
                ['popup', 'Popup'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={prefs.notifMode === value}
                className={`h-8 w-full rounded-lg transition ${
                  prefs.notifMode === value
                    ? 'bg-surface font-medium text-ink shadow-sm'
                    : 'text-muted'
                }`}
                onClick={() => set('notifMode', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        </div>
      </dialog>
    </>
  )
}

function CogIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[22px] md:size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4">
      <span className="text-[15px]">{label}</span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-[31px] w-[51px] rounded-full bg-[#e9e9eb] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-checked:bg-accent" />
        <span className="pointer-events-none absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

function NumRow({
  label,
  suffix,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  suffix?: string
  value: number
  min: number
  max?: number
  onChange: (n: number) => void
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 px-4">
      <span className="text-[15px]">{label}</span>
      <span className="flex items-center gap-1.5 text-[15px] text-muted">
        <input
          type="number"
          className="h-8 w-14 rounded-lg bg-page text-center text-ink tabular-nums outline-none focus:ring-2 focus:ring-accent/30"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            let n = Math.floor(Number(e.target.value) || min)
            if (n < min) n = min
            if (max != null && n > max) n = max
            onChange(n)
          }}
        />
        {suffix}
      </span>
    </label>
  )
}
