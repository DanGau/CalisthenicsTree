import type { Move, Pose } from '../../core/figure'

// Rows: face up, head to the left, heels on the floor (x: 'foot'). Hand points come from the
// straight-arm bottom; the top pivots on the heels until the bent arm reaches the same point.
const inclineBottom: Pose = [-130, 160, 160, 160, 160, 50, 50, 50, 50]
const inclineTop: Pose = [-138, 128, -143, 128, -143, 42, 42, 42, 42]
const rowBottom: Pose = [-97, 175, 175, 175, 175, 83, 83, 83, 83]
const rowTop: Pose = [-110, 127, -111, 127, -111, 70, 70, 70, 70]
const rowRings = { t: 'rings', x: -60, y: -69 } as const
const row = (keys: Pose[], ms?: number): Move => ({ keys, x: 'foot', at: [60, 0], props: [rowRings], ms })

// Levers: hands on the bar, body horizontal face up (torso 270, legs 90).
const bar = { t: 'bar', x: 0, y: -210 } as const
const lever = (keys: Pose[], ms = 1200): Move => ({ keys, x: 'hand', y: 'hand', at: [0, -210], props: [bar], ms })
const fl: Pose = [270, 180, 180, 180, 180, 90, 90, 90, 90]
const tuck: Pose = [270, 180, 180, 180, 180, 225, 100, 225, 100]
const advTuck: Pose = [270, 180, 180, 180, 180, 180, 90, 180, 90]
const inverted: Pose = [360, 180, 180, 180, 180, 180, 180, 180, 180]
const chinOver: Pose = [172, 79, 222, 79, 222, 20, -10, 20, -10]
// Hips sag a little before locking level.
const sag = (p: Pose): Pose => [p[0] - 8, p[1] + 4, p[2] + 4, p[3] + 4, p[4] + 4, p[5] - 8, p[6] - 8, p[7] - 8, p[8] - 8]

export const MOVES: Record<string, Move> = {
  incline_row: { ...row([inclineBottom, inclineTop]), props: [{ t: 'bar', x: -18, y: -132 }] },
  row: row([rowBottom, rowTop]),
  feet_up_row: {
    keys: [[-80, 180, 180, 180, 180, 100, 100, 100, 100], [-90, 126, -127, 126, -127, 90, 90, 90, 90]],
    x: 'hand', y: 'hand', at: [0, -120], props: [{ t: 'rings', x: 0, y: -120 }, { t: 'box', x: 106, w: 44, h: 88 }],
  },
  archer_row: row([rowBottom, [-110, 127, -111, 150, 150, 70, 70, 70, 70]]),
  tuck_fl: lever([sag(tuck), tuck]),
  oa_row: row([[-97, 175, 175, 70, 160, 83, 83, 83, 83], [-110, 127, -111, 70, 160, 70, 70, 70, 70]], 1000),
  adv_tuck_fl: lever([sag(advTuck), advTuck]),
  tuck_fl_row: lever([tuck, [270, 73, 149, 73, 149, 225, 100, 225, 100]], 900),
  oneleg_fl: lever([[270, 180, 180, 180, 180, 90, 90, 180, 90], [270, 180, 180, 180, 180, 180, 90, 90, 90]], 1300),
  ice_cream: lever([chinOver, fl], 1300),
  straddle_fl: lever([sag([270, 180, 180, 180, 180, 84, 84, 96, 96]), [270, 180, 180, 180, 180, 84, 84, 96, 96]]),
  full_fl: lever([sag(fl), fl]),
  fl_raise: lever([inverted, fl], 1500),
  fl_pullup: lever([fl, [270, 73, 149, 73, 149, 90, 90, 90, 90]], 1000),
}
