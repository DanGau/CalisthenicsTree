import { type Move, type Pose, type Prop } from '../../core/figure'
import { balance, bent, com3, world, fit, fit3, handOf, holdBeats, type Key3, line, reachTo, rep, set, solidMove, straight, tween } from './push'

const ARM = 54

// Plank family: hands fixed, toes on the floor. Hollow = upper back rounded (chest below the torso line).
const hollow = straight((t) => line(t, -8), 0)
const D_HANDS = handOf(hollow).x
const sag = reachTo((t) => line(t, 9, -4, 10), ARM - 0.5, D_HANDS, 0, -1, 100, 150)
const protract = reachTo((t) => line(t, -12), ARM - 0.5, D_HANDS, 0, -1, 100, 150)
const retract = reachTo((t) => line(t, 5, 0, 5), ARM - 0.5, D_HANDS, 0, -1, 100, 150)

// Lean: shoulders travel past the hands, the feet roll onto the toes.
const lean = straight((t) => line(t, -10), -24)
const ppLow = bent((t) => line(t, -2), 17, handOf(lean).x)

/** Straight arms at angle u with the centre of mass over the hands. */
const float = (body: Pose) => balance((u) => set(set(body, [1, 3], u), [2, 4], u), -75, 20)
/** Bent arms (upper arm at u) with the forearm solved to balance. */
const press = (body: Pose, u: number) => balance((f) => set(set(body, [1, 3], u), [2, 4], f), -60, 60)

// Shoulders depressed (-3) and protracted (upper back rounded: chest below the torso line) in every planche.
const D = -3
// Tuck: back rounded, knees to the chest, gaze forward.
const tuckBody: Pose = [104, 0, 0, 0, 0, 62, -112, 62, -112, 62, 95, D]
const tuck = float(tuckBody)
// Entry: same tuck with the toes still on the floor and less lean.
const tuckIn = fit((s) => set(set(tuckBody, [1, 2, 3, 4], -12), [6, 8], s), (b) => b.hand.y - b.toe.y, -10, -120)
const advBody = (hip: number): Pose => [92, 0, 0, 0, 0, hip, -112, hip, -112, 90, 115, D]
const advTuck = float(advBody(32))
const oneLeg = float([92, 0, 0, 0, 0, 32, -112, -92, -92, 89, 112, D])
const fullBody = (dip = 0): Pose => [92 - dip, 0, 0, 0, 0, -91 + dip, -91 + dip, -91 + dip, -91 + dip, 86, 108, D]
const planche = float(fullBody())

/**
 * Solid planche: trunk tilted `t` (90 level), straight arms swung `armOut` and solved so the centre of mass is
 * over the hands, legs straight `pike` below the trunk line and swung `legOut` each.
 */
function solidPlanche(t: number, o: { armOut: number; legOut: number; pike?: number; head?: number }): Key3 {
  const legs = t - 180 - (o.pike ?? 0)
  const build = ([u]: number[]): Key3 => ({ p: [t, u, u, u, u, legs, legs, legs, legs, t - 6, t + (o.head ?? 16), D], st: { armOut: o.armOut, farArmOut: o.armOut, legOut: o.legOut, farLegOut: o.legOut } })
  return fit3(build, [-60], (b) => [com3(b).x - b.hand.x])
}
// Straddle: hands a touch wider, legs wide; it lifts from straddled toes on the floor.
const STR = { armOut: 8, legOut: 45 }
const straddleIn = (() => {
  const key = (t: number): Key3 => ({ p: [t, -40, -40, -40, -40, t - 180, t - 180, t - 180, t - 180, t - 6, t + 16, D], st: { armOut: STR.armOut, farArmOut: STR.armOut, legOut: STR.legOut, farLegOut: STR.legOut } })
  return fit3(([t]) => key(t), [110], (b) => [b.toe.y - b.hand.y])
})()
const straddle = solidPlanche(92, STR)
// Maltese on parallettes: legs together, arms swung far out to the sides, chest just above the hands.
const MAL = { armOut: 72, legOut: 0, y: -26 }
const parallettes = (m: Move): Prop[] => {
  const b = world(m)
  return [{ t: 'bars', x: Math.round(b.hand.x), y: Math.round(b.hand.y), z: Math.round(Math.abs(b.hand.z ?? 22)) }]
}
const maltese = (() => {
  const mv = solidMove([solidPlanche(95, { ...MAL, pike: 8, head: 10 }), solidPlanche(91, MAL), solidPlanche(90, { ...MAL, pike: -2 })], holdBeats(1.5, 1.5), 40, { x: 'hand', y: 'hand', at: [0, MAL.y], point: true, tilt: 25 })
  return { ...mv, props: parallettes(mv) }
})()

/** Seconds per beat unit. */
const m = (keys: Pose[]): Move => ({ keys, x: 'hand', ms: 1000 })
/** Planche push-up, floating: upper arm from the straight-arm hold to u, forearms solved to keep balance; slow both ways. */
const floatRep = (body: Pose, top: Pose, u: number, down: number, up: number) =>
  rep(top, press(body, u), (f) => press(body, top[1] + (u - top[1]) * f), down, up, [0.3, 0.3])

export const MOVES: Record<string, Move> = {
  plank: { ...m([sag, hollow, reachTo((t) => line(t, -5), ARM - 0.5, D_HANDS, 0, -1, 100, 150)]), beats: holdBeats(1.6, 2) },
  scap_pu: { ...m([retract, protract]), beats: [{ hold: 0.3, dur: 1 }, { hold: 0.4, dur: 0.8 }], mode: 'cycle' },
  planche_lean: { ...m([hollow, lean, tween(hollow, lean, 1.04)]), beats: [{ hold: 0.4, dur: 2 }, { dur: 1.5 }, { hold: 0.2 }] },
  pp_pu: { x: 'hand', ...rep(lean, ppLow, (f) => tween(lean, ppLow, f), 2, 1.2) },
  tuck_planche: { ...m([tuckIn, tuck, float(set(tuckBody, [10], 100))]), beats: holdBeats(1.8, 1.5) },
  tuck_planche_pu: { x: 'hand', ...floatRep(tuckBody, tuck, -80, 2.2, 1.6) },
  adv_tuck_planche: { ...m([tuck, advTuck, float(advBody(26))]), beats: holdBeats(2, 1.5) },
  straddle_planche: solidMove([straddleIn, straddle, solidPlanche(91, { ...STR, legOut: STR.legOut + 3 })], holdBeats(1.8, 1.5), 35, { x: 'hand', point: true, tilt: 25 }),
  one_leg_planche: { ...m([advTuck, oneLeg, float(set(oneLeg, [7, 8], -86))]), beats: holdBeats(2, 1.5) },
  full_planche: { ...m([advTuck, planche, float(fullBody(4))]), beats: holdBeats(2.5, 1.5) },
  planche_pu: { x: 'hand', ...floatRep(fullBody(), planche, -82, 2.5, 1.8) },
  maltese,
}
