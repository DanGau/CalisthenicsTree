import type { Move, Pose } from '../../core/figure'
import { H, KNEEL, ang, put } from './mobility'

const stand: Pose = [180, 2, 4, -2, -4, 0, 0, 0, 0]
// Standing fold, ankles at x 0: flat-back hinge, then the spine lets go and the palms reach the floor.
const flatBack = put([90, 0, 0, 0, 0, 0, 0, 0, 0, 90, 92], [-8, 80.6], { foot: [0, H.ankle], farFoot: [0, H.ankle] })
const fold = put([50, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0], [-8, 80.6], { foot: [0, H.ankle], farFoot: [0, H.ankle], hand: [27, H.hand], farHand: [27, H.hand] }, { hand: 1, farHand: 1 })

// Seated, legs straight forward (85° so the heels rest on the floor); hip at [0, 10.6].
const SEAT: [number, number] = [0, 10.6]
const sit = (t: number, c: number, head: number, hands: [number, number], legs = 85, k = -1): Pose =>
  put([t, 0, 0, 0, 0, legs, legs, legs, legs, c, head], SEAT, { hand: hands, farHand: hands }, { hand: k, farHand: k })

// Front view straddle: legs out at l from vertical, hip resting on the floor.
const straddle = (l: number, t: number, arms: [number, number, number, number]): Pose => [t, ...arms, l, l, -l, -l]
const midHands = (l: number): Pose => {
  const h = 76 * Math.cos((l * Math.PI) / 180) + 7
  return put(straddle(l, 180, [10, 10, -10, -10]), [0, h], { hand: [32, H.hand], farHand: [-32, H.hand] }, { hand: 1, farHand: -1 }, true)
}

// Half split: rear (far) knee down at x 0 under the hip, front leg straight to the heel.
const halfSplit = (t: number, c: number, head: number, hands: [number, number]): Pose =>
  put([t, 0, 0, 0, 0, 60, 60, 0, KNEEL, c, head], [0, 43], { foot: [66, H.ankle], hand: hands, farHand: hands }, { hand: 1, farHand: 1 })

// Front split with the hip h up: front heel on the floor, rear leg straight back onto the toes.
const split = (h: number, hands: [number, number]): Pose => {
  const p: Pose = [180, 0, 0, 0, 0, 80, 80, -95, -95, 182, 180]
  return put(p, [0, h], { foot: [Math.sqrt(75.9 ** 2 - (h - 4) ** 2), 4], farFoot: [-Math.sqrt(75.9 ** 2 - (h - 13.3) ** 2), 13.3], hand: hands, farHand: hands })
}
// On blocks: rear knee down, hip resting on a block.
const blockSplit = (h: number): Pose => {
  const kx = -Math.sqrt(LEN_T2 - (h - H.knee) ** 2)
  const p: Pose = [180, 0, 0, 0, 0, 75, 75, ang(kx, h - H.knee), KNEEL, 182, 180]
  return put(p, [0, h], { foot: [Math.sqrt(75.9 ** 2 - (h - 4) ** 2), 4], hand: [3, 23], farHand: [3, 23] })
}
const LEN_T2 = 38 ** 2

// Jefferson curl on a box: chin, upper back, lower back, then the hips fold; arms hang the whole way.
const curl = (t: number, c: number, head: number, legs = 0): Pose => [t, 0, 0, 0, 0, legs, legs, legs, legs, c, head]

// Standing split: stance (near) foot at x 0, chest to the knee, hands on the floor.
const needle = (rear: number): Pose =>
  put([40, 0, 0, 0, 0, 0, 0, rear, rear, 20, -5], [0, 81], { foot: [0, H.ankle], hand: [30, H.hand], farHand: [30, H.hand] }, { hand: 1, farHand: 1 })

export const MOVES: Record<string, Move> = {
  fwd_fold: { keys: [stand, flatBack, fold], x: 'foot', ms: 1300 },
  // Chest leads toward the toes; the hinge is at the hip.
  pike_seated: { keys: [sit(180, 180, 180, [6, H.hand]), sit(128, 112, 105, [80, 12])], x: 'hip', ms: 1400 },
  straddle_sit: { keys: [straddle(85, 180, [20, 20, -20, -20]), straddle(85, 180, [165, 175, -165, -175])], front: true, ms: 1400 },
  // Hands by the knees push down; the straight legs lift.
  pike_comp: { keys: [sit(165, 140, 150, [32, 2]), sit(165, 140, 150, [32, 2], 100)], x: 'hip', ms: 800 },
  half_split: { keys: [halfSplit(174, 174, 178, [26, 40]), halfSplit(112, 98, 92, [44, H.hand])], x: 'hip', ms: 1400 },
  // Flat back: the pelvis tilts forward, the spine stays long.
  pancake_45: { keys: [sit(178, 178, 180, [6, H.hand]), sit(135, 135, 140, [62, H.hand])], x: 'hip', ms: 1400 },
  jefferson: {
    keys: [curl(180, 180, 180), curl(180, 180, 120), curl(178, 120, 60), curl(130, 50, 10), curl(58, 4, -12, 3)],
    x: 'foot', y: 'foot', at: [0, -65], props: [{ t: 'box', x: -42, w: 52, h: 60 }], ms: 1300,
  },
  front_split_half: { keys: [blockSplit(32), blockSplit(27)], x: 'hip', props: [{ t: 'box', x: -10, w: 20, h: 19 }], ms: 1400 },
  pancake: { keys: [sit(135, 135, 140, [62, H.hand]), sit(100, 95, 92, [104, H.hand])], x: 'hip', ms: 1400 },
  pike_full: { keys: [sit(128, 112, 105, [80, 12]), sit(110, 100, 95, [88, 8])], x: 'hip', ms: 1400 },
  front_split: { keys: [split(18, [3, H.hand]), split(9.5, [3, H.hand])], x: 'hip', ms: 1400 },
  middle_split: { keys: [straddle(68, 180, [15, 15, -15, -15]), midHands(85)], front: true, ms: 1400 },
  // Fold first, then lift the heels with the hands beside the hips.
  compression_max: { keys: [sit(150, 128, 120, [8, 2], 105), sit(150, 128, 120, [8, 2], 115)], x: 'hip', ms: 1200 },
  needle: { keys: [needle(-120), needle(-172)], x: 'foot', ms: 1400 },
}
