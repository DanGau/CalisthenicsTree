/**
 * A cartoon figure posed by absolute limb angles in degrees:
 * 0 points down, 90 forward (+x, the way the figure faces), 180 up, -90 back.
 * Angles never wrap, so 0 → 360 animates a full rotation (rolls, flips).
 */
export type Pose = [torso: number, nearUpperArm: number, nearForearm: number, farUpperArm: number, farForearm: number,
  nearThigh: number, nearShin: number, farThigh: number, farShin: number, chest?: number, head?: number, scap?: number]

/**
 * `torso` is the pelvis-to-waist segment; optional `chest` (waist to shoulders, default = torso)
 * bends the spine (hollow, arch, rounding); optional `head` (default = chest) tilts the head;
 * optional `scap` moves the shoulders along the chest: + shrug/elevate, - depress (units, about -5..6).
 */
export const full = (p: Pose): Required<Pose> => {
  const chest = p[9] ?? p[0]
  return [...p.slice(0, 9), chest, p[10] ?? chest, p[11] ?? 0] as Required<Pose>
}

export type Joint = 'hip' | 'shoulder' | 'head' | 'elbow' | 'hand' | 'knee' | 'foot' | 'farHand' | 'farFoot'

export type Prop =
  | { t: 'bar'; x: number; y: number }
  /** `z` (solid moves): one ring at that depth; omitted, a pair either side. */
  | { t: 'rings'; x: number; y: number; z?: number }
  | { t: 'wall'; x: number }
  | { t: 'pole'; x: number }
  /** `z` (solid moves): depth of the box centre. */
  | { t: 'box'; x: number; w: number; h: number; z?: number }
  /** Parallel bars or parallettes seen end-on: a post topped at `y`. */
  | { t: 'bars'; x: number; y: number; z?: number }
  /** Hangboard or campus rung: a block in front of the hands, its edge under a hand pinned at (x, y); `w` its width (solid). */
  | { t: 'board'; x: number; y: number; z?: number; w?: number }
  /**
   * Stall bars (Swedish ladder): rungs every 13 at x from y -13 to -221 (`RUNG(k)`), the wall 13 behind on side `wall`
   * (default +x); front view, edge-on without the wall. Solid: rails at `z` and `z + span` (default -40, 80).
   */
  | { t: 'stall'; x: number; wall?: 1 | -1; z?: number; span?: number }

/** Height of stall bar rung `k` (1 = lowest, 17 = top). */
export const RUNG = (k: number) => -13 * k

/**
 * `keys` play in order. `bounce` plays them back in reverse (reps); `cycle` jumps from the
 * last to the first (rolls, crawls). `x` and `y` name the joint pinned to `at`; y = 'floor'
 * rests the lowest point on the floor. `front` draws a front view with limbs out to the sides.
 */
export type Move = {
  keys: Pose[]
  mode?: 'bounce' | 'cycle'
  x?: Joint
  y?: Joint | 'floor'
  at?: [number, number]
  props?: Prop[]
  /** A strap from the hands around the ball of the near foot, drawn each frame. */
  strap?: boolean
  front?: boolean
  /** True 3D: limbs swing out (`armOut`..), the body rolls and turns, drawn by depth. */
  solid?: boolean
  /** Solid moves: camera turns about the vertical by this many degrees, props and all (0 side, 90 front). */
  view?: number
  /** Solid moves: camera looks down by this many degrees, so circles on the floor plane read (flare, back spin). */
  tilt?: number
  /** With `front`: seen from behind (no face). */
  back?: boolean
  /** Toes pointed all loop (kneeling, prone, tops of the feet on the floor); 'near' or 'far' for one foot. */
  point?: boolean | 'near' | 'far'
  floor?: boolean
  /** Milliseconds per transition. */
  ms?: number
  /** Per key, parallel to `keys`: lift, holds and the timing of the transition to the next key. */
  beats?: Beat[]
  /** Distance the figure travels each loop (`cycle` gaits, runs, crawls, walks); the view follows it. */
  travel?: number
  /** Height gained each loop (rope climbs); the view follows it up. */
  climb?: number
  /** Overlap: forearms, shins and head trail the body by this fraction of a transition (0.1-0.25 for swings, throws, flight). */
  flow?: number
  /** Solid moves: limb ends held still while down (mocap contacts), by shift and limb IK. */
  plants?: Plant[]
  /** Arms turn about the pinned hand (`x: 'hand'`) so the centre of mass stays over or under it: holds and slow reps on the hands. */
  balance?: boolean
}

/** `joint` stays at its mean place from `from` to `to` (loop time, in `dur` units; `from > to` wraps the seam). */
export type Plant = { joint: 'hand' | 'farHand' | 'foot' | 'farFoot'; from: number; to: number }

/**
 * - `in`: accelerates (falling, dropping into a catch); `out`: decelerates (rising to an apex, settling).
 * - `snap`: explosive start, long settle (kips, jumps, throws); `io`: smooth both ends (default); `lin`: constant (cyclic gaits).
 */
export type Ease = 'io' | 'in' | 'out' | 'snap' | 'lin'

/**
 * `lift`: height above the move's pinned placement (flight phases). `shift`: forward offset (travel within
 * a loop: broad jump, push away from a wall). `turn`: degrees the body has turned about its vertical axis
 * (0 side view, 90 facing the viewer edge-on, 180 mirrored: rolling over, turning round). `trunk`: trunk length
 * scale for foreshortening (front view, trunk pointing at the viewer: 0.4-0.8); `legs` and `arms` the same for both legs or arms (arms angled out to the side in side view). `hold`: pause on this key in
 * transitions (default: 0.3 at the turnaround keys of a bounce, else 0). `dur`: length of the
 * transition to the next key in transitions (default 1). `ease`: how that transition moves.
 */
