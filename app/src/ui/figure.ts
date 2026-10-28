import { at, LEN, place, sequence, type Body, type Move, type Pose, type Prop, type Pt, type Stage } from '../core/figure'

const f = (n: number) => n.toFixed(1)
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
const mix = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const off = (a: Pt, n: Pt, d: number): Pt => ({ x: a.x + n.x * d, y: a.y + n.y * d })
/** Unit normal of a→b, turned so it faces the figure's front when the segment points up. */
const normal = (a: Pt, b: Pt, s = 1): Pt => {
  const d = sub(b, a)
  const l = Math.hypot(d.x, d.y) || 1
  return { x: (-d.y / l) * s, y: (d.x / l) * s }
}

/** A tapered capsule from `a` (width `wa`) to `b` (width `wb`): one limb segment. */
function limb(a: Pt, b: Pt, wa: number, wb: number, cls: string) {
  const n = normal(a, b)
  const ra = wa / 2
  const rb = wb / 2
  const [a1, a2, b1, b2] = [off(a, n, ra), off(a, n, -ra), off(b, n, rb), off(b, n, -rb)]
  return `<path class="${cls}" d="M${f(a1.x)} ${f(a1.y)}L${f(b1.x)} ${f(b1.y)}A${f(rb)} ${f(rb)} 0 0 0 ${f(b2.x)} ${f(b2.y)}L${f(a2.x)} ${f(a2.y)}A${f(ra)} ${f(ra)} 0 0 0 ${f(a1.x)} ${f(a1.y)}Z"/>`
}

