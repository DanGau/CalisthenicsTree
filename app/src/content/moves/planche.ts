import { joints, place, type Move, type Pose, type Prop } from '../../core/figure'
import { reach } from './legs'
import { balance, bent, fit, handOf, holdBeats, line, reachTo, rep, set, straight, tween } from './push'

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
 * Front view from slightly above: the back rises behind the head (hips level with the shoulders) and straight legs fan out `a`
 * from down. Hands `span` apart, both arms straight; `shift` moves the body toward the near hand.
 */
function facing(a: number, span: number, shift = 0): Pose {
  const p: Pose = [180, 0, 0, 0, 0, a, a, -a, -a, 0, 180, D]
  const b = joints(p, true)
  const s = Math.sign(b.nearShoulder.x - b.farShoulder.x)
  const w = span / 2 - 17
  const y = b.shoulder.y + Math.sqrt((ARM - 0.4) ** 2 - (w + Math.abs(shift)) ** 2)
  return reach(p, { hand: [b.nearShoulder.x + s * (w - shift), y], farHand: [b.farShoulder.x - s * (w + shift), y] }, { front: true, k: { hand: s, farHand: -s } })
}
// Straddle, front view: toes leave the floor, the legs fan up level.
const STR = 40
// Maltese, front view on parallettes: arms spread wide, chest low.
const MAL = { span: 128, y: -26 }
const maltese = (a: number, head = 180): Pose => set(facing(a, MAL.span), [10], head)
const parallettes = (m: Move): Prop[] => {
  const b = place(m, m.keys[0])
  return [b.hand, b.farHand].map((h) => ({ t: 'bars', x: Math.round(h.x), y: Math.round(h.y) }))
}
const front = (keys: Pose[], beats = holdBeats(2, 1.5)): Move => ({ keys, front: true, x: 'hand', ms: 1000, beats })

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
  straddle_planche: front([facing(STR + 8, 40), facing(84, 40), facing(80, 40, 2)]),
  one_leg_planche: { ...m([advTuck, oneLeg, float(set(oneLeg, [7, 8], -86))]), beats: holdBeats(2, 1.5) },
  full_planche: { ...m([advTuck, planche, float(fullBody(4))]), beats: holdBeats(2.5, 1.5) },
  planche_pu: { x: 'hand', ...floatRep(fullBody(), planche, -82, 2.5, 1.8) },
  maltese: (() => {
    const mv: Move = { ...front([maltese(96, 176), maltese(101)], [{ hold: 0.4, dur: 1.5 }, { hold: 0.3 }]), y: 'hand', at: [0, MAL.y] }
    return { ...mv, props: parallettes(mv) }
  })(),
}
