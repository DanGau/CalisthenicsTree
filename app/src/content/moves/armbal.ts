import { joints, LEN, type Move, type Pose, type Pt } from '../../core/figure'
import { balance, holdBeats, set, solve } from './push'

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
// Pigeon: shin across the arms, back leg reaching back; it enters with the back toes on the floor.
const pigeonLegs = (back: number) => (p: Pose): Pose => [p[0], p[1], p[2], p[3], p[4], p[5], 100, back, back, p[9], p[10]]
const pigeon = perched((u) => u + 10, -70, 5, { along: 14, bend: -20, head: 65, shin: 100, legs: pigeonLegs(-95) })
const pigeonIn = (() => {
  const lift = (L: number) => set(pigeon, [7, 8], L)
  return lift(solve((L) => { const b = joints(lift(L)); return b.farToe.y - b.hand.y }, -95, -10))
})()

/**
 * Front view twist (side crow, grasshopper): shoulders square to the viewer, arms nearly vertical with the
 * elbows a touch out; the trunk leans toward the viewer so the hips sit just outside the near elbow.
 */
const twist = (legs: [number, number, number, number], head = 195): Pose => [-88, 10, -4, -10, 4, ...legs, 188, head]
/** Shins of a twist solved so the feet rest on the floor (trunk foreshortened to `trunk`). */
const feetDown = (p: Pose, trunk = 1): Pose => {
  const at = (s: number) => set(set(p, [6], s), [8], s - 6)
  return at(solve((s) => { const b = joints(at(s), true, false, trunk); return Math.max(b.foot.y, b.farFoot.y) + LEN.sole - b.hand.y }, 150, 20))
}
// Side crow: both knees stacked on the near upper arm, shins folded back under. Leaning onto the arm, the chest
// tips toward the viewer (trunk foreshortened) and the hips settle onto the near elbow.
const SC = { in: 0.9, on: 0.6 }
const sideCrow = twist([80, 130, 74, 124])
const sideCrowIn = feetDown(twist([112, 60, 106, 54]), SC.in)
// Grasshopper: the near leg straight across both upper arms, the far leg bent with its foot by the near knee.
const grasshopper = twist([-88, -88, 150, 70], 190)
const grasshopperIn = (() => {
  const at = (L: number) => twist([L, L, 150, 70], 190)
  return at(solve((L) => { const b = joints(at(L), true); return b.foot.y + LEN.sole - b.hand.y }, -88, -20))
})()

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
// The chest pushes through toward the face, the hips swing over the back and the bent knees drop the feet toward the head.
const scorpion = balance((t): Pose => [t, 22, -90, 22, -90, t - 95, t + 5, t - 85, t + 15, t + 60, -40], -130, -30, overForearms)

// Crow to handstand: hips rise over the hands, arms straighten, knees leave the arms, then the legs extend.
const crowTuck = balance((t) => [t, -12, -12, -12, -12, t - 60, t - 200, t - 60, t - 200, t - 10, t - 30], -30, 40)

/** Balance hold: [entry, hold, small correction], bounced. */
const bal = (entry: Pose, hold: Pose, sway: Pose, o: Partial<Move> = {}): Move => ({ keys: [entry, hold, sway], x: 'hand', beats: holdBeats(1.4, 1.5), ...o })
/** Small correction: fingers press and the hips settle a touch. */
const nod = (p: Pose, d = 3): Pose => set(set(p, [0], p[0] + d), [9], (p[9] ?? p[0]) + d)

export const MOVES: Record<string, Move> = {
  frog_stand: bal(frogIn, frog, nod(frog)),
  crow: bal(crowIn, crow, nod(crow)),
  side_crow: bal(sideCrowIn, sideCrow, nod(sideCrow, -3), { front: true, beats: holdBeats(1.4, 1.5).map((b, i) => ({ ...b, trunk: i ? SC.on : SC.in })) }),
  crane: bal(crow, crane, nod(crane)),
  tripod_hs: { keys: [tripodTuck, tripod], x: 'hand', ms: 900, beats: [{ hold: 0.5, dur: 1.8 }, { hold: 0.9 }] },
  flying_pigeon: bal(pigeonIn, pigeon, nod(pigeon)),
  elbow_lever: bal(leverTuck, elbowLever, nod(elbowLever, 2)),
  forearm_stand: { keys: [faIn, forearm], x: 'elbow', flow: 0.12, ms: 800, beats: [{ hold: 0.5, dur: 1.1, ease: 'out' }, { hold: 1 }] },
  grasshopper: bal(grasshopperIn, grasshopper, nod(grasshopper, -3), { front: true }),
  oa_elbow_lever: bal(elbowLever, oaLever, nod(oaLever, 2)),
  crow_to_hs: { keys: [crow, crowTuck, HS], x: 'hand', ms: 900, beats: [{ hold: 0.5, dur: 1.3 }, { dur: 1.5, ease: 'out' }, { hold: 0.8 }] },
  scorpion: { keys: [forearm, scorpion], x: 'elbow', ms: 900, beats: [{ hold: 0.5, dur: 2 }, { hold: 1 }] },
}
