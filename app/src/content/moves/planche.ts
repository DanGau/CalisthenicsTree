import type { Move, Pose } from '../../core/figure'
import { balance, bent, fit, handOf, line, reachTo, set, straight } from './push'

const ARM = 54

// Plank family: hands fixed, toes on the floor. Hollow = upper back rounded (chest below the torso line).
const hollow = straight((t) => line(t, -8), 0)
const D = handOf(hollow).x
const sag = reachTo((t) => line(t, 9, -4, 10), ARM - 0.5, D, 0, -1, 100, 150)
const protract = reachTo((t) => line(t, -12), ARM - 0.5, D, 0, -1, 100, 150)
const retract = reachTo((t) => line(t, 5, 0, 5), ARM - 0.5, D, 0, -1, 100, 150)

// Lean: shoulders travel past the hands, the feet roll onto the toes.
const lean = straight((t) => line(t, -10), -24)
const ppLow = bent((t) => line(t, -2), 17, handOf(lean).x)

/** Straight arms at angle u with the centre of mass over the hands. */
const float = (body: Pose) => balance((u) => set(set(body, [1, 3], u), [2, 4], u), -75, 20)
/** Bent arms (upper arm at u) with the forearm solved to balance. */
const press = (body: Pose, u: number) => balance((f) => set(set(body, [1, 3], u), [2, 4], f), -60, 60)

// Tuck: back rounded, knees to the chest, gaze forward.
const tuckBody: Pose = [104, 0, 0, 0, 0, 62, -112, 62, -112, 62, 95]
const tuck = float(tuckBody)
// Entry: same tuck with the toes still on the floor and less lean.
const tuckIn = fit((s) => set(set(tuckBody, [1, 2, 3, 4], -12), [6, 8], s), (b) => b.hand.y - b.toe.y, -10, -120)
const tuckLow = press(tuckBody, -80)
const advTuck = float([92, 0, 0, 0, 0, 32, -112, 32, -112, 90, 115])
const straddle = float([93, 0, 0, 0, 0, -84, -84, -96, -96, 88, 110])
const oneLeg = float([92, 0, 0, 0, 0, 32, -112, -92, -92, 89, 112])
const fullBody: Pose = [92, 0, 0, 0, 0, -91, -91, -91, -91, 86, 108]
const planche = float(fullBody)
const plancheLow = press(fullBody, -82)
// Maltese: arms out wide, so side-on the hands sit by the hips and the chest skims the floor.
const maltese = set(set([90, 0, 0, 0, 0, -90, -90, -90, -90, 87, 108], [1, 3], -66), [2, 4], -66)

const m = (keys: Pose[], ms?: number): Move => ({ keys, x: 'hand', ms })

export const MOVES: Record<string, Move> = {
  plank: m([sag, hollow], 1300),
  scap_pu: m([retract, protract], 800),
  planche_lean: m([hollow, lean], 1200),
  pp_pu: m([lean, ppLow]),
  tuck_planche: m([tuckIn, tuck], 1100),
  tuck_planche_pu: m([tuck, tuckLow]),
  adv_tuck_planche: m([tuck, advTuck], 1100),
  straddle_planche: m([advTuck, straddle], 1200),
  one_leg_planche: m([advTuck, oneLeg], 1200),
  full_planche: m([advTuck, planche], 1200),
  planche_pu: m([planche, plancheLow]),
  maltese: m([planche, maltese], 1300),
}
