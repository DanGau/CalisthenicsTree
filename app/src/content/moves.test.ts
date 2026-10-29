import { expect, test } from 'vitest'
import { at, loopMs, place, sequence, sink } from '../core/figure'
import { MOVES } from './moves'
import { SKILLS } from './tree'

test.each(SKILLS)('$id has an animation', (s) => {
  expect(MOVES[s.id], `add ${s.id} to content/moves/${s.branch}.ts`).toBeDefined()
})

test.each(Object.entries(MOVES))('%s stays above the floor', (id, m) => {
  expect(SKILLS.some((s) => s.id === id), `${id} is not a skill`).toBe(true)
  for (const k of m.keys) expect([9, 10, 11, 12]).toContain(k.length)
  if (m.beats) expect(m.beats.length, `${id} needs one beat per key`).toBe(m.keys.length)
  if (m.floor !== false) for (const k of sequence(m)) expect(sink(m, k.pose, k), `${id} sinks into the floor`).toBeLessThanOrEqual(2)
})

test.each(Object.entries(MOVES).filter(([, m]) => m.plants))('%s keeps planted joints still', (_, m) => {
  const total = loopMs(m)
  for (const p of m.plants!) {
    const pts: number[][] = []
    for (let ms = 0; ms < 2 * total; ms += 20) {
      const u = (ms % total) / (m.ms ?? 900)
      const wrap = p.from > p.to
      if (wrap ? u < p.from && u > p.to : u < p.from || u > p.to) continue
      const s = at(m, ms)
      const b = place({ ...m, view: 0, tilt: 0 }, s.pose, s)[p.joint]
      const loop = Math.floor(ms / total) - (wrap && u <= p.to ? 1 : 0)
      pts.push([b.x - loop * (m.travel ?? 0), b.y, b.z ?? 0])
    }
    const slip = Math.max(...pts.flatMap((q) => pts.map((r) => Math.hypot(q[0] - r[0], q[1] - r[1], q[2] - r[2]))))
    expect(slip, `${p.joint} slips`).toBeLessThan(2.5)
  }
})
