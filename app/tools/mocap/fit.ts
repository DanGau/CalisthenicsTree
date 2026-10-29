// CMU skeleton → our solid Pose + Stage, by matching each segment's direction.
import { LEN } from '../../src/core/figure'
import { positions, type Bvh, type V } from './bvh'

/** 12 pose angles then COLS. */
export type Sample = { frame: number; t: number; v: number[] }

const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const addv = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scl = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V) => Math.hypot(...a)
const unit = (a: V): V => scl(a, 1 / (norm(a) || 1))
const mid = (a: V, b: V): V => scl(addv(a, b), 0.5)
const D = 180 / Math.PI
/** `v` shifted by whole turns to sit nearest `prev`. */
export const near = (v: number, prev?: number) => (prev === undefined ? v : v + Math.round((prev - v) / 360) * 360)

/** `ref`: frame whose facing defines world x (default 1; frame 0 is often a T-pose). */
export type Opts = { ref?: number; yaw?: number; mirror?: boolean; pin?: 'hip' | 'foot' | 'farFoot' | 'hand' | 'farHand' }

/** Our-named joints in our world: x forward at the start, y down from the floor, z toward the viewer (near side), scaled to LEN. */
export type Skel = Record<'hip' | 'waist' | 'shoulder' | 'head' | 'nS' | 'nE' | 'nW' | 'fS' | 'fE' | 'fW' | 'nH' | 'nK' | 'nA' | 'nT' | 'fH' | 'fK' | 'fA' | 'fT', V>

/** Every frame mapped into our world. `low` is the lowest point's height above the clip's floor. */
export function skeleton(b: Bvh, o: Opts = {}): { skel: Skel[]; low: number[]; scale: number; chest: number } {
  const N = o.mirror ? 'Right' : 'Left'
  const rest = positions({ ...b, frames: [b.frames[0].map(() => 0)] })[0]
  const legLen = norm(sub(rest[`${N}UpLeg`], rest[`${N}Leg`])) + norm(sub(rest[`${N}Leg`], rest[`${N}Foot`]))
  return world(positions(b), legLen, norm(sub(rest.Spine, mid(rest.LeftArm, rest.RightArm))), o)
}

/** Frames of BVH-named joint positions (Y up) mapped into our world; `legLen` and `chestLen` in the same units. */
export function world(P: Record<string, V>[], legLen: number, chestLen: number, o: Opts = {}): { skel: Skel[]; low: number[]; scale: number; chest: number } {
  const [N, F] = o.mirror ? ['Right', 'Left'] : ['Left', 'Right']
  const scale = (LEN.thigh + LEN.shin) / legLen
  // World frame from the reference frame's facing (horizontal), turned by `yaw`.
  const p0 = P[o.ref ?? Math.min(1, P.length - 1)]
  const l0 = sub(p0[`${N}UpLeg`], p0[`${F}UpLeg`])
  const sign = o.mirror ? -1 : 1
  // Left × up is forward; mirrored, near is the right side.
  const fwd0 = unit([-l0[2] * sign, 0, l0[0] * sign])
  const y = ((o.yaw ?? 0) * Math.PI) / 180
  const X: V = unit([fwd0[0] * Math.cos(y) + fwd0[2] * Math.sin(y), 0, -fwd0[0] * Math.sin(y) + fwd0[2] * Math.cos(y)])
  const Dn: V = [0, -1, 0]
  const Z = scl(cross(X, Dn), sign)
  const floor = Math.min(...P.map((p) => Math.min(...Object.values(p).map((q) => q[1]))))
  const map = (q: V): V => [dot(q, X) * scale, (floor - q[1]) * scale, dot(q, Z) * scale]
  const skel = P.map((p) => {
    const j = (n: string) => map(p[n])
    const side = (s: string) => ({ S: j(`${s}Arm`), E: j(`${s}ForeArm`), W: j(`${s}Hand`), H: j(`${s}UpLeg`), K: j(`${s}Leg`), A: j(`${s}Foot`), T: j(`${s}ToeBase`) })
    const [n, f] = [side(N), side(F)]
    return {
      hip: mid(n.H, f.H), waist: j('Spine'), shoulder: mid(n.S, f.S), head: mid(j('Head'), j('HeadEnd')),
      nS: n.S, nE: n.E, nW: n.W, fS: f.S, fE: f.E, fW: f.W, nH: n.H, nK: n.K, nA: n.A, nT: n.T, fH: f.H, fK: f.K, fA: f.A, fT: f.T,
    }
  })
  const low = P.map((p) => (Math.min(...Object.values(p).map((q) => q[1])) - floor) * scale)
  return { skel, low, scale, chest: chestLen * scale }
}

const PIN = { hip: 'hip', foot: 'nA', farFoot: 'fA', hand: 'nW', farHand: 'fW' } as const

