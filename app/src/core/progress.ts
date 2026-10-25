import type { Skill, Status } from './types'

/** `done[skill]` holds the indexes of finished challenges. `days` are local day numbers trained. */
export type Progress = { done: Record<string, number[]>; focus: string[]; days: number[]; answers: Record<string, string[]> }

export const empty = (): Progress => ({ done: {}, focus: [], days: [], answers: {} })

export const isMastered = (p: Progress, s: Skill) => (p.done[s.id]?.length ?? 0) >= s.challenges.length

export const fraction = (p: Progress, s: Skill) => (p.done[s.id]?.length ?? 0) / s.challenges.length

export function status(p: Progress, s: Skill, byId: Map<string, Skill>): Status {
  if (isMastered(p, s)) return 'mastered'
  if (p.done[s.id]?.length) return 'active'
  return s.requires.every((r) => isMastered(p, byId.get(r)!)) ? 'open' : 'locked'
}

const withDay = (p: Progress, day: number) => (p.days.includes(day) ? p.days : [...p.days, day].sort((a, b) => a - b))

/** Ticks or unticks one challenge; ticking counts the day as trained. */
export function toggle(p: Progress, s: Skill, i: number, day: number): Progress {
  const cur = p.done[s.id] ?? []
  const on = !cur.includes(i)
  const next = on ? [...cur, i].sort((a, b) => a - b) : cur.filter((x) => x !== i)
  return { ...p, done: { ...p.done, [s.id]: next }, days: on ? withDay(p, day) : p.days }
}

/** Every skill `id` needs, itself included. */
export function ancestry(id: string, byId: Map<string, Skill>): string[] {
  const seen = new Set<string>()
  const walk = (x: string) => {
    if (seen.has(x)) return
    seen.add(x)
    byId.get(x)!.requires.forEach(walk)
  }
  walk(id)
  return [...seen]
}

/** Masters `ids` and their prerequisites. */
export function grant(p: Progress, ids: string[], byId: Map<string, Skill>): Progress {
  const done = { ...p.done }
  for (const id of ids.flatMap((i) => ancestry(i, byId))) done[id] = byId.get(id)!.challenges.map((_, i) => i)
  return { ...p, done }
}

export function unmaster(p: Progress, id: string): Progress {
  const done = { ...p.done }
  delete done[id]
  return { ...p, done }
}

/** Consecutive trained days ending today or yesterday. */
export function streak(p: Progress, day: number): number {
  const set = new Set(p.days)
  let d = set.has(day) ? day : day - 1
  let n = 0
  for (; set.has(d); d--) n++
  return n
}

/**
 * Today's plan: at most one skill per branch, in-progress skills first, then open ones
 * nearest the centre. Focus branches lead; mobility always gets a slot.
 */
export function plan(skills: Skill[], p: Progress, byId: Map<string, Skill>, kindOf: (branch: string) => string, size = 6): Skill[] {
  const rank = (s: Skill) => {
    const st = status(p, s, byId)
    return (st === 'active' ? 0 : 100) + s.tier * 2 - fraction(p, s) + (p.focus.includes(s.branch) ? -1000 : 0)
  }
  const best = new Map<string, Skill>()
  for (const s of skills) {
    const st = status(p, s, byId)
    if (st === 'locked' || st === 'mastered') continue
    const cur = best.get(s.branch)
    if (!cur || rank(s) < rank(cur)) best.set(s.branch, s)
  }
  const sorted = [...best.values()].sort((a, b) => rank(a) - rank(b))
  const picked = sorted.slice(0, size)
  if (!picked.some((s) => kindOf(s.branch) === 'mobility')) {
    const mob = sorted.find((s) => kindOf(s.branch) === 'mobility')
    if (mob) picked.splice(Math.min(picked.length, size - 1), 1, mob)
  }
  return picked
}
