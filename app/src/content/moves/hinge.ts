import type { Move, Pose } from '../../core/figure'

// Supine: torso -90 (head left), arms along the floor. Bridge top: shoulders down, hips up.
const bridgeDown: Pose = [-90, 85, 85, 85, 85, 135, 30, 135, 30]
const bridgeUp: Pose = [-75, 82, 82, 82, 82, 100, 27, 100, 27]
const slDown: Pose = [-90, 85, 85, 85, 85, 135, 30, 120, 120]
const slUp: Pose = [-75, 82, 82, 82, 82, 100, 27, 105, 105]
const curlOut: Pose = [-80, 85, 85, 85, 85, 74, 74, 74, 74]

// Hip thrust: shoulders on a bench, near foot planted under the knee.
const bench = { t: 'box', x: -75, w: 45, h: 30 } as const
const thrustDown: Pose = [-125, 100, 100, 100, 100, 130, 28, 125, 110]
const thrustUp: Pose = [-90, 90, 90, 90, 90, 90, 0, 90, 90]

// Nordic: kneeling, the body leans forward from the knee as one piece.
const lean = (d: number, arms: [number, number] = [150, -60]): Pose =>
  [180 - d, arms[0] - d, arms[1] - d, arms[0] - d, arms[1] - d, -d, -105, -d, -105]
const catchFloor = (d: number): Pose => [180 - d, 100, 30, 100, 30, -d, -105, -d, -105]
const nordicPin = { x: 'knee' as const, at: [0, 0] as [number, number] }

// Back extension: hips on a high bench, legs anchored behind.
const ghd = { t: 'box', x: -70, w: 70, h: 70 } as const
const extDown: Pose = [12, -30, 150, -30, 150, -90, -90, -90, -90]
const extUp: Pose = [92, 60, -130, 60, -130, -90, -90, -90, -90]

const rdlUp: Pose = [180, 0, 0, 0, 0, 0, 0, -8, -8]
const rdlDown: Pose = [92, 2, 2, 2, 2, 5, -5, -88, -88]

export const MOVES: Record<string, Move> = {
  glute_bridge: { keys: [bridgeDown, bridgeUp] },
  sl_bridge: { keys: [slDown, slUp] },
  slider_curl: { keys: [curlOut, bridgeUp], x: 'shoulder', at: [-50, 0] },
  sl_hip_thrust: { keys: [thrustDown, thrustUp], x: 'foot', at: [40, 0], props: [bench] },
  sl_rdl: { keys: [rdlUp, rdlDown], x: 'foot' },
  nordic_neg: { keys: [lean(0), lean(45), lean(80), catchFloor(80)], ...nordicPin, mode: 'cycle', ms: 1100 },
  back_ext: { keys: [extDown, extUp], x: 'hip', y: 'hip', at: [0, -80], props: [ghd] },
  airplane: {
    keys: [rdlDown, [100, 2, 2, 175, 175, 5, -5, -70, -70]], x: 'foot', ms: 1200,
  },
  nordic_pause: { keys: [lean(0), lean(45), lean(47), catchFloor(80)], ...nordicPin, mode: 'cycle', ms: 1300 },
  nordic: { keys: [lean(0, [40, 140]), lean(66, [40, 140])], ...nordicPin, ms: 1300 },
  nordic_strict: { keys: [lean(0), lean(82)], ...nordicPin, ms: 1800 },
}
