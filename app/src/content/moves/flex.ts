import type { Move, Pose } from '../../core/figure'
import { breathe, H, INSTEP, ang, put, rep } from './mobility'

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
// Middle split: hip height (ankles at H.ankle) rides on `lift`; the trunk leans toward the viewer (scale k) while the hands are low.
const midH = (l: number) => 76 * Math.cos((l * Math.PI) / 180) + H.ankle
const midHands = (l: number, k = 1): Pose =>
  put(straddle(l, 180, [10, 10, -10, -10]), [0, midH(l)], { hand: [32, H.hand], farHand: [-32, H.hand] }, { hand: 1, farHand: -1 }, true, k)

// Pancake (front view): legs wide on the floor; the trunk folds toward the viewer (trunk scale `k`), hands walk out in front.
const pancakeKey = (k: number, hx: number): Pose =>
  put([180, 10, 10, -10, -10, 86, 86, -86, -86, 180, 180], [0, 10.6], { hand: [hx, H.hand], farHand: [-hx, H.hand] }, { hand: 1, farHand: -1 }, true, k)

// Half split: rear (far) knee down at x 0 under the hip, front leg straight to the heel.
const halfSplit = (t: number, c: number, head: number, hands: [number, number]): Pose =>
  put([t, 0, 0, 0, 0, 60, 60, 0, INSTEP, c, head], [0, 43], { foot: [66, H.ankle], hand: hands, farHand: hands }, { hand: 1, farHand: 1 })

// Front split with the hip h up: front heel on the floor, rear leg straight back onto the toes.
const split = (h: number, hands: [number, number]): Pose => {
  const p: Pose = [180, 0, 0, 0, 0, 80, 80, -95, -95, 182, 180]
  return put(p, [0, h], { foot: [Math.sqrt(75.9 ** 2 - (h - 4) ** 2), 4], farFoot: [-Math.sqrt(75.9 ** 2 - (h - 6) ** 2), 6], hand: hands, farHand: hands })
}
// On blocks: rear knee down, hip resting on a block.
const blockSplit = (h: number): Pose => {
  const kx = -Math.sqrt(LEN_T2 - (h - H.knee) ** 2)
  const p: Pose = [180, 0, 0, 0, 0, 75, 75, ang(kx, h - H.knee), INSTEP, 182, 180]
  return put(p, [0, h], { foot: [Math.sqrt(75.9 ** 2 - (h - 4) ** 2), 4], hand: [3, 23], farHand: [3, 23] })
}
const LEN_T2 = 38 ** 2

// Jefferson curl on a box: chin, upper back, lower back, then the hips fold; arms hang the whole way.
const curl = (t: number, c: number, head: number, legs = 0): Pose => [t, 0, 0, 0, 0, legs, legs, legs, legs, c, head]

// Standing split: stance (near) foot at x 0, chest to the knee, hands on the floor.
const needle = (rear: number): Pose =>
  put([40, 0, 0, 0, 0, 0, 0, rear, rear, 20, -5], [0, 81], { foot: [0, H.ankle], hand: [30, H.hand], farHand: [30, H.hand] }, { hand: 1, farHand: 1 })

// Straddle sit on a cushion (front view): legs slope down to the heels.
const CUSHION = { t: 'box', x: -22, w: 44, h: 10 } as const
const cushion = (arms: [number, number, number, number], t = 180): Pose => straddle(78, t, arms)

export const MOVES: Record<string, Move> = {
  // Flat-back hinge, then the spine lets go; roll up a vertebra at a time.
  fwd_fold: { ...breathe([stand, flatBack, fold], 1000), x: 'foot' },
  // Chest leads toward the toes; the hinge is at the hip.
  pike_seated: { ...breathe([sit(180, 180, 180, [6, H.hand]), sit(128, 112, 105, [80, 12])]), x: 'hip' },
  // Hands on the thighs, then sit up tall and reach long.
  straddle_sit: { ...breathe([cushion([30, 10, -30, -10], 182), cushion([168, 178, -168, -178])]), front: true, props: [CUSHION] },
  // Hands by the knees push down; the straight legs lift and hold.
  pike_comp: { ...rep(sit(165, 140, 150, [32, 2]), sit(165, 140, 150, [32, 2], 100), 0.7, 1.4, 0.3, 0.8), x: 'hip', ms: 900 },
  half_split: { ...breathe([halfSplit(174, 174, 178, [26, 40]), halfSplit(112, 98, 92, [44, H.hand])], 900, halfSplit(116, 103, 96, [43, H.hand])), x: 'hip', point: 'far' },
  // Front view: the pelvis tilts the trunk partway toward the viewer, spine long, hands out front.
  pancake_45: { ...breathe([pancakeKey(1, 34), pancakeKey(0.65, 30)], 900, undefined, [{ trunk: 1 }, { trunk: 0.65 }]), front: true, y: 'hip', at: [0, -10.6] },
  // Chin, upper back, lower back, then the hips fold; arms hang. Rolls up in reverse.
  jefferson: {
    keys: [curl(180, 180, 180), curl(180, 180, 120), curl(178, 120, 60), curl(130, 50, 10), curl(58, 4, -12, 3)],
    x: 'foot', y: 'foot', at: [0, -65], props: [{ t: 'box', x: -42, w: 52, h: 60 }], ms: 1100,
    beats: [{ hold: 0.6, dur: 1.4, ease: 'in' }, { dur: 1.4, ease: 'lin' }, { dur: 1.4, ease: 'lin' }, { dur: 1.6, ease: 'out' }, { hold: 1.2 }],
  },
  front_split_half: { ...breathe([blockSplit(34), blockSplit(30), blockSplit(27)], 900, blockSplit(28)), x: 'hip', point: true, props: [{ t: 'box', x: -10, w: 20, h: 19 }] },
  // Seen from the front: the chest folds down between the wide legs as the hands walk out.
  pancake: { ...breathe([pancakeKey(1, 34), pancakeKey(0.3, 22)], 900, pancakeKey(0.5, 28), [{ trunk: 1 }, { trunk: 0.3 }]), front: true, y: 'hip', at: [0, -10.6] },
  pike_full: { ...breathe([sit(128, 112, 105, [80, 12]), sit(110, 100, 95, [88, 8])]), x: 'hip' },
  front_split: { ...breathe([split(22, [3, H.hand]), split(15, [3, H.hand]), split(9.5, [3, H.hand])], 900, split(11.5, [3, H.hand])), x: 'hip', point: true },
  // Hips slide down as the feet slide out, hands taking the weight.
  middle_split: { ...breathe([midHands(64, 0.42), midHands(86)], 900, midHands(80, 0.8), [{ lift: midH(64), trunk: 0.42 }, { lift: midH(86), trunk: 1 }]), front: true, y: 'hip' },
  // Fold first, then lift the heels with the hands beside the hips.
  compression_max: { ...rep(sit(150, 128, 120, [8, 2], 105), sit(150, 128, 120, [8, 2], 115), 0.6, 1.2, 0.3, 0.8), x: 'hip' },
  needle: { ...breathe([needle(-120), needle(-172)]), x: 'foot' },
}
