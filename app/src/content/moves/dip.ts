import { joints, type Move, type Pose, type Pt } from '../../core/figure'
import { reach } from './legs'
import { armsTo } from './push'

const Y = -130
const bars = { t: 'bars', x: 0, y: Y } as const
const rings = { t: 'rings', x: 0, y: Y } as const
const bar = { t: 'bar', x: 0, y: Y } as const
const on = (keys: Pose[], props: Move['props'], ms?: number): Move => ({ keys, x: 'hand', y: 'hand', at: [0, Y], props, ms })

/** Body with arms bent so the hands sit at `hand` from the shoulder; `pick` chooses the elbow (lowest x = back). */
function grip(p: Pose, hand: Pt, pick: (e: Pt) => number = (e) => e.x): Pose {
  const s = joints(p).shoulder
  const [a, b] = [-1, 1].map((k) => armsTo(p, { x: s.x + hand.x, y: s.y + hand.y }, k))
  return pick(joints(a).elbow) < pick(joints(b).elbow) ? a : b
}

// Support: locked arms, shoulders pressed down, hollow (ribs in, legs a touch forward). Shrug: sunk shoulders, arched, legs behind.
const support: Pose = [184, 0, 0, 0, 0, 8, 8, 8, 8, 176, 178]
const shrug: Pose = [176, 0, 0, 0, 0, -6, -20, -6, -20, 188, 200]
// Bottom: shoulders below the elbows, chest leaning forward, forearms near vertical, shins crossed behind.
const dipLow = grip([152, 0, 0, 0, 0, 6, -55, 6, -55, 148, 160], { x: 8, y: 22 })
const rto: Pose = [178, 5, 5, 5, 5, 8, 8, 8, 8, 172, 176]

// Korean: bar behind the hips; at the bottom the shoulders drop in front of and below the bar, the hips swing back.
const kTop = grip([172, 0, 0, 0, 0, 22, 0, 22, 0, 168, 170], { x: -12, y: 52 })
const kLow = grip([150, 0, 0, 0, 0, 35, -25, 35, -25, 142, 155], { x: -34, y: -6 })
// Straight bar: bar in front at the hips, leaning over it; at the bottom the chest meets the bar, elbows back.
const sTop = grip([166, 0, 0, 0, 0, 12, 0, 12, 0, 160, 165], { x: 12, y: 52 })
const sLow = grip([140, 0, 0, 0, 0, 30, 0, 30, 0, 132, 150], { x: 14, y: 8 })
// Russian: down onto the forearms, flat along the bars.
const forearms: Pose = [168, -12, 90, -12, 90, 6, -55, 6, -55, 164, 172]

// Impossible: body stays straight, forearms carry it.
const straightTop: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180]
const straightForearm: Pose = [162, -18, 90, -18, 90, -18, -18, -18, -18, 160, 168]

// L-sit: legs level, shoulders over the hands; at the bottom the chest leans while the legs stay level.
const lTop: Pose = [182, -6, -6, -6, -6, 90, 90, 90, 90, 176, 178]
const lLow = grip([168, 0, 0, 0, 0, 90, 90, 90, 90, 160, 170], { x: 8, y: 22 })

// Bulgarian, front view: the rings travel out wide and the chest drops between them.
const bTop: Pose = [180, -4, -4, 4, 4, -2, -2, 2, 2]
const bLow = (() => {
  const p: Pose = [180, 0, 0, 0, 0, -2, -2, 2, 2]
  const b = joints(p, true)
  const out = Math.sign(b.nearShoulder.x - b.shoulder.x) * 42
  return reach(p, { hand: [b.nearShoulder.x + out, b.nearShoulder.y + 14], farHand: [b.farShoulder.x - out, b.farShoulder.y + 14] }, { front: true, k: { hand: 1, farHand: -1 } })
})()

export const MOVES: Record<string, Move> = {
  support_hold: on([shrug, support], [bars], 1200),
  dip_neg: on([support, dipLow], [bars], 1900),
  bar_dip: on([support, dipLow], [bars]),
  ring_support: on([shrug, support], [rings], 1200),
  korean_dip: on([kTop, kLow], [bar]),
  straight_bar_dip: on([sTop, sLow], [bar]),
  rto_support: on([support, rto], [rings], 1200),
  russian_dip: on([support, dipLow, forearms], [bars], 1000),
  ring_dip: on([support, dipLow], [rings]),
  lsit_dip: on([lTop, lLow], [bars]),
  impossible_dip: on([straightTop, straightForearm], [bars], 1200),
  bulgarian_dip: { keys: [bTop, bLow], front: true, x: 'hip', y: 'hand', at: [0, -145] },
  rto_dip: on([rto, dipLow], [rings], 1200),
}