export type Stage = {
  lift: number; shift: number; turn: number; trunk: number; legs: number; arms: number
  /**
   * `solid` moves only: `roll` about the body's forward axis; each limb's swing out to its side (abduction);
   * `foreOut`..`farShinOut` add to that for the forearm or shin alone (knee out, foot back under: 90/90, goalpost arms);
   * `twist` turns the chest, arms and head about the spine against the pelvis (thread the needle).
   */
  roll: number; armOut: number; farArmOut: number; legOut: number; farLegOut: number
  foreOut: number; farForeOut: number; shinOut: number; farShinOut: number; twist: number
  /**
   * Shoulders slide round the ribcage toward the chest's front (+, protraction) or back (-, retraction), units, about
   * -5..6. With hands planted the ribcage moves instead: up between the blades protracted, sinking retracted.
   */
  protract: number
}
/** `air`: the transition to the next key is airborne (see `aloft`). */
export type Beat = Partial<Stage> & { hold?: number; dur?: number; ease?: Ease; air?: boolean }
export const STAGE: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1, legs: 1, arms: 1, roll: 0, armOut: 0, farArmOut: 0, legOut: 0, farLegOut: 0, foreOut: 0, farForeOut: 0, shinOut: 0, farShinOut: 0, twist: 0, protract: 0 }
const KEYS = Object.keys(STAGE) as (keyof Stage)[]
const stage = (b: Beat): Stage => ({ ...STAGE, ...Object.fromEntries(KEYS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]])) })

const EASE: Record<Ease, (t: number) => number> = {
  io: (t) => t * t * (3 - 2 * t),
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  snap: (t) => 1 - (1 - t) ** 3,
  lin: (t) => t,
}
const REVERSE: Record<Ease, Ease> = { io: 'io', in: 'out', out: 'in', snap: 'in', lin: 'lin' }

/** Median US man (~175 cm, about 7 heads tall); 1 unit is about 1.1 cm. */
export const LEN = { waist: 22, chest: 24, neck: 18, head: 11, upper: 29, fore: 25, thigh: 38, shin: 38, foot: 13, sole: 5 }
/** Half widths of the front-view shoulder and hip girdles. */
const GIRDLE = { shoulder: 17, hip: 10 }

/** `z` (solid moves) points toward the viewer. */
export type Pt = { x: number; y: number; z?: number }
/** `face` is a point just in front of the head centre: which way the figure looks. */
export type Body = Record<Joint, Pt> & { face: Pt; waist: Pt; nearShoulder: Pt; nearHip: Pt; farShoulder: Pt; farHip: Pt; farElbow: Pt; farKnee: Pt; toe: Pt; farToe: Pt; heel: Pt; farHeel: Pt }

const dir = (deg: number, len: number): Pt => {
  const r = (deg * Math.PI) / 180
  return { x: Math.sin(r) * len, y: Math.cos(r) * len }
}
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y })
const ramp = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)))

/** Foot direction for a shin angle: flat when standing, square to the shin in a plank, pointed when inverted. */
export function footAngle(shin: number) {
  const w = ((((shin + 180) % 360) + 360) % 360) - 180
  const a = Math.abs(w)
  const flat = 90 + w * ramp(a, 45, 75)
  // Inverted: the toes swing from square to the shin round to in line with it.
  return flat - 90 * ramp(a, 120, 160)
}

/** Joint positions with the hip at the origin. */
export function joints(p: Pose, front = false, point: Move['point'] = false, trunk = 1, legs = 1, arms = 1, protract = 0): Body {
  const [t, nu, nf, fu, ff, nt, ns, ft, fs, c, h] = full(p)
  const hip = { x: 0, y: 0 }
  const waist = dir(t, LEN.waist * trunk)
  const shoulder = add(waist, dir(c, LEN.chest * trunk))
  // Front view: limbs hang from shoulders and hips set apart; side view: they share a joint.
  const side = (deg: number, w: number): Pt => (front ? dir(deg + 90, w) : { x: 0, y: 0 })
  const sh = add(add(shoulder, dir(c, p[11] ?? 0)), dir(c - 90, protract))
  const nS = add(sh, side(c, -GIRDLE.shoulder))
  const fS = add(sh, side(c, GIRDLE.shoulder))
  const nH = add(hip, side(t, -GIRDLE.hip))
  const fH = add(hip, side(t, GIRDLE.hip))
  const elbow = add(nS, dir(nu, LEN.upper * arms))
  const farElbow = add(fS, dir(fu, LEN.upper * arms))
  const knee = add(nH, dir(nt, LEN.thigh * legs))
  const farKnee = add(fH, dir(ft, LEN.thigh * legs))
  const foot = add(knee, dir(ns, LEN.shin * legs))
  const farFoot = add(farKnee, dir(fs, LEN.shin * legs))
  // The sole sits below the ankle; side view: heel just behind, toes ahead.
  const sole = (f: Pt, s: number, len: number, pt: boolean) => add(add(f, dir(s, LEN.sole)), dir(pt ? s + 15 : footAngle(s), front ? 0 : len))
  const [pn, pf] = [point === true || point === 'near', point === true || point === 'far']
  return {
    hip, waist, shoulder: sh, head: add(shoulder, dir(h, LEN.neck)), face: add(add(shoulder, dir(h, LEN.neck)), dir(c - 90, 1)),
    elbow, hand: add(elbow, dir(nf, LEN.fore * arms)), farElbow, farHand: add(farElbow, dir(ff, LEN.fore * arms)),
    knee, farKnee, foot, farFoot,
    toe: sole(foot, ns, LEN.foot, pn), farToe: sole(farFoot, fs, LEN.foot, pf),
    heel: sole(foot, ns, -4, pn), farHeel: sole(farFoot, fs, -4, pf),
    nearShoulder: nS, nearHip: nH, farShoulder: fS, farHip: fH,
  }
}

