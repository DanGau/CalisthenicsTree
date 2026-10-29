// MediaPipe Pose world landmarks (tools/video/landmarks.py) → the BVH-named joints `world` fits.
import { readFileSync } from 'node:fs'
import type { V } from './bvh'
import { world, type Opts, type Skel } from './fit'

export type Landmarks = { video: string; fps: number; frames: { f: number; t: number; w: number[][] | null; i: number[][] | null }[] }

/** BVH joint name → MediaPipe landmark(s), averaged. Spine is placed between hip and shoulder centres. */
const MAP: Record<string, number[]> = {
  LeftArm: [11], LeftForeArm: [13], LeftHand: [15], LeftUpLeg: [23], LeftLeg: [25], LeftFoot: [27], LeftToeBase: [31],
  RightArm: [12], RightForeArm: [14], RightHand: [16], RightUpLeg: [24], RightLeg: [26], RightFoot: [28], RightToeBase: [32],
  Head: [7, 8], HeadEnd: [7, 8],
}

/** Ground: `low` puts each frame's lowest point on the floor; `foot`/`hand` hold the feet/hands still (pushup, hang). */
export type VideoOpts = Opts & { jump?: number; minVis?: number; maxGap?: number; cutoff?: number; beta?: number; ground?: 'low' | 'foot' | 'hand'; flat?: number }

/** One-Euro filter run forward and backward, averaged, so there is no lag. */
function oneEuro(x: number[], dt: number, cutoff: number, beta: number): number[] {
  const alpha = (fc: number) => 1 / (1 + 1 / (2 * Math.PI * fc * dt))
  const pass = (xs: number[]) => {
    const out = [xs[0]]
    let dx = 0
    for (let i = 1; i < xs.length; i++) {
      dx += alpha(1) * ((xs[i] - xs[i - 1]) / dt - dx)
      const a = alpha(cutoff + beta * Math.abs(dx))
      out.push(out[i - 1] + a * (xs[i] - out[i - 1]))
    }
    return out
  }
  const f = pass(x)
  const b = pass([...x].reverse()).reverse()
  return f.map((v, i) => (v + b[i]) / 2)
}

/** Fill invalid samples by linear interpolation; gaps longer than `maxGap` keep their raw values where present. */
function fill(x: (number | null)[], ok: boolean[], maxGap: number): number[] {
  const out = x.map((v) => v ?? NaN)
  let i = 0
  while (i < out.length) {
    if (ok[i]) { i++; continue }
    let j = i
    while (j < out.length && !ok[j]) j++
    const long = j - i > maxGap
    const [a, b] = [ok[i - 1] ? out[i - 1] : undefined, j < out.length ? out[j] : undefined]
    for (let k = i; k < j; k++) {
      if (long && !Number.isNaN(out[k])) continue
      out[k] = a === undefined ? b! : b === undefined ? a : a + ((b - a) * (k - i + 1)) / (j - i + 1)
    }
    i = j
  }
  return out
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1]
const dist = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const avg = (ps: V[]): V => [0, 1, 2].map((k) => ps.reduce((s, p) => s + p[k], 0) / ps.length) as V

/** Limb chains from the trunk out. */
const CHAINS = ['Left', 'Right'].flatMap((s) => [[`${s}Arm`, `${s}ForeArm`, `${s}Hand`], [`${s}UpLeg`, `${s}Leg`, `${s}Foot`, `${s}ToeBase`]])

/**
 * Side-on clips: camera depth (z) is the body's side-to-side axis and the noisiest. Scale each limb
 * segment's depth by `k` (0 flat in the sagittal plane, 1 as estimated), keeping its length, so only a
 * small out-of-plane swing survives. Shoulder and hip width stay.
 */
