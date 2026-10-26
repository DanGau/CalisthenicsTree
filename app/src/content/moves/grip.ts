import type { Move, Pose } from '../../core/figure'
import { pos, reach } from './legs'
import { solve, yOf } from './frontlever'
import { body, chestPt, fgrip, fHang, fSettle, grip, hold, oa, rep, sMid } from './pull'

const BAR = -210
const frontHang = (keys: Pose[], props: Move['props'], x = 28, ms = 1400): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [x, BAR], props, ms })
const sideRings = (keys: Pose[], ms?: number, y = BAR): Move => ({ keys, x: 'hand', y: 'hand', at: [0, y], props: [{ t: 'rings', x: 0, y }], ms })

// Towels over a bar: hands close, 56 below it.
const tHang = fgrip(body(180, 180, 180, [0, 0, 0, 0], 180, 4), [17, -54], [-17, -54])
const tSqueeze = fgrip(body(180, 180, 184, [4, -2, -4, 2], 180, -2), [17, -54], [-17, -54])

// Rope 20 in front of the hips. The climber rises up it; the view follows.
// J-hook: hang, knees up, feet clamp, stand to straight legs (hands drop to the face), reach hand over hand, release.
const ROPE = 20
const onRope = (p: Pose, near: number, far: number, foot: number | null): Pose => {
  const s = pos(p, 'shoulder')
  const q = reach(p, { hand: [ROPE, s[1] + near], farHand: [ROPE, s[1] + far] })
  return foot === null ? q : reach(q, { foot: [ROPE, foot], farFoot: [ROPE, foot] })
}
type Grip = 'hand' | 'farHand' | 'foot'
/**
 * Each transition names the limb gripping the rope through it; `lift` keeps that limb fixed in the scene
 * (scene y = base - lift + limb y), and `climb` is the height gained by the time the loop returns to the first key.
 */
const rope = (keys: Pose[], beats: NonNullable<Move['beats']>, anchor: Grip[]): Move => {
  const lift = [0]
  for (let i = 0; i < keys.length; i++) {
    const a = anchor[i]
    lift.push(lift[i] + pos(keys[(i + 1) % keys.length], a)[1] - pos(keys[i], a)[1])
  }
  return {
    keys, mode: 'cycle', x: 'hand', y: 'hip', at: [8, -120], props: [{ t: 'pole', x: 8 }], floor: false, ms: 900,
    beats: beats.map((b, i) => ({ ...b, lift: lift[i] })), climb: lift[keys.length],
  }
}
const climb = [
  onRope(body(180, 180, 180, [8, 2, 10, 4]), -52, -38, null),
  onRope(body(174, 170, 176, [0, 0, 0, 0]), -50, -36, 40),
  onRope(body(182, 186, 186, [0, 0, 0, 0]), -24, -10, 72.5),
  onRope(body(180, 182, 184, [0, 0, 0, 0]), -54, -10, 72.5),
  onRope(body(180, 182, 184, [0, 0, 0, 0]), -54, -40, 72.5),
]
// Legless: hand over hand, legs together in a slight pike that swings forward on each pull.
const legless = (near: number, far: number, pike: number): Pose => {
  const p = body(178, 178, 182, [pike, pike - 8, pike, pike - 8])
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [12, s[1] + near], farHand: [12, s[1] + far] })
}

// False grip: wrist over the ring, so the hand sits higher in the palm and the ring rides at the wrist.
const fgHang = grip(body(180, 186, 182, [4, 0, 4, 0], 180, -4), [6, -50])
const fgLoose = grip(body(180, 184, 180, [2, 0, 2, 0], 180, 3), [6, -50])
const fgBody = body(186, 202, 190, [12, 4, 12, 4], 180, -2)
const fgTop = grip(fgBody, chestPt(fgBody, 0.75, 16), -1, true)

// Fingertip push-up: body one line, solved so hands and toes both touch the floor.
const pu = (u: number, f: number): Pose => {
  const mk = (t: number) => body(t, t, t - 6, [t + 180, t + 180, t + 180, t + 180]).map((v, i) => (i === 1 || i === 3 ? u : i === 2 || i === 4 ? f : v)) as Pose
  const m: Move = { keys: [], x: 'hand' }
  return mk(solve(70, 140, (t) => yOf(m, mk(t), 'hand') - yOf(m, mk(t), 'toe')))
}

