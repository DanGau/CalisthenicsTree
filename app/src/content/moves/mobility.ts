import { STAGE, blend, full, joints, LEN, RUNG, solid, type Beat, type Move, type Pose, type Stage } from '../../core/figure'
import { pos, reach } from './legs'
import { pinned } from './pull'

const D = 180 / Math.PI
const STAGES = ['lift', 'turn', 'trunk', 'roll', 'armOut', 'farArmOut', 'legOut', 'farLegOut', 'foreOut', 'farForeOut', 'shinOut', 'farShinOut', 'twist'] as const

/**
 * A stretch on the breath: slide in through `path` to its last key, sink there on the exhale,
 * release a little on the inhale (`release`, default a 15% blend back), sink again, then come out.
 * Real time (motion-reference §1.4, §9): slide in about 3.5 s, each breath half-period 4.5 s.
 * `stages`: per `path` key; the release lerps them too.
 */
export function breathe(path: Pose[], ms = 900, release?: Pose, stages: Partial<Stage>[] = []): Pick<Move, 'keys' | 'mode' | 'beats' | 'ms'> {
  const n = path.length
  const deep = path[n - 1]
  const before = path[n - 2] ?? deep
  const sd = stages[n - 1] ?? {}
  const sb = stages[n - 2] ?? sd
  const mid: Partial<Stage> = {}
  for (const k of STAGES) if (sd[k] !== undefined || sb[k] !== undefined) {
    const d = sd[k] ?? (k === 'trunk' ? 1 : 0)
    mid[k] = d + ((sb[k] ?? (k === 'trunk' ? 1 : 0)) - d) * 0.15
  }
  const s = (sec: number) => (sec * 1000) / ms
  const slide = s(n > 2 ? 2 : 3.5)
  const into: Beat[] = path.slice(0, -1).map((_, i) => ({ ...stages[i], hold: i ? 0 : s(0.8), dur: slide }))
  return {
    keys: [...path, release ?? blend(deep, before, 0.15), deep],
    mode: 'cycle', ms,
    beats: [...into, { ...sd, hold: s(0.5), dur: s(4.5) }, { ...mid, hold: s(0.4), dur: s(4.5) }, { ...sd, hold: s(0.6), dur: s(2.5) }],
  }
}

/** Strength rep: `a` to `b` in `go`, back in `back` (slow eccentric), pausing at each end. */
export const rep = (a: Pose, b: Pose, go = 1, back = 1.8, holdA = 0.3, holdB = 0.4): Pick<Move, 'keys' | 'mode' | 'beats'> => ({
  keys: [a, b], mode: 'cycle', beats: [{ hold: holdA, dur: go, ease: 'io' }, { hold: holdB, dur: back, ease: 'io' }],
})

/** Minimum-jerk progress at time fraction u (motion-reference §1.1). */
const mjp = (u: number) => u ** 3 * (10 - 15 * u + 6 * u * u)

/**
 * Rep along a pose family `f` (0 = start, 1 = end), like `rep`, with keys at minimum-jerk progress:
 * speed is bell-shaped and contacts that `f` keeps exact hold between keys too.
 */
export const repPath = (f: (s: number) => Pose, go = 1, back = 1.8, holdA = 0.3, holdB = 0.4, n = 3): Pick<Move, 'keys' | 'mode' | 'beats'> => {
  const s = Array.from({ length: n + 1 }, (_, i) => mjp(i / n))
  const keys = [...s, ...s.slice(1, -1).reverse()].map(f)
  const beats: Beat[] = keys.map((_, i) => ({ hold: i === 0 ? holdA : i === n ? holdB : 0, dur: (i < n ? go : back) / n }))
  return { keys, mode: 'cycle', beats }
}

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

const OUT: Record<Limb, 'armOut' | 'farArmOut' | 'legOut' | 'farLegOut'> = { hand: 'armOut', farHand: 'farArmOut', foot: 'legOut', farFoot: 'farLegOut' }
type Knee = 'knee' | 'farKnee'
const KNEE: Record<Knee, Limb> = { knee: 'foot', farKnee: 'farFoot' }
const SHIN: Record<Limb, 'foreOut' | 'farForeOut' | 'shinOut' | 'farShinOut'> = { hand: 'foreOut', farHand: 'farForeOut', foot: 'shinOut', farFoot: 'farShinOut' }
const STAGE0: Stage = STAGE
const ROOT = { hand: 'nearShoulder', farHand: 'farShoulder', foot: 'nearHip', farFoot: 'farHip' } as const