function flatten(p: Record<string, V>, k: number) {
  for (const c of CHAINS) {
    let [prev, base] = [p[c[0]], p[c[0]]]
    for (const j of c.slice(1)) {
      const d: V = [p[j][0] - prev[0], p[j][1] - prev[1], p[j][2] - prev[2]]
      const z = d[2] * k
      const s = Math.sqrt(Math.max(0, d[0] ** 2 + d[1] ** 2 + d[2] ** 2 - z * z)) / (Math.hypot(d[0], d[1]) || 1e-6)
      prev = p[j]
      base = p[j] = [base[0] + d[0] * s, base[1] + d[1] * s, base[2] + z]
    }
  }
}

export const loadLandmarks = (path: string): Landmarks => JSON.parse(readFileSync(path, 'utf8'))

/** Frames `from..to` (video frame numbers) as our skeleton, plus the per-sample time step. */
export function videoSkeleton(L: Landmarks, from: number, to: number, o: VideoOpts = {}): { skel: Skel[]; low: number[]; chest: number; dt: number; raw: number } {
  const fr = L.frames.filter((x) => x.f >= from && x.f <= to)
  const dt = fr.length > 1 ? (fr[fr.length - 1].t - fr[0].t) / (fr.length - 1) : 1 / L.fps
  const [minVis, maxGap] = [o.minVis ?? 0.5, Math.round((o.maxGap ?? 0.5) / dt)]
  // A pose whose image hip jumps more than `jump` (fraction of the frame) from the last kept one is another person: drop it.
  let last: number[] | undefined
  const kept = fr.map((x) => {
    if (!x.i) return false
    const h = [(x.i[23][0] + x.i[24][0]) / 2, (x.i[23][1] + x.i[24][1]) / 2]
    if (last && Math.hypot(h[0] - last[0], h[1] - last[1]) > (o.jump ?? 0.15)) return false
    last = h
    return true
  })
  // 33 landmarks × xyz series, MediaPipe (x right, y down, z away) turned to Y up: (x, -y, -z).
  const series = Array.from({ length: 33 }, (_, i) => [0, 1, 2].map((k) => {
    const sgn = k === 0 ? 1 : -1
    const ok = fr.map((x, n) => kept[n] && x.w![i][3] >= minVis)
    return oneEuro(fill(fr.map((x, n) => (kept[n] ? sgn * x.w![i][k] : null)), ok, maxGap), dt, o.cutoff ?? 2, o.beta ?? 0.3)
  }))
  const lm = (i: number, n: number): V => [series[i][0][n], series[i][1][n], series[i][2][n]]
  const P = fr.map((_, n) => {
    const p: Record<string, V> = {}
    for (const [name, ids] of Object.entries(MAP)) p[name] = avg(ids.map((i) => lm(i, n)))
    const hip = avg([p.LeftUpLeg, p.RightUpLeg])
    const sh = avg([p.LeftArm, p.RightArm])
    p.Spine = [0, 1, 2].map((k) => hip[k] + 0.4 * (sh[k] - hip[k])) as V
    return p
  })
  if (o.flat !== undefined) for (const p of P) flatten(p, o.flat)
  // Hip-centred per frame: re-anchor so the ground (or the held feet/hands) stays put.
  const anchor = (p: Record<string, V>): V | undefined => (o.ground === 'foot' ? avg([p.LeftFoot, p.RightFoot]) : o.ground === 'hand' ? avg([p.LeftHand, p.RightHand]) : undefined)
  const a0 = anchor(P[0])
  for (const p of P) {
    const a = anchor(p)
    const off: V = a && a0 ? [a0[0] - a[0], a0[1] - a[1], a0[2] - a[2]] : [0, -Math.min(...Object.values(p).map((q) => q[1])), 0]
    for (const k in p) p[k] = [p[k][0] + off[0], p[k][1] + off[1], p[k][2] + off[2]]
  }
  const side = o.mirror ? 'Right' : 'Left'
  const leg = median(P.map((p) => dist(p[`${side}UpLeg`], p[`${side}Leg`]) + dist(p[`${side}Leg`], p[`${side}Foot`])))
  const chest = median(P.map((p) => dist(p.Spine, avg([p.LeftArm, p.RightArm]))))
  const r = world(P, leg, chest, { ...o, ref: 0 })
  return { ...r, dt, raw: fr.length }
}
