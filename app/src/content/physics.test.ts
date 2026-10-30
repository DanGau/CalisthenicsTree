import { expect, test } from 'vitest'
import { full, loopMs, sequence, type Move } from '../core/figure'
import { flights, G, quad, samples, speed, spin, STEP, type Sample } from '../core/physics'
import { MOVES } from './moves'

// Physics of every move, sampled every 20 ms. Scene units: the figure is a 1.75 m man (`G` in units/ms²).
const ALL = Object.entries(MOVES)
const cache = new Map<Move, Sample[]>()
const two = (m: Move) => cache.get(m) ?? (cache.set(m, samples(m, 2)), cache.get(m)!)

/** Still: every tracked joint slower than this (units/ms, 8 units/s) for at least STILL ms. */
const STILL_SPEED = 0.008
const STILL = 200
/** COM may sit this far outside the span of the weight-bearing contacts (a palm or a heel's width). */
const BASE_TOL = 6

/** Torque holds: feet hooked or hands gripping behind (pads, partners, benches) hold the body off its base. */
const ANCHORED = ['nordic', 'nordic_pause', 'back_ext', 'dragon_flag', 'tuck_dragon']

/** Samples in the first loop where the body has been still for STILL ms around them. */
function still(m: Move): Sample[] {
  const s = two(m)
  const n = Math.round(loopMs(m) / STEP)
  const slow = s.map((x, i) => i > 0 && i < s.length - 1 && speed(s[i - 1], x) < STILL_SPEED && speed(x, s[i + 1]) < STILL_SPEED)
  const half = Math.ceil(STILL / STEP / 2)
  return s.slice(0, n).filter((_, i) => i >= half && slow.slice(i - half, i + half + 1).every(Boolean))
}

test.each(ALL.filter(([id]) => !ANCHORED.includes(id)))('%s balances when still', (id, m) => {
  for (const x of still(m)) {
    if (x.touch.some((c) => c.kind === 'side')) continue
    const bear = x.touch.map((c) => c.p)
    expect(bear.length, `${id} hovers at ${x.t} ms`).toBeGreaterThan(0)
    const xs = bear.map((p) => p.x), zs = bear.map((p) => p.z ?? 0)
    const out = (v: number, a: number[]) => Math.max(Math.min(...a) - v, v - Math.max(...a), 0)
    expect(out(x.c.x, xs), `${id} centre of mass off its base (x) at ${x.t} ms`).toBeLessThan(BASE_TOL)
    if (m.solid) expect(out(x.c.z, zs), `${id} centre of mass off its base (z) at ${x.t} ms`).toBeLessThan(BASE_TOL)
  }
}, 30000)

/** Flights shorter than this are too short to fit an arc. */
const ARC_MIN = 160

test.each(ALL)('%s flies on a parabola', (id, m) => {
  for (const f of flights(m, two(m), ARC_MIN)) {
    const ts = f.map((s) => s.t)
    const [a, b, c] = quad(ts, f.map((s) => s.c.y))
    const rms = Math.sqrt(f.reduce((e, s) => e + (a + b * (s.t - ts[0]) + c * (s.t - ts[0]) ** 2 - s.c.y) ** 2, 0) / f.length)
    const at = `${id} flight at ${ts[0]} ms`
    expect(2 * c / G, `${at}: vertical acceleration / g`).toBeGreaterThan(0.6)
    expect(2 * c / G, `${at}: vertical acceleration / g`).toBeLessThan(1.5)
    expect(rms, `${at}: off its arc`).toBeLessThan(3)
    expect(Math.abs(2 * quad(ts, f.map((s) => s.c.x))[2] / G), `${at}: horizontal acceleration / g`).toBeLessThan(0.4)
  }
}, 30000)

const torso = (s: Sample) => (Math.atan2(s.b.shoulder.x - s.b.hip.x, s.b.shoulder.y - s.b.hip.y) * 180) / Math.PI

test.each(ALL)('%s keeps its spin in flight', (id, m) => {
  for (const f of flights(m, two(m), ARC_MIN)) {
    let turn = 0
    for (let i = 1; i < f.length; i++) { const d = torso(f[i]) - torso(f[i - 1]); turn += d - Math.round(d / 360) * 360 }
    // Flips only: a body turning about the vertical (swipe, twists) spins out of the side-on plane.
    if (Math.abs(turn) < 90 || Math.max(...f.map((s) => Math.abs(s.turn - f[0].turn))) > 20) continue
    const L = f.slice(1).map((s, i) => spin(f[i], s)).slice(1, -1)
    const mean = L.reduce((x, y) => x + y, 0) / L.length
    const sd = Math.sqrt(L.reduce((x, y) => x + (y - mean) ** 2, 0) / L.length)
    expect(sd / Math.abs(mean), `${id} flight at ${f[0].t} ms: angular momentum varies`).toBeLessThan(0.3)
  }
}, 30000)

test.each(ALL)('%s keeps real timing', (id, m) => {
  for (const f of flights(m, two(m)))
    expect(f.length * STEP, `${id} flight at ${f[0].t} ms lasts too long`).toBeLessThanOrEqual(900)
  // A hold (`holdBeats`): entry, then a sway of under 5° bounced; one way lasts ≈1.5 s or more (motion-reference §1.4).
  const n = m.keys.length
  if ((m.mode ?? 'bounce') !== 'bounce' || n < 2 || n > 3) return
  const [a, b] = [full(m.keys[n - 2]), full(m.keys[n - 1])]
  const d = Math.max(...a.map((v, j) => Math.abs(v - b[j])))
  const f = sequence(m)[n - 2]
  if (d <= 5 && f.lift === sequence(m)[n - 1].lift) expect(f.dur * (m.ms ?? 900), `${id} sways too fast`).toBeGreaterThanOrEqual(1200)
}, 30000)
