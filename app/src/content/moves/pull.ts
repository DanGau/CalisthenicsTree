import { at, com, joints, loopMs, solid, type Beat, type Body, type Move, type Pose, type Stage } from '../../core/figure'
import { pos, reach } from './legs'

const R = Math.PI / 180
const BAR = -210
const v = (deg: number, len: number): [number, number] => [Math.sin(deg * R) * len, Math.cos(deg * R) * len]

/** Spine pelvis→waist `t`, waist→shoulders `c`, head `h`; arms straight at `a`; shoulder blades `s` (+ elevate, - depress). */
export const body = (t: number, c: number, h: number, legs: [number, number, number, number], a = 180, s = 0): Pose => [t, a, a, a, a, ...legs, c, h, s]

/** A point on the front of the chest, `f` of the way up from the waist, `out` in front of the spine (hip coordinates). */
export const chestPt = (p: Pose, f: number, out: number): [number, number] => {
  const c = p[9] ?? p[0]
  const [wx, wy] = v(p[0], 22)
  const [sx, sy] = v(c, 24 * f)
  const [nx, ny] = v(c - 90, out)
  return [wx + sx + nx, wy + sy + ny]
}

/** Both hands at height y (hip coordinates) straight above or below the centre of mass. */
export const gripUnder = (p: Pose, y: number, k = -1): Pose => {
  let q = p
  for (let i = 0; i < 4; i++) q = grip(p, [com(joints(q)).x, y], k, true)
  return q
}

/** Side view: both hands to one point, given relative to the shoulder or absolute in hip coordinates. */
export const grip = (p: Pose, d: [number, number], k = -1, abs = false): Pose => {
  const s = abs ? [0, 0] : pos(p, 'shoulder')
  const h: [number, number] = [s[0] + d[0], s[1] + d[1]]
  return reach(p, { hand: h, farHand: h }, { k: { hand: k, farHand: k } })
}

/** Front view: hands at `near` and `far` relative to the shoulder centre (shoulders 17 either side); elbows flare out. */
export const fgrip = (p: Pose, near: [number, number], far: [number, number]): Pose => {
  const s = pos(p, 'shoulder', true)
  return reach(p, { hand: [s[0] + near[0], s[1] + near[1]], farHand: [s[0] + far[0], s[1] + far[1]] }, { front: true, k: { hand: -1, farHand: 1 } })
}

/** Beats sharing `total` over `n` transitions; the spline flows through the inner keys. */
const even = (n: number, total: number): Beat[] => Array.from({ length: n }, (): Beat => ({ dur: total / n }))

/**
 * A strength rep (cycle): from `hang` the blades `set` first (null skips it; ≈0.2 s, arms still), the concentric
 * through `path` to its last key, a pause, the slower eccentric back the same way, the blades release last.
 */
export const rep = <T = Pose>(hang: T, set: T | null, path: T[], o: { rise?: number; lower?: number; top?: number; bottom?: number } = {}): { mode: 'cycle'; keys: T[]; beats: Beat[] } => {
  const { rise = 1.1, lower = 1.8, top = 0.25, bottom = 0.25 } = o
  const down = [...path].reverse().slice(1)
  const up = even(path.length, rise)
  // Lowering: gravity carries the first part, the brake comes near the bottom.
  const dn = even(path.length, lower).map((b, i, a): Beat => ({ dur: b.dur! * (a.length > 1 ? (i === 0 ? 0.9 : 1.1) : 1) }))
  dn[0] = { ...dn[0], hold: top }
  return {
    mode: 'cycle',
    keys: set ? [hang, set, ...path, ...down, set] : [hang, ...path, ...down],
    beats: set ? [{ hold: bottom, dur: 0.2 }, ...up, ...dn, { dur: 0.25 }] : [{ ...up[0], hold: bottom }, ...up.slice(1), ...dn],
  }
}

