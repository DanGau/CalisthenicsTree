import { at, loopMs, type Beat, type Move, type Pose } from '../../core/figure'
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
export const rep = (hang: Pose, set: Pose | null, path: Pose[], o: { rise?: number; lower?: number; top?: number; bottom?: number } = {}): Pick<Move, 'keys' | 'beats' | 'mode'> => {
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
export const hold = (entry: Pose, p: Pose, q: Pose): Pick<Move, 'keys' | 'beats'> => ({
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

type Part = Pick<Move, 'keys'> & Partial<Move>
const side = (m: Part, ms?: number, props: Move['props'] = [{ t: 'bar', x: 0, y: BAR }]): Move => ({ x: 'hand', y: 'hand', at: [0, BAR], props, ms, ...m })
const front = (m: Part, ms?: number, x = 28): Move => ({ front: true, x: 'hand', y: 'hand', at: [x, BAR], props: [{ t: 'bar', x: 0, y: BAR }], ms, ...m })

// Front view, hands 56 apart. Passive hang: blades shrugged up. Set: blades down, the body rises on straight arms.
// Half way, then chin over (shoulders 6 below the bar, elbows down at the ribs).
const fpose = (y: number, s: number, legs: [number, number, number, number] = [0, 0, 0, 0]): Pose =>
  fgrip(body(180, 180, 180, legs, 180, s), [28, y], [-28, y])
export const fHang = fpose(-52.8, 4)
export const fSettle = fpose(-52.8, 2, [3, -3, -2, 2])
const fSet = fpose(-52.8, -4, [2, -1, -1, 2])
const fMid = fpose(-30, -3, [3, -2, -2, 3])
const fTop = fpose(-6, -2, [5, -4, -4, 5])

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

// Archer: hands 92 apart; the body slides under the working hand, the other arm straightens along the bar.
const arc = (y: number, s: number, near: number, far: number): Pose => fgrip(body(180, 180, 180, [2, -2, -2, 2], 180, s), [near, y], [far, y])
const wHang = arc(-45.5, 3, 46, -46)
const archR = arc(-6, -2, 22, -70)
const archL = arc(-6, -2, 70, -22)
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
const support = grip(supportBody, [14, 8], 1, true)
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
/** One arm: the body tilts so the hips hang under the hand at `x` (hip coordinates); free fist at the side. */
export const oa = (t: number, y: number, legs: [number, number, number, number], s = 0, x = 3): Pose => {
  const p = body(t, t, 180 + (t - 180) / 2, legs, 180, s)
  const q = reach(p, { hand: [x, pos(p, 'shoulder', true)[1] + y] }, { front: true })
  q[3] = t - 194
  q[4] = t - 174
  return q
}
export const oaHang = oa(192, -54, [6, 6, 8, 4], 3)
export const oaSet = oa(190, -54, [6, 4, 8, 4], -3)
const oaMid = oa(194, -32, [8, 4, 10, 4], -3)
const oaTop = oa(196, -6, [10, 4, 12, 6], -2)
// Assisted: the other hand holds a towel 44 below the bar.
const towel = (p: Pose): Pose => {
  const n = pos(p, 'hand', true)
  return reach(p, { farHand: [n[0] - 56, n[1] + 44] }, { front: true, k: { farHand: 1 } })
}
/** Negative (seconds): a 3-4 s lowering from the top, blades release last, then step back up. */
const negative = (top: Pose, mid: Pose, set: Pose, hang: Pose): Part => ({
  mode: 'cycle', ms: 1000, keys: [top, mid, set, hang],
  beats: [{ hold: 0.5, dur: 1.8 }, { dur: 1.7 }, { dur: 0.3 }, { hold: 0.4, dur: 0.8 }],
})

export const MOVES: Record<string, Move> = {
  dead_hang: front({ keys: [fHang, fSettle], beats: [{ hold: 0.3, dur: 1 }, { hold: 0.3 }] }, 1000),
  scap_pull: side({ mode: 'cycle', keys: [passive, active], beats: [{ hold: 0.6, dur: 0.45 }, { hold: 0.8, dur: 0.8 }] }, 1000),
  neg_pullup: pinned(front(negative(fTop, fMid, fSet, fHang)), twoHands(fHang)),
  chinup: side(rep(passive, active, [sMid, sTop]), 1000),
  pullup: pinned(front(rep(fHang, fSet, [fMid, fTop]), 1000), twoHands(fHang)),
  lsit_pullup: side(rep(lHang, lSet, [lMid, lTop], { rise: 1.4, lower: 2 }), 1000),
  pullup_12: pinned(front(rep(fHang, fSet, [fMid, fTop], { rise: 0.8, lower: 1.2, top: 0.1, bottom: 0.1 }), 1000), twoHands(fHang)),
  ctb: side(rep(passive, active, [ctbMid, ctbTop], { rise: 1.2 }), 1000),
  archer_pullup: pinned(front({
    mode: 'cycle', keys: [wHang, archR, wHang, archL],
    beats: [{ hold: 0.3, dur: 1.2 }, { hold: 0.25, dur: 1.8 }, { hold: 0.3, dur: 1.2 }, { hold: 0.25, dur: 1.8 }],
  }, 1000, 46), twoHands(wHang)),
  high_pullup: kip,
  typewriter: pinned(front({ keys: [archR, wTop, archL], beats: [{ hold: 0.4, dur: 1.3 }, { dur: 1.3 }, { hold: 0.4 }] }, 1000, 46), twoHands(archR)),
  oa_neg: front(negative(oaTop, oaMid, oaSet, oaHang)),
  bar_mu: mu(true),
  oa_assisted: { ...pinned(front(rep(towel(oaHang), towel(oaSet), [towel(oaMid), towel(oaTop)], { rise: 1.3, lower: 2 }), 1000), twoHands(towel(oaHang))), props: [{ t: 'bar', x: 0, y: BAR }, { t: 'rings', x: -28, y: BAR + 44 }] },
  ring_mu: mu(false, [{ t: 'rings', x: 0, y: BAR }]),
  oapu: front(rep(oaHang, oaSet, [oaMid, oaTop], { rise: 1.4, lower: 2.2 }), 1000),
  strict_mu: mu(false),
}
