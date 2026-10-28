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
  | { t: 'rings'; x: number; y: number }
  | { t: 'wall'; x: number }
  | { t: 'pole'; x: number }
  | { t: 'box'; x: number; w: number; h: number }
  /** Parallel bars or parallettes seen end-on: a post topped at `y`. */
  | { t: 'bars'; x: number; y: number }

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
}

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
export type Stage = { lift: number; shift: number; turn: number; trunk: number; legs: number; arms: number }
export type Beat = Partial<Stage> & { hold?: number; dur?: number; ease?: Ease }
const STAGE: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1, legs: 1, arms: 1 }
const stage = (b: Beat): Stage => ({ lift: b.lift ?? 0, shift: b.shift ?? 0, turn: b.turn ?? 0, trunk: b.trunk ?? 1, legs: b.legs ?? 1, arms: b.arms ?? 1 })

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

export type Pt = { x: number; y: number }
export type Body = Record<Joint, Pt> & { waist: Pt; nearShoulder: Pt; nearHip: Pt; farShoulder: Pt; farHip: Pt; farElbow: Pt; farKnee: Pt; toe: Pt; farToe: Pt; heel: Pt; farHeel: Pt }

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
  return flat + Math.sign(w) * 90 * ramp(a, 120, 160)
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
    hip, waist, shoulder: sh, head: add(shoulder, dir(h, LEN.neck)),
    elbow, hand: add(elbow, dir(nf, LEN.fore * arms)), farElbow, farHand: add(farElbow, dir(ff, LEN.fore * arms)),
    knee, farKnee, foot, farFoot,
    toe: sole(foot, ns, LEN.foot, pn), farToe: sole(farFoot, fs, LEN.foot, pf),
    heel: sole(foot, ns, -4, pn), farHeel: sole(farFoot, fs, -4, pf),
    nearShoulder: nS, nearHip: nH, farShoulder: fS, farHip: fH,
  }
}

const POINTS = ['hip', 'waist', 'shoulder', 'elbow', 'hand', 'farElbow', 'farHand', 'knee', 'farKnee', 'foot', 'farFoot', 'toe', 'farToe', 'heel', 'farHeel'] as const

/** Joints placed in the scene per the move's pins. */
export function place(m: Move, p: Pose, st: Partial<Stage> = {}): Body {
  const { lift, shift, turn, trunk, legs, arms } = { ...STAGE, ...st }
  const raw = joints(p, m.front, m.point, trunk, legs, arms)
  // Turning about the vertical axis squeezes x about the hip; past 90 the figure faces the other way.
  // A floor of 0.3 width keeps the body readable mid-turn; it flips sides at 90 like a cartoon turn.
  const c = Math.cos((turn * Math.PI) / 180)
  const k = (c < 0 ? -1 : 1) * (0.3 + 0.7 * Math.abs(c))
  const b = {} as Body
  for (const [n, v] of Object.entries(raw)) b[n as keyof Body] = { x: v.x * k, y: v.y }
  const [ax, ay] = m.at ?? [0, 0]
  const xj = b[m.x ?? 'hip']
  const lowest = Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
  const dy = ((m.y ?? 'floor') === 'floor' ? ay - lowest : ay - b[m.y as Joint].y) - lift
  const dx = ax - xj.x + shift
  const out = {} as Body
  for (const [k, v] of Object.entries(b)) out[k as keyof Body] = { x: v.x + dx, y: v.y + dy }
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
const ANGLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14]
const vec = (f: Frame) => [...full(f.pose), f.lift, f.shift, f.turn, f.trunk, f.legs, f.arms]

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
  const seq = sequence(m)
  if (seq.length === 1) return seq[0]
  const step = m.ms ?? 900
  const n = seq.length
  const P = seq.map(vec)
  // One loop's offset: whole turns, travel and climb, so the path continues seamlessly.
  const W = P[0].map((v, j) => {
    if (j === 13) return m.travel ?? 0
    if (j === 12) return m.climb ?? 0
    return ANGLES.includes(j) ? Math.round((P[n - 1][j] - v) / 360) * 360 : 0
  })
  const pt = (i: number) => (i < 0 ? P[n + i].map((v, j) => v - W[j]) : i >= n ? P[i - n].map((v, j) => v + W[j]) : P[i])
  const T = seq.map((f) => f.dur * step)
  const total = loopMs(m)
  // Speed at each key: a hold or a reversal stops it; an ease asks for its own; otherwise a harmonic mean keeps it monotone.
  const speed = (i: number, j: number) => {
    const k = (i + n) % n
    if (seq[k].hold > 0) return 0
    const prev = (k - 1 + n) % n
    const dIn = (pt(i)[j] - pt(i - 1)[j]) / T[prev]
    const dOut = (pt(i + 1)[j] - pt(i)[j]) / T[k]
    const asked = [ENDS[seq[prev].ease][1], ENDS[seq[k].ease][0]].filter((v): v is number => v !== null)
    if (asked.length) {
      const want = asked.reduce((a, v) => a + v, 0) / asked.length
      return want * (asked.length === 2 ? (dIn + dOut) / 2 : ENDS[seq[k].ease][0] !== null ? dOut : dIn)
    }
    return dIn * dOut <= 0 ? 0 : (2 * dIn * dOut) / (dIn + dOut)
  }
  const value = (j: number, g: number) => {
    const loop = Math.floor(g / total)
    let t = g - loop * total
    let i = 0
    for (; t >= (seq[i].hold * step + T[i]) && i < n - 1; i++) t -= seq[i].hold * step + T[i]
    const a = pt(i)[j]
    const b = pt(i + 1)[j]
    const u = Math.min(1, Math.max(0, (t - seq[i].hold * step) / T[i]))
    const [m0, m1] = [speed(i, j) * T[i], speed(i + 1, j) * T[i]]
    const u2 = u * u
    const u3 = u2 * u
    return loop * W[j] + (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b + (u3 - u2) * m1
  }
  const g = Math.max(0, ms)
  const lag = (m.flow ?? 0) * step
  const v = P[0].map((_, j) => value(j, Math.max(0, g - (j < 12 ? LAG[j] * lag : 0))))
  return { pose: v.slice(0, 12) as Pose, lift: v[12], shift: v[13], turn: v[14], trunk: v[15], legs: v[16], arms: v[17] }
}

/** Lowest joint of a pose as placed; a value above 0 means it sinks into the floor. */
export const sink = (m: Move, p: Pose, st: Partial<Stage> = {}) => {
  const b = place(m, p, st)
  return Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
}