/**
 * A static hold (bounce): a slow entry (≈2 s) from `entry` into `p`, then two sways to the small tension change `q`
 * at the real balance period (≈1.5 s each way). Timing in seconds with `ms` 1000.
 */
export const hold = <T = Pose>(entry: T, p: T, q: T): { keys: T[]; beats: Beat[] } => ({
  keys: [entry, p, q, p],
  beats: [{ hold: 0.4, dur: 2 }, { hold: 0.2, dur: 1.5 }, { hold: 0.2, dur: 1.5 }, { hold: 0.2 }],
})

/**
 * Resamples a move every ≈`step` ms through the engine and re-solves `fix` on each sample, so contacts the
 * spline would let drift between keys hold all loop. Flow is baked into the samples; angles stay on the samples' turn.
 */
export const pinned = (m: Move, fix: (p: Pose) => Pose, step = 120): Move => {
  const L = loopMs(m)
  const n = Math.round(L / step)
  const s = Array.from({ length: n }, (_, i) => at(m, (i * L) / n))
  return {
    ...m, mode: 'cycle', flow: 0, keys: s.map((f) => fix(f.pose).map((v, i) => v! - Math.round((v! - f.pose[i]!) / 360) * 360) as Pose),
    beats: s.map(({ lift, shift, turn, trunk, legs, arms }) => ({ lift, shift, turn, trunk, legs, arms, dur: L / n / (m.ms ?? 900) })),
  }
}
/** Front view fix: the far hand keeps its offset from the near hand in `ref`. */
export const twoHands = (ref: Pose) => {
  const [a, b] = [pos(ref, 'hand', true), pos(ref, 'farHand', true)]
  return (p: Pose): Pose => {
    const h = pos(p, 'hand', true)
    return reach(p, { farHand: [h[0] + b[0] - a[0], h[1] + b[1] - a[1]] }, { front: true, k: { farHand: 1 } })
  }
}

/** A solid key: a pose and its 3D stage (roll, limb swing out, camera turn). */
export type K3 = { p: Pose; s: Partial<Stage> }
export type V3 = [number, number, number]
type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
const SLOT3 = { hand: [1, 2, 'armOut'], farHand: [3, 4, 'farArmOut'], foot: [5, 6, 'legOut'], farFoot: [7, 8, 'farLegOut'] } as const
const ZERO: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1, legs: 1, arms: 1, roll: 0, armOut: 0, farArmOut: 0, legOut: 0, farLegOut: 0, foreOut: 0, farForeOut: 0, shinOut: 0, farShinOut: 0, twist: 0 }
/** Joints of a solid key about the hip, camera turn removed: x forward, y down, z the near side (before roll). */
export const b3 = (k: K3): Body => solid(k.p, { ...ZERO, ...k.s, turn: 0 })
export const p3 = (k: K3, j: keyof Body): V3 => { const v = b3(k)[j]; return [v.x, v.y, v.z ?? 0] }
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

