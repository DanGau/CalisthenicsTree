import { blend, joints, LEN, type Beat, type Move, type Pose, type Stage } from '../../core/figure'

const D = 180 / Math.PI

/**
 * A stretch on the breath: ease in through `path` to its last key, sink there on the exhale,
 * hold, release a little on the inhale (`release`, default a 30% blend back), sink again, then come out.
 * `stages`: per `path` key (lift, turn, trunk); the release lerps them too.
 */
export function breathe(path: Pose[], ms = 900, release?: Pose, stages: Partial<Stage>[] = []): Pick<Move, 'keys' | 'mode' | 'beats' | 'ms'> {
  const n = path.length
  const deep = path[n - 1]
  const before = path[n - 2] ?? deep
  const sd = stages[n - 1] ?? {}
  const sb = stages[n - 2] ?? sd
  const mid: Partial<Stage> = {}
  for (const k of ['lift', 'turn', 'trunk'] as const) if (sd[k] !== undefined || sb[k] !== undefined) {
    const d = sd[k] ?? (k === 'trunk' ? 1 : 0)
    mid[k] = d + ((sb[k] ?? (k === 'trunk' ? 1 : 0)) - d) * 0.3
  }
  const into: Beat[] = path.slice(0, -1).map((_, i) => ({ ...stages[i], hold: i ? 0 : 0.5, dur: 1.8 }))
  return {
    keys: [...path, release ?? blend(deep, before, 0.3), deep],
    mode: 'cycle', ms,
    beats: [...into, { ...sd, hold: 1, dur: 1.1 }, { ...mid, hold: 0.2, dur: 1.8 }, { ...sd, hold: 1.2, dur: 2 }],
  }
}

/** Strength rep: `a` to `b` in `go`, back in `back` (slow eccentric), pausing at each end. */
export const rep = (a: Pose, b: Pose, go = 1, back = 1.8, holdA = 0.3, holdB = 0.4): Pick<Move, 'keys' | 'mode' | 'beats'> => ({
  keys: [a, b], mode: 'cycle', beats: [{ hold: holdA, dur: go, ease: 'io' }, { hold: holdB, dur: back, ease: 'io' }],
})
/** Controlled circle: accelerate from rest, constant speed, settle back to rest. */
const circle = (n: number): Beat[] => Array.from({ length: n }, (_, i) => (i === 0 ? { hold: 0.4, dur: 2, ease: 'in' } : i === n - 1 ? { dur: 2, ease: 'out' } : { ease: 'lin' }))
const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180
/** Pose angle of the direction (dx, dy), y down. */
export const ang = (dx: number, dy: number) => Math.atan2(dx, dy) * D

type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
const SLOT: Record<Limb, number> = { hand: 1, farHand: 3, foot: 5, farFoot: 7 }

/** Contact heights above the floor: palm centre, ankle over a flat foot, knee over tucked toes, spine lying down. */
export const H = { hand: 4, ankle: 5, knee: 5, lie: 11 }
/** Shin of a kneeling leg: back along the floor, toes tucked, knee H.knee up. */
export const KNEEL = -100
/** Shin of a kneeling leg with the top of the foot on the floor (move `point: true`). */
export const INSTEP = -89

/** World point [x, height above floor] of a joint, with the hip at world `hip`. */
export function where(p: Pose, hip: [number, number], j: keyof ReturnType<typeof joints>, front = false, point = false, trunk = 1): [number, number] {
  const b = joints(p, front, point, trunk)[j]
  return [hip[0] + b.x, hip[1] - b.y]
}

/** Hip at world `hip`; each limb end reaches its world point. k: elbows default back (-1), knees forward (1). */
export function put(p: Pose, hip: [number, number], to: Partial<Record<Limb, [number, number]>>, k: Partial<Record<Limb, number>> = {}, front = false, trunk = 1): Pose {
  const out = [...p] as Pose
  const b = joints(p, front, false, trunk)
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
  const p: Pose = [t, 0, 0, far?.[0] ?? 0, far?.[1] ?? 0, thigh, INSTEP, thigh, INSTEP, c, head]
  return put(p, hip, far ? { hand: [43, H.hand] } : { hand: [43, H.hand], farHand: [43, H.hand] })
}
// Thread the needle: far hand slides under the chest along the floor.
const thread = (() => {
  const p = quad(0, 107, 96, 40, [0, 0])
  return put(p, [0, 43], { farHand: [6, H.hand + 2] }, { farHand: 1 })
})()
const kneePin = { x: 'knee' as const, at: [0, 0] as [number, number], point: true }

/** Squat with the ankles at world x 0 and the hip at [x, height]. */
const squat = (hip: [number, number], t: number, c: number, arms: [number, number, number, number]): Pose =>
  put([t, ...arms, 0, 0, 0, 0, c, c + 15], hip, { foot: [0, H.ankle], farFoot: [0, H.ankle] })

const stand: Pose = [180, 2, 4, -2, -4, 0, 0, 0, 0]
// Hands on the hips: elbows out behind.
const hipsHands = (p: Pose): Pose => put(p, [0, 81], { hand: [6, 103], farHand: [6, 103] }, { hand: 1, farHand: 1 })

