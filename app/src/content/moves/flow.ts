import type { Move, Pose } from '../../core/figure'
import { leg, reach } from './legs'

const H = 46 // hip height on all fours; shoulders sit level with it

/** Beast/bear: hands under the shoulders, knees hovering. s staggers hands and feet (opposite pairs). */
const bear = (s: number, t = 95): Pose =>
  reach([t, 0, 0, 0, 0, 0, 0, 0, 0], { hand: [50 + s, H], farHand: [50 - s, H], foot: [-42 - s, H], farFoot: [-42 + s, H] })

/** Crab: belly up, hips high, fingers back. */
const crab = (s: number, t = -95, h = 45, nearHand = true): Pose =>
  reach([t, 230, 230, 230, 230, 0, 0, 0, 0], {
    ...(nearHand ? { hand: [-56 + s, h] as [number, number] } : {}),
    farHand: [-56 - s, h], foot: [40 - s, h], farFoot: [40 + s, h],
  }, { k: { hand: 1, farHand: 1 } })

const duck = (s: number): Pose => [140, 90, 90, 90, 90, ...leg(14 + s, 28), ...leg(14 - s, 28)]

const apeSquat: Pose = reach([125, 0, 0, 0, 0, ...leg(16, 32), ...leg(16, 32)], { hand: [52, 32], farHand: [44, 32] })
const apeHop: Pose = reach([60, 0, 0, 0, 0, 120, 10, 110, 0], { hand: [40, 60], farHand: [30, 60] })

// Kickthrough: near hand and foot stay down, the far leg threads under and kicks long, far hand lifts.
const kick: Pose = reach([110, 0, 0, 170, 175, 0, 0, 84, 84], { hand: [22, 30], foot: [-14, 30] }, { k: { hand: 1 } })

// Lizard: chest low, elbows bent, one knee drives to the elbow.
const lizard = (side: 1 | -1): Pose => {
  const h = 18
  const near = side === 1
  return reach([94, 0, 0, 0, 0, 0, 0, 0, 0], {
    hand: [near ? 70 : 40, h], farHand: [near ? 40 : 70, h],
    foot: near ? [8, h] : [-70, h], farFoot: near ? [-70, h] : [8, h],
  }, { k: { hand: -1, farHand: -1, foot: 1, farFoot: 1 } })
}

const frogLow: Pose = reach([120, 0, 0, 0, 0, ...leg(22, 22), ...leg(22, 22)], { hand: [56, 22], farHand: [56, 22] })
const frogHigh: Pose = reach([40, 0, 0, 0, 0, -8, -8, -8, -8], { hand: [64, 75], farHand: [64, 75] })

// Side monkey (front view): squat, hands plant to the right, hips swing over, land on the right.
const monkeySquat: Pose = [180, 10, 0, -10, 0, 120, 20, -120, -20]
const monkeyOver: Pose = reach([110, 0, 0, 0, 0, -140, -100, -170, -130], { hand: [70, 44], farHand: [40, 44] }, { front: true, k: { hand: 1, farHand: 1 } })

// Scorpion reach: from beast the far leg lifts and curls over toward the opposite side.
const scorpion: Pose = (() => { const p = bear(0); p[7] = -160; p[8] = 110; return p })()

// Crab reach: hips drive up, far arm sweeps overhead.
const crabReach: Pose = reach([-60, 0, 0, -170, -180, 0, 0, 0, 0], { hand: [-60, 62], foot: [36, 62], farFoot: [36, 62] }, { k: { hand: 1 } })

export const MOVES: Record<string, Move> = {
  bear_crawl: { keys: [bear(10), bear(-10)], ms: 600 },
  crab_walk: { keys: [crab(10), crab(-10)], ms: 650 },
  duck_walk: { keys: [duck(14), duck(-14)], ms: 600 },
  ape_walk: { keys: [apeSquat, apeHop, apeSquat], mode: 'cycle', ms: 550 },
  kickthrough: { keys: [bear(0), kick], ms: 800 },
  lizard: { keys: [lizard(1), lizard(-1)], ms: 750 },
  frogger: { keys: [frogLow, frogHigh], ms: 650 },
  underswitch: { keys: [bear(0), kick, crab(0, -95, 45, false), crab(0)], ms: 700 },
  side_monkey: { keys: [monkeySquat, monkeyOver, monkeySquat], mode: 'cycle', front: true, ms: 650 },
  flow_linked: { keys: [bear(10), bear(-10), kick, crab(0), frogLow, lizard(1)], mode: 'cycle', ms: 700 },
  scorpion_reach: { keys: [bear(0), scorpion], ms: 1000 },
  crab_reach: { keys: [crab(0), crabReach], ms: 1000 },
  ground_improv: { keys: [bear(10), apeSquat, kick, crab(0), duck(14), lizard(-1)], mode: 'cycle', ms: 800 },
}
