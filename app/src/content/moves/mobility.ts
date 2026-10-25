import type { Move, Pose } from '../../core/figure'

const stand: Pose = [180, 0, 0, 0, 0, 0, 0, 0, 0]
// All fours: torso 109° puts the shoulders one straight arm above the floor, knees under hips.
const quad: Pose = [109, 0, 0, 0, 0, 0, -105, 0, -105]
const quadFwd: Pose = [106, -20, -20, -20, -20, -15, -105, -15, -105]
const quadBack: Pose = [112, 15, 15, 15, 15, 15, -105, 15, -105]
const squat: Pose = [150, 85, 90, 85, 90, 75, -25, 75, -25]
const squatLow: Pose = [155, 80, 85, 80, 85, 80, -28, 80, -28]

const quadPin = { x: 'knee' as const, at: [0, 0] as [number, number] }

export const MOVES: Record<string, Move> = {
  wrist_prep: { keys: [quadBack, quad, quadFwd], ...quadPin, ms: 1100 },
  deep_squat: { keys: [squat, squatLow], x: 'foot', ms: 1600 },
  hip_cars: {
    keys: [
      [180, 90, 90, 0, 0, 0, 0, 0, 0],
      [180, 90, 90, 0, 0, 0, 0, 100, 0],
      [182, 90, 90, 0, 0, 0, 0, 60, -40],
      [178, 90, 90, 0, 0, 0, 0, -30, -80],
      [180, 90, 90, 0, 0, 0, 0, -10, -10],
    ],
    mode: 'cycle', x: 'foot', ms: 1000,
  },
  ankle_df: {
    keys: [[180, 30, 60, 30, 60, 90, 0, 0, -105], [178, 40, 70, 40, 70, 86, -30, -20, -105]],
    x: 'foot', at: [0, 0], props: [{ t: 'wall', x: 22 }], ms: 1000,
  },
  shoulder_cars: {
    keys: [stand, [180, 90, 90, 0, 0, 0, 0, 0, 0], [180, 180, 180, 0, 0, 0, 0, 0, 0], [180, 270, 270, 0, 0, 0, 0, 0, 0], [180, 360, 360, 0, 0, 0, 0, 0, 0]],
    mode: 'cycle', ms: 900,
  },
  // Near leg is the rear one: knee at the wall, shin up it.
  couch: {
    keys: [[170, 10, 10, 10, 10, -5, 180, 90, 0], [185, 0, 0, 0, 0, -25, 180, 93, -15]],
    x: 'knee', at: [0, 0], props: [{ t: 'wall', x: -16 }], ms: 1500,
  },
  pigeon_9090: {
    keys: [
      [180, -150, -150, 150, 150, -95, 95, -140, -100],
      [180, -150, -150, 150, 150, -155, -10, 155, 10],
      [180, -150, -150, 150, 150, 140, 100, 95, -95],
    ],
    front: true, ms: 1100,
  },
  thoracic: { keys: [[109, 0, 0, 30, -40, 0, -105, 0, -105], [109, 0, 0, 185, 185, 0, -105, 0, -105]], ...quadPin, ms: 1300 },
  spinal_waves: {
    keys: [stand, [165, -10, -10, -10, -10, 12, -12, 12, -12], [195, 10, 10, 10, 10, -8, 8, -8, 8]],
    mode: 'cycle', x: 'foot', ms: 900,
  },
  shinbox: {
    keys: [[200, -20, -20, -20, -20, 95, -95, 95, -95], [180, 20, 20, 20, 20, 0, -105, 0, -105]],
    x: 'knee', ms: 1100,
  },
  dislocates: {
    keys: [[180, 30, 30, 30, 30, 0, 0, 0, 0], [180, 180, 180, 180, 180, 0, 0, 0, 0], [180, 320, 320, 320, 320, 0, 0, 0, 0]],
    ms: 1100,
  },
  // Toe squat: kneeling with toes tucked, sit back onto the heels.
  toes: { keys: [[180, 0, 0, 0, 0, 0, -105, 0, -105], [182, 10, 10, 10, 10, 75, -105, 75, -105]], x: 'foot', ms: 1300 },
  sit_rise: {
    keys: [[180, 20, 20, 20, 20, 95, -95, 95, -95], [145, 80, 85, 80, 85, 75, -25, 75, -25], stand],
    x: 'foot', ms: 1000,
  },
  overhead_squat: {
    keys: [[180, 180, 180, 180, 180, 0, 0, 0, 0], [148, 172, 172, 172, 172, 75, -25, 75, -25]],
    x: 'foot', ms: 1100,
  },
}
