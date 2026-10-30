import { STAGE, com, joints, solid, type Beat, type Body, type Move, type Pose, type Pt, type Stage } from '../../core/figure'
import { fig } from './hips'
import { breathe, H, INSTEP, put, put3, where } from './mobility'
import { balance, holdBeats, pushup, solve } from './push'

type V3 = [number, number, number]
type Key = [Pose, Partial<Stage>]
const D = 180 / Math.PI
const PIN: Pick<Move, 'x' | 'y' | 'at'> = { x: 'hip', y: 'hip', at: [0, 0] }
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const world = (k: Key, hip: [number, number], j: keyof Body): V3 => {
  const b = solid(k[0], { ...STAGE, ...k[1] })[j]
  return [hip[0] + b.x, hip[1] - b.y, b.z ?? 0]
}

/**
 * build(o) with the planted targets moved by o = [x, z] until the centre of mass sits over `base`
 * (a point of the solid body, hip frame): one-leg and hand balances.
 */
function settle(build: (o: [number, number]) => Key, base: (b: Body) => Pt): Key {
  let o: [number, number] = [0, 0]
  for (let i = 0; i < 12; i++) {
    const k = build(o)
    const b = solid(k[0], { ...STAGE, ...k[1] })
    const c = com(b)
    const q = base(b)
    o = [o[0] + c.x - q.x, o[1] + c.z - (q.z ?? 0)]
  }
  return build(o)
}
const over = (j: keyof Body, dx = 3) => (b: Body): Pt => ({ x: b[j].x + dx, y: 0, z: b[j].z })
const between = (a: keyof Body, c: keyof Body, f: number) => (b: Body): Pt => ({ x: b[a].x + (b[c].x - b[a].x) * f, y: 0, z: (b[a].z ?? 0) + ((b[c].z ?? 0) - (b[a].z ?? 0)) * f })

/** Solid keys on the breath (mobility `breathe`): slide in through `path`, breathe in the last. */
/** Keys resting on the floor (floor pin) instead of the hip pin's `lift`. */
const grounded = (ks: Key[]): Key[] => ks.map(([p, s]) => [p, { ...s, lift: 0, shift: 0 }])
const breath3 = (path: Key[], ms = 900) => breathe(path.map(([p]) => p), ms, undefined, path.map(([, s]) => s))
/** Balance hold: entry, the pose, a breath's sway (≤5°), bounced. */
const hold3 = (ks: Key[]): Pick<Move, 'keys' | 'beats' | 'ms'> => ({ keys: ks.map(([p]) => p), beats: holdBeats(1.6, 1.6).map((b, i) => ({ ...ks[i][1], ...b })), ms: 1000 })

// ---- Sun salutation, side-on. Hands plant at x 27, front foot at x 0; `shift` carries the hip.
const HX = 27
const [plank, chat] = pushup()
/** Hip in the world for a pose with its near hand planted at HX. */
const hipAt = (p: Pose): [number, number] => { const b = joints(p); return [HX - b.hand.x, H.hand + b.hand.y] }
const PLANK_HIP = hipAt(plank)
const PFX = PLANK_HIP[0] + joints(plank).foot.x
type K2 = { p: Pose; x: number }
const k2 = (p: Pose, hip: [number, number], to: Parameters<typeof put>[2], k: Parameters<typeof put>[3] = {}): K2 => ({ p: put(p, hip, to, k), x: hip[0] })
const FEET = { foot: [0, H.ankle] as [number, number], farFoot: [0, H.ankle] as [number, number] }
const HANDS = { hand: [HX, H.hand] as [number, number], farHand: [HX, H.hand] as [number, number] }
const prayer = k2([180, 20, 150, 20, 150, 0, 0, 0, 0, 180, 180], [0, 81], FEET)
const reach = k2([182, 185, 190, 185, 190, 0, 0, 0, 0, 194, 205], [-2, 80.8], FEET)
const fold = k2([50, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0], [-8, 80.6], { ...FEET, ...HANDS }, { hand: 1, farHand: 1 })
/** Lunge, hands down: `back` foot at the plank's, the other between the hands. */
const lunge = (back: 'foot' | 'farFoot'): K2 => k2([60, 0, 0, 0, 0, 0, 0, 0, 0, 50, 60], [-28, 42],
  { ...HANDS, [back]: [PFX, 8], [back === 'foot' ? 'farFoot' : 'foot']: [2, H.ankle] }, { hand: 1, farHand: 1 })
