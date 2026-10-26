import { joints, LEN, type Move, type Pose, type Pt } from '../../core/figure'
import { balance, solve } from './push'

const D2R = Math.PI / 180
const dir = (deg: number, len: number): Pt => ({ x: Math.sin(deg * D2R) * len, y: Math.cos(deg * D2R) * len })
const ang = (v: Pt) => Math.atan2(v.x, v.y) / D2R
const HS: Pose = [3, 0, 0, 0, 0, -180, -180, -180, -180, -3, -3]

/**
 * Knees resting on the backs of the upper arms: hands on the floor, forearm f, upper arm u (both arms).
 * The knee sits `along` from the elbow toward the shoulder, on top of the arm; the torso (spine bend `bend`)
 * is solved so the thigh reaches it.
 */
type Perch = { along: number; bend: number; head: number; shin: number; legs?: (p: Pose) => Pose; range?: [number, number] }
function perch(f: number, u: number, { along, bend, head, shin, legs, range = [100, 5] }: Perch): Pose {
  const elbow = dir(f + 180, LEN.fore)
  const shoulder = { x: elbow.x - dir(u, LEN.upper).x, y: elbow.y - dir(u, LEN.upper).y }
  const up = { x: -Math.cos(u * D2R), y: Math.sin(u * D2R) }
  const n = up.y < 0 ? up : { x: -up.x, y: -up.y }
  const k = along / LEN.upper
  const K = { x: elbow.x + (shoulder.x - elbow.x) * k + n.x * 10, y: elbow.y + (shoulder.y - elbow.y) * k + n.y * 10 }
  const hipOf = (t: number) => {
    const w = dir(t, LEN.waist)
    const c = dir(t + bend, LEN.chest)
    return { x: shoulder.x - w.x - c.x, y: shoulder.y - w.y - c.y }
  }
  const t = solve((t) => Math.hypot(K.x - hipOf(t).x, K.y - hipOf(t).y) - LEN.thigh, ...range)
  const h = hipOf(t)
  const th = ang({ x: K.x - h.x, y: K.y - h.y })
  const p: Pose = [t, u, f, u, f, th, shin, th, shin, t + bend, t + bend + head]
  return legs ? legs(p) : p
}

/** Shins solved so the toes rest on the floor (hand level). */
const toesDown = (p: Pose): Pose => {
  const at = (s: number): Pose => [p[0], p[1], p[2], p[3], p[4], p[5], s, p[7], s, p[9], p[10]]
  return at(solve((s) => { const b = joints(at(s)); return b.toe.y - b.hand.y }, -10, -150))
}

/** perch with the upper arm angle solved so the centre of mass is over the hands. */
const perched = (f: (u: number) => number, lo: number, hi: number, o: Perch) => balance((u) => perch(f(u), u, o), lo, hi)

// Frog: elbows bent, knees on them, feet float. Crow: arms nearly straight, knees high by the armpits, back rounded.
const frogIn = perch(18, -60, { along: 4, bend: -18, head: 55, shin: 0, legs: toesDown })
const frog = perched(() => 18, -100, -20, { along: 4, bend: -18, head: 55, shin: -105 })
const crowIn = perch(6, -20, { along: 20, bend: -24, head: 70, shin: 0, legs: toesDown })
const crow = perched((u) => u + 12, -50, 10, { along: 20, bend: -24, head: 70, shin: -120 })
const crane = perched((u) => u, -45, 15, { along: 24, bend: -30, head: 75, shin: -130 })
// Side crow: knees stacked on one arm, shins pointing forward out of the twist.
const sideCrow = perched(() => 12, -90, -10, { along: 6, bend: -15, head: 60, shin: 100 })
// Pigeon: shin across the arms, back leg reaching back. Grasshopper: near leg straight across the arms.
const pigeon = perched((u) => u + 10, -70, 5, { along: 14, bend: -20, head: 65, shin: 100, legs: (p) => [p[0], p[1], p[2], p[3], p[4], p[5], 100, -95, -95, p[9], p[10]] })
const grasshopper = perched((u) => u + 10, -70, 5, { along: 14, bend: -18, head: 65, shin: 0, legs: (p) => [p[0], p[1], p[2], p[3], p[4], p[5], p[5] + 8, 30, -100, p[9], p[10]] })

