import { empty, type Progress } from '../core/progress'

const KEY = 'calisthenics-tree'

/** Fills fields added since the data was saved. Throws on data that isn't a save. */
export function parseSaved(raw: string): Progress {
  const data = JSON.parse(raw)
  if (typeof data?.done !== 'object' || data.done === null) throw new Error('Not a Calisthenics Tree backup')
  return { ...empty(), ...data }
}

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseSaved(raw) : empty()
  } catch {
    return empty()
  }
}

export function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Storage blocked (private mode); progress lasts for this visit only.
  }
}

/** Local days since the epoch. */
export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000)