type Var = number | keyof Stage
const get = (k: K3, v: Var) => (typeof v === 'number' ? k.p[v]! : k.s[v] ?? ZERO[v])
const set = (k: K3, vs: Var[], x: number[], tie: [number, number][]): K3 => {
  const p = [...k.p] as Pose
  const s = { ...k.s }
  vs.forEach((v, i) => { if (typeof v === 'number') p[v] = x[i]; else s[v] = x[i] })
  for (const [a, b] of tie) p[b] = p[a]
  return { p, s }
}
/** Damped least squares: adjusts `vars` so `err` (a list of residuals) goes to zero. `tie` copies p[a] to p[b]. */
export const fit = (k: K3, vars: Var[], err: (k: K3) => number[], tie: [number, number][] = []): K3 => {
  let x = vars.map((v) => get(k, v))
  let lam = 1
  let r = err(set(k, vars, x, tie))
  let e = r.reduce((a, v) => a + v * v, 0)
  for (let it = 0; it < 80 && e > 1e-6; it++) {
    const J = vars.map((_, j) => { const y = [...x]; y[j] += 0.05; return err(set(k, vars, y, tie)).map((v, i) => (v - r[i]) / 0.05) })
    const n = vars.length
    const A = Array.from({ length: n }, (_, i) => Array.from({ length: n + 1 }, (_, j) =>
      j === n ? -J[i].reduce((a, v, m) => a + v * r[m], 0) : J[i].reduce((a, v, m) => a + v * J[j][m], 0) + (i === j ? lam : 0)))
    for (let i = 0; i < n; i++) {
      const piv = A[i][i] || 1e-9
      for (let j = 0; j < n; j++) if (j !== i) { const f = A[j][i] / piv; for (let c = i; c <= n; c++) A[j][c] -= f * A[i][c] }
    }
    const y = x.map((v, i) => v + A[i][n] / (A[i][i] || 1e-9))
    const r2 = err(set(k, vars, y, tie))
    const e2 = r2.reduce((a, v) => a + v * v, 0)
    if (e2 < e) { x = y; r = r2; e = e2; lam = Math.max(1e-4, lam / 3) } else lam *= 4
  }
  return set(k, vars, x, tie)
}
/** Re-aims limbs (both segments and swing out) so each end reaches its goal in `b3` coordinates; `straight` limbs stay locked. */
export const reach3 = (k: K3, goals: Partial<Record<Limb, V3>>, straight: Limb[] = []): K3 => {
  const ls = Object.keys(goals) as Limb[]
  const vars = ls.flatMap((l): Var[] => straight.includes(l) ? [SLOT3[l][0], SLOT3[l][2]] : [...SLOT3[l]])
  const tie = ls.filter((l) => straight.includes(l)).map((l): [number, number] => [SLOT3[l][0], SLOT3[l][1]])
  const q = fit(k, vars, (q) => { const b = b3(q); return ls.flatMap((l) => sub3([b[l].x, b[l].y, b[l].z ?? 0], goals[l]!)) }, tie)
  // Swing out kept within 180 of where it started, so blends between keys take the short way.
  for (const l of ls) { const o = SLOT3[l][2]; q.s[o] = q.s[o]! - Math.round((q.s[o]! - (k.s[o] ?? 0)) / 360) * 360 }
  return q
}
/** Solid move parts from K3 keys: poses as keys, stages folded into the beats, seen from camera yaw `view`. */
export const solid3 = (m: { keys: K3[]; beats?: Beat[]; mode?: Move['mode'] }, view: number): Pick<Move, 'keys' | 'beats' | 'solid' | 'view'> & { mode?: Move['mode'] } => ({
  ...m, solid: true, view, keys: m.keys.map((k) => k.p), beats: m.keys.map((k, i) => ({ ...k.s, ...m.beats?.[i] })),
})
const OUTS = ['armOut', 'farArmOut', 'legOut', 'farLegOut', 'foreOut', 'farForeOut', 'shinOut', 'farShinOut'] as const
/** `pinned` for solid moves: samples every ≈`step` ms and re-solves `fix` on each sample, stage included. */
export const pinned3 = (m: Move, fix: (k: K3) => K3, step = 40): Move => {
  const L = loopMs(m)
  const n = Math.round(L / step)
  const s = Array.from({ length: n }, (_, i) => at(m, (i * L) / n))
  const ks = s.map(({ pose, ...st }) => fix({ p: pose, s: st }))
  return {
    ...m, mode: 'cycle', flow: 0, keys: ks.map((k, i) => k.p.map((v, j) => v! - Math.round((v! - s[i].pose[j]!) / 360) * 360) as Pose),
    beats: ks.map((k, i) => ({ ...k.s, ...Object.fromEntries(OUTS.map((o) => [o, k.s[o]! - Math.round((k.s[o]! - s[i][o]) / 360) * 360])), dur: L / n / (m.ms ?? 900) })),
  }
}
/** Fix: the far hand keeps its 3D offset from the near hand in `ref` (both on one bar, rings or pole). */
export const twoHands3 = (ref: K3, straight: Limb[] = []) => {
  const d = sub3(p3(ref, 'farHand'), p3(ref, 'hand'))
  return (k: K3): K3 => reach3(k, { farHand: add3(p3(k, 'hand'), d) }, straight)
}

