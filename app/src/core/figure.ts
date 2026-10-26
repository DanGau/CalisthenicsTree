/**
 * A cartoon figure posed by absolute limb angles in degrees:
 * 0 points down, 90 forward (+x, the way the figure faces), 180 up, -90 back.
 * Angles never wrap, so 0 → 360 animates a full rotation (rolls, flips).
 */
export type Pose = [torso: number, nearUpperArm: number, nearForearm: number, farUpperArm: number, farForearm: number,
  nearThigh: number, nearShin: number, farThigh: number, farShin: number, chest?: number, head?: number]

/**
 * `torso` is the pelvis-to-waist segment; optional `chest` (waist to shoulders, default = torso)
 * bends the spine (hollow, arch, rounding); optional `head` (default = chest) tilts the head.
 */
export const full = (p: Pose): Required<Pose> => {
  const chest = p[9] ?? p[0]
  return [...p.slice(0, 9), chest, p[10] ?? chest] as Required<Pose>
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
  floor?: boolean
  /** Milliseconds per transition. */
  ms?: number
}

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
export function joints(p: Pose, front = false): Body {
  const [t, nu, nf, fu, ff, nt, ns, ft, fs, c, h] = full(p)
  const hip = { x: 0, y: 0 }
  const waist = dir(t, LEN.waist)
  const shoulder = add(waist, dir(c, LEN.chest))
  // Front view: limbs hang from shoulders and hips set apart; side view: they share a joint.
  const side = (deg: number, w: number): Pt => (front ? dir(deg + 90, w) : { x: 0, y: 0 })
  const nS = add(shoulder, side(c, -GIRDLE.shoulder))
  const fS = add(shoulder, side(c, GIRDLE.shoulder))
  const nH = add(hip, side(t, -GIRDLE.hip))
  const fH = add(hip, side(t, GIRDLE.hip))
  const elbow = add(nS, dir(nu, LEN.upper))
  const farElbow = add(fS, dir(fu, LEN.upper))
  const knee = add(nH, dir(nt, LEN.thigh))
  const farKnee = add(fH, dir(ft, LEN.thigh))
  const foot = add(knee, dir(ns, LEN.shin))
  const farFoot = add(farKnee, dir(fs, LEN.shin))
  // The sole sits below the ankle; side view: heel just behind, toes ahead.
  const sole = (f: Pt, s: number, len: number) => add(add(f, dir(s, LEN.sole)), dir(footAngle(s), front ? 0 : len))
  return {
    hip, waist, shoulder, head: add(shoulder, dir(h, LEN.neck)),
    elbow, hand: add(elbow, dir(nf, LEN.fore)), farElbow, farHand: add(farElbow, dir(ff, LEN.fore)),
    knee, farKnee, foot, farFoot,
    toe: sole(foot, ns, LEN.foot), farToe: sole(farFoot, fs, LEN.foot),
    heel: sole(foot, ns, -4), farHeel: sole(farFoot, fs, -4),
    nearShoulder: nS, nearHip: nH, farShoulder: fS, farHip: fH,
  }
}

const POINTS = ['hip', 'waist', 'shoulder', 'elbow', 'hand', 'farElbow', 'farHand', 'knee', 'farKnee', 'foot', 'farFoot', 'toe', 'farToe', 'heel', 'farHeel'] as const

/** Joints placed in the scene per the move's pins. */
export function place(m: Move, p: Pose): Body {
  const b = joints(p, m.front)
  const [ax, ay] = m.at ?? [0, 0]
  const xj = b[m.x ?? 'hip']
  const lowest = Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
  const dy = (m.y ?? 'floor') === 'floor' ? ay - lowest : ay - b[m.y as Joint].y
  const dx = ax - xj.x
  const out = {} as Body
  for (const [k, v] of Object.entries(b)) out[k as keyof Body] = { x: v.x + dx, y: v.y + dy }
  return out
}

/** Pose at `t` in [0, 1] between two keys, eased. */
export function blend(a: Pose, b: Pose, t: number): Pose {
  const e = t * t * (3 - 2 * t)
  const fb = full(b)
  return full(a).map((v, i) => v + (fb[i] - v) * e) as Pose
}

/** The key sequence one loop plays. */
export const sequence = (m: Move): Pose[] =>
  (m.mode ?? 'bounce') === 'bounce' && m.keys.length > 1 ? [...m.keys, ...m.keys.slice(1, -1).reverse()] : m.keys

/** Pose at `ms` into the loop; each key holds for a third of the transition time. */
export function at(m: Move, ms: number): Pose {
  const seq = sequence(m)
  if (seq.length === 1) return seq[0]
  const step = m.ms ?? 900
  const hold = step / 3
  const span = step + hold
  const t = Math.max(0, ms) % (span * seq.length)
  const i = Math.floor(t / span)
  const local = Math.max(0, (t - i * span - hold) / step)
  const from = full(seq[i])
  const next = full(seq[(i + 1) % seq.length])
  // Wrapping to the first key: drop whole turns so a roll keeps rolling instead of unwinding.
  const to = i === seq.length - 1 ? (next.map((v, j) => v + Math.round((from[j] - v) / 360) * 360) as Pose) : next
  return blend(from, to, local)
}

/** Lowest joint of a pose as placed; a value above 0 means it sinks into the floor. */
export const sink = (m: Move, p: Pose) => {
  const b = place(m, p)
  return Math.max(...POINTS.map((k) => b[k].y), b.head.y + LEN.head)
}
