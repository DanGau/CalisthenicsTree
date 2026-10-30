import { blend, com as comOf, full, G, joints, LEN, place, solid, type Beat, type Body, type Move, type Pose, type Prop, type Pt, type Stage } from '../../core/figure'
import { ik } from './legs'

// Geometry helpers shared by the pushing branches. Coordinates are relative to the hip, y down.
const ARM = LEN.upper + LEN.fore
const D2R = Math.PI / 180

/** Where f first crosses zero going from lo toward hi (scan, then bisection). */
export function solve(f: (x: number) => number, lo: number, hi: number) {
  const s = Math.sign(f(lo))
  const n = 90
  for (let i = 1; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n
    if (Math.sign(f(x)) !== s) {
      hi = x
      break
    }
    lo = x
  }
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2
    if (Math.sign(f(m)) === s) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

/** shape(v) with v solved so err(its joints) = 0. */
export const fit = (shape: (v: number) => Pose, err: (b: Body) => number, lo: number, hi: number): Pose =>
  shape(solve((v) => err(joints(shape(v))), lo, hi))

/** Copy of p with the angles at idx set to v (chest and head made explicit first). */
export const set = (p: Pose, idx: number[], v: number): Pose => {
  const o = [...full(p)] as Pose
  for (const i of idx) o[i] = v
  return o
}

/** Two-key strength rep from the top key, in seconds (ms 1000): lowering, a brief pause, a strong rise, a breath at the top. */
export const tempo = (down = 1.6, up = 0.95, top = 0.3, low = 0.15): Pick<Move, 'mode' | 'beats' | 'ms'> => ({
  mode: 'cycle', ms: 1000, beats: [{ hold: top, dur: down }, { hold: low, dur: up }],
})

/**
 * Strength rep through mid keys, in seconds (ms 1000). `mid(f, up)` is the pose f of the way down, on the way
 * down or up. Lowering accelerates and brakes near the bottom; rising is slowest just off the bottom
 * (the sticking point), then speeds up and settles into the lockout.
 */
export function rep(top: Pose, low: Pose, mid: (f: number, up: boolean) => Pose, down = 1.6, up = 0.95, hold = [0.3, 0.15]): Pick<Move, 'keys' | 'mode' | 'beats' | 'ms'> {
  return {
    keys: [top, mid(0.25, false), mid(0.7, false), low, mid(0.8, true), mid(0.35, true)], mode: 'cycle', ms: 1000,
    beats: [{ hold: hold[0], dur: 0.4 * down }, { dur: 0.35 * down }, { dur: 0.25 * down }, { hold: hold[1], dur: 0.38 * up }, { dur: 0.32 * up }, { dur: 0.3 * up }],
  }
}

/** Hold: [entry, hold, sway] bounced, in seconds (ms 1000). Settle in, then sway or breathe with period 2 × `sway`. */
export const holdBeats = (enter = 1.3, sway = 1.5): Beat[] => [{ hold: 0.5, dur: enter, ease: 'io' }, { dur: sway, ease: 'io' }, { hold: 0.25 }]

/** Copy of p with deltas added at the given indices (chest and head made explicit first). */
export const nudge = (p: Pose, d: Record<number, number>): Pose => {
  const o = [...full(p)] as Pose
  for (const [i, v] of Object.entries(d)) o[+i] = o[+i]! + v
  return o
}

const wrapTo = (v: number, to: number) => v + Math.round((to - v) / 360) * 360
/**
 * Pose f of the way from a to b (plus deltas d) with the hands kept where both keys plant them relative to
 * the toes: the blended body turns about the toes until the shoulders are the blended distance from the
 * hands, then the arms re-aim. Mid keys made this way keep hands and feet planted along the spline.
 */
export function tween(a: Pose, b: Pose, f: number, d: Record<number, number> = {}, which: 'both' | 'near' = 'both'): Pose {
  const q = nudge(blend(a, b, f, 'lin'), d)
  const [ja, jb] = [joints(a), joints(b)]
  const hand = { x: ja.hand.x - ja.toe.x, y: ja.hand.y - ja.toe.y }
  const r = dist(ja.shoulder, ja.hand) + (dist(jb.shoulder, jb.hand) - dist(ja.shoulder, ja.hand)) * f
  const turn = (v: number) => { const o = [...q] as Pose; for (const i of [0, 5, 6, 7, 8, 9, 10]) o[i] = o[i]! + v; return o }
  const err = (v: number) => { const j = joints(turn(v)); return dist(j.shoulder, { x: j.toe.x + hand.x, y: j.toe.y + hand.y }) - r }
  const v = Math.abs(err(0)) < 1e-6 ? 0 : solve(err, 0, Math.sign(err(25)) !== Math.sign(err(0)) ? 25 : -25)
  const p = turn(v)
  const j = joints(p)
  const to = { x: j.toe.x + hand.x, y: j.toe.y + hand.y }
  const [k1, k2] = [-1, 1].map((k) => armsTo(p, to, k, which))
  const off = (o: Pose) => Math.abs(wrapTo(o[1], q[1]) - q[1]) + Math.abs(wrapTo(o[2], q[2]) - q[2])
  const o = off(k1) < off(k2) ? k1 : k2
  for (const i of which === 'near' ? [1, 2] : [1, 2, 3, 4]) o[i] = wrapTo(o[i]!, q[i]!)
  return o
}

/** Straight body facing down or up: torso t, chest t + bend, legs in line (pike > 0 flexes the hips). */
export const line = (t: number, bend = 0, pike = 0, head = 0): Pose => {
  const L = t - 180 + pike
  return [t, 0, 0, 0, 0, L, L, L, L, t + bend, t + bend + head]
}

/** Aims both arms (or one) at `to`; k = -1 bends the elbow toward the lower angle. */
export function armsTo(p: Pose, to: Pt, k = -1, which: 'both' | 'near' | 'far' = 'both'): Pose {
  const s = joints(p).shoulder
  const [u, f] = ik(to.x - s.x, to.y - s.y, LEN.upper, LEN.fore, k)
  const o = [...full(p)] as Pose
  if (which !== 'far') [o[1], o[2]] = [u, f]
  if (which !== 'near') [o[3], o[4]] = [u, f]
  return o
}

/** Hand relative to the toes. */
export const handOf = (p: Pose): Pt => {
  const b = joints(p)
  return { x: b.hand.x - b.toe.x, y: b.hand.y - b.toe.y }
}
/** Point (dx, -h) from the toes, in hip coordinates. */
const fromToe = (b: Body, dx: number, h: number): Pt => ({ x: b.toe.x + dx, y: b.toe.y - h })
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/** Body from shape(t), arms straight at angle u, t solved so the hands sit h above the toes. */
export function straight(shape: (t: number) => Pose, u: number, h = 0, lo = 60, hi = 185): Pose {
  const s = h + ARM * Math.cos(u * D2R)
  return set(set(fit(shape, (b) => b.toe.y - b.shoulder.y - s, lo, hi), [1, 3], u), [2, 4], u)
}

/** Body from shape(t) with the shoulder s above the toes, hands bent to (dx, h) from the toes. */
export function bent(shape: (t: number) => Pose, s: number, dx: number, h = 0, k = -1, lo = 60, hi = 185): Pose {
  const p = fit(shape, (b) => b.toe.y - b.shoulder.y - s, lo, hi)
  return armsTo(p, fromToe(joints(p), dx, h), k)
}

/** Body from shape(t) with the shoulder d from the hands at (dx, h) from the toes. */
export function reachTo(shape: (t: number) => Pose, d: number, dx: number, h = 0, k = -1, lo = 60, hi = 185): Pose {
  const p = fit(shape, (b) => dist(b.shoulder, fromToe(b, dx, h)) - d, lo, hi)
  return armsTo(p, fromToe(joints(p), dx, h), k)
}

/** Straight legs (all four angles) solved so the toes rest h above the hands. */
export const legsTo = (p: Pose, h = 0, lo = -175, hi = -5): Pose =>
  fit((L) => set(p, [5, 6, 7, 8], L), (b) => b.hand.y - b.toe.y - h, lo, hi)

/** Centre of mass of a 2D pose. */
export const com = (p: Pose, front = false): Pt => comOf(joints(p, front))

/** shape(v) with v solved so the centre of mass sits over `over` (default: the hands). */
export const balance = (shape: (v: number) => Pose, lo: number, hi: number, over: (b: Body) => number = (b) => b.hand.x, front = false): Pose =>
  shape(solve((v) => com(shape(v), front).x - over(joints(shape(v), front)), lo, hi))

/** Pike with hands dx ahead of the toes: straight arms `open` past the torso line, legs solved to the floor. */
export const pikeTo = (dx: number, open = 0, head = -20): Pose =>
  fit((t) => legsTo([t, t + open, t + open, t + open, t + open, -40, -40, -40, -40, t, t + head], 0, -90, 0), (b) => b.hand.x - b.toe.x - dx, 20, 85)

/**
 * Tripod bottom: hands at (dx, h) from the toes, head on the hand level `ahead` beyond them,
 * torso and straight legs solved.
 */
export function headDown(dx: number, h: number, ahead = 12, bend = 0): Pose {
  const shape = (t: number, L: number): Pose => [t, 0, 0, 0, 0, L, L, L, L, t + bend, t + bend]
  const legs = (t: number) => solve((L) => { const b = joints(shape(t, L)); return b.head.y + LEN.head - (b.toe.y - h) }, -175, -5)
  const t = solve((t) => { const b = joints(shape(t, legs(t))); return b.head.x - b.toe.x - dx - ahead }, -10, 80)
  const p = shape(t, legs(t))
  // Elbows point back toward the feet.
  const [a, c] = [-1, 1].map((k) => armsTo(p, fromToe(joints(p), dx, h), k))
  return joints(a).elbow.x < joints(c).elbow.x ? a : c
}

/** A box under the toes of the move's first key. */
export function toeBox(m: Move, w = 44): Prop {
  const b = place(m, m.keys[0])
  return { t: 'box', x: Math.round(b.toe.x - w / 2), w, h: Math.round(-b.toe.y) }
}

/** A box under the hands of the move's first key. */
export function handBox(m: Move, w = 40): Prop {
  const b = place(m, m.keys[0])
  return { t: 'box', x: Math.round(b.hand.x - w / 2), w, h: Math.round(-b.hand.y) }
}

const withProps = (m: Move, ...fns: ((m: Move) => Prop)[]): Move => ({ ...m, props: [...(m.props ?? []), ...fns.map((f) => f(m))] })

/**
 * Push-up pair with hands h above the toes: bottom chest to the floor with the hands `back` behind the
 * shoulders, elbows back; top locked out with the upper back rounded (protracted).
 */
export function pushup(h = 0, back = 16, depth = 15): [Pose, Pose] {
  const low = fit((t) => line(t, -1), (b) => b.toe.y - b.shoulder.y - h - depth, 60, 185)
  const b = joints(low)
  const dx = b.shoulder.x - back - b.toe.x
  return [reachTo((t) => line(t, -7), ARM - 0.3, dx, h, -1, low[0], 185), armsTo(low, fromToe(b, dx, h))]
}

const [top, bottom] = pushup()

// Wall: toes 95 from the wall, hands on it 115 up; the chest comes to the wall.
const WALL = { dx: 95, h: 120 }
const wallBody = (t: number) => line(t, -4, 0, 25)
const wallTop = reachTo(wallBody, ARM - 1, WALL.dx, WALL.h, -1, 120, 180)
const wallIn = fit(wallBody, (b) => b.toe.x + WALL.dx - b.shoulder.x - 19, 110, 180)
const wallBottom = armsTo(wallIn, fromToe(joints(wallIn), WALL.dx, WALL.h))

const [incTop, incBottom] = pushup(45)
const [decTop, decBottom] = pushup(-40)

// Diamond: hands under the sternum, so the elbows travel straight back.
const [diaTop, diaBottom] = pushup(0, 27)

// Hindu: hands and toes fixed. Pike with arms by the ears, dive with the chest skimming the floor, cobra with an arched spine.
const HD = handOf(top).x + 18
const hPike = pikeTo(HD)
const dive = (t: number, L: number): Pose => [t, 0, 0, 0, 0, L, L, L, L, t - 4, t + 10]
const hDive = (() => {
  // Shoulder 16 above the floor and 12 behind the hands; legs and torso both solved.
  const legFor = (t: number) => solve((L) => { const b = joints(dive(t, L)); return b.toe.y - b.shoulder.y - 16 }, -95, -20)
  const t = solve((t) => { const b = joints(dive(t, legFor(t))); return b.shoulder.x - b.toe.x - (HD - 12) }, 60, 130)
  const p = dive(t, legFor(t))
  return armsTo(p, fromToe(joints(p), HD, 0))
})()
const hCobra = reachTo((t) => [t, 0, 0, 0, 0, -82, -82, -82, -82, t + 28, t + 50], ARM - 1, HD, 0, -1, 100, 175)


// Solid (3D) keys. Body frame: hip at the origin, x forward (pose angle 90), y down, z toward the near side.
/** A solid key: pose plus its 3D stage (limb swing, roll). */
export type Key3 = { p: Pose; st: Partial<Stage> }
const ST: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1, legs: 1, arms: 1, roll: 0, armOut: 0, farArmOut: 0, legOut: 0, farLegOut: 0, foreOut: 0, farForeOut: 0, shinOut: 0, farShinOut: 0, twist: 0 }
/** Joints of a solid key (its own `turn` is a body yaw; the camera is the move's `view`). */
export const frame = (k: Key3) => solid(k.p, { ...ST, ...k.st })
type P3 = Required<Pt>
export const z = (p: Pt) => p.z ?? 0
/** Centre of mass in the body frame. */
export const com3 = (b: Body): P3 => comOf(b) as P3
/** a - b - v as three residuals. */
export const off = (a: Pt, b: Pt, v: [number, number, number] = [0, 0, 0]) => [a.x - b.x - v[0], a.y - b.y - v[1], z(a) - z(b) - v[2]]

