import { place, type Move, type Pose } from '../../core/figure'
import { solve } from './frontlever'
import { pos, reach, rot } from './legs'
import { body, fgrip, grip } from './pull'


// On the back, head to the left. Low back flat (torso -92), the chest curls up off the floor in the hollow.
const table: Pose = [-90, 180, 180, 180, 180, 180, 90, 180, 90, -90, -96]
const bugL: Pose = [-90, -100, -100, 180, 180, 180, 90, 98, 98, -90, -96]
const bugR: Pose = [-90, 180, 180, -100, -100, 98, 98, 180, 90, -90, -96]
// Hollow: ribs down, shoulders and legs just off the floor, arms by the ears.
const hollow = (lift = 0): Pose => [-93, -104 - lift, -104 - lift, -104 - lift, -104 - lift, 100 + lift, 100 + lift, 100 + lift, 100 + lift, -112 - lift, -122 - lift]
// Arch (face down, head right): glutes squeeze the legs up, chest lifts, neck long.
const arch = (lift: number): Pose => [92, 100 + lift, 100 + lift, 100 + lift, 100 + lift, -92 - lift, -92 - lift, -92 - lift, -92 - lift, 100 + lift, 104 + lift]

// Hanging, side view.
const hangPin = { x: 'hand' as const, y: 'hand' as const, at: [0, -210] as [number, number], props: [{ t: 'bar', x: 0, y: -210 } as const] }
const hang = body(180, 182, 184, [2, 0, 2, 0], 176)
// The pelvis curls: hips roll forward under the waist while the chest stays tall.
const kneeUp = body(200, 178, 182, [140, 20, 140, 20], 172)
const legsUp = body(196, 178, 182, [92, 92, 92, 92], 174)
// Toes to bar: lean back on straight arms, roll the pelvis up, straight legs reach the bar.
const ttbTop = (() => {
  const p = body(232, 200, 196, [0, 0, 0, 0], 150)
  const h = pos(p, 'hand')
  return reach(p, { foot: [h[0] + 6, h[1] + 8], farFoot: [h[0] + 6, h[1] + 8] }, { k: { foot: -1, farFoot: -1 } })
})()

// Support on parallettes 40 up: arms locked beside the hips, shoulders pushed down, slight round of the upper back.
const BARS = -40
const supportPin = { x: 'hand' as const, y: 'hand' as const, at: [0, BARS] as [number, number], props: [{ t: 'bars', x: 0, y: BARS } as const] }
const support = (legs: [number, number, number, number], t = 178): Pose => grip(body(t, t - 8, t - 4, legs), [3, 8], 1, true)
const feetDown = support([100, 8, 100, 8])
const tuck = support([138, 16, 138, 16])
const ell = support([90, 90, 90, 90], 176)

// Floor V-sits: straight arms angled to the floor just behind the hips; the further the lean, the higher the legs.
const vs = (t: number, legs: number, a: number): Pose => body(t, t - 10, t - 16, [legs, legs, legs, legs], a)

// Kneeling rollout: shins on the floor, hollow trunk, straight arms reach the floor at the wheel.
const onFloor = (p: Pose, from: 'knee' | 'foot', k = -1): Pose => {
  const s = pos(p, 'shoulder')
  const f = pos(p, from)
  const dy = f[1] + (from === 'foot' ? 5 : 4) - s[1]
  const dx = Math.sqrt(Math.max(0, 53.9 ** 2 - dy ** 2))
  return reach(p, { hand: [s[0] + dx, s[1] + dy], farHand: [s[0] + dx, s[1] + dy] }, { k: { hand: k, farHand: k } })
}
const kneel = (thigh: number, t: number): Pose => onFloor([t, 0, 0, 0, 0, thigh, -90, thigh, -90, t - 8, t - 14], 'knee')
// Standing rollout: legs straight, the body opens from a pike to one line just off the floor.
const stand = (t: number, legs: number): Pose => onFloor([t, 0, 0, 0, 0, legs, legs, legs, legs, t - 6, t - 12], 'foot')
const flatT = solve(80, 100, (t) => {
  const b = place({ keys: [] }, stand(t, t - 180))
  return b.hand.y - Math.max(b.foot.y, b.heel.y, b.toe.y)
})

// Dragon flag: shoulders and head on a bench, hands grip behind the head, body one line from the shoulders.
const bench = { t: 'box', x: -70, w: 70, h: 40 } as const
const dragonPin = { x: 'shoulder' as const, y: 'shoulder' as const, at: [-10, -48] as [number, number], props: [bench] }
const dragon = (t: number, tucked = false): Pose => {
  const legs: [number, number, number, number] = tucked ? [t + 135, t + 15, t + 135, t + 15] : [t + 180, t + 180, t + 180, t + 180]
  const p: Pose = [t, 0, 0, 0, 0, ...legs, t, -90]
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [s[0] - 34, s[1] + 4], farHand: [s[0] - 34, s[1] + 4] }, { k: { hand: 1, farHand: 1 } })
}

// Wipers (front view): legs up at the bar, swung side to side from the hips.
const wiper = (side: number): Pose => fgrip(body(180 + side * 0.3, 180, 180, [180 + side, 180 + side, 180 + side, 180 + side]), [28, -52.8], [-28, -52.8])

export const MOVES: Record<string, Move> = {
  dead_bug: { keys: [table, bugL, table, bugR], mode: 'cycle', ms: 1100 },
  hollow_hold: { keys: [hollow(), hollow(3)], ms: 1400 },
  arch_hold: { keys: [arch(0), arch(12)], ms: 1300 },
  hollow_rock: { keys: [rot(hollow(), -14), rot(hollow(), 14)], ms: 700 },
  knee_raise: { keys: [hang, kneeUp], ...hangPin },
  rollout_knee: { keys: [kneel(-5, 115), kneel(-62, 100)], x: 'knee', ms: 1300 },
  tuck_lsit: { keys: [feetDown, tuck], ...supportPin, ms: 1000 },
  leg_raise: { keys: [hang, legsUp], ...hangPin },
  tuck_dragon: { keys: [dragon(10, true), dragon(-72, true)], ...dragonPin, ms: 1500 },
  lsit: { keys: [tuck, ell], ...supportPin, ms: 1000 },
  ttb: { keys: [hang, legsUp, ttbTop], ...hangPin, ms: 900 },
  dragon_flag: { keys: [dragon(10), dragon(-78)], ...dragonPin, ms: 1600 },
  lsit_30: { keys: [ell, support([93, 93, 93, 93], 177)], ...supportPin, ms: 2000 },
  wipers: { keys: [wiper(-35), wiper(35)], front: true, ...hangPin, at: [28, -210], ms: 1100 },
  standing_rollout: { keys: [stand(28, 0), stand(flatT, flatT - 180)], x: 'foot', ms: 1500 },
  vsit: { keys: [vs(196, 92, 8), vs(204, 130, 12)], ms: 1200 },
  v120: { keys: [vs(206, 132, 12), vs(216, 170, 16)], ms: 1200 },
  manna: { keys: [vs(216, 170, 16), vs(240, 200, 20)], ms: 1400 },
}
