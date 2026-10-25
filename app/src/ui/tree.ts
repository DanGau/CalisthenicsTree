import { branchAngle, position, radius } from '../core/layout'
import { fraction, status, type Progress } from '../core/progress'
import type { Skill } from '../core/types'
import { BRANCHES, BY_ID, SKILLS } from '../content/tree'
import { esc } from './html'

const INDEX = new Map(BRANCHES.map((b, i) => [b.id, i]))
const KIND = new Map(BRANCHES.map((b) => [b.id, b.kind]))
const POS = new Map(SKILLS.map((s) => [s.id, position(s, INDEX.get(s.branch)!, BRANCHES.length)]))
const TOP = new Map<string, number>()
for (const s of SKILLS) TOP.set(s.branch, Math.max(TOP.get(s.branch) ?? 0, s.tier))
const OUTER = radius(Math.max(...TOP.values()) + 1.4)

/** Keystones are each branch's last tier: drawn larger, like Path of Exile notables. */
const isKeystone = (s: Skill) => s.tier === TOP.get(s.branch)
const nodeR = (s: Skill) => (isKeystone(s) ? 22 : s.tier === 1 ? 14 : 16)

/** Pan and zoom survive re-renders. */
const view = { x: 0, y: 0, k: 0.42 }

function edge(a: Skill, b: Skill, p: Progress) {
  const pa = POS.get(a.id)!
  const pb = POS.get(b.id)!
  const sa = status(p, a, BY_ID)
  const sb = status(p, b, BY_ID)
  const cls = sa === 'mastered' && sb === 'mastered' ? 'lit' : sa === 'mastered' ? 'ready' : 'dim'
  if (a.branch === b.branch) return `<line class="edge ${cls}" x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}"/>`
  // Cross-branch links bow toward the centre so they read as bridges, not branch paths.
  const mx = (pa.x + pb.x) * 0.38
  const my = (pa.y + pb.y) * 0.38
  return `<path class="edge cross ${cls}" d="M${pa.x} ${pa.y}Q${mx} ${my} ${pb.x} ${pb.y}"/>`
}

function node(s: Skill, p: Progress, selected: string | undefined) {
  const { x, y } = POS.get(s.id)!
  const st = status(p, s, BY_ID)
  const r = nodeR(s)
  const c = 2 * Math.PI * (r + 4)
  const f = fraction(p, s)
  return `<g class="node ${st} ${KIND.get(s.branch)} ${isKeystone(s) ? 'key' : ''} ${s.id === selected ? 'sel' : ''}" data-id="${s.id}" transform="translate(${x} ${y})">
    <circle class="halo" r="${r + 9}"/>
    <circle class="ring" r="${r + 4}"/>
    ${f > 0 && f < 1 ? `<circle class="arc" r="${r + 4}" stroke-dasharray="${c * f} ${c}" transform="rotate(-90)"/>` : ''}
    <circle class="core" r="${r}"/>
    <text class="tier" dy="0.35em">${st === 'mastered' ? '✓' : s.tier}</text>
    <text class="label" y="${r + 16}">${wrap(s.name).map((l, i) => `<tspan x="0" dy="${i ? '1.1em' : 0}">${esc(l)}</tspan>`).join('')}</text>
  </g>`
}

/** Splits a name into lines of about 11 characters so side-by-side lanes don't collide. */
function wrap(name: string) {
  const lines: string[] = []
  for (const w of name.split(' ')) {
    const last = lines.length - 1
    if (last >= 0 && (lines[last] + ' ' + w).length <= 11) lines[last] += ' ' + w
    else lines.push(w)
  }
  return lines
}

function labels() {
  return BRANCHES.map((b, i) => {
    const a = branchAngle(i, BRANCHES.length)
    const r = radius(TOP.get(b.id)! + 1.1)
    const deg = (a * 180) / Math.PI + 90
    const flip = deg > 90 && deg < 270
    return `<text class="branch ${b.kind}" transform="translate(${Math.cos(a) * r} ${Math.sin(a) * r}) rotate(${flip ? deg + 180 : deg})">${esc(b.name.toUpperCase())}</text>`
  }).join('')
}

function rings() {
  const tiers = Math.max(...TOP.values())
  return Array.from({ length: tiers }, (_, i) => `<circle class="orbit" r="${radius(i + 1)}"/>`).join('')
}

