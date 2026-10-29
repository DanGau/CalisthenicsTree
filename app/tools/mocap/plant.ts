// Contacts and loop seams for retargeted samples.
import { at, loopMs, place, type Move, type Plant } from '../../src/core/figure'
import type { Sample, Skel } from './fit'

/** Sample channels that wrap by whole turns in core `at`: pose angles, turn, roll, limb swings. */
const WRAP = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 17, 18, 21, 22])
const LIFT = 12
const SHIFT = 13
const smooth = (u: number) => u * u * (3 - 2 * u)

/**
 * Cycle seam: ease the last `sec` seconds so the clip runs on into its start, and append that start
 * (offset by whole turns and one loop's travel) as a final sample. Emit keys without it; it is the wrap.
 */
export function seam(S: Sample[], sec: number): Sample[] {
  const [a, z, y] = [S[0], S[S.length - 1], S[S.length - 2]]
  const dt = z.t - y.t
  const end = a.v.map((v, j) => (j === SHIFT ? 2 * z.v[j] - y.v[j] : WRAP.has(j) ? v + Math.round((z.v[j] - v) / 360) * 360 : v))
  // Gap between the clip run on one step and where it must land.
  const gap = end.map((v, j) => v - (2 * z.v[j] - y.v[j]))
  const out = S.map((s) => {
    const u = sec > 0 ? Math.max(0, (s.t - (z.t - sec)) / sec) : s === z ? 1 : 0
    return { ...s, v: s.v.map((v, j) => Math.max(j === LIFT ? 0 : -Infinity, v + gap[j] * smooth(Math.min(1, u)))) }
  })
  return [...out, { frame: z.frame, t: z.t + dt, v: end }]
}

/** Pose distance between two samples, ignoring where and which way the body is. */
export const poseGap = (p: number[], q: number[]) =>
  Math.max(...p.map((v, j) => (j === 12 || j === SHIFT || j === 14 ? 0 : WRAP.has(j) ? Math.abs(((v - q[j] + 540) % 360) - 180) : Math.abs(v - q[j]))))

/** How far (body units) a contact may sit above the frame's lowest joint. */
const LOWEST = 4
const PLANT: Record<Plant['joint'], (keyof Skel)[]> = { foot: ['nA', 'nT'], farFoot: ['fA', 'fT'], hand: ['nW'], farHand: ['fW'] }

/**
 * Windows where a hand or foot is down (near the floor and the lowest joint) and still in the raw data, in loop seconds from `frames[0]`.
 * `total` is the loop length; windows touching both ends merge across the seam.
 */
export function contacts(sk: Skel[], frames: number[], dt: number, total: number, o: { height?: number; speed?: number; min?: number } = {}): Plant[] {
  const [hMax, vMax, minLen] = [o.height ?? 7, o.speed ?? 45, o.min ?? 0.1]
  const out: Plant[] = []
  for (const [joint, keys] of Object.entries(PLANT) as [Plant['joint'], (keyof Skel)[]][]) {
    const h = frames.map((f) => Math.min(...keys.map((k) => -sk[f][k][1])))
    const floor = Math.min(...sk.flatMap((s) => keys.map((k) => -s[k][1])))
    const down = frames.map((_, i) => {
      const [a, b] = [frames[Math.max(0, i - 1)], frames[Math.min(frames.length - 1, i + 1)]]
      const p = sk[a][keys[0]]
      const q = sk[b][keys[0]]
      const v = Math.hypot(q[0] - p[0], q[2] - p[2]) / (((b - a) * dt) || 1)
      // Down means near the floor and near the frame's lowest point: pin keeps the lowest point down.
      const low = Math.min(...Object.values(sk[frames[i]]).map((q) => -q[1]))
      return h[i] - floor < hMax && h[i] - low < LOWEST && v < vMax
    })
    const t = (i: number) => (frames[i] - frames[0]) * dt
    const runs: [number, number][] = []
    for (let i = 0; i < down.length; i++) {
      if (!down[i]) continue
      let j = i
      while (j + 1 < down.length && down[j + 1]) j++
      runs.push([t(i), t(j)])
      i = j
    }
    // Close tiny gaps, then join the ends across the seam.
    const merged = runs.reduce<[number, number][]>((acc, r) => {
      const last = acc[acc.length - 1]
      if (last && r[0] - last[1] < 0.06) last[1] = r[1]
      else acc.push([...r])
      return acc
    }, [])
    const lastT = t(frames.length - 1)
    if (merged.length > 1 && merged[0][0] === 0 && merged[0][1] >= 0.05 && lastT - merged[merged.length - 1][1] < 0.05) {
      const tail = merged.pop()!
      merged[0] = [tail[0], merged[0][1]]
    }
    for (const [a, b] of merged) {
      const wrap = a > b
      const len = wrap ? total - a + b : b - a
      if (len >= minLen) out.push({ joint, from: +a.toFixed(3), to: +(wrap ? b : Math.min(b, total)).toFixed(3) })
    }
  }
  return out
}

/** Worst drift (body units) of a planted joint inside its window, sampling `at` every 20 ms over two loops. */
export const slip = (m: Move) => Math.max(0, ...slips(m))

/** Under the test's slip limit (2.5). */
const LIMIT = 2.4
/** Seconds trimmed per step. */
const TRIM = 1 / 30

/**
 * Trim each plant from whichever end helps more until it holds under the limit, or drop it.
 * A window's edges often catch a limb still landing or lifting that the figure cannot reach.
 */
export function hold(m: Move): Plant[] {
  let ps = [...(m.plants ?? [])]
  const step = (m.ms ?? 900) / 1000
  for (let i = 0; i < ps.length; ) {
    const err = (q: Plant) => slips({ ...m, plants: ps.map((p, k) => (k === i ? q : p)) })[i]
    let p = ps[i]
    while (err(p) > LIMIT) {
      const len = (p.to - p.from + loopMs(m) / 1000 / step) % (loopMs(m) / 1000 / step)
      if (len < 0.1 / step + 2 * TRIM / step) break
      const a = { ...p, from: +(p.from + TRIM / step).toFixed(3) }
      const b = { ...p, to: +(p.to - TRIM / step).toFixed(3) }
      p = err(a) < err(b) ? a : b
    }
    if (err(p) > LIMIT) ps = ps.filter((_, k) => k !== i)
    else ps[i++] = p
  }
  return ps
}

/** Each plant's worst drift. */
function slips(m: Move): number[] {
  const total = loopMs(m)
  const step = m.ms ?? 900
  return (m.plants ?? []).map((p) => {
    let worst = 0
    const pts: number[][] = []
    for (let ms = 0; ms < 2 * total; ms += 20) {
      const u = (ms % total) / step
      if (p.from > p.to ? u < p.from && u > p.to : u < p.from || u > p.to) continue
      const s = at(m, ms)
      const b = place({ ...m, view: 0, tilt: 0 }, s.pose, s)[p.joint]
      // Unroll travel so one window compares with itself.
      const loop = Math.floor(ms / total) - (p.from > p.to && u <= p.to ? 1 : 0)
      pts.push([b.x - loop * (m.travel ?? 0), b.y, b.z ?? 0])
    }
    for (const q of pts) for (const r of pts) worst = Math.max(worst, Math.hypot(q[0] - r[0], q[1] - r[1], q[2] - r[2]))
    return worst
  })
}