/** Least squares (damped Gauss-Newton): the v near v0 that brings res(frame(build(v))) to zero. */
export function fit3(build: (v: number[]) => Key3, v0: number[], res: (b: Body, v: number[]) => number[]): Key3 {
  const r = (v: number[]) => res(frame(build(v)), v)
  const cost = (e: number[]) => e.reduce((s, x) => s + x * x, 0)
  let v = [...v0]
  let e = r(v)
  let lam = 1e-3
  for (let it = 0; it < 200 && cost(e) > 1e-8; it++) {
    const J = v.map((_, j) => { const w = [...v]; w[j] += 1e-4; return r(w).map((x, i) => (x - e[i]) / 1e-4) })
    const n = v.length
    const A = v.map((_, i) => v.map((_, j) => J[i].reduce((s, x, k) => s + x * J[j][k], 0) + (i === j ? lam * (1 + J[i].reduce((s, x) => s + x * x, 0)) : 0)))
    const g = v.map((_, i) => -J[i].reduce((s, x, k) => s + x * e[k], 0))
    // Gaussian elimination.
    for (let c = 0; c < n; c++) {
      const piv = A[c][c] || 1e-12
      for (let q = c + 1; q < n; q++) {
        const f = A[q][c] / piv
        for (let k = c; k < n; k++) A[q][k] -= f * A[c][k]
        g[q] -= f * g[c]
      }
    }
    const d = new Array<number>(n).fill(0)
    for (let c = n - 1; c >= 0; c--) d[c] = (g[c] - A[c].slice(c + 1).reduce((s, x, k) => s + x * d[c + 1 + k], 0)) / (A[c][c] || 1e-12)
    const w = v.map((x, i) => x + d[i])
    const ew = r(w)
    if (cost(ew) < cost(e)) [v, e, lam] = [w, ew, lam / 3]
    else lam *= 4
  }
  return build(v)
}

