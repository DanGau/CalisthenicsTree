import { joints, LEN, type Move, type Pose } from '../../core/figure'

const D = 180 / Math.PI
const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180
/** Pose angle of the direction (dx, dy), y down. */
export const ang = (dx: number, dy: number) => Math.atan2(dx, dy) * D

type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
const SLOT: Record<Limb, number> = { hand: 1, farHand: 3, foot: 5, farFoot: 7 }

/** Contact heights above the floor: palm centre, ankle over a flat foot, knee over tucked toes, spine lying down. */
export const H = { hand: 4, ankle: 5, knee: 5, lie: 11 }
/** Shin of a kneeling leg: back along the floor, toes tucked, knee H.knee up. */
export const KNEEL = -100

/** World point [x, height above floor] of a joint, with the hip at world `hip`. */
export function where(p: Pose, hip: [number, number], j: keyof ReturnType<typeof joints>, front = false): [number, number] {
  const b = joints(p, front)[j]
  return [hip[0] + b.x, hip[1] - b.y]
}

/** Hip at world `hip`; each limb end reaches its world point. k: elbows default back (-1), knees forward (1). */
export function put(p: Pose, hip: [number, number], to: Partial<Record<Limb, [number, number]>>, k: Partial<Record<Limb, number>> = {}, front = false): Pose {
  const out = [...p] as Pose
  const b = joints(p, front)
  for (const [l, [x, h]] of Object.entries(to) as [Limb, [number, number]][]) {
    const i = SLOT[l]
    const isArm = i < 5
    const root = b[isArm ? (l === 'hand' ? 'nearShoulder' : 'farShoulder') : l === 'foot' ? 'nearHip' : 'farHip']
    const [a, c] = isArm ? [LEN.upper, LEN.fore] : [LEN.thigh, LEN.shin]
    const dx = x - hip[0] - root.x
    const dy = hip[1] - h - root.y
    const d = Math.max(Math.abs(a - c) + 0.01, Math.min(Math.hypot(dx, dy), a + c - 0.01))
    const A = Math.acos((a * a + d * d - c * c) / (2 * a * d)) * D
    const raw = ang(dx, dy) + (k[l] ?? (isArm ? -1 : 1)) * A
    const u = p[i]! + wrap(raw - p[i]!)
    const lo = ang(dx - Math.sin(u / D) * a, dy - Math.cos(u / D) * a)
    out[i] = u
    out[i + 1] = u + wrap(lo - u)
  }
  return out
}

/** All fours, knee at world x 0: thigh angle, spine and head; hands planted at x 43. */
const quad = (thigh: number, t: number, c: number, head: number, far?: [number, number]): Pose => {
  const hip: [number, number] = [-Math.sin(thigh / D) * LEN.thigh, H.knee + Math.cos(thigh / D) * LEN.thigh]
  const p: Pose = [t, 0, 0, far?.[0] ?? 0, far?.[1] ?? 0, thigh, KNEEL, thigh, KNEEL, c, head]
  return put(p, hip, far ? { hand: [43, H.hand] } : { hand: [43, H.hand], farHand: [43, H.hand] })
}
// Thread the needle: far hand slides under the chest along the floor.
const thread = (() => {
  const p = quad(0, 107, 96, 40, [0, 0])
  return put(p, [0, 43], { farHand: [6, H.hand + 2] }, { farHand: 1 })
})()
const kneePin = { x: 'knee' as const, at: [0, 0] as [number, number] }

/** Squat with the ankles at world x 0 and the hip at [x, height]. */
const squat = (hip: [number, number], t: number, c: number, arms: [number, number, number, number]): Pose =>
  put([t, ...arms, 0, 0, 0, 0, c, c + 15], hip, { foot: [0, H.ankle], farFoot: [0, H.ankle] })

const stand: Pose = [180, 2, 4, -2, -4, 0, 0, 0, 0]
// Hands on the hips: elbows out behind.
const hipsHands = (p: Pose): Pose => put(p, [0, 81], { hand: [6, 103], farHand: [6, 103] }, { hand: 1, farHand: 1 })

// Knee to wall: front foot at x 0, rear knee down at x -34; the hip rides the rear thigh forward.
const kneeToWall = (hx: number): Pose => {
  const hy = H.knee + Math.sqrt(LEN.thigh ** 2 - (hx + 34) ** 2)
  const p: Pose = [178, 0, 0, 0, 0, 0, 0, ang(-34 - hx, hy - H.knee), KNEEL, 176]
  return put(put(p, [hx, hy], { foot: [0, H.ankle] }), [hx, hy], { hand: [WALL - 4, 100], farHand: [WALL - 4, 100] })
}
const WALL = 30

// Couch stretch: near (rear) knee in the corner at x 5, shin up the wall; front foot planted at x 56.
const couch = (thigh: number, t: number, c: number): Pose => {
  const hip: [number, number] = [5 - Math.sin(thigh / D) * LEN.thigh, 4 + Math.cos(thigh / D) * LEN.thigh]
  const p: Pose = [t, 0, 0, 0, 0, thigh, 180, 0, 0, c]
  return put(put(p, hip, { farFoot: [56, H.ankle] }), hip, { hand: [42, 50], farHand: [44, 50] })
}

