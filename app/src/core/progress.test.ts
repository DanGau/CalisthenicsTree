import { expect, test } from 'vitest'
import { empty, grant, status, streak, toggle, workout } from './progress'
import type { Skill } from './types'

const sk = (id: string, branch: string, tier: number, requires: string[] = []): Skill =>
  ({ id, name: id, branch, tier, lane: 0, requires, what: '', cues: [], challenges: ['a', 'b'] })
const skills = [sk('a', 'x', 1), sk('b', 'x', 2, ['a']), sk('m', 'mob', 1), sk('c', 'y', 1)]
const byId = new Map(skills.map((s) => [s.id, s]))

test('status moves locked → open → active → mastered', () => {
  let p = empty()
  expect(status(p, byId.get('b')!, byId)).toBe('locked')
  expect(status(p, byId.get('a')!, byId)).toBe('open')
  p = toggle(p, byId.get('a')!, 0, 5)
  expect(status(p, byId.get('a')!, byId)).toBe('active')
  p = toggle(p, byId.get('a')!, 1, 5)
  expect(status(p, byId.get('a')!, byId)).toBe('mastered')
  expect(status(p, byId.get('b')!, byId)).toBe('open')
  expect(p.days).toEqual([5])
})

test('grant masters prerequisites too', () => {
  const p = grant(empty(), ['b'], byId)
  expect(status(p, byId.get('a')!, byId)).toBe('mastered')
})

test('streak counts consecutive days ending today or yesterday', () => {
  const p = { ...empty(), days: [1, 3, 4, 5] }
  expect(streak(p, 5)).toBe(3)
  expect(streak(p, 6)).toBe(3)
  expect(streak(p, 7)).toBe(0)
})

test('workout leads with focus, one area per branch, stable per day', () => {
  const p = toggle({ ...empty(), focus: ['y'] }, byId.get('a')!, 0, 1)
  const out = workout(skills, p, byId, 9, 2)
  expect(out[0].skill.id).toBe('c')
  expect(new Set(out.map((b) => b.skill.branch)).size).toBe(2)
  expect(workout(skills, p, byId, 9, 2)).toEqual(out)
  expect(workout(skills, p, byId, 9, 3).slice(0, 2)).toEqual(out)
})

test('block: work sets at the level reached, then a try at the next', () => {
  const p = toggle(grant(empty(), ['a'], byId), byId.get('b')!, 0, 1)
  expect(workout(skills, p, byId, 1, 9).find((b) => b.skill.id === 'b')!.steps.map((s) => [s.role, s.skill.id, s.challenge]))
    .toEqual([['builder', 'a', 1], ['work', 'b', 0], ['test', 'b', 1]])
})
