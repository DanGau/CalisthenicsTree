// BVH parsing and forward kinematics. Y up, BVH units.
export type V = [number, number, number]
type Joint = { name: string; parent: number; offset: V; channels: string[] }
export type Bvh = { joints: Joint[]; frames: number[][]; dt: number }

export function parse(text: string): Bvh {
  const tok = text.split(/\s+/).filter(Boolean)
  let i = 0
  const joints: Joint[] = []
  const stack: number[] = []
  while (tok[i] !== 'MOTION') {
    const t = tok[i++]
    if (t === 'ROOT' || t === 'JOINT' || t === 'End') {
      const name = t === 'End' ? `${joints[stack[stack.length - 1]].name}End` : tok[i]
      i++
      joints.push({ name, parent: stack.length ? stack[stack.length - 1] : -1, offset: [0, 0, 0], channels: [] })
    } else if (t === '{') stack.push(joints.length - 1)
    else if (t === '}') stack.pop()
    else if (t === 'OFFSET') {
      joints[joints.length - 1].offset = [+tok[i], +tok[i + 1], +tok[i + 2]]
      i += 3
    } else if (t === 'CHANNELS') {
      const n = +tok[i++]
      joints[joints.length - 1].channels = tok.slice(i, i + n)
      i += n
    }
  }
  i++
  const count = +tok[i + 1]
  const dt = +tok[i + 4]
  i += 5
  const width = joints.reduce((s, j) => s + j.channels.length, 0)
  const frames: number[][] = []
  for (let f = 0; f < count; f++, i += width) frames.push(tok.slice(i, i + width).map(Number))
  return { joints, frames, dt }
}

type M = number[] // 3x3 row-major
const mul = (a: M, b: M): M => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]))
const apply = (m: M, v: V): V => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]
const rot = (axis: string, deg: number): M => {
  const r = (deg * Math.PI) / 180
  const [c, s] = [Math.cos(r), Math.sin(r)]
  if (axis === 'X') return [1, 0, 0, 0, c, -s, 0, s, c]
  if (axis === 'Y') return [c, 0, s, 0, 1, 0, -s, 0, c]
  return [c, -s, 0, s, c, 0, 0, 0, 1]
}

/** World position of every joint (end sites included) per frame, keyed by joint name. */
export function positions(b: Bvh): Record<string, V>[] {
  return b.frames.map((row) => {
    let k = 0
    const R: M[] = []
    const P: V[] = []
    const out: Record<string, V> = {}
    b.joints.forEach((j, n) => {
      let pos: V = [...j.offset]
      let m: M = [1, 0, 0, 0, 1, 0, 0, 0, 1]
      for (const ch of j.channels) {
        const v = row[k++]
        if (ch.endsWith('position')) pos[ch === 'Xposition' ? 0 : ch === 'Yposition' ? 1 : 2] += v
        else m = mul(m, rot(ch[0], v))
      }
      if (j.parent >= 0) {
        const o = apply(R[j.parent], pos)
        pos = [P[j.parent][0] + o[0], P[j.parent][1] + o[1], P[j.parent][2] + o[2]]
        m = mul(R[j.parent], m)
      }
      R[n] = m
      P[n] = pos
      out[j.name] = pos
    })
    return out
  })
}
