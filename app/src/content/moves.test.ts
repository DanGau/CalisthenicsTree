import { expect, test } from 'vitest'
import { sequence, sink } from '../core/figure'
import { MOVES } from './moves'
import { SKILLS } from './tree'

test.each(SKILLS)('$id has an animation', (s) => {
  expect(MOVES[s.id], `add ${s.id} to content/moves/${s.branch}.ts`).toBeDefined()
})

test.each(Object.entries(MOVES))('%s stays above the floor', (id, m) => {
  expect(SKILLS.some((s) => s.id === id), `${id} is not a skill`).toBe(true)
  for (const k of m.keys) expect(k).toHaveLength(9)
  if (m.floor !== false) for (const k of sequence(m)) expect(sink(m, k), `${id} sinks into the floor`).toBeLessThanOrEqual(2)
})