type V3 = [number, number, number]
/** `v` rotated by `deg` about the unit axis `ax` through `o`. */
const spin = (v: V3, o: V3, ax: V3, deg: number): V3 => {
  const [c, sn] = [Math.cos(deg / D), Math.sin(deg / D)]
  const w = v.map((q, i) => q - o[i]) as V3
  const dot = w[0] * ax[0] + w[1] * ax[1] + w[2] * ax[2]
  const cr: V3 = [ax[1] * w[2] - ax[2] * w[1], ax[2] * w[0] - ax[0] * w[2], ax[0] * w[1] - ax[1] * w[0]]
  return w.map((q, i) => o[i] + q * c + cr[i] * sn + ax[i] * dot * (1 - c)) as V3
}

/**
 * `put` for solid moves: hip at [x, height], each limb end reaches its point [x, height, z] (z sideways,
 * + the near side). Points are before the camera `turn`, which only views them. A knee target kneels:
 * the thigh reaches the knee, the shin lies on the floor straight back. Returns pose and stage.
 */
export function put3(p: Pose, st: Partial<Stage>, hip: [number, number], to: Partial<Record<Limb | Knee, [number, number, number]>>, k: Partial<Record<Limb, number>> = {}): [Pose, Partial<Stage>] {
  // Roots and targets in the body frame before roll and twist.
  const b = solid(p, { ...STAGE0, ...st, turn: 0, roll: 0, twist: 0 })
  const out = [...p] as Pose
  const so = { ...st }
  const [cr, sr] = [Math.cos((st.roll ?? 0) / D), Math.sin((st.roll ?? 0) / D)]
  const f = full(p)
  const waist: V3 = [Math.sin(f[0] / D) * LEN.waist, Math.cos(f[0] / D) * LEN.waist, 0]
  const axis: V3 = [Math.sin(f[9] / D), Math.cos(f[9] / D), 0]
  for (const [j, [x, h, z]] of Object.entries(to) as [Limb | Knee, [number, number, number]][]) {
    const l = KNEE[j as Knee] ?? (j as Limb)
    const r = b[ROOT[l]]
    const side = l === 'hand' || l === 'foot' ? 1 : -1
    const [wx, wy, wz] = [x - hip[0], hip[1] - h, z]
    let q: V3 = [wx, wy * cr + wz * sr, -wy * sr + wz * cr]
    if (SLOT[l] < 5 && st.twist) q = spin(q, waist, axis, -st.twist)
    const v: V3 = [q[0] - r.x, q[1] - r.y, q[2] - (r.z ?? 0)]
    const i = SLOT[l]
    if (l !== j) {
      // Kneeling: slide the knee along x until the thigh reaches it; the shin lies straight back.
      v[0] = Math.sign(v[0] || 1) * Math.sqrt(Math.max(0, LEN.thigh ** 2 - v[1] ** 2 - v[2] ** 2))
      const o = Math.asin(Math.max(-1, Math.min(1, (side * v[2]) / LEN.thigh))) * D
      so[OUT[l]] = o
      so[SHIN[l]] = -o
      out[i] = p[i]! + wrap(ang(v[0], v[1]) - p[i]!)
      out[i + 1] = -90
      continue
    }
    const isArm = i < 5
    const [a0, c0] = isArm ? [LEN.upper, LEN.fore] : [LEN.thigh, LEN.shin]
    const o = Math.asin(Math.max(-0.999, Math.min(0.999, (side * v[2]) / (a0 + c0)))) * D
    so[OUT[l]] = o
    so[SHIN[l]] = 0
    const [a, c] = [a0 * Math.cos(o / D), c0 * Math.cos(o / D)]
    const [dx, dy] = [v[0], v[1]]
    const d = Math.max(Math.abs(a - c) + 0.01, Math.min(Math.hypot(dx, dy), a + c - 0.01))
    const A = Math.acos((a * a + d * d - c * c) / (2 * a * d)) * D
    const raw = ang(dx, dy) + (k[l] ?? (isArm ? -1 : 1)) * A
    const u = p[i]! + wrap(raw - p[i]!)
    out[i] = u
    out[i + 1] = u + wrap(ang(dx - Math.sin(u / D) * a, dy - Math.cos(u / D) * a) - u)
  }
  return [out, so]
}

