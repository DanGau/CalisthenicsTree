import { blend, joints, LEN, type Body, type Move, type Pose, type Pt, type Stage } from '../../core/figure'
import { armsTo, balance, com3, fit3, frame, holdBeats, type Key3, nudge, off, set, solidMove, solve } from './push'

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
 * Solid twist (side crow, grasshopper): chaturanga arms (forearms near vertical, elbows back), trunk leaning
 * forward, both legs swung to one side. `legs` builds the key from [trunk, upper arm, ...leg vars].
 */
const twistKey = (t: number, u: number, legs: [number, number, number, number], st: Partial<Stage>, head = 20): Key3 =>
  ({ p: [t, u, 4, u, 4, ...legs, t, t + head, -2], st: { armOut: 6, farArmOut: 6, ...st } })
const midX = (b: Body) => (b.hand.x + b.farHand.x) / 2
/**
 * Side crow: the pelvis lies on its side (hips stacked, `roll`), knees bent forward and stacked on the near
 * upper arm above the elbow; the chest twists back to face the floor over shoulder-width hands, forearms vertical.
 */
const hz = (p: Pt) => p.z ?? 0
const sideCrowAt = (lean: number, toes: boolean, v0: number[], hands?: number[]) => fit3(
  ([t, tw, r, nu, nf, fu, ff, ao, fo, nt]) => ({ p: [t, nu, nf, fu, ff, nt, nt - 110, nt - 4, nt - 114, t, t + 25, -2], st: { roll: r, twist: tw, armOut: ao, farArmOut: fo } }),
  v0,
  (b) => {
    const c = com3(b)
    const mid = { x: (b.hand.x + b.farHand.x) / 2, z: (hz(b.hand) + hz(b.farHand)) / 2 }
    return [
      ...(hands ? off(b.farHand, b.hand, hands as [number, number, number]) : [b.hand.y - b.farHand.y, Math.hypot(b.hand.x - b.farHand.x, hz(b.hand) - hz(b.farHand)) - 40]),
      c.x - mid.x - lean, c.z - mid.z,
      ...off(b.knee, b.elbow, [0, -9, 0]),
      toes ? Math.max(b.toe.y, b.farToe.y) - b.hand.y : 0,
      (b.hand.x - b.elbow.x) * 0.3, (hz(b.hand) - hz(b.elbow)) * 0.3, (b.farHand.x - b.farElbow.x) * 0.3, (hz(b.farHand) - hz(b.farElbow)) * 0.3,
    ]
  },
)
const sideCrow = (() => {
  // From crow: the pelvis turns a quarter about the spine and the whole body rolls back so the chest faces the floor.
  const c = crow
  return sideCrowAt(0, false, [c[0], -80, 80, c[1], c[2], c[3], c[4], 0, 0, c[5]])
})()
const vars = (k: Key3) => [k.p[0], k.st.twist!, k.st.roll!, ...[1, 2, 3, 4].map((i) => k.p[i]!), k.st.armOut!, k.st.farArmOut!, k.p[5]!]
const scHands = (() => { const b = frame(sideCrow); return off(b.farHand, b.hand) })()
const sideCrowSway = sideCrowAt(3, false, vars(sideCrow), scHands)
const sideCrowIn = sideCrowAt(-6, true, vars(sideCrow), scHands)
// Grasshopper: the near leg straight out across the backs of the arms past the far elbow; the far leg bent, its
// foot resting on the straight leg's thigh.
const grassAt = (lean: number, toe: boolean) => fit3(
  ([t, u, nt, lo, ft, fs, fo]) => twistKey(t, u, [nt, nt, ft, fs], { legOut: lo, farLegOut: fo }, 25),
  [100, -60, 80, -50, 120, 20, 10],
  (b, [t]) => {
    const k = off(b.knee, b.farElbow, [0, -9, 0])
    return [toe ? (t - 98) * 0.5 : com3(b).x - midX(b) - lean, ...(toe ? [k[0], k[2], b.toe.y - b.hand.y] : k), ...off(b.farFoot, b.knee, [6, -8, 0])]
  },
)
const grasshopper = grassAt(0, false)
// Entry: trunk leaning in, the straight leg's toes still on the floor.
const grasshopperIn = grassAt(0, true)

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

