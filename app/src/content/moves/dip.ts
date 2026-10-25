import type { Move, Pose } from '../../core/figure'

const Y = -130
const bars = { t: 'bars', x: 0, y: Y } as const
const rings = { t: 'rings', x: 0, y: Y } as const
const bar = { t: 'bar', x: 0, y: Y } as const
const on = (keys: Pose[], props: Move['props'], ms?: number, front = false): Move => ({ keys, x: 'hand', y: 'hand', at: [0, Y], props, ms, front })

const support: Pose = [174, 0, 0, 0, 0, 14, -40, 14, -40]
const shrug: Pose = [178, 10, -10, 10, -10, 4, -25, 4, -25]
const dipLow: Pose = [160, -110, 0, -110, 0, -5, -60, -5, -60]
const rto: Pose = [175, -6, -6, -6, -6, 12, -38, 12, -38]

const kTop: Pose = [178, -12, -12, -12, -12, 20, -15, 20, -15]
const kLow: Pose = [150, -120, 10, -120, 10, 60, 0, 60, 0]
const sTop: Pose = [165, 12, 12, 12, 12, 15, 0, 15, 0]
const sLow: Pose = [140, -115, 20, -115, 20, 25, -10, 25, -10]
const forearms: Pose = [165, 0, 90, 0, 90, 10, -60, 10, -60]

const straightTop: Pose = [180, 0, 0, 0, 0, -2, -2, -2, -2]
const straightForearm: Pose = [160, 0, 90, 0, 90, -20, -20, -20, -20]

const lTop: Pose = [178, 0, 0, 0, 0, 90, 90, 90, 90]
const lLow: Pose = [165, -110, 0, -110, 0, 88, 88, 88, 88]

// Front view on rings: hands flare out at the bottom.
const bTop: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0]
const bLow: Pose = [180, 120, 10, -120, -10, 0, 0, 0, 0]

export const MOVES: Record<string, Move> = {
  support_hold: on([shrug, support], [bars], 1200),
  dip_neg: on([support, dipLow], [bars], 1900),
  bar_dip: on([support, dipLow], [bars]),
  ring_support: on([shrug, support], [rings], 1200),
  korean_dip: on([kTop, kLow], [bar]),
  straight_bar_dip: on([sTop, sLow], [bar]),
  rto_support: on([support, rto], [rings], 1200),
  russian_dip: on([support, dipLow, forearms], [bars], 1000),
  ring_dip: on([support, dipLow], [rings]),
  lsit_dip: on([lTop, lLow], [bars]),
  impossible_dip: on([straightTop, straightForearm], [bars], 1200),
  bulgarian_dip: { keys: [bTop, bLow], front: true, x: 'hip', y: 'hand', at: [0, -145] },
  rto_dip: on([rto, dipLow], [rings], 1200),
}
