import { place, RUNG, type Body, type Move, type Pose, type Stage } from '../../core/figure'
import { add3, b3, body, fit, grip3, hold, onBar, rep, type V3, p3, pinned3, reach3, solid3, twoHands3, type K3 } from './pull'

// Pole flags, solid, chest 30 off facing the viewer. Built standing (z = near side), then rolled 90 so the near side
// is up: the body lies level, head to the pole. Both straight arms swing out 157, a "<" whose hands stack 76 apart on
// the pole (top hand pulls, bottom hand pushes).
const CAM = 60
type Legs = [number, number, number, number]
const stand = (legs: Legs): Pose => [180, 0, 0, 0, 0, ...legs, 180, 180]
/** `out`: legs straddle; `lift`: both legs swing toward the near side (up when level). */
const flagK = (legs: Legs, roll = 90, out = 0, lift = 0): K3 => ({ p: stand(legs), s: { roll, armOut: 157, farArmOut: 157, legOut: out + lift, farLegOut: out - lift } })
const pole = (m: { keys: K3[]; beats: Move['beats']; mode?: Move['mode'] }, ref: K3, y = -150): Move =>
  pinned3({ ...solid3(m, CAM), x: 'hand', y: 'hand', at: [0, y], props: [{ t: 'pole', x: 0 }], ms: 1000 }, twoHands3(ref))
const TUCK: Legs = [125, -15, 125, -15]
const LINE: Legs = [0, 0, 0, 0]
/** Settle from a droop (body tipped, hips sagging) into the flag, then squeeze the feet a touch higher. */
const flagHold = (legs: Legs, out = 0): Move => pole(hold(flagK(legs, 82, out, -10), flagK(legs, 90, out), flagK(legs, 90, out, 3)), flagK(LINE))
/** Flag raise path, solved from the flag down to vertical so each arm keeps one shape: the body rolls about the hands. */
const raise = (() => {
  const b = flagK(LINE)
  const hb = p3(b, 'hand')
  const ha: V3 = [10, -4, -28]
  const out: K3[] = [b]
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const h: V3 = [hb[0] + (ha[0] - hb[0]) * f, hb[1] + (ha[1] - hb[1]) * f, hb[2] + (ha[2] - hb[2]) * f]
    const prev = out[out.length - 1]
    out.push(reach3({ p: prev.p, s: { ...prev.s, roll: 90 + 90 * f } }, { hand: h, farHand: add3(h, [0, 76, 0]) }))
  }
  return out.reverse()
})()
// Vertical flag: rolled upside down, legs up, the pole just in front of the top (near) shoulder; top hand by the
// hips, the bottom arm reaches across to it past the head.
const vertical = (roll = 180): K3 => reach3({ p: raise[0].p, s: { ...raise[0].s, roll } }, { hand: [10, -4, -28], farHand: [10, 72, -28] })
// Clutch flag: the bottom (far) elbow jams into the hip, forearm forward to the pole in front of the waist; the
// straight top arm reaches down across the chest to it. The body lies level across the pole on that arm.
const clutch = (legs: Legs, roll = 90): K3 => {
  const k: K3 = { p: [180, 0, 0, 0, 90, ...legs, 180, 180], s: { roll } }
  return reach3(k, { hand: add3(p3(k, 'farHand'), [0, -72, 0]) }, ['hand'])
}

// Stall bar flag support: the same "<" arms, the body rolled only 37-40 so it hangs diagonally off the ladder,
// top hand on rung 13, bottom hand 4 rungs lower and 58 along it (the jump: 5 rungs, 20 along, to reach the flag).
// The ladder runs away from the head.
const LOW: V3 = [0, 52, -58]
const JUMP: V3 = [0, 65, -20]
const onRungs = (k: K3, low: V3): K3 => reach3(k, { hand: p3(k, 'hand'), farHand: add3(p3(k, 'hand'), low) })
const ladder = (m: { keys: K3[]; beats: Move['beats']; mode?: Move['mode'] }, low: V3): Move =>
  pinned3({ ...solid3(m, CAM), x: 'hand', y: 'hand', at: [0, RUNG(13)], props: [{ t: 'stall', x: 0, wall: -1, z: -72 }], ms: 1000 }, twoHands3(onRungs(flagK(LINE, 40), low)))