/** Solid move: each key's stage merged into its beat, seen from camera yaw `view`. */
export const solidMove = (keys: Key3[], beats: Beat[], view: number, o: Partial<Move> = {}): Move =>
  ({ keys: keys.map((k) => k.p), beats: beats.map((b, i) => ({ ...keys[i].st, ...b })), solid: true, view, ms: 1000, ...o })
/** A solid move's key placed in the scene before the camera: where its props go. */
export const world = (m: Move, i = 0) => place({ ...m, view: 0, tilt: 0 }, m.keys[i], m.beats?.[i])
/** Strength rep (rep() timing) through solid keys; key(f, up, prev) is f of the way down. */
export function rep3(key: (f: number, rise: boolean, prev?: Key3) => Key3, down: number, up: number, view: number, o: Partial<Move> = {}, hold = [0.3, 0.15]): Move {
  const F: [number, boolean][] = [[0, false], [0.25, false], [0.7, false], [1, false], [0.8, true], [0.35, true]]
  const keys: Key3[] = []
  for (const [f, u] of F) keys.push(key(f, u, keys.at(-1)))
  const x = keys[0].p
  return solidMove(keys, rep(x, x, () => x, down, up, hold).beats!, view, { mode: 'cycle', ...o })
}

/**
 * Archer, solid: hands planted `Z` either side of the centre, feet apart. Going down the chest travels over the
 * near hand (+z) and drops; the near elbow bends back, the far arm stays straight and reaches out. f: top to bottom.
 */
