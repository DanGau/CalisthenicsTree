import type { Move, Pose } from '../../core/figure'

// Front view on a pole at x = 0. Human flag: torso -90 (shoulders toward the pole), near arm up
// at 225 and far arm down at -45 both land 88 left of the shoulders, so the hands stack on the pole.
const flag = (keys: Pose[], ms = 1300, y = -150): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [0, y], props: [{ t: 'pole', x: 0 }], ms })
const full: Pose = [-90, 225, 225, -45, -45, 90, 90, 90, 90]
const tuck: Pose = [-90, 225, 225, -45, -45, 110, -100, 110, -100]
const straddle: Pose = [-90, 225, 225, -45, -45, 115, 115, 65, 65]
// Vertical flag: body upside down beside the pole, hands stacked (near on top).
const vertical: Pose = [0, 209, 209, -68, -68, 180, 180, 180, 180]
const droop = (p: Pose): Pose => [p[0] - 4, p[1], p[2], p[3], p[4], p[5] - 6, p[6] - 6, p[7] - 6, p[8] - 6]

// Side plank: body straight at ~14°, bottom forearm flat, top arm up.
const plank: Pose = [-104, 180, 180, 0, -90, 76, 76, 76, 76]
// Copenhagen: top leg on the bench raises the hips; the bottom leg lifts to it.
const copenShort: Pose = [-80, 180, 180, 0, -90, 100, 0, 80, 80]
const copenLong: Pose = [-80, 180, 180, 0, -90, 100, 100, 80, 80]

const hang: Pose = [180, 165, 165, 195, 195, 0, 0, 0, 0]

export const MOVES: Record<string, Move> = {
  side_plank: { keys: [[-100, 180, 180, 0, -90, 80, 80, 80, 80], plank], front: true, ms: 1300 },
  copen_short: { keys: [copenShort, [-80, 180, 180, 0, -90, 100, 0, 100, 100]], front: true, props: [{ t: 'box', x: 22, w: 34, h: 60 }], ms: 1100 },
  copen_long: { keys: [copenLong, [-80, 180, 180, 0, -90, 100, 100, 100, 100]], front: true, props: [{ t: 'box', x: 60, w: 40, h: 66 }], ms: 1100 },
  vertical_flag: flag([[4, 209, 209, -68, -68, 176, 176, 184, 184], vertical], 1300, -120),
  oblique_raise: {
    keys: [hang, [180, 165, 165, 195, 195, 120, 10, 120, 10], hang, [180, 165, 165, 195, 195, -120, -10, -120, -10]],
    mode: 'cycle', front: true, x: 'hand', y: 'hand', at: [26, -210], props: [{ t: 'bar', x: 0, y: -210 }], ms: 1000,
  },
  tuck_flag: flag([droop(tuck), tuck]),
  clutch_flag: flag([[-90, 225, 225, 100, -95, 110, -100, 110, -100], [-90, 225, 225, 100, -95, 90, 90, 90, 90]]),
  straddle_flag: flag([droop(straddle), straddle]),
  full_flag: flag([droop(full), full]),
  flag_raise: flag([vertical, full], 1600),
}