type Part = Pick<Move, 'keys'> & Partial<Move>
const side = (m: Part, ms?: number, props: Move['props'] = [{ t: 'bar', x: 0, y: BAR }]): Move => ({ x: 'hand', y: 'hand', at: [0, BAR], props, ms, ...m })
type Legs = [number, number, number, number]
export const CAM = 60
/** Solid: both hands to points from the shoulder centre (`b3` coordinates). */
export const grip3 = (p: Pose, s: Partial<Stage>, near: V3, far: V3): K3 => {
  const k: K3 = { p, s: { armOut: 10, farArmOut: 10, ...s } }
  const sh = p3(k, 'shoulder')
  return reach3(k, { hand: add3(sh, near), farHand: add3(sh, far) })
}
/**
 * A solid hang seen from camera yaw `view` (default CAM): the near hand pinned, the far hand held to its offset in the
 * first key (unless `free`), the bar (along z) or a ring under each hand.
 */
export const onBar = (m: { keys: K3[]; beats?: Beat[]; mode?: Move['mode'] }, o: { view?: number; tilt?: number; y?: number; rings?: boolean; free?: boolean; extra?: Move['props']; step?: number } = {}): Move => {
  const y = o.y ?? BAR
  const base: Move = { ...solid3(m, o.view ?? CAM), x: 'hand', y: 'hand', at: [0, y], ms: 1000, tilt: o.tilt }
  const mv = o.free ? base : pinned3(base, twoHands3(m.keys[0]), o.step)
  // The pin puts the near hand at depth 0.
  const props: Move['props'] = o.rings ? (['hand', 'farHand'] as const).map((h) => ({ t: 'rings', x: 0, y, z: p3(m.keys[0], h)[2] - p3(m.keys[0], 'hand')[2] })) : [{ t: 'bar', x: 0, y }]
  return { ...mv, props: [...props, ...(o.extra ?? [])] }
}

// Solid hangs, seen 60 off the side: grip width and depth at once. Hands 56 apart. Passive hang: blades shrugged up.
// Set: blades down, the body rises on straight arms. Half way, then chin over (shoulders 6 below the bar).
const fpose = (y: number, s: number, legs: Legs = [0, 0, 0, 0]): K3 => grip3(body(180, 180, 180, legs, 180, s), {}, [0, y, 28], [0, y, -28])
export const fHang = fpose(-52.8, 4)
export const fSettle = fpose(-52.8, 2, [3, -1, 2, -1])
const fSet = fpose(-52.8, -4, [2, -1, 2, -1])
const fMid = fpose(-30, -3, [6, -2, 5, -2])
const fTop = fpose(-6, -2, [10, -4, 8, -4])

// Side view. Passive hang: blades up, head sunk. Active: blades down, chest up, slight hollow.
export const passive = body(180, 180, 166, [0, 0, 0, 0], 174, 5)
export const active = body(182, 194, 186, [8, 2, 8, 2], 171, -4)
export const sMid = grip(body(184, 196, 186, [10, 2, 10, 2], 180, -3), [14, -30])
const lean = body(188, 200, 188, [14, 4, 14, 4], 180, -2)
const sTop = grip(lean, chestPt(lean, 1, 15), -1, true)

