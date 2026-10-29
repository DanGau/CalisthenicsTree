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
}
export type Beat = Partial<Stage> & { hold?: number; dur?: number; ease?: Ease }
const STAGE: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1, legs: 1, arms: 1, roll: 0, armOut: 0, farArmOut: 0, legOut: 0, farLegOut: 0, foreOut: 0, farForeOut: 0, shinOut: 0, farShinOut: 0, twist: 0 }
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
export function joints(p: Pose, front = false, point: Move['point'] = false, trunk = 1, legs = 1, arms = 1): Body {
  const [t, nu, nf, fu, ff, nt, ns, ft, fs, c, h] = full(p)
  const hip = { x: 0, y: 0 }
  const waist = dir(t, LEN.waist * trunk)
  const shoulder = add(waist, dir(c, LEN.chest * trunk))
  // Front view: limbs hang from shoulders and hips set apart; side view: they share a joint.
  const side = (deg: number, w: number): Pt => (front ? dir(deg + 90, w) : { x: 0, y: 0 })
  const sh = add(shoulder, dir(c, p[11] ?? 0))
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
  const shoulder = add3(add3(waist, dir3(c, 0, 0, LEN.chest * st.trunk)), dir3(c, 0, 0, sc))
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
  const raw = joints(p, m.front, m.point, trunk, legs, arms)
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

export type Frame = Stage & { pose: Pose; hold: number; dur: number; ease: Ease }

/** The frames one loop plays: bounce runs the keys back in reverse with mirrored timing. */
export function sequence(m: Move): Frame[] {
  const n = m.keys.length
  const bounce = (m.mode ?? 'bounce') === 'bounce' && n > 1
  const beat = (i: number): Beat => m.beats?.[i] ?? {}
  const end = (i: number) => bounce && (i === 0 || i === n - 1)
  const out = m.keys.map((pose, i): Frame => ({
    pose, ...stage(beat(i)), hold: beat(i).hold ?? (end(i) ? 0.3 : 0), dur: beat(i).dur ?? 1, ease: beat(i).ease ?? 'io',
  }))
  if (!bounce) return out
  // Going back from key i to i - 1 replays the forward transition i - 1 → i in reverse.
  const back = m.keys.slice(1, -1).map((_, j) => {
    const i = n - 2 - j
    const prev = out[i - 1]
    return { ...out[i], dur: prev.dur, ease: REVERSE[prev.ease] }
  })
  const last = { ...out[n - 1], dur: out[n - 2].dur, ease: REVERSE[out[n - 2].ease] }
  return [...out.slice(0, -1), last, ...back]
}

/** Length of one loop in ms. */
export const loopMs = (m: Move) => sequence(m).reduce((s, f) => s + (f.hold + f.dur) * (m.ms ?? 900), 0)

/** Pose and stage at `ms` into the move; `travel` accumulates across loops. */
const vec = (f: Frame) => [...full(f.pose), ...KEYS.map((k) => f[k])]
const ANGLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...(['turn', 'roll', 'armOut', 'farArmOut', 'legOut', 'farLegOut'] as const).map((k) => 12 + KEYS.indexOf(k))]

/**
 * Speed (per ms) a segment's ease asks for at its start and end, as a multiple of its average speed.
 * `null` leaves it to the spline. Holds and reversals always stop.
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
  return m.plants?.length && m.solid ? planted(m, ms, s) : s
}

function spline(m: Move, ms: number): Stage & { pose: Pose } {
  const seq = sequence(m)
  if (seq.length === 1) return seq[0]
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
    const seg = side === 0 ? k : (k - 1 + n) % n
    const ask = ENDS[seq[seg].ease][side]
    const d = side === 0 ? (pt(i + 1)[j] - pt(i)[j]) / T[seg] : (pt(i)[j] - pt(i - 1)[j]) / T[seg]
    // Clamped to the segment's own direction and at most 3x its mean speed, so it never overshoots.
    const v = ask === null ? auto(i, j) : ask * d
    return d === 0 ? 0 : Math.sign(d) * Math.min(Math.max(0, v * Math.sign(d)), 3 * Math.abs(d))
  }
  const value = (j: number, g: number) => {
    const loop = Math.floor(g / total)
    let t = g - loop * total
    let i = 0
    for (; t >= (seq[i].hold * step + T[i]) && i < n - 1; i++) t -= seq[i].hold * step + T[i]
    const a = pt(i)[j]
    const b = pt(i + 1)[j]
    const u = Math.min(1, Math.max(0, (t - seq[i].hold * step) / T[i]))
    const [m0, m1] = [speed(i, j, 0) * T[i], speed(i + 1, j, 1) * T[i]]
    const u2 = u * u
    const u3 = u2 * u
    return loop * W[j] + (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b + (u3 - u2) * m1
  }
  const g = Math.max(0, ms)
  const lag = (m.flow ?? 0) * step
  const v = P[0].map((_, j) => value(j, Math.max(0, g - (j < 12 ? LAG[j] * lag : 0))))
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

/** Where each plant holds: its joint's mean place over the window on the uncorrected path. */
function plantTargets(m: Move): V3[] {
  const hit = targets.get(m)
  if (hit) return hit
  const step = m.ms ?? 900
  const total = loopMs(m) / step
  const out = m.plants!.map((p) => {
    const end = p.from > p.to ? p.to + total : p.to
    const sum: V3 = [0, 0, 0]
    let n = 0
    for (let u = p.from; u <= end + 1e-9; u += Math.min(0.02, (end - p.from) / 4 || 1)) {
      const s = spline(m, u * step)
      const b = ground(m, s.pose, s)[p.joint]
      sum[0] += b.x; sum[1] += b.y; sum[2] += b.z ?? 0
      n++
    }
    return sum.map((v) => v / n) as V3
  })
  targets.set(m, out)
  return out
}

/** A plant's weight at `g` (dur units since start): 1 in a window, easing to 0 over RAMP outside; and the loop that window began in. */
function plantWeight(p: Plant, g: number, total: number): [number, number] {
  const len = (p.to - p.from + total) % total
  let best: [number, number] = [0, 0]
  for (let k = Math.floor(g / total) - 1; k <= Math.floor(g / total) + 1; k++) {
    const a = p.from + k * total
    const d = g < a ? a - g : g > a + len ? g - a - len : 0
    const w = d >= RAMP ? 0 : 1 - d / RAMP
    if (w * w * (3 - 2 * w) > best[0]) best = [w * w * (3 - 2 * w), k]
  }
  return best
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
  // The strongest contact moves the body along; then each limb reaches for its own target.
  const lead = live.reduce((a, b) => (b.w > a.w ? b : a))
  for (let round = 0; round < 3; round++) {
    st.shift += lead.t[0] - where(lead.p.joint)[0]
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