/** Balance hold, seconds: [entry, hold, small correction], bounced; one sway ≈1.5 s each way. */
const bal = (entry: Pose, hold: Pose, sway: Pose, o: Partial<Move> = {}): Move => ({ keys: [entry, hold, sway], x: 'hand', ms: 1000, beats: holdBeats(1.5, 1.5), ...o })
/** Elbow lever entry: the hips rise so the knees pass over the floor, then the legs straighten back as the body tips level. */
const leverMid = [levered(74, [35, -145]), levered(74, [-35, -145])]
/** One-arm lever: the free hand lifts straight off the floor before it reaches forward. */
const oaMid = [[0.3, 4, 14], [0.7, 50, 32]].map(([f, x, y]) => {
  const h = joints(elbowLever).hand
  return armsTo(set(set(blend(elbowLever, oaLever, f, 'lin'), [3], elbowLever[3]), [4], elbowLever[4]), { x: h.x + x, y: h.y - y }, 1, 'far')
})
/** Small correction: fingers press and the hips settle a touch. */
const nod = (p: Pose, d = 3): Pose => set(set(p, [0], p[0] + d), [9], (p[9] ?? p[0]) + d)
const nod3 = (k: Key3): Key3 => ({ ...k, p: nudge(k.p, { 2: 2, 4: 2 }) })
/** Camera for the twists: a quarter off the front, the stacked legs toward the viewer. */
const TW = 35

export const MOVES: Record<string, Move> = {
  frog_stand: bal(frogIn, frog, nod(frog)),
  crow: bal(crowIn, crow, nod(crow)),
  side_crow: solidMove([sideCrowIn, sideCrow, sideCrowSway], holdBeats(1.5, 1.5), -60, { x: 'hand' }),
  crane: bal(crow, crane, nod(crane)),
  tripod_hs: { keys: [tripodTuck, tripod], x: 'hand', ms: 1000, beats: [{ hold: 0.5, dur: 2 }, { hold: 1 }] },
  flying_pigeon: solidMove([pigeonIn, pigeon, nod(pigeon)].map((p) => ({ p, st: { legOut: 20, shinOut: -90 } })), holdBeats(1.5, 1.5), 40, { x: 'hand' }),
  elbow_lever: { ...bal(leverTuck, elbowLever, nod(elbowLever, 2)), keys: [leverTuck, ...leverMid, elbowLever, nod(elbowLever, 2)], beats: [{ hold: 0.5, dur: 0.6 }, { dur: 0.5 }, { dur: 0.8 }, { dur: 1.5 }, { hold: 0.25 }] },
  forearm_stand: { keys: [faIn, forearm], x: 'elbow', ms: 1000, beats: [{ hold: 0.5, dur: 1.1, ease: 'out' }, { hold: 1 }] },
  grasshopper: solidMove([grasshopperIn, grasshopper, nod3(grasshopper)], holdBeats(1.5, 1.5), TW, { x: 'hand' }),
  oa_elbow_lever: { ...bal(elbowLever, oaLever, nod(oaLever, 2)), keys: [elbowLever, ...oaMid, oaLever, nod(oaLever, 2)], beats: [{ hold: 0.5, dur: 0.4 }, { dur: 0.4 }, { dur: 0.5 }, { dur: 1.5 }, { hold: 0.25 }] },
  crow_to_hs: { keys: [crow, crowTuck, HS], x: 'hand', ms: 1000, beats: [{ hold: 0.5, dur: 1.3 }, { dur: 1.5, ease: 'out' }, { hold: 0.8 }] },
  scorpion: { keys: [forearm, scorpion], x: 'elbow', ms: 1000, beats: [{ hold: 0.5, dur: 2 }, { hold: 1 }] },
}