const POINTS = ['hip', 'waist', 'shoulder', 'elbow', 'hand', 'farElbow', 'farHand', 'knee', 'farKnee', 'foot', 'farFoot', 'toe', 'farToe', 'heel', 'farHeel'] as const

type V3 = [number, number, number]
const rad = (d: number) => (d * Math.PI) / 180
/** Unit direction of a segment at sagittal angle `a`, swung `out` degrees toward side `s` (+1 near, toward the viewer at turn 0). */
const dir3 = (a: number, out: number, s: number, len: number): V3 =>
  [Math.sin(rad(a)) * Math.cos(rad(out)) * len, Math.cos(rad(a)) * Math.cos(rad(out)) * len, s * Math.sin(rad(out)) * len]
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

/**
 * A true 3D body: sagittal angles from the pose, limbs swung out by `armOut`..`farLegOut`, the whole body
 * rolled about its forward axis by `roll`, then turned about the vertical by `turn` (90 faces the viewer).
 * Projected orthographically; `z` keeps depth for drawing order.
 */
export function solid(p: Pose, st: Stage, point: Move['point'] = false): Body {
  const [t, nu, nf, fu, ff, nt, ns, ft, fs, c, h, sc] = full(p)
  const hip: V3 = [0, 0, 0]
  const waist = dir3(t, 0, 0, LEN.waist * st.trunk)
  const shoulder = add3(add3(add3(waist, dir3(c, 0, 0, LEN.chest * st.trunk)), dir3(c, 0, 0, sc)), dir3(c - 90, 0, 0, st.protract))
  const nS = add3(shoulder, [0, 0, GIRDLE.shoulder])
  const fS = add3(shoulder, [0, 0, -GIRDLE.shoulder])
  const nH: V3 = [0, 0, GIRDLE.hip]
  const fH: V3 = [0, 0, -GIRDLE.hip]
  const limb = (root: V3, a: number, b: number, out: number, out2: number, s: number, l1: number, l2: number) => {
    const mid = add3(root, dir3(a, out, s, l1))
    return [mid, add3(mid, dir3(b, out + out2, s, l2))]
  }
  const [elbow, hand] = limb(nS, nu, nf, st.armOut, st.foreOut, 1, LEN.upper * st.arms, LEN.fore * st.arms)
  const [farElbow, farHand] = limb(fS, fu, ff, st.farArmOut, st.farForeOut, -1, LEN.upper * st.arms, LEN.fore * st.arms)
  const [knee, foot] = limb(nH, nt, ns, st.legOut, st.shinOut, 1, LEN.thigh * st.legs, LEN.shin * st.legs)
  const [farKnee, farFoot] = limb(fH, ft, fs, st.farLegOut, st.farShinOut, -1, LEN.thigh * st.legs, LEN.shin * st.legs)
  const sole = (f: V3, sh: number, out: number, s: number, len: number, pt: boolean) =>
    add3(add3(f, dir3(sh, out, s, LEN.sole)), dir3(pt ? sh + 15 : footAngle(sh), out, s, len))
  const [pn, pf] = [point === true || point === 'near', point === true || point === 'far']
  const head = add3(shoulder, dir3(h, 0, 0, LEN.neck))
  // Facing: the chest's forward normal, carried through the same rotations as the joints.
  const face = add3(head, dir3(c - 90, 0, 0, 1))
  const pts: Record<string, V3> = {
    hip, waist, shoulder, head, face, elbow, hand, farElbow, farHand, knee, farKnee, foot, farFoot,
    toe: sole(foot, ns, st.legOut + st.shinOut, 1, LEN.foot, pn), farToe: sole(farFoot, fs, st.farLegOut + st.farShinOut, -1, LEN.foot, pf),
    heel: sole(foot, ns, st.legOut + st.shinOut, 1, -4, pn), farHeel: sole(farFoot, fs, st.farLegOut + st.farShinOut, -1, -4, pf),
    nearShoulder: nS, nearHip: nH, farShoulder: fS, farHip: fH,
  }
  // Twist: the upper body turns about the spine axis through the waist.
  if (st.twist) {
    const ax = dir3(c, 0, 0, 1)
    const [ct, sn] = [Math.cos(rad(st.twist)), Math.sin(rad(st.twist))]
    for (const k of ['shoulder', 'head', 'face', 'elbow', 'hand', 'farElbow', 'farHand', 'nearShoulder', 'farShoulder']) {
      const v = pts[k].map((q, i) => q - waist[i]) as V3
      const dot = v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]
      const cr3: V3 = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]]
      pts[k] = v.map((q, i) => waist[i] + q * ct + cr3[i] * sn + ax[i] * dot * (1 - ct)) as V3
    }
  }
  const [cr, sr, cy, sy] = [Math.cos(rad(st.roll)), Math.sin(rad(st.roll)), Math.cos(rad(st.turn)), Math.sin(rad(st.turn))]
  const out = {} as Body
  for (const [k, [x, y, z]] of Object.entries(pts)) {
    const [y1, z1] = [y * cr - z * sr, y * sr + z * cr]
    out[k as keyof Body] = { x: x * cy - z1 * sy, y: y1, z: x * sy + z1 * cy }
  }
  return out
}

/** A scene point seen through a solid move's camera: turned by `view`, then tilted down by `tilt`. */
export function camera(m: Move, v: Pt): Pt {
  const [cv, sv, ct, st] = [Math.cos(rad(m.view ?? 0)), Math.sin(rad(m.view ?? 0)), Math.cos(rad(m.tilt ?? 0)), Math.sin(rad(m.tilt ?? 0))]
  const z0 = v.z ?? 0
  const [x, z] = [v.x * cv - z0 * sv, v.x * sv + z0 * cv]
  return { x, y: v.y * ct + z * st, z: z * ct - v.y * st }
}