// L-sit pull-up: legs level the whole way.
const L: [number, number, number, number] = [90, 90, 90, 90]
const lHang = body(178, 180, 176, L, 176, 4)
const lSet = body(180, 186, 180, L, 174, -4)
const lMid = grip(body(182, 190, 184, L, 180, -3), [14, -30])
const lTopBody = body(186, 196, 186, L, 180, -2)
const lTop = grip(lTopBody, chestPt(lTopBody, 1, 15), -1, true)

// Chest to bar: lean back hard, elbows drive down and back, bar meets the sternum.
const ctbBody = body(198, 222, 196, [18, 6, 18, 6], 180, -3)
const ctbTop = grip(ctbBody, chestPt(ctbBody, 0.6, 17), -1, true)
const ctbMid = grip(body(190, 205, 190, [12, 4, 12, 4], 180, -4), [16, -28])

// Archer: hands 92 apart; the body slides and tips under the working hand, the other arm straightens along the bar.
const arc = (y: number, s: number, near: number, far: number, roll = 0): K3 => grip3(body(180, 180, 180, [4, -2, 4, -2], 180, s), { roll }, [0, y, near], [0, y, far])
const wHang = arc(-44, 3, 46, -46)
const archR = arc(-7, -2, 25, -67, 5)
const archL = arc(-7, -2, 67, -25, -5)
const wTop = arc(-6, -2, 46, -46)

// Kipping: swing back to an arch (feet behind, chest through), snap to a hollow (feet ahead), then the bar to the belly.
// The whole body swings about the hands: ≈35° of arc between the ends.
const swing = (p: Pose, d: number): Pose => p.map((v, i) => (i === 11 ? v : v! + d)) as Pose
const arch = swing(body(186, 200, 196, [-24, -14, -24, -14], 178, 2), 14)
const hollow = swing(body(176, 166, 170, [22, 10, 22, 10], 186, -3), -10)
const highBody = body(196, 214, 196, [20, 4, 20, 4], 180, -4)
const highPull = grip(highBody, chestPt(highBody, 0.15, 17), -1, true)
// Muscle-up: chest drops over the bar (deep dip bottom, elbows high behind), then press to straight arms.
const overBody = body(150, 128, 120, [14, 0, 14, 0], 180, 2)
const turnover = grip(overBody, chestPt(overBody, 0.3, 17), -1, true)
const supportBody = body(168, 172, 178, [10, 2, 10, 2], 180, -4)
const support = gripUnder(supportBody, 8, 1)
// Descent: chest stays at the bar, body tall under it, elbows bending past the ribs.
const closeBody = body(182, 188, 184, [8, 2, 8, 2], 180, -3)
const closeDown = grip(closeBody, chestPt(closeBody, 0.85, 14), -1, true)

// A small push back into a hollow starts the swing from a dead hang.
const startSwing = swing(body(178, 174, 178, [10, 4, 10, 4], 182, 0), -5)

/** Kip (seconds, ms 1000): start the swing, half swings ≈1 s, the hip snap drives the pull, then lower under control. */
const kip: Move = side({
  mode: 'cycle', flow: 0.15,
  keys: [passive, startSwing, arch, hollow, highPull, sMid],
  beats: [{ hold: 0.3, dur: 0.7 }, { dur: 1 }, { dur: 0.75 }, { dur: 0.35, ease: 'snap' }, { hold: 0.2, dur: 0.75 }, { dur: 0.6 }],
}, 1000)
/**
 * Muscle-up (seconds, ms 1000): kip swing (or strict set) into an explosive pull to the sternum ≈0.35 s, the turnover
 * ≈0.25 s, press out ≈0.6 s, hold, then lower back through the dip and the pull.
 */