const plankK: K2 = { p: plank, x: PLANK_HIP[0] }
const chatK: K2 = { p: chat, x: hipAt(chat)[0] }
const updog = k2([118, 0, 0, 0, 0, -97, -97, -97, -97, 150, 165], [PFX + 74, 18], { ...HANDS, foot: [PFX - 2, 4], farFoot: [PFX - 2, 4] })
// Down-dog: hip where a straight arm-and-trunk line from the hands (99) meets straight legs from the heels (75.5).
const DOG = (() => {
  const [ax, ah, bx, bh, ra, rb] = [HX, H.hand, PFX, H.ankle, 99, 75.5]
  const d = Math.hypot(ax - bx, ah - bh)
  const a = (ra * ra - rb * rb + d * d) / (2 * d)
  const h = Math.sqrt(ra * ra - a * a)
  const [ux, uy] = [(bx - ax) / d, (bh - ah) / d]
  const c = [-1, 1].map((k) => [ax + a * ux - k * h * uy, ah + a * uy + k * h * ux] as [number, number])
  return c[0][1] > c[1][1] ? c[0] : c[1]
})()
const dogT = Math.atan2(HX - DOG[0], DOG[1] - H.hand) * D
const downdog = k2([dogT, dogT, dogT, dogT, dogT, 0, 0, 0, 0, dogT, dogT - 15], DOG, { ...HANDS, foot: [PFX, H.ankle], farFoot: [PFX, H.ankle] })
const SUN: [K2, Beat][] = [
  [prayer, { hold: 0.6, dur: 1.4 }], [reach, { hold: 0.3, dur: 1.6 }], [fold, { hold: 0.4, dur: 1.2 }], [lunge('foot'), { dur: 1 }],
  [plankK, { hold: 0.4, dur: 1.6 }], [chatK, { hold: 0.2, dur: 1.2 }], [updog, { hold: 0.6, dur: 1.4 }], [downdog, { hold: 2.5, dur: 1.2 }],
  [lunge('farFoot'), { dur: 1 }], [fold, { hold: 0.4, dur: 1.6 }], [reach, { hold: 0.3, dur: 1.4 }],
]

// ---- Warrior II, solid: stance along z (front knee to the near side), hips and chest open to +x.
const W2 = { front: 47, back: -66 }
const warrior2 = (h: number, up: number, prev?: Key): Key => {
  const sh = h + 46
  const arm = (s: number): V3 => [2 - 2 * up, sh - 53 + 53 * up, s * (22 + 48 * up)]
  return fig([180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180], [0, h], {
    foot: { end: [0, H.ankle, W2.front], pole: [0.1, 0.2, 1] }, farFoot: { end: [0, H.ankle, W2.back], pole: [1, 0, 0] },
    hand: { end: arm(1), pole: [0, -1, 0.3] }, farHand: { end: arm(-1), pole: [0, -1, -0.3] },
  }, {}, prev)
}

// ---- Triangle family, solid with `roll` (put3): feet along z, the body tips sideways over the near (front) leg.
/** Hip height where the lower-reaching foot just touches. */
const standH = (build: (h: number) => Key, feet: (keyof Body)[], hip0 = 0): number =>
  solve((h) => Math.max(...feet.map((f) => world(build(h), [hip0, h], f)[1])) - H.ankle - 0.3, 30, 95)
