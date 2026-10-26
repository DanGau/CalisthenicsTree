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
  /** Toes pointed all loop (kneeling, prone, tops of the feet on the floor). */
  point?: boolean
  floor?: boolean
  /** Milliseconds per transition. */
  ms?: number
  /** Per key, parallel to `keys`: lift, holds and the timing of the transition to the next key. */
  beats?: Beat[]
  /** Distance the figure travels each loop (`cycle` gaits, runs, crawls, walks); the view follows it. */
  travel?: number
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
 * scale for foreshortening (front view, trunk pointing at the viewer: 0.4-0.8). `hold`: pause on this key in
 * transitions (default: 0.3 at the turnaround keys of a bounce, else 0). `dur`: length of the
 * transition to the next key in transitions (default 1). `ease`: how that transition moves.
 */
export type Stage = { lift: number; shift: number; turn: number; trunk: number }
export type Beat = Partial<Stage> & { hold?: number; dur?: number; ease?: Ease }
const STAGE: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1 }
const stage = (b: Beat): Stage => ({ lift: b.lift ?? 0, shift: b.shift ?? 0, turn: b.turn ?? 0, trunk: b.trunk ?? 1 })

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
export function joints(p: Pose, front = false, point = false, trunk = 1): Body {
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
  const elbow = add(nS, dir(nu, LEN.upper))
  const farElbow = add(fS, dir(fu, LEN.upper))
  const knee = add(nH, dir(nt, LEN.thigh))
  const farKnee = add(fH, dir(ft, LEN.thigh))
  const foot = add(knee, dir(ns, LEN.shin))
  const farFoot = add(farKnee, dir(fs, LEN.shin))
  // The sole sits below the ankle; side view: heel just behind, toes ahead.
  const sole = (f: Pt, s: number, len: number) => add(add(f, dir(s, LEN.sole)), dir(point ? s + 15 : footAngle(s), front ? 0 : len))
  return {
    hip, waist, shoulder: sh, head: add(shoulder, dir(h, LEN.neck)),
    elbow, hand: add(elbow, dir(nf, LEN.fore)), farElbow, farHand: add(farElbow, dir(ff, LEN.fore)),
    knee, farKnee, foot, farFoot,
    toe: sole(foot, ns, LEN.foot), farToe: sole(farFoot, fs, LEN.foot),
    heel: sole(foot, ns, -4), farHeel: sole(farFoot, fs, -4),
    nearShoulder: nS, nearHip: nH, farShoulder: fS, farHip: fH,
  }
}

const POINTS = ['hip', 'waist', 'shoulder', 'elbow', 'hand', 'farElbow', 'farHand', 'knee', 'farKnee', 'foot', 'farFoot', 'toe', 'farToe', 'heel', 'farHeel'] as const

/** Joints placed in the scene per the move's pins. */
export function place(m: Move, p: Pose, st: Partial<Stage> = {}): Body {
  const { lift, shift, turn, trunk } = { ...STAGE, ...st }
  const raw = joints(p, m.front, m.point, trunk)
  // Turning about the vertical axis squeezes x about the hip; past 90 the figure faces the other way.
  const k = Math.cos((turn * Math.PI) / 180)
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
export function at(m: Move, ms: number): Stage & { pose: Pose } {
  const seq = sequence(m)
  if (seq.length === 1) return seq[0]
  const step = m.ms ?? 900
  const total = loopMs(m)
  const loop = Math.floor(Math.max(0, ms) / total)
  let t = Math.max(0, ms) % total
  const span = (i: number) => (seq[i].hold + seq[i].dur) * step
  let i = 0
  for (; t >= span(i); i++) t -= span(i)
  const f = seq[i]
  const local = Math.max(0, (t - f.hold * step) / (f.dur * step))
  const from = full(f.pose)
  const wrap = i === seq.length - 1
  const nf = seq[(i + 1) % seq.length]
  const next = full(nf.pose)
  // Wrapping to the first key: drop whole turns so a roll keeps rolling instead of unwinding.
  const to = wrap ? (next.map((v, j) => v + Math.round((from[j] - v) / 360) * 360) as Pose) : next
  const e = EASE[f.ease](local)
  const lerp = (a: number, b: number) => a + (b - a) * e
  const travel = m.travel ?? 0
  const turnTo = wrap ? nf.turn + Math.round((f.turn - nf.turn) / 360) * 360 : nf.turn
  return {
    pose: blend(from, to, local, f.ease, m.flow ?? 0),
    lift: lerp(f.lift, nf.lift),
    shift: loop * travel + lerp(f.shift, nf.shift + (wrap ? travel : 0)),
    turn: lerp(f.turn, turnTo),
    trunk: lerp(f.trunk, nf.trunk),
  }
}

/** Lowest joint of a pose as placed; a value above 0 means it sinks into the floor. */
export const sink = (m: Move, p: Pose, st: Partial<Stage> = {}) => {
  const b = place(m, p, st)
  return Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
}