const mu = (kipped: boolean, props?: Move['props']): Move => side({
  mode: 'cycle', flow: kipped ? 0.15 : 0,
  keys: [passive, ...(kipped ? [startSwing, arch, hollow] : [active]), highPull, turnover, support, turnover, closeDown, sMid, active],
  beats: [
    { hold: 0.3, dur: kipped ? 0.7 : 0.2 },
    ...(kipped ? [{ dur: 1 }, { dur: 0.75 }, { dur: 0.35, ease: 'snap' as const }] : [{ dur: 0.7, ease: 'snap' as const }]),
    { dur: kipped ? 0.25 : 0.35 }, { dur: 0.6 }, { hold: 0.6, dur: 0.9 }, { dur: 0.8 }, { dur: 0.8 }, { dur: 0.5 }, { dur: 0.25 },
  ],
}, 1000, props)
/**
 * One arm: the body rolls 11 so the working shoulder leans over the hips and the hand above them; the free fist
 * hangs at the side. Pulling, the body twists toward the working arm (`turn`).
 */
export const oa = (y: number, legs: Legs, s = 0, twist = 0): K3 => {
  const k: K3 = { p: body(180, 182, 182, legs, 180, s).map((v, i) => (i === 3 || i === 4 ? 4 : v)) as Pose, s: { roll: 11, armOut: 5, farArmOut: 8, turn: twist } }
  return reach3(k, { hand: [2, p3(k, 'nearShoulder')[1] + y, 0] })
}
export const oaHang = oa(-53.5, [6, 0, 8, 0], 3)
export const oaSet = oa(-53.5, [6, 0, 8, 0], -3)
const oaMid = oa(-32, [10, -2, 12, -2], -3, 12)
const oaTop = oa(-6, [14, -4, 16, -4], -2, 25)
// Assisted: the other hand holds a towel 44 below the bar and 56 to the side; no twist.
const towel = (k: K3): K3 => reach3({ p: k.p, s: { ...k.s, turn: 0, farArmOut: -30 } }, { farHand: add3(p3(k, 'hand'), [0, 44, -56]) })
/** The bar over the working hand only, a towel ring at the other. */
const towelRing = (m: Move, k: K3): Move => {
  const [h, f] = [p3(k, 'hand'), p3(k, 'farHand')]
  return { ...m, props: [{ t: 'bar', x: 0, y: BAR }, { t: 'rings', x: f[0] - h[0], y: BAR + f[1] - h[1], z: f[2] - h[2] }] }
}
/** Negative (seconds): a 3-4 s lowering from the top, blades release last, then step back up. */
const negative = (top: K3, mid: K3, set: K3, hang: K3) => ({
  mode: 'cycle' as const, keys: [top, mid, set, hang],
  beats: [{ hold: 0.5, dur: 1.8 }, { dur: 1.7 }, { dur: 0.3 }, { hold: 0.4, dur: 0.8 }],
})

// Lock-offs: elbows at full flexion (chin over), 90° (hand 38 above the shoulder) and 120° (47).
const f90 = fpose(-38, -3, [8, -3, 7, -3])
const f120 = fpose(-46, -3, [6, -2, 5, -2])
const oa90 = oa(-38, [12, -3, 14, -3], -3, 18)
const oa120 = oa(-46, [10, -2, 12, -2], -3, 12)
/** Lock-off ladder (seconds): hold the top, lower to 90°, hold, to 120°, hold, pull back up. */
const lockLadder = (top: K3, a: K3, b: K3, h: number) => ({
  mode: 'cycle' as const, keys: [top, a, b],
  beats: [{ hold: h, dur: 0.9 }, { hold: h, dur: 0.6 }, { hold: h, dur: 1.2 }],
})
// Offset: the low hand on a towel 40 below the bar, close in; the bar hand does the work.
const offset = (k: K3): K3 => reach3({ p: k.p, s: { ...k.s, turn: 0, farArmOut: -20 } }, { farHand: add3(p3(k, 'hand'), [0, 40, -40]) })
/** Board edge (fingers.ts) in place of the bar. */
const onEdge = (m: Move): Move => ({ ...m, props: [{ t: 'board', x: 0, y: BAR }] })

