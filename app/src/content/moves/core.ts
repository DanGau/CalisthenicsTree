import { place, RUNG, type Move, type Pose } from '../../core/figure'
import { solve } from './frontlever'
import { pos, reach, rot } from './legs'
import { body, grip, grip3, hold, type K3, onBar, pinned, rep } from './pull'


// On the back, head to the left. Low back flat (torso -92), the chest curls up off the floor in the hollow.
const table: Pose = [-90, 180, 180, 180, 180, 180, 90, 180, 90, -90, -96]
const bugL: Pose = [-90, 260, 260, 180, 180, 180, 90, 98, 98, -90, -96]
const bugR: Pose = [-90, 180, 180, 260, 260, 98, 98, 180, 90, -90, -96]
// Hollow: ribs down, shoulders and legs just off the floor, arms by the ears.
const hollow = (lift = 0): Pose => [-93, -104 - lift, -104 - lift, -104 - lift, -104 - lift, 100 + lift, 100 + lift, 100 + lift, 100 + lift, -112 - lift, -122 - lift]
// Arch (face down, head right): glutes squeeze the legs up, chest lifts, neck long.
const arch = (lift: number): Pose => [92, 100 + lift, 100 + lift, 100 + lift, 100 + lift, -92 - lift, -92 - lift, -92 - lift, -92 - lift, 100 + lift, 104 + lift]

