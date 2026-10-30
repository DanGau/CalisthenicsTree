import { expect, test } from 'vitest'
import { MIN_GAP, position } from '../core/layout'
import { ancestry } from '../core/progress'
import { QUESTIONS } from './questions'
import { BRANCHES, BY_ID, SKILLS } from './tree'

test('ids are unique', () => {
  expect(BY_ID.size).toBe(SKILLS.length)
  expect(new Set(BRANCHES.map((b) => b.id)).size).toBe(BRANCHES.length)
})

test.each(SKILLS)('$id is well formed', (s) => {
  for (const r of s.requires) expect(BY_ID.has(r), `${s.id} requires unknown ${r}`).toBe(true)
  expect(s.challenges.length).toBeGreaterThanOrEqual(3)
  expect(s.cues.length).toBeGreaterThanOrEqual(2)
  expect(Math.abs(s.lane)).toBeLessThanOrEqual(s.tier >= 5 ? 2 : s.tier >= 3 ? 1 : 0)
  // Every skill hangs off a lower tier of its own branch, so branches read as paths.
  if (s.tier > 1) expect(s.requires.some((r) => BY_ID.get(r)!.branch === s.branch && BY_ID.get(r)!.tier < s.tier), s.id).toBe(true)
  else expect(s.requires).toEqual([])
})

test('requirements have no cycles', () => {
  for (const s of SKILLS) {
    const stack = new Set<string>()
    const walk = (id: string) => {
      expect(stack.has(id), `cycle through ${id}`).toBe(false)
      stack.add(id)
      BY_ID.get(id)!.requires.forEach(walk)
      stack.delete(id)
    }
    walk(s.id)
  }
})

test('no two nodes overlap', () => {
  const pts = SKILLS.map((s) => ({ id: s.id, ...position(s, BRANCHES.findIndex((b) => b.id === s.branch), BRANCHES.length) }))
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y), `${pts[i].id} vs ${pts[j].id}`).toBeGreaterThanOrEqual(MIN_GAP)
})

test('questions grant real skills and focus real branches', () => {
  const branches = new Set(BRANCHES.map((b) => b.id))
  for (const q of QUESTIONS)
    for (const o of q.options) {
      for (const g of o.grants ?? []) expect(() => ancestry(g, BY_ID), g).not.toThrow()
      for (const f of o.focus ?? []) expect(branches.has(f), f).toBe(true)
    }
})