/** Joints placed in the scene per the move's pins. */
export function place(m: Move, p: Pose, st: Partial<Stage> = {}): Body {
  const full3 = { ...STAGE, ...st }
  const { lift, shift, turn, trunk, legs, arms } = full3
  if (m.solid) {
    // Pin on true heights, then move the camera, so contacts stay put as the body turns.
    const b = pin(m, solid(p, full3, m.point), lift, shift)
    for (const v of Object.values(b)) Object.assign(v, camera(m, v))
    return b
  }
  const raw = joints(p, m.front, m.point, trunk, legs, arms, full3.protract)
  // Turning about the vertical axis squeezes x about the hip; past 90 the figure faces the other way.
  // A floor of 0.3 width keeps the body readable mid-turn; it flips sides at 90 like a cartoon turn.
  const c = Math.cos((turn * Math.PI) / 180)
  const k = (c < 0 ? -1 : 1) * (0.3 + 0.7 * Math.abs(c))
  const b = {} as Body
  for (const [n, v] of Object.entries(raw)) b[n as keyof Body] = { x: v.x * k, y: v.y }
  return pin(m, b, lift, shift)
}

function pin(m: Move, b: Body, lift: number, shift: number): Body {
  const [ax, ay] = m.at ?? [0, 0]
  const xj = b[m.x ?? 'hip']
  const lowest = Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
  const dy = ((m.y ?? 'floor') === 'floor' ? ay - lowest : ay - b[m.y as Joint].y) - lift
  const dx = ax - xj.x + shift
  const out = {} as Body
  // Solid moves: the pinned joint also sits at depth 0, so the camera turns about it and it stays put.
  const dz = -(xj.z ?? 0)
  for (const [k, v] of Object.entries(b)) out[k as keyof Body] = { x: v.x + dx, y: v.y + dy, z: v.z === undefined ? undefined : v.z + dz }
  return out
}

/** Segment mass fractions (Winter 2009: head 8 %, trunk 50 %, upper arm 2.8 %, forearm and hand 2.2 %, thigh 10 %, shank and foot 6.1 %), each at its segment's midpoint. */
const MASS: [keyof Body, keyof Body, number][] = [
  ['hip', 'waist', 0.24], ['waist', 'shoulder', 0.26], ['head', 'head', 0.08],
  ['nearShoulder', 'elbow', 0.028], ['elbow', 'hand', 0.022], ['farShoulder', 'farElbow', 0.028], ['farElbow', 'farHand', 0.022],
  ['nearHip', 'knee', 0.1], ['knee', 'foot', 0.061], ['farHip', 'farKnee', 0.1], ['farKnee', 'farFoot', 0.061],
]
export const SEGMENTS = MASS

/** Centre of mass of a body (z kept when the body has depth). */
export function com(b: Body): Required<Pt> {
  const o = { x: 0, y: 0, z: 0 }
  let w = 0
  for (const [a, c, m] of MASS) {
    o.x += ((b[a].x + b[c].x) / 2) * m
    o.y += ((b[a].y + b[c].y) / 2) * m
    o.z += (((b[a].z ?? 0) + (b[c].z ?? 0)) / 2) * m
    w += m
  }
  return { x: o.x / w, y: o.y / w, z: o.z / w }
}

/** Distal segments (forearms, shins, head) trail the rest by `flow`; limbs trail the trunk by half that. */
const LAG = [0, 0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1, 0, 1, 0]

/** Pose at `t` in [0, 1] between two keys. */
export function blend(a: Pose, b: Pose, t: number, ease: Ease = 'io', flow = 0): Pose {
  const fb = full(b)
  return full(a).map((v, i) => {
    const lag = LAG[i] * flow
    const local = Math.min(1, Math.max(0, (t - lag) / (1 - lag)))
    return v + (fb[i] - v) * EASE[ease](local)
  }) as Pose
}

export type Frame = Stage & { pose: Pose; hold: number; dur: number; ease: Ease; air: boolean }

/** The frames one loop plays: bounce runs the keys back in reverse with mirrored timing. */
export function sequence(m: Move): Frame[] {
  const hit = seqCache.get(m)
  if (hit) return hit
  const out = frames(m)
  seqCache.set(m, out)
  return out
}
const seqCache = new WeakMap<Move, Frame[]>()

function frames(m: Move): Frame[] {
  const n = m.keys.length
  const bounce = (m.mode ?? 'bounce') === 'bounce' && n > 1
  const beat = (i: number): Beat => m.beats?.[i] ?? {}
  const end = (i: number) => bounce && (i === 0 || i === n - 1)
  const out = m.keys.map((pose, i): Frame => ({
    pose, ...stage(beat(i)), hold: beat(i).hold ?? (end(i) ? 0.3 : 0), dur: beat(i).dur ?? 1, ease: beat(i).ease ?? 'io', air: beat(i).air ?? false,
  }))
  if (!bounce) return out
  // Going back from key i to i - 1 replays the forward transition i - 1 → i in reverse.
  const back = m.keys.slice(1, -1).map((_, j) => {
    const i = n - 2 - j
    const prev = out[i - 1]
    return { ...out[i], dur: prev.dur, ease: REVERSE[prev.ease], air: prev.air }
  })
  const last = { ...out[n - 1], dur: out[n - 2].dur, ease: REVERSE[out[n - 2].ease], air: out[n - 2].air }
  return [...out.slice(0, -1), last, ...back]
}

/** Length of one loop in ms. */
export const loopMs = (m: Move) => sequence(m).reduce((s, f) => s + (f.hold + f.dur) * (m.ms ?? 900), 0)

/** Pose and stage at `ms` into the move; `travel` accumulates across loops. */
const vec = (f: Frame) => [...full(f.pose), ...KEYS.map((k) => f[k])]
const ANGLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...(['turn', 'roll', 'armOut', 'farArmOut', 'legOut', 'farLegOut'] as const).map((k) => 12 + KEYS.indexOf(k))]

