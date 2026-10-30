import type { Skill } from './types'

export const RING = 95
export const HUB = 260
export const LANE = 52
/** Smallest allowed gap between node centres; content tests enforce it. */
export const MIN_GAP = 44

export const radius = (tier: number) => HUB + tier * RING

/** Branches fan out clockwise from the top; lanes shift a node sideways, clockwise positive. */
export function position(s: Skill, branchIndex: number, branchCount: number) {
  const a = (branchIndex / branchCount) * 2 * Math.PI - Math.PI / 2
  const r = radius(s.tier)
  return {
    x: Math.cos(a) * r - Math.sin(a) * s.lane * LANE,
    y: Math.sin(a) * r + Math.cos(a) * s.lane * LANE,
  }
}

export const branchAngle = (branchIndex: number, branchCount: number) => (branchIndex / branchCount) * 2 * Math.PI - Math.PI / 2