// One arm: hips under the hand, free arm out for balance.
const oneArm = (t: number, legs: [number, number, number, number], sc: number): Pose => {
  const q = oa(t, -54, legs, sc)
  q[3] = -40
  q[4] = -30
  return q
}

// Ring L-sit: hands beside the hips, arms locked, legs level.
const lsit = (lean: number, legs: number): Pose => {
  const p = body(180 - lean, 172 - lean, 176, [legs, legs, legs, legs], 180, -4)
  return grip(p, [3, 8], 1, true)
}

// Cross: arms level, rings 71 out. Assisted: arms 10° up, feet on a box 73 high.
const cross: Pose = [180, 90, 90, -90, -90, 0, 0, 0, 0, 180, 180, -3]
const crossLow: Pose = [180, 100, 100, -100, -100, 0, 0, 0, 0, 180, 180, 1]
const crossRings = [{ t: 'rings', x: -71, y: BAR }, { t: 'rings', x: 71, y: BAR }] as const

const ringProps: Move['props'] = [{ t: 'rings', x: -28, y: BAR }, { t: 'rings', x: 28, y: BAR }]
const breathe: Move['beats'] = [{ hold: 1, dur: 1.4 }, { hold: 1 }]
const pushup = { mode: 'cycle' as const, keys: [pu(0, 0), pu(-100, 4)], beats: [{ hold: 0.3, dur: 1.7 }, { hold: 0.15, dur: 1 }] }

export const MOVES: Record<string, Move> = {
  ring_hang: { ...frontHang([fHang, fSettle], ringProps), beats: breathe },
  towel_hang: { ...frontHang([tHang, tSqueeze], [{ t: 'bar', x: 0, y: BAR - 56 }, { t: 'rings', x: -17, y: BAR }, { t: 'rings', x: 17, y: BAR }], 17), beats: breathe },
  rope_legs: rope(climb, [{ hold: 0.2, dur: 0.8 }, { hold: 0.1, dur: 0.9, ease: 'snap' }, { dur: 0.5, ease: 'snap' }, { dur: 0.5, ease: 'snap' }, { dur: 0.7 }], ['hand', 'foot', 'foot', 'hand', 'hand']),
  false_grip: { ...sideRings([fgLoose, fgHang], 1000), beats: [{ hold: 0.6, dur: 1, ease: 'out' }, { hold: 1.2 }] },
  fingertip_pu: { ...pushup, x: 'hand', ms: 900 },
  rope_legless: rope([legless(-52, -22, 22), legless(-22, 8, 30), legless(-22, -52, 22), legless(8, -22, 30)], [{ dur: 1 }, { dur: 0.5, ease: 'snap' }, { dur: 1 }, { dur: 0.5, ease: 'snap' }], ['hand', 'hand', 'farHand', 'farHand']),
  false_grip_pullup: { ...sideRings([]), ...rep(fgLoose, fgHang, [sMid, fgTop]) },
  oa_hang: { ...frontHang([oneArm(192, [6, 6, 8, 4], 3), oneArm(190, [4, 2, 8, 6], -3)], [{ t: 'bar', x: 0, y: BAR }], 3), beats: breathe },
  ring_lsit: { ...sideRings([], 1000, -120), ...hold(lsit(4, 78), lsit(5, 90), lsit(6, 93)) },
  cross_assist: { ...frontHang([crossLow, cross], [...crossRings, { t: 'box', x: -25, w: 50, h: 73 }], 71, 1100), beats: [{ hold: 0.6, dur: 1.6 }, { hold: 1.2 }] },
  iron_cross: { ...frontHang([[180, 86, 86, -86, -86, 2, -2, -2, 2, 180, 180, 1], cross, [180, 90, 90, -90, -90, -2, 2, 2, -2, 180, 180, -4]], [...crossRings], 71, 1100), beats: [{ hold: 0.2, dur: 1, ease: 'out' }, { hold: 0.8, dur: 1.3 }, { hold: 1 }] },
}