/**
 * Speed (per ms) a segment's ease asks for at its start and end, as a multiple of its average speed.
 * `null` leaves it to the spline. Holds, reversals and moves from or into rest stop; elsewhere both sides of a key
 * share one speed (the asks averaged), so velocity never jumps.
 */
const ENDS: Record<Ease, [number | null, number | null]> = {
  io: [null, null], lin: [null, null], in: [0, 2], out: [2, 0], snap: [3, 0],
}

/**
 * Pose and stage at `ms` into the move. Keys are points on a smooth path through time (monotone
 * cubic Hermite per channel), so motion flows through keys instead of stopping at each one; it
 * stops only on holds and where a joint reverses. Distal channels trail by `flow`; `travel` and
 * `climb` accumulate across loops.
 */
export function at(m: Move, ms: number): Stage & { pose: Pose } {
  const s = spline(m, ms)
  const p = grounded(m, ms, s)
  const q = m.keys.length > 1 && m.beats?.some((b) => b.air) ? aloft(m, ms, p) : p
  return m.balance ? balanced(m, ms, q) : q
}

/** Spline pose with plants held. */
const grounded = (m: Move, ms: number, s = spline(m, ms)) => (m.plants?.length && m.solid ? planted(m, ms, s) : s)

/** Gravity in scene units per ms²: the figure, sole to crown, is a 1.75 m man. */
export const G = (9.81 * (LEN.sole + LEN.shin + LEN.thigh + LEN.waist + LEN.chest + LEN.neck + LEN.head)) / 1.75 / 1e6

/** An airborne stretch of the loop: start and end (ms), the centre of mass there, and the spin correction table. */
type Flight = { t0: number; t1: number; c0: Pt; c1: Pt; spin: number[] | null }
const flightCache = new WeakMap<Move, Flight[]>()
const SPIN_STEPS = 32

/** Sagittal angular momentum (per unit mass) about the centre of mass, each segment a rod, between bodies dt apart. */
function momentum(a: Body, b: Body, dt: number): number {
  const [ca, cb] = [com(a), com(b)]
  let L = 0
  for (const [p, q, mass] of MASS) {
    const r0 = { x: (a[p].x + a[q].x) / 2 - ca.x, y: (a[p].y + a[q].y) / 2 - ca.y }
    const r1 = { x: (b[p].x + b[q].x) / 2 - cb.x, y: (b[p].y + b[q].y) / 2 - cb.y }
    const d0 = { x: a[q].x - a[p].x, y: a[q].y - a[p].y }
    const d1 = { x: b[q].x - b[p].x, y: b[q].y - b[p].y }
    const cross = (u: Pt, v: Pt) => u.x * v.y - u.y * v.x
    L += mass * (cross({ x: (r0.x + r1.x) / 2, y: (r0.y + r1.y) / 2 }, { x: (r1.x - r0.x) / dt, y: (r1.y - r0.y) / dt }) +
      cross({ x: (d0.x + d1.x) / 2, y: (d0.y + d1.y) / 2 }, { x: (d1.x - d0.x) / dt, y: (d1.y - d0.y) / dt }) / 12)
  }
  return L
}
/** Sagittal moment of inertia (per unit mass) about the centre of mass. */
function inertia(b: Body): number {
  const c = com(b)
  return MASS.reduce((s, [p, q, mass]) => {
    const r = { x: (b[p].x + b[q].x) / 2 - c.x, y: (b[p].y + b[q].y) / 2 - c.y }
    return s + mass * (r.x * r.x + r.y * r.y + ((b[q].x - b[p].x) ** 2 + (b[q].y - b[p].y) ** 2) / 12)
  }, 0)
}

const turned = (p: Pose, d: number) => full(p).map((v, i) => (i <= 10 ? v + d : v)) as Pose

/** The move's flights: each run of `air` frames. */
function flightsOf(m: Move): Flight[] {
  const hit = flightCache.get(m)
  if (hit) return hit
  const seq = sequence(m)
  const step = m.ms ?? 900
  const n = seq.length
  const starts: number[] = []
  let t = 0
  for (const f of seq) { starts.push(t + f.hold * step); t += (f.hold + f.dur) * step }
  const flat = { ...m, view: 0, tilt: 0 }
  const body = (ms: number) => { const s = grounded(m, ms); return place(flat, s.pose, s) }
  const out: Flight[] = []
  for (let i = 0; i < n; i++) {
    if (!seq[i].air || seq[(i - 1 + n) % n].air) continue
    let j = i
    while (seq[(j + 1) % n].air && (j + 1) % n !== i) j++
    const t0 = starts[i]
    const t1 = starts[j % n] + seq[j % n].dur * step + (j >= n ? t : 0)
    const [b0, b1] = [body(t0), body(t1)]
    // Spin: only flips (not twists or front views), where the trunk turns a quarter or more.
    const raw = Array.from({ length: SPIN_STEPS + 1 }, (_, k) => grounded(m, t0 + ((t1 - t0) * k) / SPIN_STEPS))
    const flip = !m.front && Math.abs(full(raw[SPIN_STEPS].pose)[0] - full(raw[0].pose)[0]) >= 90 &&
      raw.every((s) => Math.abs(s.turn - raw[0].turn) < 20 && Math.abs(s.roll) < 20)
    let spin: number[] | null = null
    if (flip) {
      const dt = (t1 - t0) / SPIN_STEPS
      const bs = raw.map((s) => place(flat, s.pose, s))
      const mid = bs.slice(1).map((b, k) => ({ L: momentum(bs[k], b, dt), I: (inertia(bs[k]) + inertia(b)) / 2 }))
      // Constant momentum L*: added turn rate (L* - L)/I, its integral zero so the end pose is kept. Angles grow
      // clockwise on screen (y down), the opposite sense to L.
      const Ls = mid.reduce((s, x) => s + x.L / x.I, 0) / mid.reduce((s, x) => s + 1 / x.I, 0)
      spin = [0]
      for (const x of mid) spin.push(spin[spin.length - 1] - (((Ls - x.L) / x.I) * dt * 180) / Math.PI)
    }
    out.push({ t0, t1, c0: com(b0), c1: com(b1), spin })
  }
  flightCache.set(m, out)
  return out
}

