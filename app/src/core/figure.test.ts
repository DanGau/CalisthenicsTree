import { expect, test } from 'vitest'
import { at, type Pose } from './figure'

test('a cycle wrapping to its first key keeps turning forward', () => {
  const a: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0]
  const b: Pose = [360, 0, 0, 0, 0, 0, 0, 0, 0]
  const c: Pose = [520, 0, 0, 0, 0, 0, 0, 0, 0]
  const m = { keys: [a, b, c], mode: 'cycle' as const, ms: 900, beats: [{ hold: 0.3 }, { hold: 0.3 }, { hold: 0.3 }] }
  // Midway from c back to a: a + 360 = 540, so torso sits between 520 and 540.
  const mid = at(m, 3 * 1170 - 450).pose[0]
  expect(mid).toBeGreaterThan(520)
  expect(mid).toBeLessThan(540)
})