// Tripod: hands on the belly side, head down ahead of them, forearms vertical, knees on the elbows, then legs up.
const TRI = { u: -82 }
const tripodTuck = (() => {
  const p = perch(0, TRI.u, { along: 2, bend: 0, head: 0, shin: -200, range: [-60, 30] })
  return [p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], 0] as Pose
})()
const tripod: Pose = [-6, TRI.u, 0, TRI.u, 0, -178, -178, -178, -178, -2, 0]

/** Elbow lever: forearm f, elbows dug into the belly just above the hip, body near level. */
function lever(t: number, f: number, legs: [number, number], oneArm = false): Pose {
  const bend = -4
  const p0: Pose = [t, 0, 0, 0, 0, legs[0], legs[1], legs[0], legs[1], t + bend, t + bend + 20]
  const b = joints(p0)
  const d = dir(t, 1)
  const below = { x: -d.y, y: d.x }
  const n = below.y > 0 ? below : { x: -below.x, y: -below.y }
  // Contact point on the belly, slid along the trunk until it is an upper arm from the shoulder.
  const P = (s: number) => ({ x: b.hip.x + d.x * s + n.x * 9, y: b.hip.y + d.y * s + n.y * 9 })
  const s = solve((s) => Math.hypot(P(s).x - b.shoulder.x, P(s).y - b.shoulder.y) - LEN.upper, 0, 40)
  const u = ang({ x: P(s).x - b.shoulder.x, y: P(s).y - b.shoulder.y })
  return [t, u, f, oneArm ? 70 : u, oneArm ? 80 : f, legs[0], legs[1], legs[0], legs[1], t + bend, t + bend + 20]
}
const levered = (t: number, legs: [number, number], oneArm = false) => balance((f) => lever(t, f, legs, oneArm), -40, 40)
const leverTuck = levered(98, [72, -105])
const elbowLever = levered(96, [-86, -86])
const oaLever = levered(96, [-86, -86], true)

// Forearm stand: forearms flat toward the belly side, upper arms near vertical, head lifted off the floor.
const fa = (t: number, legs: [number, number, number, number], bend = 0, head = -45): Pose => [t, 22, -90, 22, -90, ...legs, t + bend, head]
const overForearms = (b: ReturnType<typeof joints>) => (b.hand.x + b.elbow.x) / 2
const forearm = balance((t) => fa(t, [-180 + t, -180 + t, -180 + t, -180 + t], -t), -20, 20, overForearms)
const faIn = (() => {
  const p = fa(14, [0, 0, -175, -175], -6)
  const L = solve((L) => { const b = joints([p[0], p[1], p[2], p[3], p[4], L, L, p[7], p[8], p[9], p[10]]); return b.toe.y - b.hand.y }, -90, 0)
  return [p[0], p[1], p[2], p[3], p[4], L, L, p[7], p[8], p[9], p[10]] as Pose
})()
// Scorpion: belly bowed out toward the face, the knees bend so the feet drop toward the head.
const scorpion = balance((t) => fa(t, [t + 160, t + 30, t + 160, t + 30], 70, -80), -50, 0, overForearms)

// Crow to handstand: hips rise over the hands, arms straighten, knees leave the arms, then the legs extend.
const crowTuck = balance((t) => [t, -12, -12, -12, -12, t - 60, t - 200, t - 60, t - 200, t - 10, t - 30], -30, 40)

const m = (keys: Pose[], ms?: number): Move => ({ keys, x: 'hand', ms })

export const MOVES: Record<string, Move> = {
  frog_stand: m([frogIn, frog], 1200),
  crow: m([crowIn, crow], 1200),
  side_crow: m([crowIn, sideCrow], 1200),
  crane: m([crow, crane], 1200),
  tripod_hs: m([tripodTuck, tripod], 1300),
  flying_pigeon: m([crowIn, pigeon], 1300),
  elbow_lever: m([leverTuck, elbowLever], 1200),
  forearm_stand: { keys: [faIn, forearm], x: 'elbow', ms: 1200 },
  grasshopper: m([crowIn, grasshopper], 1300),
  oa_elbow_lever: m([elbowLever, oaLever], 1300),
  crow_to_hs: m([crow, crowTuck, HS], 1100),
  scorpion: { keys: [forearm, scorpion], x: 'elbow', ms: 1400 },
}
