import { full, joints, LEN, place, type Body, type Move, type Pose, type Prop, type Pt } from '../../core/figure'
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

const MASS: [keyof Body, keyof Body, number][] = [
  ['hip', 'waist', 0.24], ['waist', 'shoulder', 0.26], ['head', 'head', 0.08],
  ['nearShoulder', 'elbow', 0.03], ['elbow', 'hand', 0.022], ['farShoulder', 'farElbow', 0.03], ['farElbow', 'farHand', 0.022],
  ['nearHip', 'knee', 0.1], ['knee', 'foot', 0.06], ['farHip', 'farKnee', 0.1], ['farKnee', 'farFoot', 0.06],
]
/** Centre of mass. */
export function com(p: Pose, front = false): Pt {
  const b = joints(p, front)
  let x = 0, y = 0, w = 0
  for (const [a, c, m] of MASS) {
    x += ((b[a].x + b[c].x) / 2) * m
    y += ((b[a].y + b[c].y) / 2) * m
    w += m
  }
  return { x: x / w, y: y / w }
}

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

// Archer: the near arm bends while the far arm slides out straight along the floor (or swings its ring out).
/** Arm (near or far) aimed straight at `to` from the toes. */
const aim = (p: Pose, to: Pt, which: 'near' | 'far'): Pose => {
  const b = joints(p)
  const a = Math.atan2(b.toe.x + to.x - b.shoulder.x, b.toe.y + to.y - b.shoulder.y) / D2R
  return set(p, which === 'near' ? [1, 2] : [3, 4], a)
}
function archerPair(h = 0, back = 16, depth = 15): [Pose, Pose] {
  const [top, low] = pushup(h, back, depth)
  const b = joints(low)
  const r = ARM - 0.3
  const dy = b.toe.y - h - b.shoulder.y
  const F = { x: b.shoulder.x - b.toe.x + Math.sqrt(r * r - dy * dy), y: -h }
  return [h ? aim(top, F, 'far') : top, aim(low, F, 'far')]
}
const [arcTop, arcBottom] = archerPair()

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
const headAt = (p: Pose): [number, number] => {
  const b = place({ keys: [p], x: 'hand' }, p)
  return [b.head.x, b.head.y]
}

// Ring archer: the far ring is where the far hand lands.
const [raTop, raBottom] = archerPair(RING_H, 14, 3)
const farRing = (): Prop => {
  const b = place(rto([raBottom]), raBottom)
  return { t: 'rings', x: Math.round(b.farHand.x), y: Math.round(b.farHand.y) }
}

export const MOVES: Record<string, Move> = {
  wall_pu: { keys: [wallTop, wallBottom], x: 'hand', props: [{ t: 'wall', x: 4 }] },
  incline_pu: withProps({ keys: [incTop, incBottom], x: 'hand' }, handBox),
  pushup: { keys: [top, bottom], x: 'hand' },
  diamond_pu: { keys: [diaTop, diaBottom], x: 'hand' },
  hindu_pu: { keys: [hPike, hDive, hCobra], x: 'hand', ms: 1000 },
  decline_pu: withProps({ keys: [decTop, decBottom], x: 'hand' }, toeBox),
  archer_pu: { keys: [arcTop, arcBottom], x: 'hand' },
  clap_pu: { keys: [bottom, top, clapAir], x: 'foot', at: [footX(top), 0], ms: 600 },
  ring_pu: rto([ringTop, ringBottom]),
  oap_incline: withProps({ keys: [oneArm(incTop), oneArm(incBottom)], x: 'hand' }, handBox),
  bb_clap: { keys: [bottom, top, bbAir], x: 'foot', at: [footX(top), 0], ms: 600 },
  rto_pu: rto([rtoTop, rtoBottom], 1200),
  one_arm_pu: { keys: [oneArm(top, false), oneArm(bottom, false)], x: 'hand' },
  aztec_pu: { keys: [top, aztecAir], x: 'hand', y: 'head', at: headAt(top), ms: 650 },
  ring_archer: { ...rto([raTop, raBottom]), props: [RING, farRing()] },
  oapu_tight: { keys: [oneArm(top), oneArm(bottom)], x: 'hand', ms: 1200 },
}