/** All fours, knee at world x 0: thigh angle, spine and head; hands planted at x 43. */
const quad = (thigh: number, t: number, c: number, head: number, far?: [number, number]): Pose => {
  const hip: [number, number] = [-Math.sin(thigh / D) * LEN.thigh, H.knee + Math.cos(thigh / D) * LEN.thigh]
  const p: Pose = [t, 0, 0, far?.[0] ?? 0, far?.[1] ?? 0, thigh, INSTEP, thigh, INSTEP, c, head]
  return put(p, hip, far ? { hand: [43, H.hand] } : { hand: [43, H.hand], farHand: [43, H.hand] })
}
/**
 * Thread the needle, `s` -1 (threaded) to 1 (open), seen from the front quarter: hips stay square over the
 * planted knees while the chest twists; the far arm slides under the chest, then opens to the ceiling.
 */
const THREAD_CAM = 40
const threadKey = (s: number, prev: Pose): [Pose, Partial<Stage>] => {
  const p: Pose = [107 + 8 * Math.min(0, s), prev[1], prev[2], prev[3], prev[4], 0, 0, 0, 0, 100 + 14 * s, 75 + 50 * s]
  // Threaded: the far palm slides along the floor under the near shoulder. Else it reaches out along an arc to the ceiling.
  const u = (s + 1) / 2
  const far: [number, number, number] = s === -1 ? [26, H.hand + 2, 20] : [42 + 10 * Math.sin(Math.PI * u), 43 + 80 * u, -20 - 40 * Math.sin(Math.PI * u * 0.8)]
  const to: Parameters<typeof put3>[3] = { hand: [43, H.hand, 17], farHand: far, knee: [0, H.knee, 10], farKnee: [0, H.knee, -10] }
  const [q, st] = put3(p, { twist: -50 * s }, [0, 43], to, { hand: 1, farHand: 1 })
  return [q, st]
}
const threadKeys = [-1, -0.5, 0, 0.5, 1].reduce<[Pose, Partial<Stage>][]>((ks, s) => [...ks, threadKey(s, ks.at(-1)?.[0] ?? [0, 0, 0, 0, 0, 0, 0, 0, 0])], [])
const kneePin = { x: 'knee' as const, y: 'knee' as const, at: [0, -H.knee] as [number, number], point: true }

/** Squat with the ankles at world x 0 and the hip at [x, height]. */
const squat = (hip: [number, number], t: number, c: number, arms: [number, number, number, number]): Pose =>
  put([t, ...arms, 0, 0, 0, 0, c, c + 15], hip, { foot: [0, H.ankle], farFoot: [0, H.ankle] })

const stand: Pose = [180, 2, 4, -2, -4, 0, 0, 0, 0]
/** Controlled articular rotations, seen a third of the way round from the front. */
const CAR_CAM = 60
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

/**
 * Direction `d` as a sagittal angle and a swing out to side `s`, nearest the previous [angle, out]
 * (a direction past the side has two: (a, o) and (a + 180, 180 - o)).
 */
const aim = (d: V3, s: number, [pa, po]: [number, number]): [number, number] => {
  const o = Math.asin(Math.max(-1, Math.min(1, (s * d[2]) / Math.hypot(...d)))) * D
  const a = ang(d[0], d[1])
  const c1: [number, number] = [pa + wrap(a - pa), o]
  const c2: [number, number] = [pa + wrap(a + 180 - pa), po + wrap(180 - o - po)]
  const cost = ([x, y]: [number, number]) => Math.abs(x - pa) + Math.abs(y - po)
  return cost(c1) <= cost(c2) ? c1 : c2
}
type Legs3 = Record<'knee' | 'foot' | 'farKnee' | 'farFoot', V3>
/**
 * Legs through world knee and foot points [x, height, z], hip at [x, height, z] with the pelvis turned `yaw`
 * (toward the near side, + ). Returns pose and stage, `turn` = yaw.
 */