/**
 * A cycle with the transitions inside [from, to] (loop ms) made one flight: `air`, and retimed to the time gravity
 * takes for the centre of mass to rise and fall as the keys have it (captured flights are often too quick). Plants
 * after the flight move later with it.
 */
export function ballistic(m: Move, from: number, to: number): Move {
  const step = m.ms ?? 900
  const seq = sequence(m)
  const idx: number[] = []
  let [t, t0, t1] = [0, Infinity, 0]
  seq.forEach((f, i) => {
    const a = t + f.hold * step
    t = a + f.dur * step
    if (a >= from && t <= to) { idx.push(i); t0 = Math.min(t0, a); t1 = Math.max(t1, t) }
  })
  const flat = { ...m, view: 0, tilt: 0 }
  const y = (ms: number) => { const s = grounded(m, ms); return com(place(flat, s.pose, s)).y }
  let apex = Infinity
  for (let u = t0; u <= t1; u += 5) apex = Math.min(apex, y(u))
  const T = Math.sqrt((2 * (y(t0) - apex)) / G) + Math.sqrt((2 * (y(t1) - apex)) / G)
  const k = T / (t1 - t0)
  const added = (T - (t1 - t0)) / step
  const later = (u: number) => (u * step > t1 ? u + added : u)
  return {
    ...m,
    beats: m.keys.map((_, i) => ({ ...m.beats?.[i], ...(idx.includes(i) ? { air: true, dur: seq[i].dur * k } : {}) })),
    ...(m.plants ? { plants: m.plants.map((p) => ({ ...p, from: later(p.from), to: later(p.to) })) } : {}),
  }
}

/**
 * Air phases follow physics: over each run of `air` beats the centre of mass moves on the parabola of gravity `G`
 * between where the keys put it at takeoff and landing (`lift` and `shift` are solved), horizontally at constant
 * speed; in flips the whole body turns so its angular momentum stays constant (faster tucked, slower open).
 */
function aloft(m: Move, ms: number, s: Stage & { pose: Pose }): Stage & { pose: Pose } {
  const total = loopMs(m)
  const g = Math.max(0, ms)
  for (const f of flightsOf(m)) {
    const u = (((g - f.t0) % total) + total) % total
    if (u > f.t1 - f.t0) continue
    const T = f.t1 - f.t0
    const tau = u / T
    let pose = s.pose
    if (f.spin) {
      const k = tau * SPIN_STEPS
      const i = Math.min(SPIN_STEPS - 1, Math.floor(k))
      pose = turned(pose, f.spin[i] + (f.spin[i + 1] - f.spin[i]) * (k - i))
    }
    const c = com(place({ ...m, view: 0, tilt: 0 }, pose, s))
    // Loops since the first: travel and climb carry on.
    const k = Math.round((g - u - f.t0) / total)
    const x = f.c0.x + (f.c1.x - f.c0.x) * tau + k * (m.travel ?? 0)
    const y = f.c0.y + (f.c1.y - f.c0.y) * tau - 0.5 * G * T * T * tau * (1 - tau) - k * (m.climb ?? 0)
    return { ...s, pose, lift: s.lift + (c.y - y), shift: s.shift + (x - c.x) }
  }
  return s
}

/** Arm turn that puts the centre of mass over the pinned hand, by Newton from `d` with steps of at most `cap`. */
function balanceTurn(m: Move, s: Stage & { pose: Pose }, d: number, cap: number): number {
  const flat = { ...m, view: 0, tilt: 0 }
  const err = (x: number) => {
    const b = place(flat, full(s.pose).map((v, i) => (i >= 1 && i <= 4 ? v + x : v)) as Pose, s)
    return com(b).x - b[m.x ?? 'hip'].x
  }
  // Gauss-Newton on err² + BAL_REG·d²: where turning the arms barely moves the centre of mass (err flat, a hang with
  // the hands at the shoulders), the small-turn term keeps one smooth solution instead of a drift between roots.
  for (let it = 0; it < 8; it++) {
    const e = err(d)
    const k = (err(d + 0.5) - e) / 0.5
    const step = (k * e + BAL_REG * d) / (k * k + BAL_REG)
    d -= Math.max(-cap, Math.min(cap, step))
    if (Math.abs(step) < 0.01) break
  }
  return d
}

const BAL_STEP = 20
/** Units² of centre-of-mass error worth a degree² of arm turn. */
const BAL_REG = 0.005
const balTable = new WeakMap<Move, number[]>()

/**
 * Balance turn every BAL_STEP ms over a loop, each solved from the last (continuation), so the solution follows one
 * branch instead of jumping between roots.
 */
function balanceTable(m: Move): number[] {
  const hit = balTable.get(m)
  if (hit) return hit
  const total = loopMs(m)
  const n = Math.max(1, Math.ceil(total / BAL_STEP))
  const pre = (ms: number) => { const p = grounded(m, ms); return m.keys.length > 1 && m.beats?.some((b) => b.air) ? aloft(m, ms, p) : p }
  const out: number[] = []
  let d = balanceTurn(m, pre(0), 0, 30)
  for (let i = 0; i <= n; i++) out.push((d = balanceTurn(m, pre((i * total) / n), d, 10)))
  balTable.set(m, out)
  return out
}

