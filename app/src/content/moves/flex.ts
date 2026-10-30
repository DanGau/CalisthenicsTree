import { RUNG, type Move, type Pose, type Stage } from '../../core/figure'
import { pinned, pinned3 } from './pull'
import { breathe, H, INSTEP, ang, put, rep } from './mobility'

const stand: Pose = [180, 2, 4, -2, -4, 0, 0, 0, 0]
// Standing fold, ankles at x 0: flat-back hinge, then the spine lets go and the palms reach the floor.
const flatBack = put([90, 0, 0, 0, 0, 0, 0, 0, 0, 90, 92], [-8, 80.6], { foot: [0, H.ankle], farFoot: [0, H.ankle] })
const fold = put([50, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0], [-8, 80.6], { foot: [0, H.ankle], farFoot: [0, H.ankle], hand: [27, H.hand], farHand: [27, H.hand] }, { hand: 1, farHand: 1 })

// Seated, legs straight forward (85° so the heels rest on the floor); hip at [0, 10.6].
const SEAT: [number, number] = [0, 10.6]
const sit = (t: number, c: number, head: number, hands: [number, number], legs = 85, k = -1): Pose =>
  put([t, 0, 0, 0, 0, legs, legs, legs, legs, c, head], SEAT, { hand: hands, farHand: hands }, { hand: k, farHand: k })

// Straddles are solid (3D), seen a third of the way round from the front.
const CAM = 60
const D = 180 / Math.PI
/** Sagittal angle of a straight leg swung out `o` so the ankle sits `drop` below the hip. */
const legAt = (o: number, drop: number) => Math.acos(drop / (76 * Math.cos(o / D))) * D
/** Stage for a straddle `o` each side. */
const wide = (o: number, more: Partial<Stage> = {}): Partial<Stage> => ({ legOut: o, farLegOut: o, ...more })

// Pancake: seated, legs straight out 55° each side, heels down; the pelvis tips forward and the hands walk out.
const PANCAKE = 55
const pancakeKey = (t: number, c: number, head: number, hx: number): Pose => {
  const l = legAt(PANCAKE, SEAT[1] - H.ankle)
  return put([t, 0, 0, 0, 0, l, l, l, l, c, head], SEAT, { hand: [hx, H.hand], farHand: [hx, H.hand] }, { hand: 1, farHand: 1 })
}

// Middle split: feet slide out to the sides, the hip (height on `lift`) sinks; hands on the floor in front.
const midH = (o: number) => 76 * Math.cos(o / D) + H.ankle
const midKey = (o: number, t: number, hx: number): Pose =>
  put([t, 0, 0, 0, 0, 0, 0, 0, 0, t, t + 10], [0, midH(o)], { hand: [hx, H.hand], farHand: [hx, H.hand] }, { hand: 1, farHand: 1 })

// Straddle sit on a cushion: hip 16 up, legs 45° out sloping to the heels.
const CUSHION = { t: 'box', x: -14, w: 22, h: 10 } as const
const CUSH_LEG = legAt(45, 16 - H.ankle)
const cushion = (t: number, arms: [number, number]): Pose => [t, arms[0], arms[1], arms[0], arms[1], CUSH_LEG, CUSH_LEG, CUSH_LEG, CUSH_LEG, t + 2, t]

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


// Stall bars at x 0. Pike pull: feet by the bars, hands on rung 2; the arms bend to pull the chest down the legs.
const h = (k: number) => -RUNG(k)
const PIKE_HIP: [number, number] = [-34, 80.5]
const pikePull = (t: number, c: number, head: number): Pose => put([t, 0, 0, 0, 0, 0, 0, 0, 0, c, head], PIKE_HIP, { hand: [0, h(2)], farHand: [0, h(2)], foot: [-30, H.ankle], farFoot: [-30, H.ankle] })
// Pancake pull: straddle sitting with the feet at the bars, hands on rung 1 pull the chest down.
const STALL_SEAT: [number, number] = [-48, SEAT[1]]
const pancakePull = (t: number, c: number, head: number): Pose => {
  const l = legAt(PANCAKE, SEAT[1] - H.ankle)
  return put([t, 0, 0, 0, 0, l, l, l, l, c, head], STALL_SEAT, { hand: [0, h(1)], farHand: [0, h(1)] }, { hand: 1, farHand: 1 })
}

// Strap hamstring: supine, far leg long on the floor, near leg raised to thigh angle `a`; hands hold the strap
// on the line from the shoulder to the foot.
const strap = (a: number): Pose => {
  const hip: [number, number] = [46, H.lie]
  const r = a / D
  const foot = [hip[0] + 76 * Math.sin(r), hip[1] - 76 * Math.cos(r)]
  const n = Math.hypot(foot[0], foot[1] - H.lie)
  const hand: [number, number] = [(foot[0] * 48) / n, H.lie + ((foot[1] - H.lie) * 48) / n]
  return put([-90, 0, 0, 0, 0, a, a, 90, 90, -90, -90], hip, { farFoot: [hip[0] + 75.5, H.ankle], hand, farHand: hand }, { hand: 1, farHand: 1 })
}
// Elephant walk: the fold with one heel lifted and that knee bent; hips stay put.
const ele = (near: boolean): Pose =>
  put([50, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0], [-8, 80.6], { foot: near ? [3, 13] : [0, H.ankle], farFoot: near ? [0, H.ankle] : [3, 13], hand: [27, H.hand], farHand: [27, H.hand] }, { hand: 1, farHand: 1 })