const legs3 = (p: Pose, hip: V3, yaw: number, at: Legs3, st: Partial<Stage> = {}, prev: Partial<Stage> = {}): [Pose, Partial<Stage>] => {
  const [c, sn] = [Math.cos(yaw / D), Math.sin(yaw / D)]
  const body = ([x, h, z]: V3): V3 => {
    const [dx, dz] = [x - hip[0], z - hip[2]]
    return [dx * c + dz * sn, hip[1] - h, -dx * sn + dz * c]
  }
  const out = [...p] as Pose
  const so: Partial<Stage> = { ...st, turn: yaw }
  for (const [s, i, k, f, o1, o2] of [[1, 5, 'knee', 'foot', 'legOut', 'shinOut'], [-1, 7, 'farKnee', 'farFoot', 'farLegOut', 'farShinOut']] as const) {
    const [K, F] = [body(at[k]), body(at[f])]
    const [ta, to] = aim([K[0], K[1], K[2] - s * 10], s, [p[i] ?? 0, prev[o1] ?? 0])
    const [sa, sho] = aim([F[0] - K[0], F[1] - K[1], F[2] - K[2]], s, [p[i + 1] ?? 0, (prev[o1] ?? 0) + (prev[o2] ?? 0)])
    ;[out[i], out[i + 1], so[o1], so[o2]] = [ta, sa, to, sho - to]
  }
  return [out, so]
}

// 90/90 switch: feet planted wide in front, hip on the floor; both knees fall to one side, then sweep over
// the top to the other (windshield wipers). The chest turns to face the front shin; hands at the chest.
/** Knees resting on the floor: just below level with the hip-to-foot line. */
const REST = -4
const NINETY = { cam: 60, hip: [0, 10.6, 0] as V3, foot: [26, H.ankle, 30] as V3 }
/** Knee of a leg from `root` to `foot`, swung `phi` from lying on the near side (0) over the top (90) to the far side (180). */
const kneeAt = (root: V3, foot: V3, phi: number): V3 => {
  const m = root.map((v, i) => (v + foot[i]) / 2) as V3
  const [dx, dz] = [foot[0] - root[0], foot[2] - root[2]]
  const half = Math.hypot(dx, foot[1] - root[1], dz) / 2
  const r = Math.sqrt(LEN.thigh ** 2 - half ** 2)
  const n = [-dz, dx].map((v) => v / Math.hypot(dx, dz)) as [number, number]
  const [nx, nz] = n[1] > 0 ? n : [-n[0], -n[1]]
  // Up, square to the hip-foot line.
  const L = 2 * half
  const dy = foot[1] - root[1]
  const up: V3 = [-(dy * dx) / L ** 2, 1 - (dy * dy) / L ** 2, -(dy * dz) / L ** 2]
  const ul = Math.hypot(...up)
  const [c, sn] = [r * Math.cos(phi / D), (r * Math.sin(phi / D)) / ul]
  return [m[0] + c * nx + sn * up[0], m[1] + sn * up[1], m[2] + c * nz + sn * up[2]]
}
const wiperLegs = (phi: number): Legs3 => {
  const [h, f] = [NINETY.hip, NINETY.foot]
  const foot: V3 = f
  const farFoot: V3 = [f[0], f[1], -f[2]]
  return { knee: kneeAt([h[0], h[1], 10], foot, phi), foot, farKnee: kneeAt([h[0], h[1], -10], farFoot, phi), farFoot }
}
const chest: Pose = [180, 30, 150, 30, 150, 0, 0, 0, 0, 180, 180]
const wiper = (phi: number, prev: Pose, ps: Partial<Stage>): [Pose, Partial<Stage>] =>
  legs3(prev, NINETY.hip, 0, wiperLegs(phi), { twist: 25 * Math.cos(phi / D), armOut: 20, farArmOut: 20, foreOut: -60, farForeOut: -60 }, ps)
const chain = <T>(xs: T[], f: (x: T, prev: Pose, st: Partial<Stage>) => [Pose, Partial<Stage>], seed: Pose) =>
  xs.reduce<[Pose, Partial<Stage>][]>((ks, x) => [...ks, f(x, ks.at(-1)?.[0] ?? seed, ks.at(-1)?.[1] ?? {})], [])
const WIPE = [REST, 25, 50, 70, 90, 110, 130, 155, 180 - REST]
const wipers = chain(WIPE, wiper, chest)

