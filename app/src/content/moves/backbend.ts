import type { Move, Pose } from '../../core/figure'

const stand: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0]
const armsUp: Pose = [180, 180, 180, 180, 180, 0, 0, 0, 0]
const kneel: Pose = [180, -10, 160, -10, 160, 0, -105, 0, -105]
// Full bridge: hands (50·cos67 + 54·cos30) and feet (38·cos40 + 38·cos10) land at the same depth.
const bridge: Pose = [-67, -30, -30, -30, -30, 40, -10, 40, -10]
const lying: Pose = [-90, -150, 23, -150, 23, 135, 14, 135, 14]
const arch: Pose = [-150, -135, -135, -135, -135, 25, -15, 25, -15]
const kneelArch: Pose = [-150, -140, -140, -140, -140, -15, -105, -15, -105]
const kneelBridge: Pose = [-70, -70, -70, -70, -70, -20, -105, -20, -105]

export const MOVES: Record<string, Move> = {
  cobra: { keys: [[92, -110, 0, -110, 0, -86, -86, -86, -86], [128, -40, 20, -40, 20, -86, -86, -86, -86]], x: 'hip', ms: 1300 },
  table: { keys: [[-140, -45, -45, -45, -45, 135, 45, 135, 45], [-110, 0, 0, 0, 0, 90, 0, 90, 0]], x: 'foot', ms: 1100 },
  bridge_box: {
    keys: [[-90, -140, -105, -140, -105, 135, 30, 135, 30], [-70, -70, -70, -70, -70, 30, -5, 30, -5]],
    x: 'foot', at: [40, 0], props: [{ t: 'box', x: -105, w: 35, h: 35 }], ms: 1100,
  },
  camel: { keys: [kneel, [-110, 0, 0, 0, 0, -15, -105, -15, -105]], x: 'knee', ms: 1400 },
  wall_angels: { keys: [[180, -90, -180, 90, 180, 0, 0, 0, 0], [180, -160, -170, 160, 170, 0, 0, 0, 0]], front: true, ms: 1200 },
  full_bridge: { keys: [lying, bridge], x: 'foot', at: [40, 0], ms: 1100 },
  bench_opener: {
    keys: [[90, 150, -60, 150, -60, 0, -105, 0, -105], [75, 160, -50, 160, -50, -25, -105, -25, -105]],
    x: 'knee', at: [0, 0], props: [{ t: 'box', x: 45, w: 40, h: 48 }], ms: 1500,
  },
  one_leg_bridge: { keys: [bridge, [-70, -15, -15, -15, -15, 40, -10, 170, 170]], x: 'foot', ms: 1100 },
  bridge_walk: {
    keys: [armsUp, [-160, -150, -150, -150, -150, 15, -15, 15, -15], [-120, -90, -90, -90, -90, 30, -15, 30, -15], bridge],
    x: 'foot', at: [60, 0], props: [{ t: 'wall', x: -58 }], ms: 1000,
  },
  straight_bridge: { keys: [bridge, [-75, 0, 0, 0, 0, 28, 28, 28, 28]], x: 'hand', ms: 1300 },
  kneel_drop: { keys: [[180, 180, 180, 180, 180, 0, -105, 0, -105], kneelArch, kneelBridge], x: 'knee', ms: 900 },
  stand_to_bridge: { keys: [armsUp, arch, bridge], x: 'foot', ms: 900 },
  bridge_stand: {
    keys: [bridge, [-88, 0, 0, 0, 0, 60, -30, 60, -30], [-170, -120, -120, -120, -120, 20, -20, 20, -20], stand],
    x: 'foot', ms: 900,
  },
  bridge_rotation: {
    keys: [bridge, [-90, 0, 0, 180, 180, 20, -5, 20, -5], [-109, 0, 0, 0, 0, 0, 105, 0, 105]],
    x: 'hip', ms: 1100,
  },
  tick_tock: {
    keys: [bridge, [0, 0, 0, 0, 0, 180, 180, 180, 180], [67, 30, 30, 30, 30, 320, 370, 320, 370]],
    x: 'hand', ms: 900,
  },
}