const sup = (roll: number, legs: Legs = LINE, low = LOW): K3 => onRungs(flagK(legs, roll), low)
const BENT: Legs = [30, -10, 30, -10]
const J = (roll: number, legs: Legs = LINE) => sup(roll, legs, JUMP)
// Side plank, solid, chest 20 off facing the viewer: standing pose rolled onto the far side, turned to lie along x.
// The fit sets the roll and the bottom (far) arm: elbow under the shoulder on the floor, forearm flat ahead of it,
// and `rest` (feet, or the top knee or ankle on a bench) where it belongs.
type Rest = (b: Body, floor: number) => number[]
const plank = (legs: Legs, s: Partial<Stage>, rest: Rest): K3 => fit({ p: [180, 8, 8, 0, 110, ...legs, 180, 180], s: { roll: 72, farArmOut: 34, ...s, turn: 90 } }, ['roll', 3, 4, 'farArmOut', 'farForeOut'], (q) => {
  const b = b3(q)
  const floor = b.farHand.y + 4
  return [3 * (b.farElbow.y + 5 - floor), b.farHand.x - b.farElbow.x - 22, b.farHand.z! - b.farElbow.z!, (b.farElbow.x - b.farShoulder.x) * 0.5, (b.farElbow.z! - b.farShoulder.z!) * 0.5, ...rest(b, floor)]
})
const feet: Rest = (b, floor) => [Math.max(b.farToe.y, b.farHeel.y) - floor]
// Hips sag: the legs swing up from the trunk (toward the near side), the trunk rolls lower.
const sag = (d: number): Partial<Stage> => ({ legOut: d, farLegOut: -d })
// Copenhagen: the top (near) knee (short) or ankle (long) rests on a bench. Up: one straight line, bottom
// leg squeezed up to the bench. Down: hips sag, the bottom leg drops and bends, foot just off the floor.
const copen = (long: boolean, lifted: boolean, bench = 34): K3 => {
  const legs: Legs = [0, long ? 0 : -90, lifted ? 0 : 45, lifted ? 0 : -60]
  return plank(legs, { roll: 86, ...(lifted ? { legOut: 0, farLegOut: -4 } : { legOut: 8, farLegOut: long ? 10 : 2 }) }, (b, floor) => [2 * (rest(b, long) - (floor - bench))])
}
const rest = (b: Body, long: boolean) => (long ? b.foot.y + 4 : b.knee.y + 6)
const copenMove = (long: boolean): Move => {
  const k = copen(long, true)
  const b = b3(k)
  const h = b.farHand.y + 4 - rest(b, long)
  const p = place({ ...side, keys: [], view: 0 }, k.p, k.s)
  const [x0, x1] = long ? [p.foot.x, p.toe.x] : [p.knee.x, p.foot.x]
  return {
    ...side, ...solid3({ keys: [copen(long, false, h), k], beats: [{ hold: 0.3, dur: 1, ease: 'out' }, { hold: 1, dur: 1.6 }] }, SIDE), mode: 'cycle',
    props: [{ t: 'box', x: Math.min(x0, x1) - 14, w: Math.abs(x1 - x0) + 28, h }],
  }
}
const SIDE = -20
const side: Move = { keys: [], solid: true, x: 'farHand', y: 'farHand', at: [0, -4], ms: 1000 }

// Oblique raise, solid, seen 70 off the side: from a hang the knees drive up and across to one side, the pelvis
// tipping up that side, then the other.
const hang = grip3(body(180, 180, 180, [0, 0, 0, 0], 180, -3), {}, [0, -51, 28], [0, -51, -28])
const oblique = (d: number): K3 => grip3(body(186, 180, 180, [120, 20, 120, 20], 180, -4), { legOut: 38 * d, farLegOut: -38 * d, roll: 8 * d }, [0, -51, 28], [0, -51, -28])

export const MOVES: Record<string, Move> = {
  side_plank: { ...side, ...solid3({ keys: [plank(LINE, sag(14), feet), plank(LINE, {}, feet)], beats: [{ hold: 0.6, dur: 1.5 }, { hold: 2 }] }, SIDE) },
  copen_short: copenMove(false),
  copen_long: copenMove(true),
  vertical_flag: pole(hold(vertical(174), vertical(), vertical(182)), vertical(), -120),
  oblique_raise: { ...onBar({ keys: [hang, oblique(1), hang, oblique(-1)], mode: 'cycle', beats: [{ hold: 0.3, dur: 1 }, { hold: 0.3, dur: 1.5 }, { hold: 0.3, dur: 1 }, { hold: 0.3, dur: 1.5 }] }, { view: 70 }), balance: true },
  tuck_flag: flagHold(TUCK),
  clutch_flag: pole(hold(clutch(TUCK, 80), clutch(LINE), clutch(LINE, 93)), clutch(LINE)),
  straddle_flag: flagHold(LINE, 32),
  full_flag: flagHold(LINE),
  flag_support: ladder({ keys: [sup(37), sup(40), sup(41)], beats: [{ hold: 0.5, dur: 1.2, ease: 'out' }, { hold: 1.5, dur: 1.5 }, { hold: 1.5, dur: 1.2 }], mode: 'cycle' }, LOW),
  flag_jump: ladder({ keys: [J(37), J(35, BENT), J(82, TUCK), J(84, TUCK), J(60), J(37)], mode: 'cycle',
    beats: [{ hold: 0.4, dur: 0.8, ease: 'out' }, { hold: 0.1, dur: 0.45, ease: 'snap' }, { dur: 0.3, ease: 'out' }, { hold: 0.8, dur: 1.2 }, { dur: 1.2, ease: 'out' }, { hold: 0.4, dur: 0.6 }] }, JUMP),
  flag_raise: pole({ ...rep(raise[0], null, raise.slice(1), { rise: 2.5, lower: 1.7, top: 0.6, bottom: 0.4 }) }, flagK(LINE)),
}