/** Arms in one vertical line through the shoulders: near hand down (to `low` at most), far hand up. */
const armsLine = (p: Pose, st: Partial<Stage>, hip: [number, number], low: number, to: Partial<Record<'foot' | 'farFoot', V3>>): Key => {
  const k: Key = [p, st]
  const [n, f] = [world(k, hip, 'nearShoulder'), world(k, hip, 'farShoulder')]
  return put3(p, st, hip, { ...to, hand: [n[0] + 2, Math.max(low, n[1] - 53), n[2] + 4], farHand: [f[0], f[1] + 53, f[2] - 2] })
}
const triangle = (roll: number, low: number): Key => {
  const feet = { foot: [0, H.ankle, 56] as V3, farFoot: [0, H.ankle, -54] as V3 }
  const st: Partial<Stage> = { roll }
  const base: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180]
  const legs = (h: number): Key => put3(base, st, [0, h], feet)
  const h = standH(legs, ['foot', 'farFoot'])
  const [p, s] = legs(h)
  return armsLine(p, s, [0, h], low, feet)
}
// Half moon, mastery form: standing on the near leg, trunk and far leg level toward ±z, bottom hand hovering.
const halfMoon = (roll: number, lift: number): Key => settle((o) => {
  const st: Partial<Stage> = { roll }
  const base: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180]
  const stand: V3 = [o[0], H.ankle, o[1]]
  const h = solve((h) => world(put3(base, st, [0, h], { foot: stand }), [0, h], 'foot')[1] - H.ankle - 0.3, 40, 95)
  const k0 = put3(base, st, [0, h], { foot: stand })
  const fh = world(k0, [0, h], 'farHip')
  const legs = put3(k0[0], k0[1], [0, h], { foot: stand, farFoot: [fh[0], fh[1] + lift, fh[2] - 76] })
  return armsLine(legs[0], legs[1], [0, h], H.hand, { foot: stand, farFoot: [fh[0], fh[1] + lift, fh[2] - 76] })
}, between('heel', 'toe', 0.5))
// Revolved triangle: short stance along x, trunk hinged and twisted to open toward the near side; far hand outside the front foot.
const revTriangle = (twist: number, t: number): Key => {
  const feet = { foot: [40, H.ankle, 9] as V3, farFoot: [-40, H.ankle, -9] as V3 }
  const st: Partial<Stage> = { twist }
  const base: Pose = [t, 0, 0, 0, 0, 0, 0, 0, 0, t - 8, t - 15]
  const legs = (h: number): Key => put3(base, st, [0, h], feet)
  const h = standH(legs, ['foot', 'farFoot'])
  const k = legs(h)
  const n = world(k, [0, h], 'nearShoulder')
  return put3(k[0], k[1], [0, h], { ...feet, farHand: [44, H.hand, 24], hand: [n[0], n[1] + 53, n[2]] })
}

// ---- One-leg balances, solid (fig, hip pinned): the standing foot moves under the centre of mass.
const tree = (up: number, prev?: Key): Key => settle((o) => fig([180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180], [0, 81], {
  farFoot: { end: [o[0], H.ankle, -10 + o[1]] },
  foot: { end: [5 + o[0], 46, -3 + o[1]], mid: [16 + o[0], 56, 34 + o[1]] },
  hand: { end: [12, 106 + 72 * up, 2], pole: [0, -0.3, 1] }, farHand: { end: [12, 106 + 72 * up, -2], pole: [0, -0.3, -1] },
}, {}, prev), over('farFoot'))
const treeIn = fig([180, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180], [0, 81], {
  farFoot: { end: [0, H.ankle, -10] }, foot: { end: [0, H.ankle, 10] },
  hand: { end: [12, 106, 2], pole: [0, -0.3, 1] }, farHand: { end: [12, 106, -2], pole: [0, -0.3, -1] },
})
// Eagle: sit low on the far leg, near thigh over it, near foot hooked behind the far calf; arms wrapped, elbows up.
const eagle = (sit: number, prev?: Key): Key => settle((o) => fig([166, 0, 0, 0, 0, 0, 0, 0, 0, 170, 175], [-12, 70 - sit], {
  farFoot: { end: [6 + o[0], H.ankle, -9 + o[1]], pole: [1, 0, 0] },
  foot: { end: [0 + o[0], 24, -15 + o[1]], mid: [16 + o[0], 52 - sit, -6 + o[1]] },
  hand: { end: [24, 142 - sit, -3], mid: [22, 116 - sit, 2] }, farHand: { end: [26, 140 - sit, 3], mid: [22, 114 - sit, -2] },
}, {}, prev), over('farFoot'))
const eagleIn = fig([176, 0, 0, 0, 0, 0, 0, 0, 0, 178, 180], [-4, 78], {
  farFoot: { end: [0, H.ankle, -10], pole: [1, 0, 0] }, foot: { end: [0, H.ankle, 10], pole: [1, 0, 0] },
  hand: { end: [8, 72, 22] }, farHand: { end: [8, 72, -22] },
})