const ARCH = { feet: 14, len: 118, cam: 50 }
function archer(Z: number, f: number, prev?: Key3): Key3 {
  const top = Math.sqrt((ARM - 0.5) ** 2 - (Z - 17) ** 2)
  const [h, d] = [top + (16 - top) * f, (Z - 17) * f]
  const build = ([t, nu, nf, fu, ff, nt, ns, ft, fs, ao, fo, lo, flo]: number[]): Key3 =>
    ({ p: [t, nu, nf, fu, ff, nt, ns, ft, fs, t, t, -2 * f], st: { armOut: ao, farArmOut: fo, legOut: lo, farLegOut: flo } })
  const v0 = prev ? [...(prev.p.slice(0, 9) as number[]), prev.st.armOut!, prev.st.farArmOut!, prev.st.legOut!, prev.st.farLegOut!] : [100, 0, 0, 0, 0, -80, -80, -80, -80, 25, 25, 8, 8]
  return fit3(build, v0, (b, [t, , , fu, ff, nt, ns, ft, fs]) => [
    ...off(b.farHand, b.hand, [0, 0, -2 * Z]),
    ...off(b.toe, b.hand, [-ARCH.len, 0, ARCH.feet - Z]),
    ...off(b.farToe, b.hand, [-ARCH.len, 0, -ARCH.feet - Z]),
    b.shoulder.y - b.hand.y + h, z(b.shoulder) - z(b.hand) + Z - d,
    Math.max(0, b.elbow.y - b.hand.y + 6), (fu - ff) * 0.3, (ns - nt) * 0.2, (fs - ft) * 0.2, (nt - t + 180) * 0.1, (ft - t + 180) * 0.1,
  ])
}
const archerMove = (Z: number, down: number, up: number, o: Partial<Move> = {}): Move =>
  rep3((f, _, prev) => archer(Z, f, prev), down, up, ARCH.cam, { x: 'hand', ...o })