/**
 * Explosive pull (seconds): set, drive fast to the chest, the hands leave the bar on momentum (≈14 cm, 0.17 s up),
 * catch on bent arms, absorb, lower 1.8 s.
 */
const fFly = fpose(-4, -2, [12, -5, 10, -5])
const explosive = onBar({
  mode: 'cycle', keys: [fHang, fSet, fMid, fTop, fFly, fMid, fSet],
  beats: [{ hold: 0.4, dur: 0.2 }, { dur: 0.25, ease: 'snap' }, { dur: 0.2 }, { dur: 0.17, ease: 'out' }, { lift: 14, dur: 0.2, ease: 'in' }, { dur: 1.4 }, { dur: 0.3 }],
}, { step: 20 })

export const MOVES: Record<string, Move> = {
  dead_hang: onBar({ keys: [fHang, fSettle], beats: [{ hold: 0.3, dur: 1 }, { hold: 0.3 }] }),
  scap_pull: side({ mode: 'cycle', keys: [passive, active], beats: [{ hold: 0.6, dur: 0.45 }, { hold: 0.8, dur: 0.8 }] }, 1000),
  neg_pullup: onBar(negative(fTop, fMid, fSet, fHang)),
  chinup: side(rep(passive, active, [sMid, sTop]), 1000),
  pullup: onBar(rep(fHang, fSet, [fMid, fTop])),
  lsit_pullup: { ...side(rep(lHang, lSet, [lMid, lTop], { rise: 1.4, lower: 2 }), 1000), balance: true },
  pullup_12: onBar(rep(fHang, fSet, [fMid, fTop], { rise: 0.8, lower: 1.2, top: 0.1, bottom: 0.1 })),
  ctb: side(rep(passive, active, [ctbMid, ctbTop], { rise: 1.2 }), 1000),
  archer_pullup: onBar({
    mode: 'cycle', keys: [wHang, archR, wHang, archL],
    beats: [{ hold: 0.3, dur: 1.2 }, { hold: 0.25, dur: 1.8 }, { hold: 0.3, dur: 1.2 }, { hold: 0.25, dur: 1.8 }],
  }),
  high_pullup: kip,
  typewriter: onBar({ keys: [archR, wTop, archL], beats: [{ hold: 0.4, dur: 1.3 }, { dur: 1.3 }, { hold: 0.4 }] }),
  oa_neg: onBar(negative(oaTop, oaMid, oaSet, oaHang), { free: true }),
  bar_mu: mu(true),
  oa_assisted: towelRing(onBar(rep(towel(oaHang), towel(oaSet), [towel(oaMid), towel(oaTop)], { rise: 1.3, lower: 2 })), towel(oaHang)),
  ring_mu: mu(false, [{ t: 'rings', x: 0, y: BAR }]),
  oapu: onBar(rep(oaHang, oaSet, [oaMid, oaTop], { rise: 1.4, lower: 2.2 }), { free: true }),
  strict_mu: mu(false),
  lockoff: onBar(lockLadder(fTop, f90, f120, 1.6)),
  weighted_pull: onBar(rep(fHang, fSet, [fMid, fTop], { rise: 1.6, lower: 2.4, top: 0.3, bottom: 0.6 })),
  offset_pull: towelRing(onBar(rep(offset(oaHang), offset(oaSet), [offset(oaMid), offset(oaTop)], { rise: 1.3, lower: 2 })), offset(oaHang)),
  oa_lockoff: onBar(lockLadder(oaTop, oa90, oa120, 1.2), { free: true }),
  oapu_edge: onEdge(onBar(rep(oaHang, oaSet, [oaMid, oaTop], { rise: 1.5, lower: 2.3 }), { free: true })),
  oa_scap: onBar({ mode: 'cycle', keys: [oaHang, oaSet], beats: [{ hold: 0.6, dur: 0.5 }, { hold: 1, dur: 0.9 }] }, { free: true }),
  explosive_pull: explosive,
}