/** Arms (both upper and forearms) turned by the angle that puts the centre of mass over the pinned hand. */
function balanced(m: Move, ms: number, s: Stage & { pose: Pose }): Stage & { pose: Pose } {
  const tab = balanceTable(m)
  const n = tab.length - 1
  const total = loopMs(m)
  const k = ((((Math.max(0, ms) % total) + total) % total) / total) * n
  const i = Math.min(n - 1, Math.floor(k))
  const d = tab[i] + (tab[i + 1] - tab[i]) * (k - i)
  return { ...s, pose: full(s.pose).map((v, j) => (j >= 1 && j <= 4 ? v + d : v)) as Pose }
}

type Path = { total: number; starts: number[]; W: number[]; pt: (i: number) => number[]; v: number[][][] }
const paths = new WeakMap<Move, Path>()

/** Per-move spline tables: keys, loop offset, segment starts and key speeds, built once. */
function path(m: Move): Path {
  const hit = paths.get(m)
  if (hit) return hit
  const seq = sequence(m)
  const step = m.ms ?? 900
  const n = seq.length
  const P = seq.map(vec)
  // One loop's offset: whole turns, travel and climb, so the path continues seamlessly.
  const W = P[0].map((v, j) => {
    if (j === 12 + KEYS.indexOf('shift')) return m.travel ?? 0
    if (j === 12 + KEYS.indexOf('lift')) return m.climb ?? 0
    return ANGLES.includes(j) ? Math.round((P[n - 1][j] - v) / 360) * 360 : 0
  })
  const pt = (i: number) => (i < 0 ? P[n + i].map((v, j) => v - W[j]) : i >= n ? P[i - n].map((v, j) => v + W[j]) : P[i])
  const T = seq.map((f) => f.dur * step)
  const total = loopMs(m)
  // Speed at each key: a hold or a reversal stops it; a segment's ease may ask for its own end speed;
  // otherwise a harmonic mean keeps it monotone. `side` 0 leaves key i, 1 arrives at it.
  const auto = (i: number, j: number) => {
    const k = (i + n) % n
    const prev = (k - 1 + n) % n
    const dIn = (pt(i)[j] - pt(i - 1)[j]) / T[prev]
    const dOut = (pt(i + 1)[j] - pt(i)[j]) / T[k]
    return dIn * dOut <= 0 ? 0 : (2 * dIn * dOut) / (dIn + dOut)
  }
  const speed = (i: number, j: number, side: 0 | 1) => {
    const k = (i + n) % n
    if (seq[k].hold > 0) return 0
    const prev = (k - 1 + n) % n
    const dIn = (pt(i)[j] - pt(i - 1)[j]) / T[prev]
    const dOut = (pt(i + 1)[j] - pt(i)[j]) / T[k]
    const [aIn, aOut] = [ENDS[seq[prev].ease][1], ENDS[seq[k].ease][0]]
    const d = side === 0 ? dOut : dIn
    if (d === 0) return 0
    // Clamped to the segment's own direction and at most 3x its mean speed, so it never overshoots.
    const clamp = (v: number, e: number) => Math.sign(e) * Math.min(Math.max(0, v * Math.sign(e)), 3 * Math.abs(e))
    // A reversal, or into or out of rest, stops on both sides: a one-frame jump to or from speed reads as a pop.
    if (dIn * dOut <= 0) return 0
    // Moving on through the key: both sides share one speed, so velocity is continuous.
    const asks = [aIn === null ? null : aIn * dIn, aOut === null ? null : aOut * dOut].filter((v) => v !== null)
    const v = asks.length ? asks.reduce((a, b) => a + b, 0) / asks.length : auto(i, j)
    return clamp(clamp(v, dIn), dOut)
  }
  const v = Array.from({ length: n + 1 }, (_, i) => P[0].map((_, j) => [speed(i, j, 0), speed(i, j, 1)]))
  const starts: number[] = [0]
  for (let i = 0; i < n; i++) starts.push(starts[i] + seq[i].hold * step + T[i])
  const out = { total, starts, W, pt, v }
  paths.set(m, out)
  return out
}

