import { joints, LEN, place, type Move, type Pose, type Pt } from '../../core/figure'
import { reach } from './legs'
import { armsTo, holdBeats, nudge, tempo } from './push'

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

// Bulgarian, front view: rings wide of the shoulders; the chest sinks between them, elbows bent out and down.
const B = { out: 22, drop: 44 }
const bulgarian = (drop: number): Pose => {
  const p: Pose = [180, 0, 0, 0, 0, -2, -2, 2, 2, 180, 180, drop ? 2 : -5]
  const b = joints(p, true)
  const s = Math.sign(b.nearShoulder.x - b.shoulder.x)
  const y = b.nearShoulder.y + Math.sqrt((LEN.upper + LEN.fore - 0.3) ** 2 - B.out ** 2) - drop
  const to = { hand: [b.nearShoulder.x + s * B.out, y] as [number, number], farHand: [b.farShoulder.x - s * B.out, y] as [number, number] }
  const [a, c] = [reach(p, to, { front: true, k: { hand: 1, farHand: -1 } }), reach(p, to, { front: true, k: { hand: -1, farHand: 1 } })]
  return s * joints(a, true).elbow.x > s * joints(c, true).elbow.x ? a : c
}
// Halfway keys keep the hands on the rings through the blend.
const bulgarianM: Move = {
  keys: [bulgarian(0), bulgarian(B.drop / 2), bulgarian(B.drop), bulgarian(B.drop / 2)], mode: 'cycle', front: true, x: 'hip', y: 'hand', at: [0, Y], ms: 800,
  beats: [{ hold: 0.4, dur: 1.1, ease: 'in' }, { dur: 1.1, ease: 'out' }, { hold: 0.15, dur: 0.65, ease: 'in' }, { dur: 0.65, ease: 'out' }],
}

const dip = (top: Pose, low: Pose, props: Move['props'], down = 1.8, up = 1): Move => ({ ...on([top, low], props, 800), ...tempo(down, up) })
const hold = (keys: Pose[], props: Move['props']): Move => ({ ...on(keys, props, 900), beats: holdBeats(1.4, 1.6) })

export const MOVES: Record<string, Move> = {
  support_hold: hold([shrug, support, nudge(support, { 5: 3, 6: 3, 7: 3, 8: 3, 9: -1 })], [bars]),
  dip_neg: dip(support, dipLow, [bars], 3.5, 1.2),
  bar_dip: dip(support, dipLow, [bars]),
  ring_support: hold([shrug, rto, support], [rings]),
  korean_dip: dip(kTop, kLow, [bar], 2, 1.2),
  straight_bar_dip: dip(sTop, sLow, [bar]),
  rto_support: hold([support, rto, nudge(rto, { 1: 2, 2: 2, 3: 2, 4: 2, 5: -3, 6: -3, 7: -3, 8: -3 })], [rings]),
  russian_dip: { ...on([support, dipLow, forearms], [bars], 800), mode: 'cycle', beats: [{ hold: 0.4, dur: 1.8 }, { hold: 0.1, dur: 1.2 }, { hold: 0.3, dur: 2 }] },
  ring_dip: dip(support, dipLow, [rings], 2, 1.1),
  lsit_dip: dip(lTop, lLow, [bars]),
  impossible_dip: dip(straightTop, straightForearm, [bars], 2.2, 1.4),
  bulgarian_dip: { ...bulgarianM, props: [place(bulgarianM, bulgarianM.keys[0]), place(bulgarianM, bulgarianM.keys[0])].map((b, i) => { const h = i ? b.farHand : b.hand; return { t: 'rings', x: Math.round(h.x), y: Math.round(h.y) } }) },
  rto_dip: dip(rto, dipLow, [rings], 2.2, 1.3),
}