// 90/90 (front view): both knees fall to one side, feet tucked in, hands clasped at the chest.
const chestHands: [number, number, number, number] = [20, -100, -20, 100]
// Thighs unwrap so the knees sweep over the top from one side to the other.
const knees9090: [Pose, Pose, Pose] = [
  [176, ...chestHands, -84, 84, -84, 84],
  [180, ...chestHands, -160, -10, -200, 10],
  [184, ...chestHands, -276, -84, -276, -84],
]

// Shinbox: rear (far) foot fixed; the hip rises over the rear knee to a tall kneel.
const box = (rear: number, front: [number, number], t: number): Pose => [t, 80, 100, 80, 100, front[0], front[1], rear, KNEEL, t - 5]

// Toe squat: kneel on tucked toes, then sit back onto the heels.
const toeKneel: Pose = [180, 10, 10, 10, 10, 0, -102, 0, -102]
const toeSit: Pose = [178, 30, 60, 30, 60, 62, -102, 62, -102]

// Sit-to-rise: ankles crossed at x 0 stay put; seated, rocked onto the feet, standing.
const seated = squat([-26, 10], 175, 175, [60, 90, 60, 90])
const rocked = squat([-12, 26], 135, 145, [80, 90, 80, 90])

// Overhead squat: stick locked over mid-foot (x 4).
const ohsTop = put([180, 180, 180, 180, 180, 0, 0, 0, 0], [0, 81], { hand: [4, 183], farHand: [4, 183] }, { hand: 1, farHand: 1 })
const ohsBottom = (() => {
  const p = squat([-14, 22], 157, 165, [170, 170, 170, 170])
  const [sx, sy] = where(p, [-14, 22], 'shoulder')
  return put(p, [-14, 22], { hand: [4, sy + Math.sqrt(53.5 ** 2 - (4 - sx) ** 2)], farHand: [4, sy + Math.sqrt(53.5 ** 2 - (4 - sx) ** 2)] }, { hand: 1, farHand: 1 })
})()

export const MOVES: Record<string, Move> = {
  // Rock the shoulders forward past the wrists and back, hands planted.
  wrist_prep: { keys: [quad(21, 110, 110, 95), quad(0, 109, 109, 100), quad(-17, 110, 110, 105)], ...kneePin, ms: 1100 },
  deep_squat: { keys: [squat([-9, 19], 145, 155, [35, 90, 35, 90]), squat([-10, 16], 148, 160, [38, 95, 38, 95])], x: 'foot', ms: 1600 },
  // Only the hip moves: knee up, out, back, down; the torso never leans.
  hip_cars: {
    keys: [
      hipsHands([180, 0, 0, 0, 0, 0, 0, 5, -5]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, 110, 15]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, 60, -60]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, -35, -115]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, -10, -30]),
    ],
    mode: 'cycle', x: 'foot', ms: 1100,
  },
  // Heel stays down while the knee drives over the toes to touch the wall.
  ankle_df: { keys: [kneeToWall(-24), kneeToWall(-12)], x: 'foot', props: [{ t: 'wall', x: WALL }], ms: 1100 },
  shoulder_cars: {
    keys: [stand, [180, 90, 90, -2, -4, 0, 0, 0, 0], [180, 180, 180, -2, -4, 0, 0, 0, 0], [180, 270, 270, -2, -4, 0, 0, 0, 0], [180, 360, 362, -2, -4, 0, 0, 0, 0]],
    mode: 'cycle', ms: 1000,
  },
  // From leaning forward to tall: pelvis tucks, hip pushes forward over the rear knee.
  couch: { keys: [couch(2, 160, 162), couch(-20, 188, 178)], x: 'knee', at: [5, 0], props: [{ t: 'wall', x: -12 }], ms: 1500 },
  pigeon_9090: { keys: knees9090, front: true, ms: 1200 },
  // Thread the needle: far hand slides under the chest, then opens to the ceiling; eyes follow it.
  thoracic: { keys: [thread, quad(0, 107, 112, 170, [180, 180])], ...kneePin, ms: 1400 },
  // Cat-cow, head leading each wave.
  spinal_waves: {
    keys: [quad(0, 107, 107, 100), quad(0, 107, 107, 40), quad(0, 135, 85, 30), quad(0, 120, 100, 150), quad(0, 92, 125, 165)],
    mode: 'cycle', ...kneePin, ms: 1000,
  },
  shinbox: {
    keys: [box(-84, [84, KNEEL], 182), box(-45, [40, KNEEL], 178), box(0, [0, KNEEL], 180)],
    x: 'farFoot', at: [-40, 0], ms: 1200,
  },
  dislocates: {
    keys: [[180, 25, 25, 25, 25, 0, 0, 0, 0], [180, 180, 180, 180, 180, 0, 0, 0, 0], [180, 330, 330, 330, 330, 0, 0, 0, 0]],
    ms: 1200,
  },
  toes: { keys: [toeKneel, toeSit], x: 'knee', ms: 1400 },
  sit_rise: { keys: [seated, rocked, [180, 30, 60, 30, 60, 0, 0, 0, 0]], x: 'foot', ms: 1100 },
  overhead_squat: { keys: [ohsTop, ohsBottom], x: 'foot', ms: 1300 },
}