/** Sagittal angle and out-of-plane swing of a local segment, the representation nearest `prev`. */
function seg(v: V, s: number, prev?: [number, number]): [number, number] {
  const o = Math.asin(Math.max(-1, Math.min(1, (s * v[2]) / (norm(v) || 1)))) * D
  const a = Math.atan2(v[0], v[1]) * D
  if (!prev) return [a, o]
  const cands: [number, number][] = [[a, o], [a + 180, 180 - o], [a + 180, -180 - o]].map(([x, y]) => [near(x, prev[0]), near(y, prev[1])])
  const cost = ([x, y]: [number, number]) => Math.abs(x - prev[0]) * Math.abs(Math.cos(y / D)) + Math.abs(y - prev[1])
  return cands.reduce((b, c) => (cost(c) < cost(b) ? c : b))
}

/** Rotate `v` by `deg` about unit axis `ax` (Rodrigues). */
const turnAbout = (v: V, ax: V, deg: number): V => {
  const [c, s] = [Math.cos(deg / D), Math.sin(deg / D)]
  return addv(addv(scl(v, c), scl(cross(ax, v), s)), scl(ax, dot(ax, v) * (1 - c)))
}

/** Per-frame Pose + Stage, unwrapped so rotations never jump. */
export function retarget(sk: Skel[], low: number[], chestLen: number, frames: number[], dt: number, o: Opts = {}): Sample[] {
  const pin = PIN[o.pin ?? 'hip']
  const x0 = sk[frames[0]][pin][0]
  // Contacts sit a few units off the floor in the data; ignore that much so the figure doesn't hover.
  const lift0 = Math.min(...frames.map((f) => low[f]))
  let prevX: V | undefined
  let prev: number[] | undefined
  const segs: Record<string, [number, number] | undefined> = {}
  return frames.map((f) => {
    const s = sk[f]
    const l = unit(sub(s.nH, s.fH))
    const down: V = [0, 1, 0]
    const bodyDown = unit(sub(s.hip, s.waist))
    const front = unit(cross(bodyDown, l))
    // Frame forward: horizontal and square to the hip line; the pelvis front when the hip line is vertical.
    let c = cross(down, l)
    if (norm(c) < 0.25) c = [front[0], 0, front[2]]
    c = unit(c)
    if (dot(c, prevX ?? front) < 0) c = scl(c, -1)
    prevX = c
    const P = prev ?? []
    const turn = near(Math.atan2(c[2], c[0]) * D, P[12 + 2])
    const [ct, st] = [Math.cos(turn / D), Math.sin(turn / D)]
    const roll = near(Math.atan2(-l[1], l[2] * ct - l[0] * st) * D, P[12 + 3])
    const [cr, sr] = [Math.cos(roll / D), Math.sin(roll / D)]
    const Rx: V = [ct, 0, st]
    const Ry: V = [-sr * st, cr, sr * ct]
    const Rz: V = [-cr * st, -sr, cr * ct]
    const loc = (a: V, b: V): V => {
      const v = sub(b, a)
      return [dot(v, Rx), dot(v, Ry), dot(v, Rz)]
    }
    const ang = (v: V, p?: number) => near(Math.atan2(v[0], v[1]) * D, p)
    const torso = ang(loc(s.hip, s.waist), P[0])
    const chest = ang(loc(s.waist, s.shoulder), P[9])
    const head = ang(loc(s.shoulder, s.head), P[10])
    const ax: V = [Math.sin(chest / D), Math.cos(chest / D), 0]
    const flat = (v: V) => unit(sub(v, scl(ax, dot(v, ax))))
    const [hl, sl] = [flat([0, 0, 1]), flat(loc(s.fS, s.nS))]
    const twist = near(Math.atan2(dot(ax, cross(hl, sl)), dot(hl, sl)) * D, P[12 + 4])
    // Shrug or depression: the shoulders ride up or down the chest against its rest length.
    const scap = Math.max(-5, Math.min(6, norm(sub(s.shoulder, s.waist)) - chestLen))
    const limb = (k: string, a: V, b: V, side: number, arm: boolean) => {
      const v = loc(a, b)
      segs[k] = seg(arm ? turnAbout(v, ax, -twist) : v, side, segs[k])
      return segs[k]!
    }
    const [nu, nuo] = limb('nu', s.nS, s.nE, 1, true)
    const [nf, nfo] = limb('nf', s.nE, s.nW, 1, true)
    const [fu, fuo] = limb('fu', s.fS, s.fE, -1, true)
    const [ff, ffo] = limb('ff', s.fE, s.fW, -1, true)
    const [nt, nto] = limb('nt', s.nH, s.nK, 1, false)
    const [ns, nso] = limb('ns', s.nK, s.nA, 1, false)
    const [ft, fto] = limb('ft', s.fH, s.fK, -1, false)
    const [fs, fso] = limb('fs', s.fK, s.fA, -1, false)
    const lift = Math.max(0, low[f] - lift0 - 4)
    const shift = s[pin][0] - x0
    const v = [torso, nu, nf, fu, ff, nt, ns, ft, fs, chest, head, scap,
      lift, shift, turn, roll, twist, nuo, fuo, nfo - nuo, ffo - fuo, nto, fto, nso - nto, fso - fto]
    prev = v
    return { frame: f, t: (f - frames[0]) * dt, v }
  })
}