// Hanging, side view.
const hangPin = { x: 'hand' as const, y: 'hand' as const, at: [0, -210] as [number, number], props: [{ t: 'bar', x: 0, y: -210 } as const] }
const hang = body(180, 182, 184, [2, 0, 2, 0], 176, -3)
// The pelvis curls: hips roll forward under the waist while the chest stays tall.
const kneeUp = body(200, 178, 182, [140, 20, 140, 20], 172, -3)
const legsUp = body(196, 178, 182, [92, 92, 92, 92], 174, -3)
// Toes to bar: lean back on straight arms, roll the pelvis up, straight legs reach the bar.
const ttbTop = (() => {
  const p = body(232, 200, 196, [0, 0, 0, 0], 150, -4)
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

// Wipers, solid, seen 70 off the side: hanging, hips rolled up so straight legs point at the bar, then the legs
// sweep side to side together as the pelvis rotates under a square upper body.
const wiper = (side: number): K3 => {
  const k = grip3(body(214, 196, 190, [178, 178, 178, 178], 180, -3), { legOut: side, farLegOut: -side, twist: -side * 0.3 }, [10, -50, 28], [10, -50, -28])
  return k
}

// Tension hold: hands on the bar, straight body angled down to the feet on a box in front, hips up.
const tense = (t: number, legs: number, s: number): Pose => body(t, t, t + 4, [legs, legs, legs, legs], t, s)
const TB = tense(222, 40, -3)
const tbFeet = place({ keys: [], ...hangPin }, TB)
const tbBox = { t: 'box' as const, x: tbFeet.foot.x - 25, w: 60, h: -Math.max(tbFeet.toe.y, tbFeet.heel.y) }
/** Re-aims the legs so the feet stay on the box as the hips move. */
const onBox = (p: Pose): Pose => {
  const b = place({ keys: [], ...hangPin }, p)
  const f: [number, number] = [tbFeet.foot.x - b.hip.x, tbFeet.foot.y - b.hip.y]
  return reach(p, { foot: f, farFoot: f }, { k: { foot: -1, farFoot: -1 } })
}
// Cut loose: the feet slip, the body swings forward under the bar, back, then the lats brake it dead.
const swingTo = (p: Pose, d: number): Pose => p.map((v, i) => (i === 11 ? v : v! + d)) as Pose
const cutFwd = swingTo(body(176, 168, 172, [40, 20, 40, 20], 184, -2), -22)
const cutBack = swingTo(body(184, 196, 190, [-14, -8, -14, -8], 178, 1), 14)
const cutBrake = swingTo(body(180, 178, 180, [16, 6, 16, 6], 180, -4), -4)

// Stall bars, back to the rungs: hands on the top rung just behind the head, the back against the bars.
// Arms angle back up 14 to the rung, so shoulders, pelvis and the rungs line up.
const stallPin = { x: 'hand' as const, y: 'hand' as const, at: [0, RUNG(17)] as [number, number], props: [{ t: 'stall', x: 0, wall: -1 } as const] }
const sHang = body(180, 182, 182, [2, 0, 2, 0], 194, -3)
const sLegs = (legs: number, t = 196): Pose => body(t, 182, 180, [legs, legs, legs, legs], 194, -4)
// Leg circles, solid, 50 off the side: straight legs up at 80, sweeping out to one side, up, across and down.
const circle = (legs: number, side: number): K3 => grip3(body(190, 182, 180, [legs, legs, legs, legs], 194, -4), { legOut: side, farLegOut: -side, roll: side * 0.15 }, [-10, -45, 26], [-10, -45, -26])
const stallSolid = (m: { keys: K3[]; beats?: Move['beats']; mode?: Move['mode'] }): Move => ({ ...onBar(m, { view: 50, y: RUNG(17) }), props: [{ t: 'stall', x: 0, wall: -1, z: -40 }] })

const hb = (hold: number, ...durs: number[]): Move['beats'] => durs.map((d, i) => ({ hold: i === 0 || i === durs.length - 1 ? hold : 0, dur: d }))

export const MOVES: Record<string, Move> = {
  dead_bug: { keys: [table, bugL, table, bugR], mode: 'cycle', ms: 1000, beats: [{ hold: 0.2, dur: 1.5 }, { hold: 0.3, dur: 1 }, { hold: 0.2, dur: 1.5 }, { hold: 0.3, dur: 1 }] },
  hollow_hold: { keys: [hollow(), hollow(2)], ms: 1000, beats: hb(0.3, 2, 2) },
  arch_hold: { ...hold(arch(0), arch(12), arch(14)), ms: 1000 },
  hollow_rock: { keys: [rot(hollow(), -14), rot(hollow(), 14)], ms: 700, beats: [{ hold: 0.05, dur: 1 }, { hold: 0.05 }] },
  knee_raise: { ...rep(hang, null, [kneeUp], { rise: 1, lower: 1.6 }), ...hangPin, ms: 1000 },
  rollout_knee: { ...rep(kneel(-5, 115), null, [kneel(-62, 100)], { rise: 2, lower: 1.3, top: 0.3 }), x: 'knee', ms: 1000 },
  tuck_lsit: { ...hold(feetDown, tuck, support([142, 18, 142, 18], 177)), ...supportPin, ms: 1000 },
  leg_raise: { ...rep(sHang, null, [sLegs(92)], { rise: 1.2, lower: 1.9 }), ...stallPin, ms: 1000 },
  stall_lhang: { ...hold(sLegs(60, 190), sLegs(90), sLegs(93)), ...stallPin, ms: 1000 },
  stall_vhang: { ...hold(sLegs(92), sLegs(140, 206), sLegs(144, 207)), ...stallPin, ms: 1000 },
  stall_leg_circles: stallSolid({ keys: [circle(70, 40), circle(110, 0), circle(70, -40), circle(40, 0)], mode: 'cycle', beats: [{ dur: 1 }, { dur: 1 }, { dur: 1 }, { dur: 1 }] }),
  tuck_dragon: { keys: [dragon(10, true), dragon(-72, true)], mode: 'cycle', ...dragonPin, ms: 1000, beats: [{ hold: 0.3, dur: 2 }, { hold: 0.3, dur: 1.3 }] },
  lsit: { ...hold(tuck, ell, support([92, 92, 92, 92], 177)), ...supportPin, ms: 1000 },
  ttb: { ...rep(hang, null, [legsUp, ttbTop], { rise: 1.3, lower: 2 }), ...hangPin, ms: 1000 },
  dragon_flag: { keys: [dragon(10), dragon(-78)], mode: 'cycle', ...dragonPin, ms: 1000, beats: [{ hold: 0.3, dur: 2.2 }, { hold: 0.3, dur: 1.4 }] },
  lsit_30: { keys: [ell, support([93, 93, 93, 93], 177)], ...supportPin, ms: 1000, beats: hb(0.3, 2, 2) },
  wipers: onBar({ keys: [wiper(-55), wiper(0), wiper(55)], beats: [{ hold: 0.3, dur: 0.8, ease: 'in' }, { dur: 0.8, ease: 'out' }, { hold: 0.3 }] }, { view: 70 }),
  standing_rollout: { ...rep(stand(28, 0), null, [stand(flatT, flatT - 180)], { rise: 2.5, lower: 1.6, top: 0.3 }), x: 'foot', ms: 1000 },
  vsit: { ...hold(vs(196, 92, 8), vs(204, 130, 12), vs(205, 132, 12)), ms: 1000 },
  v120: { ...hold(vs(206, 132, 12), vs(216, 170, 16), vs(217, 172, 16)), ms: 1000 },
  tension_board: pinned({ ...hangPin, ...hold(onBox(tense(226, 36, 0)), onBox(TB), onBox(tense(220, 42, -4))), ms: 1000, props: [hangPin.props[0], tbBox] }, onBox, 20),
  cut_loose: { ...hangPin, mode: 'cycle', flow: 0.15, ms: 1000, keys: [onBox(TB), cutFwd, cutBack, cutBrake, hang, legsUp, ttbTop, legsUp, hang],
    beats: [{ hold: 0.6, dur: 0.6, ease: 'in' }, { dur: 0.9 }, { dur: 0.7 }, { hold: 0.3, dur: 0.5 }, { dur: 0.6 }, { dur: 0.4 }, { hold: 0.3, dur: 0.6 }, { dur: 0.7 }, { hold: 0.3, dur: 0.6 }],
    props: [hangPin.props[0], tbBox] },
  manna: { ...hold(vs(216, 170, 16), vs(240, 200, 20), vs(241, 202, 20)), ms: 1000 },
}
