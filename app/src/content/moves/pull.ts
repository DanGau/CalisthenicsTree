import type { Move, Pose } from '../../core/figure'
import { pos, reach } from './legs'

const R = Math.PI / 180
const BAR = -210
const v = (deg: number, len: number): [number, number] => [Math.sin(deg * R) * len, Math.cos(deg * R) * len]

/** Spine pelvis→waist `t`, waist→shoulders `c`, head `h`; arms straight at `a`. */
export const body = (t: number, c: number, h: number, legs: [number, number, number, number], a = 180): Pose => [t, a, a, a, a, ...legs, c, h]

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

/** Front view: hands at `near` and `far` relative to the shoulder centre (shoulders at �17); elbows flare out. */
export const fgrip = (p: Pose, near: [number, number], far: [number, number]): Pose => {
  const s = pos(p, 'shoulder', true)
  return reach(p, { hand: [s[0] + near[0], s[1] + near[1]], farHand: [s[0] + far[0], s[1] + far[1]] }, { front: true, k: { hand: -1, farHand: 1 } })
}

const side = (keys: Pose[], ms?: number, props: Move['props'] = [{ t: 'bar', x: 0, y: BAR }]): Move => ({ keys, x: 'hand', y: 'hand', at: [0, BAR], props, ms })
const front = (keys: Pose[], ms?: number, x = 28): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [x, BAR], props: [{ t: 'bar', x: 0, y: BAR }], ms })

// Front view, hands 56 apart: dead hang, half way, chin over (shoulders 6 below the bar, elbows down at the ribs).
const still: Pose = body(180, 180, 180, [0, 0, 0, 0])
export const fHang = fgrip(still, [28, -52.8], [-28, -52.8])
const fMid = fgrip(still, [28, -32], [-28, -32])
const fTop = fgrip(body(180, 180, 180, [3, -3, -3, 3]), [28, -6], [-28, -6])

// Side view. Passive hang: shoulders shrugged, head sunk. Active: blades down, chest up, slight hollow.
export const passive = body(180, 180, 166, [0, 0, 0, 0], 174)
export const active = body(182, 194, 186, [8, 2, 8, 2], 171)
const sMid = grip(body(184, 196, 186, [10, 2, 10, 2]), [14, -30])
const lean = body(188, 200, 188, [14, 4, 14, 4])
const sTop = grip(lean, chestPt(lean, 1, 15), -1, true)

// L-sit pull-up: legs level the whole way.
const L: [number, number, number, number] = [90, 90, 90, 90]
const lHang = body(178, 180, 176, L, 176)
const lMid = grip(body(182, 190, 184, L), [14, -30])
const lTopBody = body(186, 196, 186, L)
const lTop = grip(lTopBody, chestPt(lTopBody, 1, 15), -1, true)

// Chest to bar: lean back hard, elbows drive down and back, bar meets the sternum.
const ctbBody = body(198, 222, 196, [18, 6, 18, 6])
const ctbTop = grip(ctbBody, chestPt(ctbBody, 0.6, 17), -1, true)
const ctbMid = grip(body(190, 205, 190, [12, 4, 12, 4]), [16, -28])

// Archer: hands 92 apart; the body slides under the working hand, the other arm straightens along the bar.
const wHang = fgrip(still, [46, -45.5], [-46, -45.5])
const archR = fgrip(body(180, 180, 180, [2, -2, -2, 2]), [22, -6], [-70, -6])
const archL = fgrip(body(180, 180, 180, [2, -2, -2, 2]), [70, -6], [-22, -6])
const wTop = fgrip(body(180, 180, 180, [2, -2, -2, 2]), [46, -6], [-46, -6])

// Kipping: arch (feet behind, chest through), hollow (feet ahead), then the bar pulled to the belly.
const arch = body(186, 200, 196, [-24, -14, -24, -14], 178)
const hollow = body(176, 166, 170, [22, 10, 22, 10], 186)
const highBody = body(196, 214, 196, [20, 4, 20, 4])
const highPull = grip(highBody, chestPt(highBody, 0.15, 17), -1, true)
// Muscle-up: chest drops over the bar (deep dip bottom, elbows high behind), then press to straight arms.
const overBody = body(150, 128, 120, [14, 0, 14, 0])
const turnover = grip(overBody, chestPt(overBody, 0.3, 17), -1, true)
const supportBody = body(168, 172, 178, [10, 2, 10, 2])
const support = grip(supportBody, [14, 8], 1, true)

// One arm: near hand over the near shoulder, free fist squeezed at the side.
const free = (p: Pose): Pose => {
  const q = [...p] as Pose
  q[3] = -14
  q[4] = 6
  return q
}
const oa = (p: Pose, near: [number, number]): Pose => free(fgrip(p, near, [-28, -40]))
const oaHang = oa(body(176, 176, 176, [0, 0, 2, -2]), [17, -54])
const oaMid = oa(body(178, 178, 178, [2, -2, 4, -4]), [24, -32])
const oaTop = oa(body(180, 180, 180, [3, -3, 5, -5]), [24, -6])
// Assisted: the other hand holds a towel 44 below the bar.
const towel = (p: Pose): Pose => {
  const n = pos(p, 'hand', true)
  return reach(p, { farHand: [n[0] - 56, n[1] + 44] }, { front: true, k: { farHand: 1 } })
}

export const MOVES: Record<string, Move> = {
  dead_hang: front([fHang, fgrip(body(180, 180, 182, [3, -3, -2, 2]), [28, -52.8], [-28, -52.8])], 1400),
  scap_pull: side([passive, active], 1000),
  neg_pullup: { ...front([fTop, fMid, fHang], 1500), mode: 'cycle' },
  chinup: side([passive, active, sMid, sTop]),
  pullup: front([fHang, fMid, fTop]),
  lsit_pullup: side([lHang, lMid, lTop]),
  pullup_12: front([fHang, fMid, fTop], 550),
  ctb: side([passive, active, ctbMid, ctbTop]),
  archer_pullup: { ...front([wHang, archR, wHang, archL], 900, 46), mode: 'cycle' },
  high_pullup: side([arch, hollow, highPull], 450),
  typewriter: front([archR, wTop, archL], 1500, 46),
  oa_neg: { ...front([oaTop, oaMid, oaHang], 1600, 28), mode: 'cycle' },
  bar_mu: side([arch, hollow, highPull, turnover, support], 650),
  oa_assisted: { ...front([towel(oaHang), towel(oaMid), towel(oaTop)], 1000, 28), props: [{ t: 'bar', x: 0, y: BAR }, { t: 'rings', x: -28, y: BAR + 44 }] },
  ring_mu: side([passive, active, highPull, turnover, support], 900, [{ t: 'rings', x: 0, y: BAR }]),
  oapu: front([oaHang, oaMid, oaTop], 1100, 28),
  strict_mu: side([passive, active, highPull, turnover, support], 1100),
}
