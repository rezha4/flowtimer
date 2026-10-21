import type { NotifMode } from './storage.ts'
import type { Mode } from './timer.ts'

export async function ensureNotifPermission(): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') await Notification.requestPermission()
}

export function notify(title: string, body: string, mode: NotifMode): void {
  if (mode === 'sound' || mode === 'both') playBeep()
  if (
    (mode === 'popup' || mode === 'both') &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(title, { body, silent: mode === 'both' })
    } catch {
      /* ignore */
    }
  }
}

function playBeep(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => void ctx.close()
  } catch {
    /* ignore */
  }
}

const INK = '#171717'
/** Filled discs sit just inside the 32×32 tile; the ring's outer edge nearly touches it. */
const DISC_R = 15.3
const RING_R = 14.4
const RING_STROKE = 2.8

/** Opaque play triangle, centred in a filled circle. */
function playGlyph(fill: string): string {
  return `<path d="M12.1 9.2 23.6 16 12.1 22.8Z" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round"/>`
}

/** Two pause bars, centred in a circle. */
function pauseGlyph(fill: string): string {
  return `<rect x="10.1" y="8.9" width="4.15" height="14.2" rx="2.07" fill="${fill}"/><rect x="17.75" y="8.9" width="4.15" height="14.2" rx="2.07" fill="${fill}"/>`
}

const FAVICONS: Record<Mode, string> = {
  idle: `<circle cx="16" cy="16" r="${RING_R}" fill="none" stroke="${INK}" stroke-width="${RING_STROKE}"/>`,
  session: `<circle cx="16" cy="16" r="${DISC_R}" fill="${INK}"/>${playGlyph('#fff')}`,
  paused: `<circle cx="16" cy="16" r="${DISC_R}" fill="#e9eaed"/>${pauseGlyph(INK)}`,
  break: `<circle cx="16" cy="16" r="${DISC_R}" fill="#0d9488"/><text x="16" y="21.5" text-anchor="middle" font-size="13" fill="#fff">◐</text>`,
}

export function faviconSvg(mode: Mode): string {
  // Explicit width/height are required: without them some browsers (Safari) render the
  // SVG on a default 300×150 canvas and park the artwork in the top-left corner.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${FAVICONS[mode]}</svg>`
}

export function setPresence(mode: Mode, clock: string): void {
  const link = document.getElementById('favicon') as HTMLLinkElement | null
  if (link) {
    link.href = `data:image/svg+xml,${encodeURIComponent(faviconSvg(mode))}`
  }
  if (mode === 'idle') document.title = 'Flowtimer'
  else if (mode === 'break') document.title = `❚ ${clock} · Flowtimer`
  else document.title = `${clock} · Flowtimer`
}

/** ADR 0002 — returns cleanup that releases the lock (needed for React StrictMode). */
export function gateActiveTab(onActive: () => void, onBlocked: () => void): () => void {
  if (!navigator.locks) {
    onActive()
    return () => {}
  }

  let release: (() => void) | null = null
  onBlocked()
  void navigator.locks.request('flowtimer-active', async () => {
    onActive()
    await new Promise<void>((resolve) => {
      release = resolve
      window.addEventListener('pagehide', () => resolve(), { once: true })
    })
  })

  return () => {
    release?.()
  }
}