export const MOVES: Record<string, Move> = {
  // The straight leg rises on the strap; the knee never bends.
  strap_ham: { ...breathe([strap(120), strap(150)]), x: 'shoulder', at: [0, 0] },
  // One knee bends as the other presses straight, alternating; hands stay down.
  elephant_walk: { keys: [fold, ele(true), fold, ele(false)], mode: 'cycle', x: 'foot', ms: 1000, beats: [{ dur: 1 }, { hold: 0.4, dur: 1 }, { dur: 1 }, { hold: 0.4, dur: 1 }] },
  // Flat-back hinge, then the spine lets go; roll up a vertebra at a time.
  fwd_fold: { ...breathe([stand, flatBack, fold], 1000), x: 'foot' },
  // Chest leads toward the toes; the hinge is at the hip.
  pike_seated: { ...breathe([sit(180, 180, 180, [6, H.hand]), sit(128, 112, 105, [80, 12])]), x: 'hip' },
  // Hands on the thighs, then sit up tall and reach long.
  straddle_sit: {
    ...breathe([cushion(178, [30, 50]), cushion(186, [172, 178])], 900, undefined, [wide(45, { armOut: 22, farArmOut: 22 }), wide(45, { armOut: 12, farArmOut: 12 })]),
    solid: true, view: CAM, y: 'hip', at: [0, -16], props: [CUSHION],
  },
  // Hands by the knees push down; the straight legs lift and hold.
  pike_comp: { ...rep(sit(165, 140, 150, [32, 2]), sit(165, 140, 150, [32, 2], 100), 0.7, 1.4, 0.3, 0.8), x: 'hip', ms: 900 },
  half_split: { ...breathe([halfSplit(174, 174, 178, [26, 40]), halfSplit(112, 98, 92, [44, H.hand])], 900, halfSplit(116, 103, 96, [43, H.hand])), x: 'hip', point: 'far' },
  // The pelvis tips the long spine halfway to the floor, hands out front.
  pancake_45: { ...breathe([pancakeKey(178, 178, 178, 30), pancakeKey(138, 136, 140, 44)], 900, undefined, [wide(PANCAKE), wide(PANCAKE)]), solid: true, view: CAM, y: 'hip', at: [0, -SEAT[1]] },
  // Chin, upper back, lower back, then the hips fold; arms hang. Rolls up in reverse.
  jefferson: {
    keys: [curl(180, 180, 180), curl(180, 180, 120), curl(178, 120, 60), curl(130, 50, 10), curl(58, 4, -12, 3)],
    x: 'foot', y: 'foot', at: [0, -65], props: [{ t: 'box', x: -42, w: 62, h: 60 }], ms: 1100,
    beats: [{ hold: 0.6, dur: 1.4, ease: 'in' }, { dur: 1.4, ease: 'lin' }, { dur: 1.4, ease: 'lin' }, { dur: 1.6, ease: 'out' }, { hold: 1.2 }],
  },
  front_split_half: { ...breathe([blockSplit(34), blockSplit(30), blockSplit(27)], 900, blockSplit(28)), x: 'hip', point: true, props: [{ t: 'box', x: -10, w: 20, h: 19 }] },
  // The chest folds down between the wide legs as the hands walk out.
  stall_pike: pinned({ ...breathe([pikePull(52, 36, 20), pikePull(30, 14, 2)]), x: 'hip', y: 'hip', at: [PIKE_HIP[0], -PIKE_HIP[1]], props: [{ t: 'stall', x: 0 }] }, (p) => put(p, PIKE_HIP, { hand: [0, h(2)], farHand: [0, h(2)] }), 40),
  stall_pancake: pinned3({
    ...breathe([pancakePull(150, 146, 150), pancakePull(128, 122, 124), pancakePull(110, 104, 106)], 900, undefined, [wide(PANCAKE), wide(PANCAKE), wide(PANCAKE)]),
    solid: true, view: -CAM, x: 'hip', y: 'hip', at: [STALL_SEAT[0], -SEAT[1]], props: [{ t: 'stall', x: 0 }],
  }, (k) => ({ ...k, p: put(k.p, STALL_SEAT, { hand: [0, h(1)], farHand: [0, h(1)] }, { hand: 1, farHand: 1 }) })),
  pancake: { ...breathe([pancakeKey(178, 178, 178, 30), pancakeKey(102, 98, 100, 62)], 900, pancakeKey(110, 104, 106, 60), [wide(PANCAKE), wide(PANCAKE)]), solid: true, view: CAM, y: 'hip', at: [0, -SEAT[1]] },
  pike_full: { ...breathe([sit(128, 112, 105, [80, 12]), sit(110, 100, 95, [88, 8])]), x: 'hip' },
  front_split: { ...breathe([split(22, [3, H.hand]), split(15, [3, H.hand]), split(9.5, [3, H.hand])], 900, split(11.5, [3, H.hand])), x: 'hip', point: true },
  // Hips slide down as the feet slide out, hands taking the weight.
  middle_split: {
    ...breathe([midKey(55, 165, 34), midKey(86, 168, 26)], 900, midKey(82, 165, 27), [wide(55, { lift: midH(55) }), wide(86, { lift: midH(86) })]),
    solid: true, view: CAM, y: 'hip',
  },
  // Fold first, then lift the heels with the hands beside the hips.
  compression_max: { ...rep(sit(150, 128, 120, [18, 2], 105), sit(150, 128, 120, [18, 2], 115), 0.6, 1.2, 0.3, 0.8), x: 'hip' },
  needle: { ...breathe([needle(-120), needle(-172)]), x: 'foot' },
}
