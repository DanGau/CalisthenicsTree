import { expect, test } from 'vitest'
import type { Body } from '../core/figure'
import { samples, type Sample } from '../core/physics'
import { MOVES } from './moves'

// Smoothness of every move, sampled at 60 fps over two loops (the seam inside). A spike is a frame where a joint's
// second difference (units/frame²) is both large and far above its neighbours': a pop, a branch flip, a speed jump.
const FRAME = 1000 / 60
/** Smallest spike: 4 units/frame² is ≈ 14 g at 60 fps (the figure a 1.75 m man). */
const JUMP = 4
/** A spike stands this many times above the median of the frames around it (±10, its own and next skipped). */
const RATIO = 8
/** Impacts are allowed: frames this close to a change of contacts or of the lowest joint (landings, strikes, rolls). */
const IMPACT = 3

const contactKey = (s: Sample) =>
  s.touch.map((c) => c.k).sort().join() + '|' + (Object.keys(s.b) as (keyof Body)[]).reduce((a, k) => (s.b[k].y > s.b[a].y ? k : a))

/** Spikes: [size, joint, ms], largest first. */
function spikes(s: Sample[]): [number, string, number][] {
  const keys = s.map(contactKey)
  const out: [number, string, number][] = []
  for (const k of Object.keys(s[0].b) as (keyof Body)[]) {
    const d = s.map((_, i) => {
      if (i === 0 || i === s.length - 1) return 0
      const [a, b, c] = [s[i - 1].b[k], s[i].b[k], s[i + 1].b[k]]
      return Math.hypot(a.x - 2 * b.x + c.x, a.y - 2 * b.y + c.y, (a.z ?? 0) - 2 * (b.z ?? 0) + (c.z ?? 0))
    })
    for (let i = 1; i < d.length - 1; i++) {
      if (d[i] <= JUMP) continue
      const near = d.slice(Math.max(1, i - 10), i + 11).filter((_, j) => Math.abs(j + Math.max(1, i - 10) - i) > 1).sort((x, y) => x - y)
      if (d[i] <= RATIO * (near[near.length >> 1] + 0.1)) continue
      if (new Set(keys.slice(Math.max(0, i - IMPACT), i + IMPACT + 1)).size > 1) continue
      out.push([d[i], k, Math.round(s[i].t)])
    }
  }
  return out.sort((a, b) => b[0] - a[0])
}

test.each(Object.entries(MOVES))('%s moves smoothly', (id, m) => {
  const top = spikes(samples(m, 2, FRAME)).slice(0, 3).map(([d, k, t]) => `${k} at ${t} ms (${d.toFixed(1)})`)
  expect(top, `${id} jerks`).toEqual([])
}, 30000)