// ---- Warrior III and dancer, side-on: the standing (far) leg's lean is solved so the centre of mass sits over its foot.
const onFoot = (shape: (v: number) => Pose) => balance(shape, -25, 25, (b) => b.farFoot.x + 3)
const warrior3 = (t: number) => onFoot((v) => [t, t, t, t, t, t - 180, t - 180, v, v, t, t + 6])
/** Hand to the near ankle, pose relative to the hip. */
const holdFoot = (p: Pose, k = 1): Pose => put(p, [0, 0], { hand: where(p, [0, 0], 'foot') }, { hand: k })
const dancer = (t: number, thigh: number) => onFoot((v) => holdFoot([t, 0, 0, t - 20, t - 25, thigh, thigh + 125, v, v, t + 8, t - 10], -1))

// ---- Floor poses, side-on.
// Lizard: front (near) foot at x 42, rear knee down at x -30 on the instep; hands, then forearms, inside the foot.
const lizard = (thigh: number, t: number, c: number, hand: [number, number], k = 1): Pose => {
  const hip: [number, number] = [-30 + Math.sin(-thigh / D) * 38, H.knee + Math.cos(thigh / D) * 38]
  return put([t, 0, 0, 0, 0, 40, 0, thigh, INSTEP, c, c + 15], hip, { foot: [42, H.ankle], hand, farHand: hand }, { hand: k, farHand: k })
}
// Bow: on the belly, hands hold the ankles; kicking back lifts the chest and knees.
const bow = (t: number, c: number, head: number, thigh: number, shin: number): Pose => {
  const p: Pose = [t, 0, 0, 0, 0, thigh, shin, thigh, shin, c, head]
  const f = where(p, [0, 0], 'foot')
  return put(p, [0, 0], { hand: f, farHand: f }, { hand: 1, farHand: 1 })
}
// Shoulder stand and plough: shoulders on the floor at x 0, head back along it.
const SH: [number, number] = [0, 11]
const fromShoulder = (p: Pose): [number, number] => { const s = joints(p).shoulder; return [SH[0] - s.x, SH[1] + s.y] }
const sstand = (t: number): Pose => {
  const p: Pose = [t, 0, 0, 0, 0, 180 + t, 180 + t, 180 + t, 180 + t, t, -90]
  const hip = fromShoulder(p)
  const w = where(p, hip, 'shoulder')
  return put(p, hip, { hand: [w[0] + 9, w[1] + 18], farHand: [w[0] + 9, w[1] + 18] }, { hand: 1, farHand: 1 })
}
const plough = (t: number, fx: number): Pose => {
  const p: Pose = [t, 84, 86, 84, 86, 0, 0, 0, 0, t, -90]
  const hip = fromShoulder(p)
  return put(p, hip, { foot: [fx, 4], farFoot: [fx, 4] })
}
// Headstand: crown at x 0, forearms down in front of the face, hands clasped round the back of the head.
const ARMS_HS = [-34, 90, -34, 90] as const
const headstand = (thigh: number, shin: number) => balance((v) => [v, ...ARMS_HS, v + thigh, v + shin, v + thigh, v + shin, v, 0], -40, 40, (b) => b.head.x)

// ---- Pigeon family, solid: front shin across the body, back leg long behind.
const pigeonLegs = (back?: V3): Parameters<typeof fig>[2] => ({
  foot: { end: [24, H.ankle, -16], mid: [30, 5, 20] },
  farFoot: back ? { end: back, mid: [-36, H.knee, -12] } : { end: [-74, H.ankle, -12], pole: [0, 1, 0] },
})
const pigeonUp = (t: number, prev?: Key): Key => fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t + 2, t + 4], [0, 14], {
  ...pigeonLegs(), hand: { end: [12, H.hand, 24], pole: [-1, 0, 0] }, farHand: { end: [12, H.hand, -24], pole: [-1, 0, 0] },
}, {}, prev)
const pigeonFold = (t: number, prev?: Key): Key => fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t + 10, t + 20], [0, 14], {
  ...pigeonLegs(), hand: { end: [72, H.hand, 13], mid: [44, H.knee, 15] }, farHand: { end: [72, H.hand, -13], mid: [44, H.knee, -15] },
}, {}, prev)
/** King pigeon: back shin vertical, the spine arches back and the hands hold the foot overhead, elbows up. */
const kingPigeon = (t: number, c: number, head: number, prev?: Key): Key => {
  const foot: V3 = [-40, 43, -12]
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, c, head], [0, 14], {
    ...pigeonLegs(foot), hand: { end: add(foot, [0, 4, 4]), pole: [0.3, 1, 0.3] }, farHand: { end: add(foot, [0, 4, -4]), pole: [0.3, 1, -0.3] },
  }, {}, prev)
}