export function treeSvg(p: Progress, selected?: string) {
  const edges = SKILLS.flatMap((s) => s.requires.map((r) => edge(BY_ID.get(r)!, s, p)))
  const roots = SKILLS.filter((s) => s.tier === 1).map((s) => {
    const { x, y } = POS.get(s.id)!
    return `<line class="edge ${status(p, s, BY_ID) === 'mastered' ? 'lit' : 'ready'}" x1="0" y1="0" x2="${x}" y2="${y}"/>`
  })
  const mastered = SKILLS.filter((s) => status(p, s, BY_ID) === 'mastered').length
  return `<svg class="tree" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow"><stop offset="0" stop-color="var(--gold)" stop-opacity="0.35"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="world">
      <circle class="outer" r="${OUTER}"/>
      ${rings()}
      ${labels()}
      ${roots.join('')}
      ${edges.join('')}
      <circle r="150" fill="url(#glow)"/>
      <g class="hub"><circle r="64"/><circle class="hub-in" r="52"/>
        <text class="hub-n" dy="0.1em">${mastered}</text><text class="hub-l" y="22">of ${SKILLS.length}</text></g>
      ${SKILLS.map((s) => node(s, p, selected)).join('')}
    </g>
  </svg>`
}

/** Pointer pan, pinch and wheel zoom. Taps on nodes call `onTap`. */
export function mountTree(svg: SVGSVGElement, onTap: (id: string) => void) {
  const world = svg.querySelector<SVGGElement>('.world')!
  const apply = () => {
    const w = svg.clientWidth
    const h = svg.clientHeight
    world.setAttribute('transform', `translate(${w / 2 + view.x} ${h / 2 + view.y}) scale(${view.k})`)
  }
  const zoomAt = (cx: number, cy: number, factor: number) => {
    const k = Math.min(2.5, Math.max(0.12, view.k * factor))
    const w = svg.clientWidth / 2
    const h = svg.clientHeight / 2
    view.x = cx - w - ((cx - w - view.x) * k) / view.k
    view.y = cy - h - ((cy - h - view.y) * k) / view.k
    view.k = k
    apply()
  }
  const pts = new Map<number, { x: number; y: number }>()
  let moved = 0
  let pinch = 0
  svg.addEventListener('pointerdown', (e) => {
    svg.setPointerCapture(e.pointerId)
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 1) moved = 0
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      pinch = Math.hypot(a.x - b.x, a.y - b.y)
    }
  })
  svg.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    pts.set(e.pointerId, cur)
    if (pts.size === 1) {
      view.x += cur.x - prev.x
      view.y += cur.y - prev.y
      moved += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y)
      apply()
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const r = svg.getBoundingClientRect()
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinch)
      pinch = d
      moved = 99
    }
  })
  const up = (e: PointerEvent) => {
    const tapped = pts.size === 1 && moved < 8
    pts.delete(e.pointerId)
    if (!tapped) return
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<SVGGElement>('.node')
    if (hit) onTap(hit.dataset.id!)
  }
  svg.addEventListener('pointerup', up)
  svg.addEventListener('pointercancel', (e) => pts.delete(e.pointerId))
  svg.addEventListener('wheel', (e) => {
    e.preventDefault()
    const r = svg.getBoundingClientRect()
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15)
  }, { passive: false })
  addEventListener('resize', apply)
  apply()
  return {
    /** Centres a skill, leaving room for the sheet below it. */
    focus(id: string) {
      const pos = POS.get(id)!
      view.k = Math.max(view.k, 0.75)
      view.x = -pos.x * view.k
      view.y = -pos.y * view.k - svg.clientHeight * 0.25
      apply()
    },
    branch(id: string) {
      const a = branchAngle(INDEX.get(id)!, BRANCHES.length)
      const r = radius((TOP.get(id)! + 1) / 2)
      view.k = 0.5
      view.x = -Math.cos(a) * r * view.k
      view.y = -Math.sin(a) * r * view.k
      apply()
    },
    zoom(f: number) {
      zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, f)
    },
    home() {
      Object.assign(view, { x: 0, y: 0, k: 0.42 })
      apply()
    },
  }
}
