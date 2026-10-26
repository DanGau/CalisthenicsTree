import type { Move, Pose } from '../../core/figure'
import { plant } from './legs'

/** Beast/bear: back flat, hands under the shoulders, knees hovering just off the floor. s staggers opposite hand and foot. */
const bear = (s: number): Pose =>
  plant([101, 0, 0, 0, 0, 0, 0, 0, 0, 100, 112], { hand: 46 + s, farHand: 46 - s, foot: -34 - s, farFoot: -34 + s }, 50)

/** Crab: belly up, hips lifted level, hands behind the shoulders with fingers back. */
const crab = (s: number, nearHand = true): Pose =>
  plant([-97, 0, 0, 0, 0, 0, 0, 0, 0, -97, -70], { ...(nearHand ? { hand: -50 + s } : {}), farHand: -50 - s, foot: 40 - s, farFoot: 40 + s }, 50, { k: { hand: 1, farHand: 1 } })

const duck = (s: number): Pose => plant([138, 90, 90, 90, 90, 0, 0, 0, 0, 150, 170], { foot: 16 + s, farFoot: 16 - s }, 30)

// Ape: deep squat, hands land ahead first, then the feet hop up to them with the hips low.
const apeSquat: Pose = plant([125, 0, 0, 0, 0, 0, 0, 0, 0, 135, 160], { hand: 46, farHand: 38, foot: 14, farFoot: 14 }, 32)
const apeHop: Pose = plant([75, 0, 0, 0, 0, 115, 10, 105, 0, 80, 110], { hand: 38, farHand: 30 }, 58)

// Kickthrough: near hand and foot stay down, hips turn, the far leg threads under and kicks long, far hand lifts.
const kick: Pose = plant([140, 0, 0, 170, 175, 0, 0, 88, 86, 140, 150], { hand: 26, foot: -12 }, 40, { k: { hand: 1 } })

// Lizard: chest low, elbows bent back, one knee drives up to its elbow, the other leg long.
const lizard = (side: 1 | -1): Pose => {
  const near = side === 1
  return plant([92, 0, 0, 0, 0, 0, 0, 0, 0, 92, 100], {
    hand: near ? 66 : 36, farHand: near ? 36 : 66,
    foot: near ? 6 : -66, farFoot: near ? -66 : 6,
  }, 20, { k: { hand: -1, farHand: -1, foot: 1, farFoot: 1 } })
}

// Frogger: hips sink deep between the knees, chest proud; then hands plant and the hips pop up.
const frogLow: Pose = plant([125, 0, 0, 0, 0, 0, 0, 0, 0, 140, 165], { hand: 50, farHand: 50, foot: 22, farFoot: 22 }, 24)
const frogHigh: Pose = plant([35, 0, 0, 0, 0, -20, -20, -20, -20, 30, 40], { hand: 60, farHand: 60 }, 75)

// Side monkey (front view): squat, hands plant to the right, hips turn up and over, land low on the right.
const monkeySquat: Pose = plant([180, 15, 5, -15, -5, 0, 0, 0, 0], { foot: -26, farFoot: 26 }, 34, { front: true, k: { foot: -1, farFoot: 1 } })
const monkeyOver: Pose = plant([105, 0, 0, 0, 0, -150, -110, -175, -135], { hand: 64, farHand: 34 }, 44, { front: true, k: { hand: 1, farHand: 1 } })

// Scorpion: from beast the far leg lifts and curls over toward the far side, eyes on the foot.
const scorpion: Pose = (() => { const p = bear(0); p[7] = -150; p[8] = 110; p[10] = 140; return p })()

// Crab reach: hips drive up, chest opens, the far arm sweeps overhead.
const crabReach: Pose = plant([-62, 0, 0, -165, -175, 0, 0, 0, 0, -45, -20], { hand: -56, foot: 36, farFoot: 36 }, 66, { k: { hand: 1 } })

export const MOVES: Record<string, Move> = {
  bear_crawl: { keys: [bear(10), bear(-10)], ms: 600 },
  crab_walk: { keys: [crab(10), crab(-10)], ms: 650 },
  duck_walk: { keys: [duck(14), duck(-14)], ms: 600 },
  ape_walk: { keys: [apeSquat, apeHop, apeSquat], mode: 'cycle', ms: 550 },
  kickthrough: { keys: [bear(0), kick], ms: 800 },
  lizard: { keys: [lizard(1), lizard(-1)], ms: 750 },
  frogger: { keys: [frogLow, frogHigh], ms: 650 },
  underswitch: { keys: [bear(0), kick, crab(0, false), crab(0)], ms: 700 },
  side_monkey: { keys: [monkeySquat, monkeyOver, monkeySquat], mode: 'cycle', front: true, ms: 650 },
  flow_linked: { keys: [bear(10), bear(-10), kick, crab(0), frogLow, lizard(1)], mode: 'cycle', ms: 700 },
  scorpion_reach: { keys: [bear(0), scorpion], ms: 1000 },
  crab_reach: { keys: [crab(0), crabReach], ms: 1000 },
  ground_improv: { keys: [bear(10), apeSquat, kick, crab(0), duck(14), lizard(-1)], mode: 'cycle', ms: 800 },
}
