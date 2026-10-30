import { blend, full, joints, LEN, type Move, type Pose, type Pt } from '../../core/figure'
import { armsTo, world, fit3, holdBeats, type Key3, nudge, off, rep, rep3 } from './push'

const Y = -130
const bars = { t: 'bars', x: 0, y: Y } as const
const rings = { t: 'rings', x: 0, y: Y } as const
const bar = { t: 'bar', x: 0, y: Y } as const
const on = (keys: Pose[], props: Move['props'], ms?: number): Move => ({ keys, x: 'hand', y: 'hand', at: [0, Y], props, ms, balance: true })

/** Body with arms bent so the hands sit at `hand` from the shoulder; `pick` chooses the elbow (lowest x = back). */
function grip(p: Pose, hand: Pt, pick: (e: Pt) => number = (e) => e.x): Pose {
  const s = joints(p).shoulder
  const [a, b] = [-1, 1].map((k) => armsTo(p, { x: s.x + hand.x, y: s.y + hand.y }, k))
  return pick(joints(a).elbow) < pick(joints(b).elbow) ? a : b
}

// Support: locked arms, shoulders pressed down, hollow (ribs in, legs a touch forward). Shrug: sunk shoulders, arched, legs behind.
const support: Pose = [184, 0, 0, 0, 0, 8, 8, 8, 8, 176, 178, -5]
const shrug: Pose = [176, 0, 0, 0, 0, -6, -20, -6, -20, 188, 200, 6]
// Bottom: shoulders below the elbows, chest leaning forward, forearms near vertical, shins crossed behind.
const dipLow = grip([152, 0, 0, 0, 0, 6, -55, 6, -55, 148, 160], { x: 8, y: 22 })
const rto: Pose = [178, 5, 5, 5, 5, 8, 8, 8, 8, 172, 176, -5]

// Korean: bar behind the hips; at the bottom the shoulders drop in front of and below the bar, the hips swing back.
const kTop = grip([172, 0, 0, 0, 0, 22, 0, 22, 0, 168, 170, -4], { x: -12, y: 52 })
const kLow = grip([150, 0, 0, 0, 0, 35, -25, 35, -25, 142, 155], { x: -34, y: -6 })
// Straight bar: bar in front at the hips, leaning over it; at the bottom the chest meets the bar, elbows back.
const sTop = grip([166, 0, 0, 0, 0, 12, 0, 12, 0, 160, 165, -4], { x: 12, y: 52 })
const sLow = grip([140, 0, 0, 0, 0, 30, 0, 30, 0, 132, 150], { x: 14, y: 8 })
// Russian: down onto the forearms, flat along the bars.
const forearms: Pose = [168, -12, 90, -12, 90, 6, -55, 6, -55, 164, 172]

// Impossible: body stays straight, forearms carry it.
const straightTop: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180, -5]
const straightForearm: Pose = [162, -18, 90, -18, 90, -18, -18, -18, -18, 160, 168]

// L-sit: legs level, shoulders over the hands; at the bottom the chest leans while the legs stay level.
const lTop: Pose = [182, -6, -6, -6, -6, 90, 90, 90, 90, 176, 178, -5]
const lLow = grip([168, 0, 0, 0, 0, 90, 90, 90, 90, 160, 170], { x: 8, y: 22 })

// Bulgarian, solid: rings wide of the shoulders; the chest sinks between them below the rings, elbows back and out.
const B = { w: 40, low: -8, lean: 12, cam: 30 }
function bulgarian(f: number, prev?: Key3): Key3 {
  const t = 180 - B.lean * f
  const top = Math.sqrt((LEN.upper + LEN.fore - 0.5) ** 2 - (B.w - 17) ** 2)
  const build = ([nu, nf, fu, ff, ao, fo]: number[]): Key3 =>
    ({ p: [t, nu, nf, fu, ff, 8, -45, 14, -50, t - 4 * f, t + 6 * f, -5 + 7 * f], st: { armOut: ao, farArmOut: fo } })
  const v0 = prev ? [...(prev.p.slice(1, 5) as number[]), prev.st.armOut!, prev.st.farArmOut!] : [0, 0, 0, 0, 25, 25]
  return fit3(build, v0, (b) => [
    ...off(b.farHand, b.hand, [0, 0, -2 * B.w]),
    ...off(b.shoulder, b.hand, [6 * f, -(top + (B.low - top) * f), -B.w]),
  ])
}
const bulgarianM: Move = rep3((f, _, prev) => bulgarian(f, prev), 2, 1.2, B.cam, { x: 'hand', y: 'hand', at: [0, Y] })

/** Dip rep, seconds: shoulders and elbows bend together; the shoulders depress again only at the end of the press-out. */
const dip = (top: Pose, low: Pose, props: Move['props'], down = 1.7, up = 1): Move => {
  const mid = (f: number, rise: boolean) => {
    const p = blend(top, low, f, 'lin')
    return rise ? nudge(p, { 11: (full(low)[11] - full(top)[11]) * (1 - f) * 0.6 }) : p
  }
  return { ...on([], props), ...rep(top, low, mid, down, up, [0.25, 0.2]) }
}
/** Support hold: settle in, then breathe (≈2 s each way). */
const hold = (keys: Pose[], props: Move['props']): Move => ({ ...on(keys, props, 1000), beats: holdBeats(1.4, 2) })

export const MOVES: Record<string, Move> = {
  support_hold: hold([shrug, support, nudge(support, { 5: 3, 6: 3, 7: 3, 8: 3, 9: -1 })], [bars]),
  dip_neg: dip(support, dipLow, [bars], 3.5, 1.2),
  bar_dip: dip(support, dipLow, [bars]),
  ring_support: hold([shrug, rto, support], [rings]),
  korean_dip: dip(kTop, kLow, [bar], 2, 1.2),
  straight_bar_dip: dip(sTop, sLow, [bar]),
  rto_support: hold([support, rto, nudge(rto, { 1: 2, 2: 2, 3: 2, 4: 2, 5: -3, 6: -3, 7: -3, 8: -3 })], [rings]),
  russian_dip: { ...on([support, dipLow, forearms], [bars], 1000), mode: 'cycle', beats: [{ hold: 0.3, dur: 1.5 }, { hold: 0.15, dur: 1 }, { hold: 0.3, dur: 1.7 }] },
  ring_dip: dip(support, dipLow, [rings], 2, 1.1),
  lsit_dip: dip(lTop, lLow, [bars]),
  impossible_dip: dip(straightTop, straightForearm, [bars], 2.2, 1.4),
  bulgarian_dip: { ...bulgarianM, props: (() => { const b = world(bulgarianM); return [b.hand, b.farHand].map((h) => ({ t: 'rings', x: Math.round(h.x), y: Math.round(h.y), z: Math.round(h.z ?? 0) }) as const) })() },
  rto_dip: dip(rto, dipLow, [rings], 2.2, 1.3),
}
