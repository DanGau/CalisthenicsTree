// glTF/GLB skinned animation → the BVH-named joint positions `world` fits. Y up, metres.
import { readFileSync } from 'node:fs'
import type { V } from './bvh'

type Node = { name?: string; children?: number[]; translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[] }
type Gltf = {
  nodes: Node[]; scenes: { nodes: number[] }[]; scene?: number; skins?: { joints: number[] }[]
  animations?: { name?: string; channels: { sampler: number; target: { node?: number; path: string } }[]; samplers: { input: number; output: number; interpolation?: string }[] }[]
  accessors: { bufferView?: number; byteOffset?: number; count: number; type: string; componentType: number; normalized?: boolean }[]
  bufferViews: { byteOffset?: number; byteStride?: number }[]
}
export type Glb = { j: Gltf; bin: Buffer }

export function load(path: string): Glb {
  const b = readFileSync(path)
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path}: not a GLB`)
  const n = b.readUInt32LE(12)
  const j = JSON.parse(b.subarray(20, 20 + n).toString('utf8')) as Gltf
  const at = 20 + n
  return { j, bin: b.subarray(at + 8, at + 8 + b.readUInt32LE(at)) }
}

const SIZE: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const READ: Record<number, [number, (b: Buffer, o: number) => number, number]> = {
  5126: [4, (b, o) => b.readFloatLE(o), 1], 5120: [1, (b, o) => b.readInt8(o), 127], 5121: [1, (b, o) => b.readUInt8(o), 255],
  5122: [2, (b, o) => b.readInt16LE(o), 32767], 5123: [2, (b, o) => b.readUInt16LE(o), 65535],
}

function accessor({ j, bin }: Glb, i: number): number[][] {
  const a = j.accessors[i]
  const v = j.bufferViews[a.bufferView!]
  const [bytes, rd, max] = READ[a.componentType]
  const k = SIZE[a.type]
  const stride = v.byteStride ?? bytes * k
  const base = (v.byteOffset ?? 0) + (a.byteOffset ?? 0)
  return Array.from({ length: a.count }, (_, n) => Array.from({ length: k }, (_, c) => {
    const x = rd(bin, base + n * stride + c * bytes)
    return a.componentType === 5126 || !a.normalized ? x : Math.max(x / max, -1)
  }))
}

type M = number[] // 4x4 column-major, as glTF
const mul = (a: M, b: M): M => Array.from({ length: 16 }, (_, i) => {
  const [c, r] = [i >> 2, i & 3]
  return a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
})
function trs(t: number[], q: number[], s: number[]): M {
  const [x, y, z, w] = q
  return [
    (1 - 2 * (y * y + z * z)) * s[0], 2 * (x * y + z * w) * s[0], 2 * (x * z - y * w) * s[0], 0,
    2 * (x * y - z * w) * s[1], (1 - 2 * (x * x + z * z)) * s[1], 2 * (y * z + x * w) * s[1], 0,
    2 * (x * z + y * w) * s[2], 2 * (y * z - x * w) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ]
}
function slerp(a: number[], b: number[], u: number): number[] {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  const bb = d < 0 ? b.map((x) => -x) : b
  d = Math.abs(d)
  const q = d > 0.9995 ? a.map((x, i) => x + (bb[i] - x) * u) : (() => {
    const th = Math.acos(d)
    const [wa, wb] = [Math.sin((1 - u) * th) / Math.sin(th), Math.sin(u * th) / Math.sin(th)]
    return a.map((x, i) => wa * x + wb * bb[i])
  })()
  const n = Math.hypot(...q)
  return q.map((x) => x / n)
}

export const names = (g: Glb) => (g.j.animations ?? []).map((a, i) => `${i}: ${a.name ?? '?'}`)

/** BVH joint name → candidate bone names: Mixamo (prefix stripped), Unreal/UAL2, Rigify DEF (UAL1). */
const MAP: Record<string, string[]> = {
  Spine: ['Spine', 'spine_01', 'DEF-spine.001'], Neck: ['Neck', 'neck_01', 'DEF-neck'], Head: ['Head', 'head', 'DEF-head'],
  ...Object.fromEntries((['Left', 'Right'] as const).flatMap((s) => {
    const [u, r] = s === 'Left' ? ['l', 'L'] : ['r', 'R']
    return [
      [`${s}Arm`, [`${s}Arm`, `upperarm_${u}`, `DEF-upper_arm.${r}`]], [`${s}ForeArm`, [`${s}ForeArm`, `lowerarm_${u}`, `DEF-forearm.${r}`]],
      [`${s}Hand`, [`${s}Hand`, `hand_${u}`, `DEF-hand.${r}`]], [`${s}UpLeg`, [`${s}UpLeg`, `thigh_${u}`, `DEF-thigh.${r}`]],
      [`${s}Leg`, [`${s}Leg`, `calf_${u}`, `DEF-shin.${r}`]], [`${s}Foot`, [`${s}Foot`, `foot_${u}`, `DEF-foot.${r}`]],
      [`${s}ToeBase`, [`${s}ToeBase`, `ball_${u}`, `DEF-toe.${r}`]],
    ]
  })),
}

/** Animation `anim` (index or name) sampled at `fps`: per frame, BVH-named world positions; plus rest leg and chest lengths. */
export function sample(g: Glb, anim: string, fps: number): { P: Record<string, V>[]; dt: number; name: string } {
  const { j } = g
  const ai = /^\d+$/.test(anim) ? +anim : (j.animations ?? []).findIndex((a) => a.name === anim)
  const A = j.animations?.[ai]
  if (!A) throw new Error(`no animation ${anim}; have:\n${names(g).join('\n')}`)
  const parent: number[] = j.nodes.map(() => -1)
  j.nodes.forEach((n, i) => n.children?.forEach((c) => (parent[c] = i)))
  const order: number[] = []
  const walk = (i: number) => { order.push(i); j.nodes[i].children?.forEach(walk) }
  j.scenes[j.scene ?? 0].nodes.forEach(walk)
  const idx: Record<string, number> = {}
  j.nodes.forEach((n, i) => { if (n.name) idx[n.name.replace(/^mixamorig\d*:/, '')] = i })
  const bone: Record<string, number> = {}
  for (const [k, cands] of Object.entries(MAP)) {
    const c = cands.find((x) => idx[x] !== undefined)
    if (c === undefined) throw new Error(`no bone for ${k} (tried ${cands.join(', ')})`)
    bone[k] = idx[c]
  }
  const tracks = A.channels.filter((c) => c.target.node !== undefined && c.target.path !== 'weights').map((c) => {
    const s = A.samplers[c.sampler]
    const t = accessor(g, s.input).map((x) => x[0])
    let v = accessor(g, s.output)
    if (s.interpolation === 'CUBICSPLINE') v = v.filter((_, i) => i % 3 === 1)
    return { node: c.target.node!, path: c.target.path, t, v, step: s.interpolation === 'STEP' }
  })
  const end = Math.max(...tracks.map((k) => k.t[k.t.length - 1]))
  const dt = 1 / fps
  const P: Record<string, V>[] = []
  for (let time = 0; time <= end + 1e-6; time += dt) {
    const T = j.nodes.map((n) => n.translation ?? [0, 0, 0])
    const R = j.nodes.map((n) => n.rotation ?? [0, 0, 0, 1])
    const S = j.nodes.map((n) => n.scale ?? [1, 1, 1])
    for (const k of tracks) {
      let i = k.t.findIndex((x) => x > time)
      if (i < 0) i = k.t.length
      const [a, b] = [k.v[Math.max(0, i - 1)], k.v[Math.min(k.t.length - 1, i)]]
      const u = i === 0 || i === k.t.length || k.step ? 0 : (time - k.t[i - 1]) / (k.t[i] - k.t[i - 1])
      const val = k.path === 'rotation' ? slerp(a, b, u) : a.map((x, c) => x + (b[c] - x) * u)
      ;(k.path === 'rotation' ? R : k.path === 'translation' ? T : S)[k.node] = val
    }
    const W: M[] = []
    for (const i of order) {
      const n = j.nodes[i]
      const local = n.matrix && !tracks.some((k) => k.node === i) ? n.matrix : trs(T[i], R[i], S[i])
      W[i] = parent[i] < 0 ? local : mul(W[parent[i]], local)
    }
    const pos = (i: number): V => [W[i][12], W[i][13], W[i][14]]
    const p: Record<string, V> = {}
    for (const [k, i] of Object.entries(bone)) p[k] = pos(i)
    // Head bone sits at the skull base: extend along neck→head for the top.
    p.HeadEnd = [0, 1, 2].map((c) => p.Head[c] + 1.2 * (p.Head[c] - p.Neck[c])) as V
    P.push(p)
  }
  return { P, dt, name: A.name ?? String(ai) }
}