function spline(m: Move, ms: number): Stage & { pose: Pose } {
  const seq = sequence(m)
  if (seq.length === 1) return seq[0]
  const step = m.ms ?? 900
  const n = seq.length
  const { total, starts, W, pt, v: V } = path(m)
  const value = (j: number, g: number) => {
    const loop = Math.floor(g / total)
    const r = g - loop * total
    let [lo, hi] = [0, n - 1]
    while (lo < hi) { const c = (lo + hi + 1) >> 1; if (starts[c] <= r) lo = c; else hi = c - 1 }
    const i = lo
    const t = r - starts[i]
    const Ti = seq[i].dur * step
    const a = pt(i)[j]
    const b = pt(i + 1)[j]
    const u = Math.min(1, Math.max(0, (t - seq[i].hold * step) / Ti))
    const [m0, m1] = [V[i][j][0] * Ti, V[i + 1][j][1] * Ti]
    const u2 = u * u
    const u3 = u2 * u
    return loop * W[j] + (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b + (u3 - u2) * m1
  }
  const g = Math.max(0, ms)
  const lag = (m.flow ?? 0) * step
  const v = W.map((_, j) => value(j, Math.max(0, g - (j < 12 ? LAG[j] * lag : 0))))
  return { pose: v.slice(0, 12) as Pose, ...(Object.fromEntries(KEYS.map((k, i) => [k, v[12 + i]])) as Stage) }
}

/** Lowest joint of a pose as placed; a value above 0 means it sinks into the floor. */
export const sink = (m: Move, p: Pose, st: Partial<Stage> = {}) => {
  // True heights: camera tilt only changes how the floor is drawn.
  const b = place({ ...m, tilt: 0 }, p, st)
  return Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
}

/** Solid joints pinned but not yet seen through the camera. */
const ground = (m: Move, p: Pose, st: Stage) => pin(m, solid(p, st, m.point), st.lift, st.shift)
/** Limb channels a plant's IK moves: two pose angles and the swing out. */
const LIMB: Record<Plant['joint'], [number, number, keyof Stage]> = { hand: [1, 2, 'armOut'], farHand: [3, 4, 'farArmOut'], foot: [5, 6, 'legOut'], farFoot: [7, 8, 'farLegOut'] }
/** Loop time a plant eases in and out over, in `dur` units. */
const RAMP = 0.08
const targets = new WeakMap<Move, V3[]>()

/** Where each plant holds: its joint's mean place over the window on the uncorrected path, at its lowest there. */
function plantTargets(m: Move): V3[] {
  const hit = targets.get(m)
  if (hit) return hit
  const step = m.ms ?? 900
  const total = loopMs(m) / step
  const out = m.plants!.map((p) => {
    const end = p.from > p.to ? p.to + total : p.to
    const sum: V3 = [0, 0, 0]
    let [n, low] = [0, -Infinity]
    for (let u = p.from; u <= end + 1e-9; u += Math.min(0.02, (end - p.from) / 4 || 1)) {
      const s = spline(m, u * step)
      const b = ground(m, s.pose, s)[p.joint]
      sum[0] += b.x; sum[2] += b.z ?? 0
      low = Math.max(low, b.y)
      n++
    }
    // Pin keeps the lowest point down, so a target above where the joint gets down to fights it.
    return [sum[0] / n, low, sum[2] / n] as V3
  })
  targets.set(m, out)
  return out
}

/** A plant's weight at `g` (dur units since start): 1 in a window, easing to 0 over RAMP outside; and the loop that window began in. */
function plantWeight(p: Plant, g: number, total: number): [number, number] {
  const len = (p.to - p.from + total) % total
  let [best, sum] = [[0, 0] as [number, number], 0]
  for (let k = Math.floor(g / total) - 1; k <= Math.floor(g / total) + 1; k++) {
    const a = p.from + k * total
    const d = g < a ? a - g : g > a + len ? g - a - len : 0
    const w = d >= RAMP ? 0 : 1 - d / RAMP
    const s = w * w * (3 - 2 * w)
    sum += s
    if (s > best[0]) best = [s, k]
  }
  // Summed, so a gap between windows shorter than two ramps holds instead of dipping.
  return [Math.min(1, sum), best[1]]
}

/** Move shift and limb angles so each planted joint sits on its target. */
function planted(m: Move, ms: number, s: Stage & { pose: Pose }): Stage & { pose: Pose } {
  const step = m.ms ?? 900
  const total = loopMs(m) / step
  const g = Math.max(0, ms) / step
  const T = plantTargets(m)
  const live = m.plants!.map((p, i) => {
    const [w, k] = plantWeight(p, g, total)
    return { p, w, t: [T[i][0] + k * (m.travel ?? 0), T[i][1], T[i][2]] as V3 }
  }).filter((x) => x.w > 0)
  if (!live.length) return s
  const pose = [...full(s.pose)] as number[]
  // Planted on the floor: no flight.
  const st: Stage = { ...s, lift: (m.y ?? 'floor') === 'floor' ? 0 : s.lift }
  const where = (j: Plant['joint']): V3 => {
    const b = ground(m, pose as Pose, st)[j]
    return [b.x, b.y, b.z ?? 0]
  }
  // The strongest contact moves the body along (unless a hand is pinned on a prop); then each limb reaches for its own target.
  const lead = live.reduce((a, b) => (b.w > a.w ? b : a))
  const free = (m.x ?? 'hip') === 'hip'
  for (let round = 0; round < 3; round++) {
    if (free) st.shift += lead.t[0] - where(lead.p.joint)[0]
    for (const { p, t } of live) {
      const [a, b, out] = LIMB[p.joint]
      const get = () => [pose[a], pose[b], st[out]]
      const set = (v: number[]) => { [pose[a], pose[b]] = [v[0], v[1]]; (st[out] as number) = v[2] }
      for (let it = 0; it < 4; it++) {
        const x0 = get()
        const e = where(p.joint).map((v, k) => t[k] - v)
        if (Math.hypot(...e) < 0.05) break
        // Damped Gauss-Newton on a finite-difference Jacobian.
        const J = [0, 1, 2].map((c) => {
          const x = [...x0]
          x[c] += 0.5
          set(x)
          const q = where(p.joint)
          set(x0)
          return q.map((v, k) => (v - (t[k] - e[k])) / 0.5)
        })
        const A = [0, 1, 2].map((r) => [0, 1, 2].map((c) => J[r].reduce((sum, _, k) => sum + J[r][k] * J[c][k], 0) + (r === c ? 0.01 : 0)))
        const rhs = [0, 1, 2].map((r) => J[r].reduce((sum, v, k) => sum + v * e[k], 0))
        set(x0.map((v, k) => v + solve3(A, rhs)[k]))
      }
    }
  }
  // Ease each correction in by its plant's weight; shift by the lead's.
  const pz = [...full(s.pose)] as number[]
  const out: Stage = { ...s, shift: s.shift + (st.shift - s.shift) * lead.w, lift: s.lift + (st.lift - s.lift) * lead.w }
  for (const { p, w } of live) {
    const [a, b, o] = LIMB[p.joint]
    for (const i of [a, b]) pz[i] += (pose[i] - pz[i]) * w
    ;(out[o] as number) = s[o] + (st[o] - s[o]) * w
  }
  return { ...out, pose: pz as Pose }
}

/** Solve a 3x3 linear system (Cramer). */
function solve3(A: number[][], b: number[]): number[] {
  const det = (M: number[][]) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  const d = det(A) || 1
  return [0, 1, 2].map((c) => det(A.map((row, r) => row.map((v, k) => (k === c ? b[r] : v)))) / d)
}