// Shinbox get-up from the 90/90 (knees to the near side): the hips drive up and turn over the knees to a tall
// kneel facing them; the feet pivot behind. Lowers back the same way.
const BOX0 = wiperLegs(REST)
const kneelKnees = (() => {
  const m = BOX0.knee.map((v, i) => (v + BOX0.farKnee[i]) / 2) as V3
  const d = [BOX0.knee[0] - BOX0.farKnee[0], BOX0.knee[2] - BOX0.farKnee[2]]
  const l = Math.hypot(d[0], d[1])
  const u = [d[0] / l, d[1] / l]
  // Facing: perpendicular to the knee line, toward +z.
  const fwd = u[0] * 1 < 0 ? [u[1], -u[0]] : [-u[1], u[0]]
  return { m, u, fwd: fwd[1] > 0 ? fwd : [-fwd[0], -fwd[1]] }
})()
const boxKey = (s: number, prev: Pose, ps: Partial<Stage>): [Pose, Partial<Stage>] => {
  const { m, fwd } = kneelKnees
  const e = (1 - Math.cos(Math.PI * s)) / 2
  const yaw = Math.atan2(fwd[1], fwd[0]) * D * e
  const lerp3 = (a: V3, b: V3): V3 => a.map((v, i) => v + (b[i] - v) * e) as V3
  // Knees stay where they lay; the hip rises as high as the farther knee allows, the nearer one slides out to match.
  const hip = lerp3(NINETY.hip, [m[0], 0, m[2]])
  const lat = [-Math.sin(yaw / D), Math.cos(yaw / D)]
  const root = (side: number, k: V3) => Math.hypot(k[0] - hip[0] - side * 10 * lat[0], k[2] - hip[2] - side * 10 * lat[1])
  const [dn, df] = [root(1, BOX0.knee), root(-1, BOX0.farKnee)]
  const reach = Math.max(dn, df)
  hip[1] = H.knee + Math.sqrt(LEN.thigh ** 2 - reach ** 2)
  const slide = (side: number, k: V3, d: number): V3 => {
    const [rx, rz] = [hip[0] + side * 10 * lat[0], hip[2] + side * 10 * lat[1]]
    return [rx + ((k[0] - rx) * reach) / d, H.knee, rz + ((k[2] - rz) * reach) / d]
  }
  const [kn, kf] = [slide(1, BOX0.knee, dn), slide(-1, BOX0.farKnee, df)]
  // Shins swing round flat on the floor from where they lay to straight back.
  const shin = (k0: V3, f0: V3, k: V3): V3 => {
    const a0 = Math.atan2(f0[2] - k0[2], f0[0] - k0[0])
    const a = a0 + wrap((Math.atan2(-fwd[1], -fwd[0]) - a0) * D) / D * e
    return [k[0] + Math.cos(a) * LEN.shin, H.ankle, k[2] + Math.sin(a) * LEN.shin]
  }
  const p: Pose = [...prev]
  p[0] = 180 - 14 * Math.sin(Math.PI * s)
  p[9] = 180 - 6 * Math.sin(Math.PI * s)
  p[10] = 180
  return legs3(p, hip, yaw, { knee: kn, foot: shin(BOX0.knee, BOX0.foot, kn), farKnee: kf, farFoot: shin(BOX0.farKnee, BOX0.farFoot, kf) },
    { twist: 25 * (1 - e), armOut: 20, farArmOut: 20, foreOut: -60, farForeOut: -60 }, ps)
}
const BOX_S = [0, 0.2, 0.4, 0.6, 0.8, 1]
const boxKeys = chain(BOX_S, boxKey, chest)

// Toe squat: kneel on tucked toes, then sit back onto the heels.
const toeKneel: Pose = [180, 10, 10, 10, 10, 0, -102, 0, -102]
const toeSit: Pose = [178, 30, 60, 30, 60, 62, -102, 62, -102]

// Sit-to-rise: ankles crossed at x 0 stay put; seated, rocked onto the feet, standing.
const seated = squat([-26, 10], 175, 175, [60, 90, 60, 90])
const rocked = squat([-12, 26], 135, 145, [80, 90, 80, 90])

// Overhead squat: stick locked over mid-foot (x 4); `s` from standing (0) to the bottom (1), hips and knees together.
const ohs = (s: number): Pose => {
  const hip: [number, number] = [-14 * s, 81 - 59 * s]
  const p = put([180 - 23 * s, 180 - 10 * s, 180 - 10 * s, 180 - 10 * s, 180 - 10 * s, 0, 0, 0, 0, 180 - 15 * s, 180], hip, { foot: [0, H.ankle], farFoot: [0, H.ankle] })
  const [sx, sy] = where(p, hip, 'shoulder')
  const hy = sy + Math.sqrt(53.5 ** 2 - (4 - sx) ** 2)
  return put(p, hip, { hand: [4, hy], farHand: [4, hy] }, { hand: 1, farHand: 1 })
}

