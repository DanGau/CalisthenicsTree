import { joints, type Beat, type Body, type Move, type Pose, type Prop } from '../../core/figure'
import { fig, type Key, sampled } from './hips'
import { H } from './mobility'
import { balance, bent, solve, com3, world, fit, fit3, handOf, holdBeats, type Key3, line, reachTo, rep, set, solidMove, straight, tween } from './push'

const ARM = 54

// Plank family: hands fixed, toes on the floor. Hollow = upper back rounded (chest below the torso line).
const hollow = straight((t) => line(t, -8), 0)
const D_HANDS = handOf(hollow).x
const sag = reachTo((t) => line(t, 9, -4, 10), ARM - 0.5, D_HANDS, 0, -1, 100, 150)
/**
 * Scap push-up key: hands and toes fixed, arms locked, body a straight plank; the shoulders slide `q` round the
 * ribs (`protract`), so the trunk rises between the blades (+) or sinks between them (-) instead of turning.
 */
const scap = (q: number, bend: number): [Pose, Beat] => {
  const hand = (b: Body) => ({ x: b.toe.x + D_HANDS, y: b.toe.y })
  const at = (t: number) => joints(line(t, bend), false, false, 1, 1, 1, q)
  const t = solve((t) => { const b = at(t); return Math.hypot(b.shoulder.x - hand(b).x, b.shoulder.y - hand(b).y) - (ARM - 0.5) }, 100, 150)
  const b = at(t)
  const u = (Math.atan2(hand(b).x - b.shoulder.x, hand(b).y - b.shoulder.y) * 180) / Math.PI
  return [set(set(line(t, bend), [1, 3], u), [2, 4], u), { protract: q }]
}
const [protract, retract] = [scap(6, -3), scap(-5, 2)]

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
  const build = ([u, a]: number[]): Key3 => ({ p: [t, u, u, u, u, legs, legs, legs, legs, t - 6, t + (o.head ?? 16), D], st: { armOut: a, farArmOut: a, legOut: o.legOut, farLegOut: o.legOut } })
  // Arms as wide as asked, narrower only when the hands can't otherwise reach back under the centre of mass.
  return fit3(build, [-60, o.armOut], (b, [, a]) => [com3(b).x - b.hand.x, 0.05 * (a - o.armOut)])
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
  return { ...mv, props: parallettes(mv), balance: true }
})()

/** Seconds per beat unit. */
const m = (keys: Pose[]): Move => ({ keys, x: 'hand', ms: 1000 })
/** Planche push-up, floating: upper arm from the straight-arm hold to u, forearms solved to keep balance; slow both ways. */
const floatRep = (body: Pose, top: Pose, u: number, down: number, up: number) =>
  rep(top, press(body, u), (f) => press(body, top[1] + (u - top[1]) * f), down, up, [0.3, 0.3])

// Spider-Man hold: straight-arm plank, hips level; one knee draws up outside its arm to the elbow and holds.
// `u` 0 plank, ±1 near or far knee up, past ±1 a breath.
const SPIDER = (u: number, prev?: Key): Key => {
  const [s, e] = [Math.sign(u), Math.min(Math.abs(u), 1)]
  const b = Math.max(0, Math.abs(u) - 1) / 0.04
  const toe = (z: number): [number, number, number] => [-66, 13, z]
  const up: [number, number, number] = [2 - 68 * (1 - e), 13 + 14 * e + 14 * Math.sin(Math.PI * e), 10 + 22 * e]
  const leg = (side: number) => (side === s && e > 0 ? { end: [up[0], up[1], side * up[2]] as [number, number, number], pole: [1, 0.2, side] as [number, number, number] } : { end: toe(side * 10), pole: [0, 1, 0] as [number, number, number] })
  return fig([100, 0, 0, 0, 0, 0, 0, 0, 0, 100 - b, 110], [0, 49], {
    hand: { end: [45, H.hand, 18], pole: [-1, 0, 0.3] }, farHand: { end: [45, H.hand, -18], pole: [-1, 0, -0.3] },
    foot: leg(1), farFoot: leg(-1),
  }, {}, prev)
}

export const MOVES: Record<string, Move> = {
  plank: { ...m([sag, hollow, reachTo((t) => line(t, -5), ARM - 0.5, D_HANDS, 0, -1, 100, 150)]), beats: holdBeats(1.6, 2) },
  scap_pu: { ...m([retract[0], protract[0]]), beats: [{ ...retract[1], hold: 0.3, dur: 1 }, { ...protract[1], hold: 0.4, dur: 0.8 }], mode: 'cycle' },
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
  spiderman_hold: {
    ...sampled([{ u: 0, sec: 0.6 }, { u: 1, sec: 1 }, { u: 1.04, sec: 2 }, { u: 1, sec: 2 }, { u: 0, sec: 0.9 }, { u: 0, sec: 0.6 }, { u: -1, sec: 1 }, { u: -1.04, sec: 2 }, { u: -1, sec: 2 }, { u: 0, sec: 0.9 }], SPIDER),
    x: 'hip', y: 'hip', at: [0, 0], solid: true, view: 25, tilt: 8,
  },
}
