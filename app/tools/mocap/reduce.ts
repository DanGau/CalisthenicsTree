// Fewest keys whose spline (core `at`) stays within tolerance of the per-frame fit.
import { at, type Move } from '../../src/core/figure'
import { clip, COLS } from '../../src/content/mocap/clip'
import type { Sample } from './fit'

export type Reduced = { keys: number[][]; dur: number[]; hold: number[]; err: number }
type Base = Parameters<typeof clip>[0]

/** Weight per channel in the error: lift and shift are in body units, the rest degrees; twist and out-swings matter a bit less. */
const W = [...Array(12).fill(1), 0.6, 0.6, 1, 1, 0.6, ...Array(8).fill(0.7)]

/** A Move from rows of 12 pose angles + COLS. */
export const build = (base: Base, keys: number[][], dur: number[], hold: number[]): Move => clip(base, keys.map((k, i) => [...k, dur[i], hold[i]]))

const vec = (m: Move, ms: number) => {
  const s = at(m, ms)
  return [...s.pose, ...COLS.map((c) => s[c])]
}

/** Worst weighted channel error at each sample. */
function errors(base: Base, S: Sample[], idx: number[], tail: number) {
  const keys = idx.map((i) => S[i].v)
  const dur = idx.map((i, j) => (j < idx.length - 1 ? S[idx[j + 1]].t - S[i].t : tail))
  const m = build({ ...base, mode: 'cycle' }, keys, dur, idx.map(() => 0))
  return S.map((s) => {
    const r = vec(m, s.t * 1000)
    return Math.max(...s.v.map((v, j) => Math.abs(v - (r[j] ?? v)) * W[j]))
  })
}

/** Keys at stops, then greedily wherever the spline strays most, until within `tol`. Near-still runs become holds. */
export function reduce(base: Base, S: Sample[], tol = 6, tail = 0.2): Reduced {
  const speed = S.map((s, i) => {
    const [a, b] = [S[Math.max(0, i - 1)], S[Math.min(S.length - 1, i + 1)]]
    return Math.max(...s.v.map((_, j) => (Math.abs(b.v[j] - a.v[j]) * W[j]) / (b.t - a.t || 1)))
  })
  const idx = new Set([0, S.length - 1])
  for (let i = 2; i < S.length - 2; i++) if (speed[i] < 25 && speed[i] <= speed[i - 1] && speed[i] <= speed[i + 1]) idx.add(i)
  let sorted = [...idx].sort((a, b) => a - b)
  let err = errors(base, S, sorted, tail)
  while (sorted.length < 60) {
    const worst = err.reduce((b, e, i) => (e > err[b] ? i : b), 0)
    if (err[worst] <= tol || idx.has(worst)) break
    idx.add(worst)
    sorted = [...idx].sort((a, b) => a - b)
    err = errors(base, S, sorted, tail)
  }
  // Drop stop keys the spline doesn't need.
  for (const i of [...sorted]) {
    if (i === 0 || i === S.length - 1) continue
    const trial = sorted.filter((k) => k !== i)
    const e = errors(base, S, trial, tail)
    if (Math.max(...e) <= Math.max(tol, Math.max(...err))) [sorted, err] = [trial, e]
  }
  const keys = sorted.map((i) => S[i].v.map((x) => Math.round(x)))
  const dur = sorted.map((i, j) => (j < sorted.length - 1 ? S[sorted[j + 1]].t - S[i].t : tail))
  const hold = sorted.map(() => 0)
  // A near-still segment is a hold on its first key.
  for (let j = keys.length - 2; j >= 1; j--) {
    if (Math.max(...keys[j].map((v, c) => Math.abs(v - keys[j + 1][c]))) <= 2 && j + 1 < keys.length - 1) {
      hold[j] += dur[j]
      dur[j] = dur[j + 1]
      keys.splice(j + 1, 1)
      dur.splice(j + 1, 1)
      hold.splice(j + 1, 1)
    }
  }
  return { keys, dur: dur.map((d) => +d.toFixed(2)), hold: hold.map((h) => +h.toFixed(2)), err: Math.max(...err) }
}