// Cat-cow as a wave (motion-reference §9): one breath per 5 s cycle, pelvis first, then mid back,
// head last, each segment trailing the one before by 0.3 s. Cat (rounded, head down) to cow (sway, head up).
const WAVE = { n: 16, lag: 0.06 }
const cat = [135, 85, 30]
const cow = [94, 116, 165]
const wave: Pose[] = Array.from({ length: WAVE.n }, (_, i) => {
  const [t, c, h] = cat.map((v, j) => v + (cow[j] - v) * (1 - Math.cos(2 * Math.PI * (i / WAVE.n - j * WAVE.lag))) / 2)
  return quad(0, t, c, h)
})

// Stall bars at x 0. Semi-hang: facing them, hands on rung 12, balls of the feet on rung 1, the hips sit back
// and down while the chest sinks between the arms.
const SEMI: [number, number][] = [[-50, 85], [-56, 74]]
const semi = (hip: [number, number], t: number, c: number, head: number): Pose =>
  put([t, 0, 0, 0, 0, 0, 0, 0, 0, c, head, 5], hip, { hand: [0, -RUNG(12)], farHand: [0, -RUNG(12)], foot: [-10, -RUNG(1) + 2.5 + H.ankle], farFoot: [-10, -RUNG(1) + 2.5 + H.ankle] })
// Side bend, front view, bars on the viewer's right (the near side): near hand low on rung 6, far hand over the
// head on rung 12, the hips push away to the left.
const bend = (hip: [number, number], t: number, c: number, head: number): Pose =>
  put([t, 0, 0, 0, 0, 0, 0, 0, 0, c, head], hip, { hand: [0, -RUNG(6)], farHand: [0, -RUNG(12)], foot: [-16, H.ankle], farFoot: [-36, H.ankle] }, { hand: -1, farHand: -1 }, true)
/** Fixes for `pinned`, relative to the pinned near hand: semi-hang feet on rung 1; side bend far hand on rung 12, feet planted. */
const semiFeet = (p: Pose): Pose => {
  const [x, y] = pos(p, 'hand')
  const f: [number, number] = [x - 10, y - RUNG(12) - (-RUNG(1) + 2.5 + H.ankle)]
  return reach(p, { foot: f, farFoot: f })
}
const highHand = (p: Pose): Pose => {
  const [x, y] = pos(p, 'hand', true)
  const foot = (fx: number): [number, number] => [x + fx, y - RUNG(6) - H.ankle]
  return reach(p, { farHand: [x, y + RUNG(12) - RUNG(6)], foot: foot(-16), farFoot: foot(-36) }, { front: true, k: { farHand: -1 } })
}
const BEND: [number, number][] = [[-30, 80.5], [-36, 80]]

