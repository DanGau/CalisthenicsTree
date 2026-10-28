// SVG of the raw mocap skeleton, and HTML → PNG through Playwright.
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { camera, type Move } from '../../src/core/figure'
import type { V } from './bvh'
import type { Skel } from './fit'

const BONES: [keyof Skel, keyof Skel][] = [
  ['hip', 'waist'], ['waist', 'shoulder'], ['shoulder', 'head'], ['nS', 'fS'], ['nH', 'fH'],
  ['nS', 'nE'], ['nE', 'nW'], ['nH', 'nK'], ['nK', 'nA'], ['nA', 'nT'],
  ['fS', 'fE'], ['fE', 'fW'], ['fH', 'fK'], ['fK', 'fA'], ['fA', 'fT'],
]
const FAR = new Set(['fS', 'fE', 'fW', 'fH', 'fK', 'fA', 'fT'])

/** Stick figure seen through a move's camera, shifted by `off` (world units; y measured down from the floor). */
export function stick(s: Skel, cam: Pick<Move, 'view' | 'tilt'>, off: V, label = ''): { svg: string; box: number[] } {
  const p = (k: keyof Skel) => camera(cam as Move, { x: s[k][0] - off[0], y: s[k][1] - off[1], z: s[k][2] - off[2] })
  const lines = BONES.map(([a, b]) => {
    const [u, v] = [p(a), p(b)]
    const col = FAR.has(a) || FAR.has(b) ? '#7a8fb8' : '#f0c060'
    return { z: ((u.z ?? 0) + (v.z ?? 0)) / 2, d: `<line x1="${u.x.toFixed(1)}" y1="${u.y.toFixed(1)}" x2="${v.x.toFixed(1)}" y2="${v.y.toFixed(1)}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>` }
  }).sort((a, b) => a.z - b.z)
  const h = p('head')
  const pts = (Object.keys(s) as (keyof Skel)[]).map(p)
  const box = [Math.min(...pts.map((q) => q.x)), Math.min(...pts.map((q) => q.y)) - 12, Math.max(...pts.map((q) => q.x)), Math.max(...pts.map((q) => q.y))]
  const svg = lines.map((l) => l.d).join('') + `<circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="10" fill="none" stroke="#f0c060" stroke-width="3"/>`
    + (label ? `<text x="${box[0]}" y="${box[1] - 4}" fill="#ccc" font-size="18">${label}</text>` : '')
  return { svg, box }
}

const CSS = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')

export async function png(body: string, path: string, width = 1600) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width, height: 600 } })
    await page.setContent(`<!doctype html><style>${CSS} body{height:auto;padding:12px} .grid{display:grid;gap:4px} .cell{background:#1a1612;position:relative}
      .cell b{position:absolute;left:4px;top:2px;font:12px monospace;color:#bbb} svg{width:100%;height:auto;display:block}</style>${body}`)
    await page.screenshot({ path, fullPage: true })
    writeFileSync(path.replace(/.png$/, '.html'), await page.content())
  } finally {
    await browser.close()
  }
}
