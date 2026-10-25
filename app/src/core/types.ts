/** Path of Exile style attributes: strength red, dexterity green, intelligence blue. */
export type Kind = 'strength' | 'movement' | 'mobility'

/**
 * A skill on the tree. `tier` is the ring it sits on (1 = next to the centre); `lane`
 * shifts it sideways within its branch. `challenges` run easiest first; the last is the
 * mastery test. `requires` may name nodes in other branches.
 */
export type Skill = {
  id: string
  name: string
  branch: string
  tier: number
  lane: number
  requires: string[]
  what: string
  cues: string[]
  challenges: string[]
}

export type Branch = { id: string; name: string; kind: Kind; blurb: string }

/** A check-in question. Picking an option masters `grants` (and everything they require). */
export type Option = { label: string; grants?: string[]; focus?: string[] }
export type Question = { id: string; ask: string; options: Option[]; multi?: boolean }

export type Status = 'locked' | 'open' | 'active' | 'mastered'