export const MOVES: Record<string, Move> = {
  // Rock the shoulders forward past the wrists and back, hands planted.
  wrist_prep: { keys: [quad(21, 110, 110, 95), quad(0, 109, 109, 100), quad(-17, 110, 110, 105)], ...kneePin, ms: 1100, beats: [{ hold: 0.5 }, {}, { hold: 0.6 }] },
  // Resting in the hole, breathing: sink a little on each exhale.
  deep_squat: { keys: [squat([-9, 19], 145, 155, [35, 90, 35, 90]), squat([-10, 16], 148, 160, [38, 95, 38, 95])], x: 'foot', ms: 1000, beats: [{ hold: 0.4, dur: 4.2 }, { hold: 0.5, dur: 4.2 }], mode: 'cycle' },
  // Only the hip moves: knee up, out, back, down; the torso never leans.
  // Seen from the front quarter: knee up in front, out to the side with the foot under it, round behind, down; the torso never leans.
  hip_cars: {
    keys: [
      hipsHands([180, 0, 0, 0, 0, 5, -5, 0, 0]),
      hipsHands([180, 0, 0, 0, 0, 105, 10, 0, 0]),
      hipsHands([180, 0, 0, 0, 0, 95, 10, 0, 0]),
      hipsHands([180, 0, 0, 0, 0, 10, -80, 0, 0]),
      hipsHands([180, 0, 0, 0, 0, -30, -110, 0, 0]),
    ],
    solid: true, view: CAR_CAM, mode: 'cycle', x: 'farFoot', ms: 1100,
    beats: circle(5).map((b, i) => ({ ...b, legOut: [0, 5, 70, 45, 5][i], shinOut: [0, 0, -70, -40, 0][i] })),
  },
  // Heel stays down while the knee drives over the toes to touch the wall.
  ankle_df: { x: 'foot', point: 'far', props: [{ t: 'wall', x: WALL }], ms: 1000, ...rep(kneeToWall(-24), kneeToWall(-12), 1.2, 1.2, 0.3, 0.6) },
  // Arm forward, overhead, then turns out and sweeps down behind and to the side.
  shoulder_cars: {
    keys: [stand, [180, 90, 90, -2, -4, 0, 0, 0, 0, 180, 180, -1], [180, 180, 180, -2, -4, 0, 0, 0, 0, 180, 180, 5], [180, 270, 270, -2, -4, 0, 0, 0, 0, 180, 180, 2], [180, 360, 362, -2, -4, 0, 0, 0, 0, 180, 180, -3]],
    solid: true, view: CAR_CAM, mode: 'cycle', ms: 1000, beats: circle(5).map((b, i) => ({ ...b, armOut: [0, 0, 10, 45, 5][i] })),
  },
  // From leaning forward to tall: pelvis tucks, hip pushes forward over the rear knee.
  couch: { ...breathe([couch(2, 160, 162), couch(-20, 188, 178)]), x: 'knee', at: [5, 0], point: 'near', props: [{ t: 'wall', x: -12 }] },
  // Knees sweep over the top and drop to the other side; rest there.
  // The trunk turns with the knees to square up over the front shin.
  pigeon_9090: {
    keys: wipers.map(([p]) => p), solid: true, view: NINETY.cam, tilt: 20, x: 'farFoot', y: 'hip', at: [0, -NINETY.hip[1]], ms: 1000,
    beats: wipers.map(([, st], i): Beat => ({ ...st, hold: i === 0 || i === WIPE.length - 1 ? 0.8 : 0, dur: 2.6 / (WIPE.length - 1) })),
  },
  // Thread the needle: far hand slides under the chest, then opens to the ceiling; eyes follow it.
  thoracic: {
    keys: threadKeys.map(([p]) => p), solid: true, view: THREAD_CAM, ...kneePin, x: 'hip', ms: 1000,
    beats: threadKeys.map(([, st], i) => ({ ...st, hold: i === 0 ? 0.8 : i === 4 ? 1.2 : 0, dur: 0.6 })),
  },
  spinal_waves: {
    keys: wave, mode: 'cycle', ...kneePin, ms: 5000 / WAVE.n,
  },
  // Hips drive up off the floor and turn square to a tall kneel, then lower with control.
  shinbox: {
    keys: boxKeys.map(([p]) => p), solid: true, view: NINETY.cam, tilt: 20, point: true, x: 'knee', y: 'knee', at: [0, -H.knee], ms: 900,
    beats: boxKeys.map(([, st], i): Beat => ({ ...st, hold: i === 0 || i === BOX_S.length - 1 ? 0.6 : 0, dur: 0.35 })),
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
  stall_semi_hang: pinned({ keys: [semi(SEMI[0], 168, 160, 150), semi(SEMI[1], 140, 128, 118)], x: 'hand', y: 'hand', at: [0, RUNG(12)], props: [{ t: 'stall', x: 0 }], ms: 1000, beats: [{ hold: 0.6, dur: 2.5 }, { hold: 2, dur: 2 }] }, semiFeet, 40),
  stall_side_bend: pinned({ keys: [bend(BEND[0], 170, 155, 150), bend(BEND[1], 164, 128, 120)], front: true, x: 'hand', y: 'hand', at: [0, RUNG(6)], props: [{ t: 'stall', x: 0 }], ms: 1000, beats: [{ hold: 0.6, dur: 2.2 }, { hold: 2, dur: 2 }] }, highHand, 40),
  // Back to the wall, straight arms rise forward and up to the wall; ribs stay down.
  wall_reach: { ...rep([180, 2, 4, -2, -4, 0, 0, 0, 0, 180, 180], [180, 182, 183, 182, 183, 0, 0, 0, 0, 180, 180, 5], 1.6, 1.6, 0.4, 1.2), ms: 1000, props: [{ t: 'wall', x: -18 }] },
  overhead_squat: { ...repPath(ohs, 2, 1.2, 0.4, 0.3), x: 'foot', ms: 1000 },
}
