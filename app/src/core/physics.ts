export { G } from './figure'
import { at, com, LEN, loopMs, place, SEGMENTS, type Body, type Move, type Pt } from './figure'

export const STEP = 20

const ENDS = ['hand', 'farHand', 'foot', 'farFoot', 'toe', 'farToe', 'heel', 'farHeel'] as const
/** How far above a surface each joint still touches it: soles touch; ankles, knees and hands sit a shin's or a wheel's thickness up; the trunk a body's thickness. */
const REACH: [keyof Body, number][] = [
  ['toe', 4], ['farToe', 4], ['heel', 4], ['farHeel', 4], ['hand', 14], ['farHand', 14], ['foot', 14], ['farFoot', 14],
  ['knee', 14], ['farKnee', 14], ['elbow', 8], ['farElbow', 8], ['hip', 15], ['waist', 15], ['shoulder', 15], ['head', 4],
]

/**
 * `bear`: a floor, box top or grip that takes weight from above or below; `side`: a wall, pole or box face, which
 * can also push sideways (flags, wall holds), so balance over the base no longer applies.
 */
export type Touch = { p: Pt; kind: 'bear' | 'side'; k: string }

/** Joints touching the floor or a prop.  */
export function contacts(m: Move, b: Body): Touch[] {
  const out: Touch[] = []
  if ((m.y ?? 'floor') !== 'floor') out.push({ p: b[m.y as keyof Body], kind: 'bear', k: m.y as string })
  const check = (k: keyof Body, reach: number) => {
    const p = b[k]
    const y = k === 'head' ? p.y + LEN.head : p.y
    if (m.floor !== false && y >= -reach) out.push({ p, kind: 'bear', k })
    for (const q of m.props ?? []) {
      if (q.t === 'box') {
        if (p.x >= q.x - 3 && p.x <= q.x + q.w + 3 && Math.abs(y + q.h) <= reach) out.push({ p, kind: 'bear', k })
        else if ((Math.abs(p.x - q.x) <= 6 || Math.abs(p.x - q.x - q.w) <= 6) && y > -q.h && y <= 0) out.push({ p, kind: 'side', k })
      }
      if ((ENDS as readonly string[]).includes(k)) {
        if ((q.t === 'bar' || q.t === 'rings' || q.t === 'bars' || q.t === 'board') && Math.hypot(p.x - q.x, p.y - q.y) <= 10) out.push({ p, kind: 'bear', k })
        if ((q.t === 'wall' || q.t === 'pole') && Math.abs(p.x - q.x) <= 10) out.push({ p, kind: 'side', k })
        if (q.t === 'stall' && Math.abs(p.x - q.x) <= 10 && p.y < -6) out.push({ p, kind: 'side', k })
      }
    }
  }
  for (const [k, r] of REACH) check(k, r)
  return out
}

export type Sample = { t: number; b: Body; c: Required<Pt>; touch: Touch[]; turn: number }

/** `loops` loops sampled every STEP ms, seen side-on without camera turn or tilt. */
export function samples(m: Move, loops = 1): Sample[] {
  const out: Sample[] = []
  const flat = { ...m, view: 0, tilt: 0 }
  for (let t = 0; t < loops * loopMs(m); t += STEP) {
    const s = at(m, t)
    const b = place(flat, s.pose, s)
    out.push({ t, b, c: com(b), touch: contacts(m, b), turn: s.turn })
  }
  return out
}

/** Airborne runs (no contact), each at least `min` ms, that start in the first of two sampled loops. */
export function flights(m: Move, s: Sample[], min = 100): Sample[][] {
  const total = loopMs(m)
  const runs: Sample[][] = []
  let cur: Sample[] = []
  for (const x of s) {
    if (!x.touch.length) cur.push(x)
    else {
      if (cur.length) runs.push(cur)
      cur = []
    }
  }
  // A run touching the first sample may continue from before it; it reappears whole in the second loop.
  return runs.filter((r) => r[0].t > 0 && r[0].t < total && r.at(-1)!.t - r[0].t + STEP >= min)
}

const MOVING = ['hip', 'shoulder', 'head', 'hand', 'farHand', 'foot', 'farFoot', 'knee', 'farKnee'] as const
/** Largest joint speed (units per ms) between neighbouring samples. */
export const speed = (a: Sample, b: Sample) => Math.max(...MOVING.map((k) => Math.hypot(b.b[k].x - a.b[k].x, b.b[k].y - a.b[k].y, (b.b[k].z ?? 0) - (a.b[k].z ?? 0)))) / (b.t - a.t)

/** Least-squares quadratic a + b·t + c·t². */
export function quad(ts: number[], ys: number[]): [number, number, number] {
  const t0 = ts[0]
  const S = [0, 0, 0, 0, 0], R = [0, 0, 0]
  ts.forEach((t, i) => {
    const u = t - t0
    for (let k = 0; k < 5; k++) S[k] += u ** k
    for (let k = 0; k < 3; k++) R[k] += ys[i] * u ** k
  })
  const A = [[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]]
  const det = (M: number[][]) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  const d = det(A)
  return [0, 1, 2].map((c) => det(A.map((row, r) => row.map((v, k) => (k === c ? R[r] : v)))) / d) as [number, number, number]
}

/** Sagittal angular momentum about the centre of mass (per unit body mass), each segment a rod. */
export function spin(a: Sample, b: Sample): number {
  const dt = b.t - a.t
  let L = 0
  for (const [p, q, mass] of SEGMENTS) {
    const mid = (s: Sample) => ({ x: (s.b[p].x + s.b[q].x) / 2 - s.c.x, y: (s.b[p].y + s.b[q].y) / 2 - s.c.y })
    const d = (s: Sample) => ({ x: s.b[q].x - s.b[p].x, y: s.b[q].y - s.b[p].y })
    const [r0, r1, d0, d1] = [mid(a), mid(b), d(a), d(b)]
    const r = { x: (r0.x + r1.x) / 2, y: (r0.y + r1.y) / 2 }
    const v = { x: (r1.x - r0.x) / dt, y: (r1.y - r0.y) / dt }
    const dd = { x: (d0.x + d1.x) / 2, y: (d0.y + d1.y) / 2 }
    const dv = { x: (d1.x - d0.x) / dt, y: (d1.y - d0.y) / dt }
    L += mass * (r.x * v.y - r.y * v.x + (dd.x * dv.y - dd.y * dv.x) / 12)
  }
  return L
}