// Clap: toes stay down, the chest pops up, hands meet under the chest.
const clapAir = (() => {
  const p = fit((t) => line(t, -4), (b) => b.toe.y - b.shoulder.y - 72, 90, 180)
  return set(set(p, [1, 3], 10), [2, 4], 75)
})()
const bbAir = (() => {
  const p = fit((t) => line(t, -2), (b) => b.toe.y - b.shoulder.y - 82, 90, 180)
  const c = p[9]!
  return set(set(p, [1, 3], c - 197), [2, 4], c - 190)
})()
const footX = (p: Pose) => place({ keys: [p], x: 'hand' }, p).foot.x

// Rings 22 above the floor; at the bottom the chest sinks below the rings.
const RING_H = 22
const RING = { t: 'rings', x: 0, y: -RING_H } as const
const [ringTop, ringBottom] = pushup(RING_H, 14, 3)
const [rtoTop, rtoBottom] = pushup(RING_H, 24, 3)
const rto = (keys: Pose[], ms?: number): Move => ({ keys, x: 'hand', y: 'hand', at: [0, -RING_H], props: [RING], ms })

// One arm: free hand on the lower back, or along the side.
const oneArm = (p: Pose, onBack = true): Pose => {
  const c = full(p)[9]
  return set(set(p, [3], onBack ? c - 212 : c - 185), [4], onBack ? c - 150 : c - 178)
}

// Aztec: from the top, pop into a pike in the air, hands to the toes. The head stays pinned so the jump stays airborne.
const aztecAir = (() => {
  const p: Pose = [38, 0, 0, 0, 0, 72, 72, 72, 72, 28, 50]
  const b = joints(p)
  return armsTo(p, { x: b.toe.x - 4, y: b.toe.y - 6 }, 1)
})()

// Ring archer: rings a little wider than the floor archer, feet on blocks level with the rings.
const ringArcher = archerMove(42, 2.2, 1.3, { y: 'hand', at: [0, -RING_H] })
const ringsAndBlocks = (m: Move): Prop[] => {
  const b = world(m)
  return [
    ...[b.hand, b.farHand].map((h): Prop => ({ t: 'rings', x: Math.round(h.x), y: Math.round(h.y), z: Math.round(z(h)) })),
    ...[b.foot, b.farFoot].map((f): Prop => ({ t: 'box', x: Math.round(f.x - 9), w: 18, h: RING_H })),
  ]
}