// Knee to wall: front foot at x 0, rear knee down at x -34; the hip rides the rear thigh forward.
const kneeToWall = (hx: number): Pose => {
  const hy = H.knee + Math.sqrt(LEN.thigh ** 2 - (hx + 34) ** 2)
  const p: Pose = [178, 0, 0, 0, 0, 0, 0, ang(-34 - hx, hy - H.knee), INSTEP, 176]
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
const box = (rear: number, front: [number, number], t: number): Pose => [t, 80, 100, 80, 100, front[0], front[1], rear, INSTEP, t - 5]

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

// Cat-cow as a wave, one segment at a time: pelvis, mid back, head.
const wave: Pose[] = [
  quad(0, 112, 100, 140), quad(0, 128, 96, 95), quad(0, 135, 85, 30),
  quad(0, 104, 88, 35), quad(0, 95, 112, 85), quad(0, 92, 125, 165),
]

export const MOVES: Record<string, Move> = {
  // Rock the shoulders forward past the wrists and back, hands planted.
  wrist_prep: { keys: [quad(21, 110, 110, 95), quad(0, 109, 109, 100), quad(-17, 110, 110, 105)], ...kneePin, ms: 1100, beats: [{ hold: 0.5 }, {}, { hold: 0.6 }] },
  deep_squat: { keys: [squat([-9, 19], 145, 155, [35, 90, 35, 90]), squat([-10, 16], 148, 160, [38, 95, 38, 95])], x: 'foot', ms: 1000, beats: [{ hold: 0.4, dur: 2.4 }, { hold: 0.8, dur: 1.8 }], mode: 'cycle' },
  // Only the hip moves: knee up, out, back, down; the torso never leans.
  hip_cars: {
    keys: [
      hipsHands([180, 0, 0, 0, 0, 0, 0, 5, -5]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, 110, 15]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, 60, -60]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, -35, -115]),
      hipsHands([180, 0, 0, 0, 0, 0, 0, -10, -30]),
    ],
    mode: 'cycle', x: 'foot', ms: 1100, beats: circle(5),
  },
  // Heel stays down while the knee drives over the toes to touch the wall.
  ankle_df: { x: 'foot', point: 'far', props: [{ t: 'wall', x: WALL }], ms: 1000, ...rep(kneeToWall(-24), kneeToWall(-12), 1.2, 1.2, 0.3, 0.6) },
  shoulder_cars: {
    keys: [stand, [180, 90, 90, -2, -4, 0, 0, 0, 0, 180, 180, -1], [180, 180, 180, -2, -4, 0, 0, 0, 0, 180, 180, 5], [180, 270, 270, -2, -4, 0, 0, 0, 0, 180, 180, 2], [180, 360, 362, -2, -4, 0, 0, 0, 0, 180, 180, -3]],
    mode: 'cycle', ms: 1000, beats: circle(5),
  },
  // From leaning forward to tall: pelvis tucks, hip pushes forward over the rear knee.
  couch: { ...breathe([couch(2, 160, 162), couch(-20, 188, 178)]), x: 'knee', at: [5, 0], point: 'near', props: [{ t: 'wall', x: -12 }] },
  // Knees sweep over the top and drop to the other side; rest there.
  // The trunk turns with the knees to square up over the front shin.
  pigeon_9090: { keys: knees9090, front: true, ms: 1000, beats: [{ turn: 40, hold: 0.8, dur: 1.3, ease: 'in' }, { dur: 1.3, ease: 'out' }, { turn: -40, hold: 0.8 }] },
  // Thread the needle: far hand slides under the chest, then opens to the ceiling; eyes follow it.
  thoracic: { keys: [thread, quad(0, 107, 112, 170, [180, 180])], ...kneePin, ms: 1000, beats: [{ hold: 0.8, dur: 1.8 }, { hold: 1, dur: 1.8 }] },
  spinal_waves: {
    keys: wave, mode: 'cycle', ...kneePin, ms: 700,
    beats: [{ ease: 'lin' }, { ease: 'out' }, { hold: 0.4, dur: 1.4, ease: 'in' }, { ease: 'lin' }, { ease: 'out' }, { hold: 0.4, dur: 1.4, ease: 'in' }],
  },
  // Hips drive up off the floor and turn square to a tall kneel, then lower with control.
  shinbox: {
    keys: [box(-84, [84, INSTEP], 182), box(-45, [40, INSTEP], 172), box(0, [0, INSTEP], 180), box(-45, [40, INSTEP], 176)],
    mode: 'cycle', x: 'farFoot', at: [-40, 0], ms: 900, point: true,
    beats: [{ turn: 55, hold: 0.6, dur: 0.6, ease: 'in' }, { turn: 25, dur: 0.8, ease: 'out' }, { hold: 0.6, dur: 1.2 }, { turn: 25, dur: 1.4, ease: 'out' }],
  },
  dislocates: {
    keys: [[180, 25, 25, 25, 25, 0, 0, 0, 0, 180, 180, -2], [180, 180, 180, 180, 180, 0, 0, 0, 0, 180, 180, 5], [180, 330, 330, 330, 330, 0, 0, 0, 0, 180, 180, -2]],
    ms: 1100, beats: [{ hold: 0.4, dur: 1.2, ease: 'in' }, { dur: 1.2, ease: 'out' }, { hold: 0.4 }],
  },
  toes: { ...breathe([toeKneel, toeSit]), x: 'knee' },
  // Rock back, then forward onto the feet with momentum and drive up; sit back down slowly.
  sit_rise: {
    keys: [squat([-30, 10], 165, 160, [70, 90, 70, 90]), rocked, [180, 30, 60, 30, 60, 0, 0, 0, 0], squat([-14, 30], 140, 150, [75, 90, 75, 90]), seated],
    mode: 'cycle', x: 'foot', ms: 900,
    beats: [{ hold: 0.2, dur: 0.6, ease: 'snap' }, { dur: 1, ease: 'out' }, { hold: 0.6, dur: 1.4, ease: 'io' }, { dur: 1.3, ease: 'io' }, { hold: 0.5, dur: 0.8, ease: 'io' }],
  },
  overhead_squat: { ...rep(ohsTop, ohsBottom, 2, 1.2, 0.4, 0.3), x: 'foot', ms: 1000 },
}