/** Closed smooth curve through points (Catmull-Rom as cubic Béziers). */
function blob(pts: Pt[], cls: string) {
  const n = pts.length
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`
  }
  return `<path class="${cls}" d="${d}Z"/>`
}

const dot = (p: Pt, r: number, cls: string) => `<circle class="${cls}" r="${r}" cx="${f(p.x)}" cy="${f(p.y)}"/>`

/** One arm or leg: skin, then shorts over the top of the thigh. */
const arm = (s: Pt, e: Pt, h: Pt, cls: string) => limb(s, e, 10, 8, cls) + limb(e, h, 8, 6, cls) + dot(h, 4.5, cls)
const leg = (hp: Pt, k: Pt, a: Pt, heel: Pt, toe: Pt, cls: string) =>
  limb(hp, k, 15, 10, cls) + limb(k, a, 10, 7, cls) + limb(heel, toe, 7, 5, `${cls} shoe`) + limb(hp, mix(hp, k, 0.45), 17, 15, `${cls} shorts`)

/** Side view torso: pelvis, a slight belly, and a chest deeper than the waist. */
/** `s` is -1 when the figure is turned past 90 and faces the other way. */
function torso(b: Body, front: boolean, s: number) {
  if (front) {
    // n points from the spine toward the near (viewer's left) side.
    const g = sub(b.nearShoulder, b.shoulder)
    const n = { x: g.x / 17, y: g.y / 17 }
    const top = mix(b.waist, b.shoulder, 0.8)
    const seat = mix(b.hip, b.waist, -0.25)
    const belt = mix(b.hip, b.waist, 0.45)
    return blob([b.nearShoulder, off(top, n, 14), off(b.waist, n, 12), off(b.hip, n, 14),
      off(b.hip, n, -14), off(b.waist, n, -12), off(top, n, -14), b.farShoulder, mix(b.shoulder, b.head, 0.3)], 'skin')
      + blob([off(belt, n, 13), off(b.hip, n, 15), off(seat, n, 10), off(seat, n, -10), off(b.hip, n, -15), off(belt, n, -13)], 'shorts')
  }
  const nl = normal(b.hip, b.waist, s)
  const nu = normal(b.waist, b.shoulder, s)
  const chest = mix(b.waist, b.shoulder, 0.6)
  return blob([off(b.hip, nl, -10), off(b.waist, nl, -8), off(chest, nu, -10), off(b.shoulder, nu, -7), mix(b.shoulder, b.head, 0.3),
    off(b.shoulder, nu, 8), off(chest, nu, 12), off(b.waist, nl, 10), off(b.hip, nl, 9), off(mix(b.hip, b.waist, -0.35), nl, 0)], 'skin')
    + blob([off(mix(b.hip, b.waist, 0.5), nl, -9.5), off(b.hip, nl, -11), off(mix(b.hip, b.waist, -0.35), nl, -2),
      off(mix(b.hip, b.waist, -0.35), nl, 4), off(b.hip, nl, 10), off(mix(b.hip, b.waist, 0.5), nl, 10.5)], 'shorts')
}

function head(b: Body, front: boolean, s: number, back = false) {
  const base = mix(b.shoulder, b.head, 0.35)
  const neck = limb(b.shoulder, base, 10, 9, 'skin')
  const skull = dot(b.head, LEN.head, 'skin')
  if (front && back) return neck + skull + dot(b.head, LEN.head - 1, 'hair')
  if (front) return neck + skull + dot(off(b.head, normal(b.shoulder, b.head), -4), 1.6, 'eye') + dot(off(b.head, normal(b.shoulder, b.head), 4), 1.6, 'eye')
  const up = sub(b.head, b.shoulder)
  const l = Math.hypot(up.x, up.y) || 1
  const u = { x: up.x / l, y: up.y / l }
  const fwd = normal(b.shoulder, b.head, s)
  const face = (d: number, h: number) => ({ x: b.head.x + fwd.x * d + u.x * h, y: b.head.y + fwd.y * d + u.y * h })
  // Hair caps the back and top; eye and nose show which way the figure looks.
  const r = LEN.head + 0.8
  const [h1, h2] = [face(-r * 0.7, -r * 0.7), face(r * 0.55, r * 0.83)]
  const hair = `<path class="hair" d="M${f(h1.x)} ${f(h1.y)}A${f(r)} ${f(r)} 0 0 ${s > 0 ? 1 : 0} ${f(h2.x)} ${f(h2.y)}Q${f(face(-2, 4).x)} ${f(face(-2, 4).y)} ${f(h1.x)} ${f(h1.y)}Z"/>`
  const nose = limb(face(9, 0), face(12.5, -1.5), 3.5, 2.5, 'skin')
  return neck + skull + nose + hair + dot(face(6, 2), 1.6, 'eye')
}

/** A 3D body: every part drawn back to front by depth, limbs shaded darker when behind the trunk. */
function solidBody(b: Body) {
  const z = (...ps: Pt[]) => ps.reduce((a, p) => a + (p.z ?? 0), 0) / ps.length
  const mid = z(b.hip, b.shoulder)
  const shade = (...ps: Pt[]) => (z(...ps) < mid - 2 ? 'f' : 'n')
  const parts: [number, string][] = []
  const part = (svg: string, ...ps: Pt[]) => parts.push([z(...ps), svg])
  const armOf = (s: Pt, e: Pt, h: Pt) => {
    const c = shade(s, e, h)
    part(limb(s, e, 10, 8, c), s, e)
    part(limb(e, h, 8, 6, c) + dot(h, 4.5, c), e, h)
  }
  const legOf = (hp: Pt, k: Pt, a: Pt, heel: Pt, toe: Pt) => {
    const c = shade(hp, k, a)
    part(limb(hp, k, 15, 10, c) + limb(hp, mix(hp, k, 0.45), 17, 15, `${c} shorts`), hp, k)
    part(limb(k, a, 10, 7, c) + limb(heel, toe, 7, 5, `${c} shoe`), k, a)
  }
  // Trunk: a spine capsule plus shoulder and hip girdles, so it reads wide from the front, deep from the side.
  part(limb(b.hip, b.waist, 21, 19, 'skin') + limb(b.waist, b.shoulder, 19, 22, 'skin') + limb(b.nearShoulder, b.farShoulder, 13, 13, 'skin')
    + limb(b.nearHip, b.farHip, 19, 19, 'shorts') + limb(b.hip, mix(b.hip, b.waist, 0.45), 22, 20, 'shorts'), b.hip, b.shoulder)
  armOf(b.nearShoulder, b.elbow, b.hand)
  armOf(b.farShoulder, b.farElbow, b.farHand)
  legOf(b.nearHip, b.knee, b.foot, b.heel, b.toe)
  legOf(b.farHip, b.farKnee, b.farFoot, b.farHeel, b.farToe)
  // Head: profile eye when side-on, two eyes facing the viewer, hair only from behind.
  const fx = b.face.x - b.head.x
  const fy = b.face.y - b.head.y
  const fz = (b.face.z ?? 0) - (b.head.z ?? 0)
  const across = { x: b.nearShoulder.x - b.farShoulder.x, y: b.nearShoulder.y - b.farShoulder.y }
  const al = Math.hypot(across.x, across.y) || 1
  const at = (d: number, side: number) => ({ x: b.head.x + fx * d + (across.x / al) * side, y: b.head.y + fy * d + (across.y / al) * side })
  const features = fz < -0.6 ? dot(b.head, LEN.head - 1, 'hair')
    : fz > 0.6 ? dot(at(3, 4), 1.6, 'eye') + dot(at(3, -4), 1.6, 'eye')
    : dot(at(7, 0), 1.6, 'eye') + limb(at(9, 0), at(12.5, 0), 3.5, 2.5, 'skin')
  // Hair: a disc set back from the face, mostly hidden by the skull, so a cap shows at the back and top.
  const up = { x: b.head.x - b.shoulder.x, y: b.head.y - b.shoulder.y }
  const ul = Math.hypot(up.x, up.y) || 1
  const hair = dot({ x: b.head.x - fx * 2.5 + (up.x / ul) * 1.5, y: b.head.y - fy * 2.5 + (up.y / ul) * 1.5 }, LEN.head + 0.5, 'hair')
  part(limb(b.shoulder, mix(b.shoulder, b.head, 0.35), 10, 9, 'skin') + hair + dot(b.head, LEN.head, 'skin') + features, b.head)
  return parts.sort((a, c) => a[0] - c[0]).map((p) => p[1]).join('')
}

function body(b: Body, front: boolean, s = 1, back = false) {
  const far = arm(b.farShoulder, b.farElbow, b.farHand, 'f') + leg(b.farHip, b.farKnee, b.farFoot, b.farHeel, b.farToe, 'f')
  const near = leg(b.nearHip, b.knee, b.foot, b.heel, b.toe, 'n') + arm(b.nearShoulder, b.elbow, b.hand, 'n')
  return front ? torso(b, true, s) + head(b, true, s, back) + far + near : far + torso(b, false, s) + head(b, false, s) + near
}

function prop(p: Prop, front: boolean, up = 0) {
  switch (p.t) {
    case 'bar': return front ? `<line class="prop" x1="${p.x - 70}" y1="${p.y}" x2="${p.x + 70}" y2="${p.y}"/>` : `<line class="prop thin" x1="${p.x - 26}" y1="-400" x2="${p.x}" y2="${p.y}"/><line class="prop thin" x1="${p.x + 26}" y1="-400" x2="${p.x}" y2="${p.y}"/><circle class="prop bar" r="5" cx="${p.x}" cy="${p.y}"/>`
    case 'rings': return `<line class="prop thin" x1="${p.x}" y1="-400" x2="${p.x}" y2="${p.y - 6}"/><circle class="prop ring" r="6" cx="${p.x}" cy="${p.y}"/>`
    case 'wall': return `<rect class="prop fill" x="${p.x}" y="-400" width="12" height="400"/>`
    case 'pole': {
      // Marks every 30 slide past as the view climbs.
      const marks = Array.from({ length: 21 }, (_, i) => Math.floor(-up / 30) * 30 + (i - 10) * 30).filter((y) => y < 0)
      return `<line class="prop" x1="${p.x}" y1="${-up - 2000}" x2="${p.x}" y2="0"/>${marks.map((y) => `<line class="prop mark" x1="${p.x - 4}" y1="${y}" x2="${p.x + 4}" y2="${y + 3}"/>`).join('')}`
    }
    case 'box': return `<rect class="prop fill" x="${p.x}" y="${-p.h}" width="${p.w}" height="${p.h}" rx="3"/>`
    case 'bars': return `<line class="prop thin" x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="0"/><circle class="prop" r="4" cx="${p.x}" cy="${p.y}"/>`
  }
}

/** Bounds over every key, so the frame stays still while the figure moves. */
function frame(m: Move) {
  // A travelling or climbing move is framed without it: the view follows.
  const pts = sequence(m).flatMap((k) => Object.values(place(m, k.pose, { ...k, shift: m.travel ? 0 : k.shift, lift: m.climb ? 0 : k.lift })))
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const pad = 18
  const x0 = Math.min(...xs) - pad
  const x1 = Math.max(...xs) + pad
  const y0 = Math.min(...ys) - pad
  const low = Math.max(...ys)
  // Show the floor only when the figure is near it; hanging skills frame the bar instead.
  const y1 = (low > -70 ? Math.max(0, low) : low) + pad
  const w = Math.max(x1 - x0, (y1 - y0) * 1.3)
  const cx = (x0 + x1) / 2
  return `${(cx - w / 2).toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${(y1 - y0).toFixed(1)}`
}

/** Floor line with marks every 40, so travel shows as the ground sliding past. */
function floor(cam: number) {
  const marks = Array.from({ length: 31 }, (_, i) => Math.floor(cam / 40) * 40 + (i - 15) * 40)
  return `<line class="floor" x1="${cam - 600}" y1="0" x2="${cam + 600}" y2="0"/>${marks.map((x) => `<line class="floor mark" x1="${x}" y1="2" x2="${x - 6}" y2="9"/>`).join('')}`
}

function scene(m: Move, pose: Pose, st: Partial<Stage> = {}) {
  const cam = m.travel ? (st.shift ?? 0) : 0
  const up = m.climb ? (st.lift ?? 0) : 0
  const world = `${(m.props ?? []).map((p) => prop(p, !!m.front, up)).join('')}${m.floor === false ? '' : floor(cam)}<g class="fig">${m.solid ? solidBody(place(m, pose, st)) : body(place(m, pose, st), !!m.front, Math.cos(((st.turn ?? 0) * Math.PI) / 180) < 0 ? -1 : 1, m.back)}</g>`
  return cam || up ? `<g transform="translate(${f(-cam)} ${f(up)})">${world}</g>` : world
}

export const still = (m: Move, pose: Pose, st: Partial<Stage> = {}) => `<svg class="figure" viewBox="${frame(m)}" role="img">${scene(m, pose, st)}</svg>`

/** Animates every `.figure[data-move]` inside `root` until they leave the page. */
export function animate(root: HTMLElement, moves: Record<string, Move>) {
  const svgs = [...root.querySelectorAll<SVGSVGElement>('svg.figure[data-move]')]
  if (!svgs.length) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const t0 = performance.now()
  const tick = (now: number) => {
    if (!svgs.some((s) => s.isConnected)) return
    for (const s of svgs) {
      const m = moves[s.dataset.move!]
      const st = reduce ? { pose: m.keys[m.keys.length - 1], lift: 0 } : at(m, now - t0)
      s.innerHTML = scene(m, st.pose, st)
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export const live = (id: string, m: Move) => `<svg class="figure" data-move="${id}" viewBox="${frame(m)}" role="img" aria-label="Animated demonstration">${scene(m, m.keys[0])}</svg>`