// ---- Eight-angle: hands planted, elbows bent back, both straight legs out to the near side; hands settle under the centre of mass.
const eightAngle = (lift: number, prev?: Key): Key => settle((o) => fig([96, 0, 0, 0, 0, 0, 0, 0, 0, 92, 78], [-5, 31], {
  hand: { end: [30 + o[0], H.hand, 14 + o[1]], pole: [-1, 0, 0.3] }, farHand: { end: [30 + o[0], H.hand, -14 + o[1]], pole: [-1, 0, -0.3] },
  foot: { end: [44, 34 + lift, 80], pole: [0, 1, 0] }, farFoot: { end: [42, 30 + lift, 76], pole: [0, 1, 0] },
}, {}, prev), between('hand', 'farHand', 0.5))

const TRI_VIEW = 80
const HALF_MOON = halfMoon(-78, 0)
export const MOVES: Record<string, Move> = {
  // One breath per move: reach, fold, step back, lower, up-dog, down-dog (held), step forward, fold, rise.
  sun_salute: { keys: SUN.map(([k]) => k.p), beats: SUN.map(([k, b]) => ({ ...b, shift: k.x })), mode: 'cycle', ms: 1000 },
  // Front knee bends over the ankle as the arms rise to shoulder height.
  warrior2: { ...breath3([warrior2(57, 0), warrior2(52, 1), warrior2(51, 1)]), ...PIN, solid: true, view: TRI_VIEW, tilt: 8 },
  triangle: { ...breath3([triangle(-20, 40), triangle(-52, 20), triangle(-56, 16)]), solid: true, view: TRI_VIEW, tilt: 8 },
  tree_pose: { ...hold3([treeIn, tree(0), tree(1)]), ...PIN, solid: true, view: 75, tilt: 8 },
  lizard_lunge: { ...breathe([lizard(-40, 108, 100, [48, H.hand], -1), lizard(-55, 96, 92, [72, H.hand], -1)]), point: 'far' },
  half_moon: { ...breath3([halfMoon(-60, -20), HALF_MOON, halfMoon(-80, 0)]), solid: true, view: TRI_VIEW, tilt: 8 },
  eagle: { ...hold3([eagleIn, eagle(0), eagle(3)]), ...PIN, solid: true, view: 40, tilt: 8 },
  pigeon_pose: { ...breath3(grounded([pigeonUp(176), pigeonFold(80), pigeonFold(74)])), solid: true, view: 35, tilt: 15, point: 'far' },
  rev_triangle: { ...breath3([revTriangle(0, 176), revTriangle(70, 100), revTriangle(80, 98)]), solid: true, view: 30, tilt: 8 },
  warrior3: { keys: [[180, 0, 0, 0, 0, 0, 0, 0, 0], warrior3(90), warrior3(93)], beats: holdBeats(1.6, 1.6), ms: 1000, x: 'farFoot' },
  // Kick into the hands: chest and knees rise together.
  bow: { ...breathe([bow(96, 110, 120, -100, -200), bow(98, 132, 145, -118, -228)]), point: true },
  eight_angle: { ...hold3([eightAngle(-14), eightAngle(0), eightAngle(2)]), ...PIN, solid: true, view: -40, tilt: 10 },
  dancer: { keys: [[180, 0, 0, 0, 0, 0, 0, 0, 0], dancer(135, -125), dancer(132, -130)], beats: holdBeats(1.8, 1.6), ms: 1000, x: 'farFoot' },
  // Shoulder stand held, legs lower straight to the plough behind the head, held, and lift back.
  shoulder_stand: {
    keys: [sstand(0), sstand(2), plough(18, -64), plough(18, -66)], x: 'shoulder', ms: 1000, mode: 'cycle',
    beats: [{ hold: 0.4, dur: 2 }, { hold: 0.4, dur: 2.4 }, { hold: 0.4, dur: 2 }, { hold: 0.4, dur: 2.4 }],
  },
  sirsasana: { keys: [headstand(-45, -185), headstand(180, 180), headstand(178, 178)], beats: holdBeats(2, 1.6), ms: 1000, x: 'head' },
  king_pigeon: { ...breath3(grounded([pigeonUp(178), kingPigeon(186, 215, 250), kingPigeon(196, 238, 290)])), solid: true, view: -50, tilt: 10 },
}
