import type { Beat, Move, Pose } from '../../core/figure'
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

/** Even beats over a chain of `n` transitions lasting `total`: accelerate out of the first, steady, settle into the last. */
const chain = (n: number, total: number): Beat[] =>
  Array.from({ length: n }, (_, i): Beat => ({ dur: total / n, ease: n === 1 ? 'io' : i === 0 ? 'in' : i === n - 1 ? 'out' : 'lin' }))

/**
 * A strength rep (cycle): from `hang` the blades `set` (null skips it), a strong concentric through `path` to its
 * last key, a pause, the slow eccentric back the same way, then the blades release.
 */
export const rep = (hang: Pose, set: Pose | null, path: Pose[], o: { rise?: number; lower?: number; top?: number; bottom?: number } = {}): Pick<Move, 'keys' | 'beats' | 'mode'> => {
  const { rise = 1, lower = 1.8, top = 0.35, bottom = 0.3 } = o
  const down = [...path].reverse().slice(1)
  const up = chain(path.length, rise)
  const dn = chain(path.length, lower)
  dn[0] = { ...dn[0], hold: top }
  return {
    mode: 'cycle',
    keys: set ? [hang, set, ...path, ...down, set] : [hang, ...path, ...down],
    beats: set ? [{ hold: bottom, dur: 0.45 }, { ...up[0], hold: 0.1 }, ...up.slice(1), ...dn, { dur: 0.45 }] : [{ ...up[0], hold: bottom }, ...up.slice(1), ...dn],
  }
}

/** A static hold (bounce): settle from `entry` into `p`, then the small tension change `q` and back. */
export const hold = (entry: Pose, p: Pose, q: Pose): Pick<Move, 'keys' | 'beats'> => ({
  keys: [entry, p, q],
  beats: [{ hold: 0.2, dur: 1, ease: 'out' }, { hold: 0.8, dur: 1.3 }, { hold: 1 }],
})

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
const arch = body(186, 200, 196, [-24, -14, -24, -14], 178, 2)
const hollow = body(176, 166, 170, [22, 10, 22, 10], 186, -3)
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

/** Kip and pull the bar to the belly, then lower under control. */
const kip = (ms: number): Move => side({
  mode: 'cycle', flow: 0.15,
  keys: [passive, arch, hollow, highPull, sMid],
  beats: [{ hold: 0.1, dur: 0.8 }, { dur: 0.6 }, { dur: 0.45, ease: 'snap' }, { hold: 0.2, dur: 0.8, ease: 'in' }, { dur: 0.6, ease: 'out' }],
}, ms)
/** Muscle-up: the pull (kipped or strict), a fast turnover, press out, hold, then lower back through the dip. */
const mu = (kipped: boolean, ms: number, props?: Move['props']): Move => side({
  mode: 'cycle', flow: kipped ? 0.15 : 0,
  keys: [passive, ...(kipped ? [arch, hollow] : [active]), highPull, turnover, support, turnover, closeDown, sMid, active],
  beats: [
    { hold: 0.2, dur: kipped ? 0.8 : 0.45 },
    ...(kipped ? [{ dur: 0.6 }, { dur: 0.45, ease: 'snap' as const }] : [{ dur: 1.1, ease: 'out' as const }]),
    { dur: kipped ? 0.3 : 0.5, ease: 'snap' }, { dur: 0.6, ease: 'out' }, { hold: 0.6, dur: 0.9 }, { dur: 0.7 }, { dur: 0.8 }, { dur: 0.7, ease: 'out' }, { dur: 0.4 },
  ],
}, ms, props)

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
const negative = (top: Pose, mid: Pose, set: Pose, hang: Pose): Part => ({
  mode: 'cycle', keys: [top, mid, set, hang],
  beats: [{ hold: 0.5, dur: 1.6, ease: 'in' }, { dur: 1.6, ease: 'out' }, { dur: 0.4 }, { hold: 0.3, dur: 0.6, ease: 'snap' }],
})

export const MOVES: Record<string, Move> = {
  dead_hang: front({ keys: [fHang, fSettle], beats: [{ hold: 1, dur: 1.4 }, { hold: 1 }] }, 1000),
  scap_pull: side({ mode: 'cycle', keys: [passive, active], beats: [{ hold: 0.5, dur: 0.6, ease: 'out' }, { hold: 0.8, dur: 1.1 }] }, 1000),
  neg_pullup: front(negative(fTop, fMid, fSet, fHang)),
  chinup: side(rep(passive, active, [sMid, sTop])),
  pullup: front(rep(fHang, fSet, [fMid, fTop])),
  lsit_pullup: side(rep(lHang, lSet, [lMid, lTop])),
  pullup_12: front(rep(fHang, fSet, [fMid, fTop], { rise: 0.8, lower: 1.1, top: 0.15, bottom: 0.1 }), 600),
  ctb: side(rep(passive, active, [ctbMid, ctbTop])),
  archer_pullup: front({
    mode: 'cycle', keys: [wHang, archR, wHang, archL],
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.3, dur: 1.6 }, { hold: 0.3, dur: 1 }, { hold: 0.3, dur: 1.6 }],
  }, 900, 46),
  high_pullup: kip(650),
  typewriter: front({ keys: [archR, wTop, archL], beats: [{ hold: 0.4, dur: 1.4 }, { dur: 1.4 }, { hold: 0.4 }] }, 900, 46),
  oa_neg: front(negative(oaTop, oaMid, oaSet, oaHang)),
  bar_mu: mu(true, 700),
  oa_assisted: { ...front(rep(towel(oaHang), towel(oaSet), [towel(oaMid), towel(oaTop)])), props: [{ t: 'bar', x: 0, y: BAR }, { t: 'rings', x: -28, y: BAR + 44 }] },
  ring_mu: mu(false, 850, [{ t: 'rings', x: 0, y: BAR }]),
  oapu: front(rep(oaHang, oaSet, [oaMid, oaTop], { rise: 1.2, lower: 2 })),
  strict_mu: mu(false, 1000),
}
