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

/** Open or in-progress skills, best per branch: in-progress first, then nearest the centre. */
function candidates(skills: Skill[], p: Progress, byId: Map<string, Skill>): Skill[] {
  const rank = (s: Skill) => (status(p, s, byId) === 'active' ? 0 : 100) + s.tier * 2 - fraction(p, s)
  const best = new Map<string, Skill>()
  for (const s of skills) {
    const st = status(p, s, byId)
    if (st === 'locked' || st === 'mastered') continue
    const cur = best.get(s.branch)
    if (!cur || rank(s) < rank(cur)) best.set(s.branch, s)
  }
  return [...best.values()]
}

/** Shuffles with a seeded generator, so a day keeps the same order. */
function shuffle<T>(xs: T[], seed: number): T[] {
  const out = [...xs]
  let a = seed * 2654435761
  const rnd = () => ((a = (a + 0x6d2b79f5) | 0), ((Math.imul(a ^ (a >>> 15), 1 | a) >>> 0) % 1e6) / 1e6)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** `challenge` indexes the skill's challenges; -1 is easy practice before the first. */
export type Step = { role: 'builder' | 'work' | 'test'; skill: Skill; challenge: number }
export type Block = { skill: Skill; steps: Step[] }

/**
 * One area's session, aimed at `s`'s next challenge: the hardest prerequisite's mastery test as a builder,
 * work sets at the level already reached (challenge -1: none yet, so easy practice), then one try at the next level.
 */
export function block(s: Skill, p: Progress, byId: Map<string, Skill>): Block {
  const done = p.done[s.id] ?? []
  const next = s.challenges.findIndex((_, i) => !done.includes(i))
  const pre = s.requires.map((r) => byId.get(r)!).sort((a, b) => b.tier - a.tier)[0]
  const steps: Step[] = []
  if (pre) steps.push({ role: 'builder', skill: pre, challenge: pre.challenges.length - 1 })
  steps.push({ role: 'work', skill: s, challenge: next - 1 })
  steps.push({ role: 'test', skill: s, challenge: next })
  return { skill: s, steps }
}

/**
 * Today's workout: `n` areas picked at random for the day, focus branches first, each a small block.
 * Asking for more extends the same order.
 */
export function workout(skills: Skill[], p: Progress, byId: Map<string, Skill>, day: number, n = 3): Block[] {
  const all = shuffle(candidates(skills, p, byId), day)
  const focus = all.filter((s) => p.focus.includes(s.branch))
  return [...focus, ...all.filter((s) => !focus.includes(s))].slice(0, n).map((s) => block(s, p, byId))
}
