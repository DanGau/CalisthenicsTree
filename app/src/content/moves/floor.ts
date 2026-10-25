import type { Move, Pose } from '../../core/figure'
import { leg, pos, reach, rot } from './legs'
import { star } from './tumble'

// Ginga: rocking lunge, one arm guarding the face, feet swap.
const ginga = (back: 'near' | 'far'): Pose => {
  const front = leg(18, 56)
  const rear = leg(-48, 56)
  return back === 'far'
    ? [165, 130, 215, -30, 30, ...front, ...rear]
    : [165, -30, 30, 130, 215, ...rear, ...front]
}

const squatGuard: Pose = [140, 175, 255, 60, 50, ...leg(18, 26), ...leg(18, 26)]

/** Lowest head point. */
const headFloor = (p: Pose) => pos(p, 'head')[1] + 10

// Negativa: hips low, near hand behind, near foot under, far leg long and low, far hand guards the face.
const negativa = (() => {
  const p: Pose = [235, 0, 0, 150, 230, ...leg(16, 20), 76, 76]
  return reach(p, { hand: [-52, 20] }, { k: { hand: 1 } })
})()

// Baby freeze: head and both hands down, near elbow in the hip, knees tucked.
const baby = (knee: number): Pose => {
  const p: Pose = [20, 0, 0, 0, 0, knee, knee - 120, knee + 10, knee - 110]
  const f = headFloor(p)
  return reach(p, { hand: [22, f], farHand: [-6, f] }, { k: { hand: 1, farHand: -1 } })
}

// Queda de rins: torso tipped forward, elbow under the ribs, head just off the floor.
const qdr = (legs: [number, number, number, number]): Pose => {
  const p: Pose = [78, 0, 0, 0, 0, ...legs]
  const f = headFloor(p) + 6
  return reach(p, { hand: [30, f], farHand: [50, f] }, { k: { hand: 1, farHand: 1 } })
}

const chair = (t: number): Pose => {
  const p: Pose = [t, 0, 0, 120, 160, 120, 20, 70, 160]
  const f = headFloor(p) + 10
  return reach(p, { hand: [-4, f] }, { k: { hand: -1 } })
}

const turtle = (tilt: number): Pose => {
  const p: Pose = [85 + tilt, 0, 0, 0, 0, 120 + tilt, 20, 120 + tilt, 20]
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [s[0] - 8, s[1] + 34], farHand: [s[0] - 8, s[1] + 34] }, { k: { hand: 1, farHand: 1 } })
}

const airchair = (legs: number): Pose => {
  const p: Pose = [-25, 0, 0, 90, 90, legs, legs - 40, legs + 15, legs - 25]
  const f = pos(p, 'shoulder')[1] + 42
  return reach(p, { hand: [6, f] }, { k: { hand: -1 } })
}

const hollow = (drop: number): Pose => [12, 0, 0, 0, 0, -150 - drop, -90 - drop, -145 - drop, -85 - drop]

// Back spin: on the upper back, knees tucked, legs winding.
const spin = (k: number): Pose => [-75, -40 + k, 30, -60 + k, 10, 160 + k, 60 + k, 140 + k, 40 + k]

// Windmill (front view): lying across the shoulders, legs in a wide V sweeping around.
const mill = (c: number, t: number): Pose => [t, t - 40, t - 60, t + 40, t + 60, c - 45, c - 45, c + 45, c + 45]

// Flare (front view): weight shifts hand to hand, straddle swings under.
const flare = (s: number): Pose => [180 + s, s > 0 ? 0 : 50, s > 0 ? 0 : 70, s < 0 ? 0 : -50, s < 0 ? 0 : -70, 95 + s, 95 + s, -95 + s, -95 + s]

// Macaco: backward throw over one hand (angles grow).
const macSit: Pose = [170, 60, 60, 60, 60, ...leg(26, 28), ...leg(26, 28)]
const macReach = reach([215, 0, 0, 120, 120, ...leg(30, 24), ...leg(30, 24)], { hand: [-44, 24] }, { k: { hand: 1 } })
const macOver: Pose = [350, 350, 350, 300, 300, 160, 140, 200, 220]
const macLand: Pose = rot([170, 30, 40, 200, 200, ...leg(14, 44), ...leg(-10, 50)], 360)

// Swipe: bent over on the hands, whip up through a backbend, land on the hands again.
const swipeDown = reach([40, 0, 0, 0, 0, -10, -10, 10, 10], { hand: [62, 74], farHand: [44, 74] })
const swipeUp: Pose = [240, 320, 320, 300, 300, 80, 70, 130, 120]

export const MOVES: Record<string, Move> = {
  ginga: { keys: [ginga('far'), ginga('near')], ms: 1000 },
  cocorinha: { keys: [ginga('far'), squatGuard], ms: 800 },
  negativa: { keys: [ginga('far'), negativa], ms: 1000 },
  baby_freeze: { keys: [baby(110), baby(118)], ms: 1400 },
  qdr: { keys: [qdr([130, 10, 140, 20]), qdr([-120, -120, -110, -110])], ms: 1400 },
  au: { keys: [star(180, 30, 25), star(90, 40, 60), star(0, 40, 65), star(-90, 40, 60), star(-180, 30, 25)], mode: 'cycle', front: true, ms: 900 },
  chair_freeze: { keys: [chair(-55), chair(-60)], ms: 1400 },
  back_spin: { keys: [spin(0), spin(25), spin(50), spin(25)], mode: 'cycle', ms: 350 },
  macaco: { keys: [macSit, macReach, macOver, macLand], mode: 'cycle', ms: 750 },
  turtle_freeze: { keys: [turtle(-6), turtle(6)], ms: 900 },
  windmill: { keys: [mill(150, 95), mill(240, 85), mill(330, 95), mill(420, 85), mill(510, 95)], mode: 'cycle', front: true, ms: 400 },
  swipe: { keys: [swipeDown, swipeUp, rot(swipeDown, 360)], mode: 'cycle', ms: 650 },
  airchair: { keys: [airchair(140), airchair(150)], ms: 1400 },
  flare: { keys: [flare(-25), flare(25)], front: true, ms: 600 },
  hollowback: { keys: [hollow(0), hollow(15)], ms: 1400 },
}
