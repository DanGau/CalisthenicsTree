import { expect, test } from 'vitest'
import { empty, grant, plan, status, streak, toggle } from './progress'
import type { Skill } from './types'

const sk = (id: string, branch: string, tier: number, requires: string[] = []): Skill =>
  ({ id, name: id, branch, tier, lane: 0, requires, what: '', cues: [], challenges: ['a', 'b'] })
const skills = [sk('a', 'x', 1), sk('b', 'x', 2, ['a']), sk('m', 'mob', 1), sk('c', 'y', 1)]
const byId = new Map(skills.map((s) => [s.id, s]))
const kind = (b: string) => (b === 'mob' ? 'mobility' : 'strength')

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

test('plan takes one per branch, focus first, always a mobility slot', () => {
  const p = { ...empty(), focus: ['y'] }
  const out = plan(skills, p, byId, kind, 2)
  expect(out[0].id).toBe('c')
  expect(out.some((s) => s.branch === 'mob')).toBe(true)
  expect(new Set(out.map((s) => s.branch)).size).toBe(out.length)
})
