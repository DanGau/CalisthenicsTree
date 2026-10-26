import type { Move, Pose } from '../../core/figure'
import { pos, reach } from './legs'
import { solve, yOf } from './frontlever'
import { active, body, chestPt, fgrip, fHang, grip, passive } from './pull'

const BAR = -210
const frontHang = (keys: Pose[], props: Move['props'], x = 28, ms = 1400): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [x, BAR], props, ms })
const sideRings = (keys: Pose[], ms?: number, y = BAR): Move => ({ keys, x: 'hand', y: 'hand', at: [0, y], props: [{ t: 'rings', x: 0, y }], ms })
const settle = fgrip(body(180, 180, 182, [3, -3, -2, 2]), [28, -52.8], [-28, -52.8])

// Towels over a bar: hands close, 56 below it.
const tHang = fgrip(body(180, 180, 180, [0, 0, 0, 0]), [17, -54], [-17, -54])
const tSqueeze = fgrip(body(180, 180, 184, [4, -2, -4, 2]), [17, -54], [-17, -54])

// Rope 20 in front of the hips; feet clamp it below. Reach in: knees up, arms long. Stand: legs locked, hands at the face.
const ROPE = 20
const onRope = (p: Pose, hand: number, foot: number | null, k = 1): Pose => {
  const s = pos(p, 'shoulder')
  const q = reach(p, { hand: [ROPE, s[1] + hand], farHand: [ROPE, s[1] + hand + 14] })
  return foot === null ? q : reach(q, { foot: [ROPE, foot], farFoot: [ROPE, foot] }, { k: { foot: k, farFoot: k } })
}
const rope = (keys: Pose[], y: 'foot' | 'hand'): Move => ({ keys, x: 'hand', y, at: [8, y === 'foot' ? -50 : -200], props: [{ t: 'pole', x: 8 }], ms: 1100 })
const reachUp = onRope(body(172, 166, 176, [0, 0, 0, 0]), -52, 40)
const standUp = onRope(body(182, 186, 186, [0, 0, 0, 0]), -24, 72.5)
// Legless: hand over hand, legs together in a slight pike.
const legless = (near: number, far: number): Pose => {
  const p = body(178, 178, 182, [22, 14, 22, 14])
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [12, s[1] + near], farHand: [12, s[1] + far] })
}

// False grip: wrist over the ring, so the hand sits higher in the palm and the ring rides at the wrist.
const fgHang = grip(body(180, 186, 182, [4, 0, 4, 0]), [6, -50])
const fgBody = body(186, 202, 190, [12, 4, 12, 4])
const fgTop = grip(fgBody, chestPt(fgBody, 0.75, 16), -1, true)

// Fingertip push-up: body one line, solved so hands and toes both touch the floor.
const pu = (u: number, f: number): Pose => {
  const mk = (t: number) => body(t, t, t - 6, [t + 180, t + 180, t + 180, t + 180]).map((v, i) => (i === 1 || i === 3 ? u : i === 2 || i === 4 ? f : v)) as Pose
  const m: Move = { keys: [], x: 'hand' }
  return mk(solve(70, 140, (t) => yOf(m, mk(t), 'hand') - yOf(m, mk(t), 'toe')))
}

// One arm: hand over the near shoulder, free arm out for balance.
const oneArm = (p: Pose): Pose => {
  const q = reach(p, { hand: [...pos(p, 'shoulder', true)].map((v, i) => v + [17, -54][i]) as [number, number] }, { front: true })
  q[3] = -40
  q[4] = -30
  return q
}

// Ring L-sit: hands beside the hips, arms locked, legs level.
const lsit = (lean: number, legs: number): Pose => {
  const p = body(180 - lean, 172 - lean, 176, [legs, legs, legs, legs])
  return grip(p, [3, 8], 1, true)
}

// Cross: arms level, rings 71 out. Assisted: arms 10° up, feet on a box 73 high.
const cross: Pose = [180, 90, 90, -90, -90, 0, 0, 0, 0]
const crossLow: Pose = [180, 100, 100, -100, -100, 0, 0, 0, 0]
const crossRings = [{ t: 'rings', x: -71, y: BAR }, { t: 'rings', x: 71, y: BAR }] as const

export const MOVES: Record<string, Move> = {
  ring_hang: frontHang([fHang, settle], [{ t: 'rings', x: -28, y: BAR }, { t: 'rings', x: 28, y: BAR }]),
  towel_hang: frontHang([tHang, tSqueeze], [{ t: 'bar', x: 0, y: BAR - 56 }, { t: 'rings', x: -17, y: BAR }, { t: 'rings', x: 17, y: BAR }], 17),
  rope_legs: rope([reachUp, standUp], 'foot'),
  false_grip: sideRings([passive.map((v, i) => (i >= 1 && i <= 4 ? 176 : v)) as Pose, fgHang], 1400),
  fingertip_pu: { keys: [pu(0, 0), pu(-100, 4)], x: 'hand', ms: 1000 },
  rope_legless: rope([legless(-50, -20), legless(-20, -50)], 'hand'),
  false_grip_pullup: sideRings([fgHang, active, grip(body(186, 196, 186, [10, 2, 10, 2]), [16, -28]), fgTop]),
  oa_hang: frontHang([oneArm(body(178, 178, 176, [0, 0, 2, -2])), oneArm(body(176, 176, 180, [2, -2, 4, -4]))], [{ t: 'bar', x: 0, y: BAR }], 28),
  ring_lsit: sideRings([lsit(4, 80), lsit(6, 90)], 1200, -120),
  cross_assist: frontHang([crossLow, cross], [...crossRings, { t: 'box', x: -25, w: 50, h: 73 }], 71, 1300),
  iron_cross: frontHang([[180, 86, 86, -86, -86, 2, -2, -2, 2], cross], [...crossRings], 71, 1300),
}