const ramp = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)))
/**
 * Push-up rep between pushup() keys, hands and toes planted. The shoulder blades stay protracted
 * (upper back rounded) until late in the descent and protract again only in the last part of the rise.
 */
const pushRep = (top: Pose, low: Pose, down = 1.5, up = 0.9, after: (p: Pose) => Pose = (p) => p) => {
  const bend = full(top)[9] - full(top)[0] - (full(low)[9] - full(low)[0])
  const shape = (f: number, rise: boolean) => {
    const want = rise ? 1 - ramp(f, 0, 0.25) : 1 - ramp(f, 0.55, 1)
    const d = bend * (want - (1 - f))
    return after(tween(top, low, f, { 9: d, 10: d }))
  }
  return rep(after(top), after(low), shape, down, up)
}

/**
 * Explosive push-up, feet fixed: a quick lowering, no pause (stretch-shortening), a 0.25 s drive to straight
 * arms, flight to `air` and back on a parabola, catch on straight arms, absorb, settle back to the top.
 * Flight `t` seconds: the chest rises g·t²/8.
 */
const plyo = (air: Pose, t = 0.4): Move => ({
  keys: [top, tween(top, bottom, 0.55), bottom, top, air, top, tween(top, bottom, 0.4)], mode: 'cycle', x: 'foot', at: [footX(top), 0], ms: 1000,
  beats: [{ hold: 0.4, dur: 0.3 }, { dur: 0.25 }, { hold: 0.04, dur: 0.25 }, { dur: t / 2, ease: 'out' }, { dur: t / 2, ease: 'in' }, { dur: 0.22 }, { hold: 0.1, dur: 0.8 }],
})

/** Aztec: lift h above the floor; flight time 2·√(2h/g). */
const AZ = 50
const azT = 2 * Math.sqrt((2 * AZ) / (G * 1e6))
const aztec: Move = {
  keys: [top, tween(top, bottom, 0.5), top, aztecAir, top, tween(top, bottom, 0.4)], mode: 'cycle', ms: 1000,
  beats: [{ hold: 0.4, dur: 0.45 }, { hold: 0.04, dur: 0.22 }, { dur: azT / 2, ease: 'out', air: true }, { lift: AZ, dur: azT / 2, ease: 'in', air: true }, { dur: 0.25 }, { hold: 0.1, dur: 0.8 }],
}

const wallMid = (f: number) => tween(wallTop, wallBottom, f)

export const MOVES: Record<string, Move> = {
  wall_pu: { x: 'hand', props: [{ t: 'wall', x: 4 }], ...rep(wallTop, wallBottom, wallMid, 1.4, 0.9) },
  incline_pu: withProps({ x: 'hand', ...pushRep(incTop, incBottom) }, handBox),
  pushup: { x: 'hand', ...pushRep(top, bottom) },
  diamond_pu: { x: 'hand', ...pushRep(diaTop, diaBottom, 1.6, 1) },
  hindu_pu: { keys: [hPike, hDive, hCobra], x: 'hand', mode: 'cycle', ms: 1000, beats: [{ hold: 0.3, dur: 1.2 }, { dur: 0.9 }, { hold: 0.6, dur: 1.4 }] },
  decline_pu: withProps({ x: 'hand', ...pushRep(decTop, decBottom, 1.6, 1) }, toeBox),
  archer_pu: archerMove(40, 2, 1.2),
  clap_pu: plyo(clapAir),
  ring_pu: { ...rto([], 1000), ...pushRep(ringTop, ringBottom, 1.6, 1) },
  oap_incline: withProps({ x: 'hand', ...pushRep(incTop, incBottom, 2, 1.3, (p) => oneArm(p)) }, handBox),
  bb_clap: plyo(bbAir, 0.5),
  rto_pu: { ...rto([], 1000), ...pushRep(rtoTop, rtoBottom, 2.2, 1.3) },
  one_arm_pu: { x: 'hand', ...pushRep(top, bottom, 2, 1.4, (p) => oneArm(p, false)) },
  aztec_pu: aztec,
  ring_archer: { ...ringArcher, props: ringsAndBlocks(ringArcher) },
  oapu_tight: { x: 'hand', ...pushRep(top, bottom, 2.4, 1.5, (p) => oneArm(p)) },
}
