import { expect, test } from 'vitest'
import { at, joints, place, type Pose } from './figure'

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

test('travel accumulates across loops and turn mirrors x', () => {
  const p: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0]
  const m = { keys: [p, p], mode: 'cycle' as const, ms: 100, travel: 50 }
  expect(at(m, 2 * 200).shift).toBeCloseTo(100)
  const hand = (turn: number) => place({ keys: [p] }, [180, 90, 90, 0, 0, 0, 0, 0, 0], { turn }).hand.x
  expect(hand(180)).toBeCloseTo(-hand(0))
})

test('inverted feet point along the shin', () => {
  for (const s of [180, -180, 175, -175, 540]) {
    const toe = joints([0, 0, 0, 0, 0, s, s, s, s]).toe
    const ankle = joints([0, 0, 0, 0, 0, s, s, s, s]).foot
    expect(toe.y).toBeLessThan(ankle.y - 10)
  }
})
