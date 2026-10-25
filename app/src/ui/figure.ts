import { at, LEN, place, sequence, type Body, type Move, type Pose, type Prop } from '../core/figure'

const line = (a: { x: number; y: number }, b: { x: number; y: number }, cls: string) =>
  `<line class="${cls}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`

function body(b: Body, front: boolean) {
  const far = [line(b.farShoulder, b.farElbow, 'far'), line(b.farElbow, b.farHand, 'far'),
    line(b.farHip, b.farKnee, 'far'), line(b.farKnee, b.farFoot, 'far'), line(b.farFoot, b.farToe, 'far foot')]
  // Front view: a short bar across shoulders and hips joins the limbs to the torso.
  const girdles = front ? [line(b.nearShoulder, b.farShoulder, 'torso'), line(b.nearHip, b.farHip, 'torso')] : []
  const near = [...girdles, line(b.hip, b.shoulder, 'torso'), line(b.nearHip, b.knee, 'near'), line(b.knee, b.foot, 'near'), line(b.foot, b.toe, 'near foot'),
    line(b.nearShoulder, b.elbow, 'near'), line(b.elbow, b.hand, 'near')]
  // Side view: a dot on the face shows which way the figure looks.
  const dx = b.head.x - b.shoulder.x
  const dy = b.head.y - b.shoulder.y
  const n = Math.hypot(dx, dy) || 1
  const eye = front ? '' : `<circle class="eye" r="1.8" cx="${(b.head.x - (dy / n) * 5 + (dx / n) * 2).toFixed(1)}" cy="${(b.head.y + (dx / n) * 5 + (dy / n) * 2).toFixed(1)}"/>`
  return `${far.join('')}${near.join('')}<circle class="head" r="${LEN.head}" cx="${b.head.x.toFixed(1)}" cy="${b.head.y.toFixed(1)}"/>${eye}`
}

function prop(p: Prop, front: boolean) {
  switch (p.t) {
    case 'bar': return front ? `<line class="prop" x1="${p.x - 70}" y1="${p.y}" x2="${p.x + 70}" y2="${p.y}"/>` : `<circle class="prop" r="5" cx="${p.x}" cy="${p.y}"/>`
    case 'rings': return `<line class="prop thin" x1="${p.x}" y1="-400" x2="${p.x}" y2="${p.y - 6}"/><circle class="prop ring" r="6" cx="${p.x}" cy="${p.y}"/>`
    case 'wall': return `<rect class="prop fill" x="${p.x}" y="-400" width="12" height="400"/>`
    case 'pole': return `<line class="prop" x1="${p.x}" y1="-400" x2="${p.x}" y2="0"/>`
    case 'box': return `<rect class="prop fill" x="${p.x}" y="${-p.h}" width="${p.w}" height="${p.h}" rx="3"/>`
    case 'bars': return `<line class="prop thin" x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="0"/><circle class="prop" r="4" cx="${p.x}" cy="${p.y}"/>`
  }
}

/** Bounds over every key, so the frame stays still while the figure moves. */
function frame(m: Move) {
  const pts = sequence(m).flatMap((k) => Object.values(place(m, k)))
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

const scene = (m: Move, pose: Pose) =>
  `${(m.props ?? []).map((p) => prop(p, !!m.front)).join('')}${m.floor === false ? '' : '<line class="floor" x1="-600" y1="0" x2="600" y2="0"/>'}<g class="fig">${body(place(m, pose), !!m.front)}</g>`

export const still = (m: Move, pose: Pose) => `<svg class="figure" viewBox="${frame(m)}" role="img">${scene(m, pose)}</svg>`

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
      s.innerHTML = scene(m, reduce ? m.keys[m.keys.length - 1] : at(m, now - t0))
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export const live = (id: string, m: Move) => `<svg class="figure" data-move="${id}" viewBox="${frame(m)}" role="img" aria-label="Animated demonstration">${scene(m, m.keys[0])}</svg>`
