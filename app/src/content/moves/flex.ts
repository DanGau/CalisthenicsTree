import type { Move, Pose } from '../../core/figure'

const stand: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0]
// Fold at 62°: shoulders 54 off the floor, so straight arms reach it.
const fold: Pose = [62, -3, -3, -3, -3, 0, 0, 0, 0]
const sitTall: Pose = [175, 25, 25, 25, 25, 90, 90, 90, 90]
const pikeFold: Pose = [130, 55, 55, 55, 55, 90, 90, 90, 90]
const pikeFull: Pose = [100, 70, 110, 70, 110, 90, 90, 90, 90]
const halfSplitUp: Pose = [165, -20, 150, -20, 150, 60, 60, 0, -105]
const halfSplitDown: Pose = [105, 0, 0, 0, 0, 60, 60, 0, -105]
const split = (l: number, arms = 95): Pose => [180, -arms, -arms, arms, arms, l, l, -l, -l]
const straddle = (l: number, arms: number): Pose => [180, -arms, -arms, arms, arms, -l, -l, l, l]

export const MOVES: Record<string, Move> = {
  fwd_fold: { keys: [stand, fold], x: 'foot', ms: 1400 },
  pike_seated: { keys: [sitTall, pikeFold], ms: 1400 },
  straddle_sit: { keys: [straddle(90, 22), straddle(90, 165)], front: true, ms: 1400 },
  pike_comp: { keys: [[182, 20, 20, 20, 20, 90, 90, 90, 90], [182, 20, 20, 20, 20, 104, 104, 104, 104]], ms: 700 },
  half_split: { keys: [halfSplitUp, halfSplitDown], x: 'knee', ms: 1400 },
  pancake_45: { keys: [[170, 30, 30, 30, 30, 90, 90, 90, 90], [135, 45, 45, 45, 45, 90, 90, 90, 90]], ms: 1400 },
  jefferson: {
    keys: [stand, [120, 20, 20, 20, 20, 0, 0, 0, 0], [20, 0, 0, 0, 0, 0, 0, 0, 0]],
    x: 'foot', y: 'foot', at: [0, -60], props: [{ t: 'box', x: -35, w: 45, h: 60 }], ms: 1400,
  },
  front_split_half: {
    keys: [split(58, 0), split(67, 0)], x: 'hip', ms: 1400,
    props: [{ t: 'box', x: -8, w: 16, h: 33 }],
  },
  pancake: { keys: [[135, 45, 45, 45, 45, 90, 90, 90, 90], [95, 90, 90, 90, 90, 90, 90, 90, 90]], ms: 1400 },
  pike_full: { keys: [pikeFold, pikeFull], ms: 1400 },
  front_split: { keys: [split(79), split(90)], ms: 1400 },
  middle_split: { keys: [straddle(75, 95), straddle(90, 95)], front: true, ms: 1400 },
  compression_max: { keys: [[165, 0, 0, 0, 0, 115, 115, 115, 115], [165, 0, 0, 0, 0, 122, 122, 122, 122]], ms: 1400 },
  needle: { keys: [[40, -46, -46, -46, -46, 0, 0, -140, -140], [40, -46, -46, -46, -46, 0, 0, -172, -172]], x: 'foot', ms: 1400 },
}
