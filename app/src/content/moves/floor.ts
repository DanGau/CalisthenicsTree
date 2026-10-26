import { joints, type Move, type Pose } from '../../core/figure'
import { plant, pos, reach, rot } from './legs'
import { star } from './tumble'

/** Lowest point of the head and trunk, in hip coordinates. */
const base = (p: Pose, front = false) => {
  const b = joints(p, front)
  return Math.max(b.hip.y, b.waist.y, b.shoulder.y, b.head.y + 11)
}
/** Arm angles that hold the hand in front of the face (guard). */
const GUARD: [number, number] = [145, 235]

// Ginga: rocking lunge, one arm guarding the face, the rear foot on its ball; feet swap.
const ginga = (back: 'near' | 'far'): Pose => {
  const arms: [number, number, number, number] = back === 'far' ? [...GUARD, -35, -10] : [-35, -10, ...GUARD]
  return plant([158, ...arms, 0, 0, 0, 0, 165, 175], back === 'far' ? { foot: 24, farFoot: -46 } : { foot: -46, farFoot: 24 }, 62)
}

// Cocorinha: heels-down squat, near hand brushes the floor, far forearm over the head.
const squatGuard: Pose = (() => {
  const p = plant([140, 0, 0, 175, 265, 0, 0, 0, 0, 152, 175], { foot: 20, farFoot: 20 }, 30)
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [s[0] + 12, 30] })
})()

// Negativa: sit low on the near foot and near hand (behind), far leg long and low, head turned away.
const negativa: Pose = (() => {
  const p = plant([215, 0, 0, ...GUARD, 0, 0, 84, 88, 205, 230], { foot: 18 }, 24)
  return plant(p, { hand: -44 }, 24, { k: { hand: 1 } })
})()

// Baby freeze: side of the head and both palms down, near elbow tucked into the hip, knees on it.
const baby = (lift: number): Pose => {
  const p: Pose = [42 + lift, 0, 0, 0, 0, 95 + lift, 225 + lift, 105 + lift, 235 + lift, 25, 5]
  const f = base(p)
  return reach(p, { hand: [pos(p, 'shoulder')[0] + 26, f], farHand: [pos(p, 'shoulder')[0] - 16, f] }, { k: { hand: 1, farHand: -1 } })
}

// Queda de rins: torso tipped to the floor on the near elbow under the ribs, head just off the floor.
const qdr = (legs: [number, number, number, number]): Pose => {
  const p: Pose = [70, 0, 0, 0, 0, ...legs, 82, 100]
  const s = pos(p, 'shoulder')
  const f = pos(p, 'hip')[1] + 18
  return reach(p, { hand: [s[0] - 6, f], farHand: [s[0] + 24, f] }, { k: { hand: 1, farHand: 1 } })
}

// Chair freeze: head and near hand down, elbow in the small of the back, legs in a figure four, looking up.
const chair = (t: number): Pose => {
  const p: Pose = [t, 0, 0, 150, 200, 150, 40, 95, 175, t + 20, t + 50]
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [s[0] + 10, base(p)] }, { k: { hand: -1 } })
}

// Turtle: both elbows in the hips, body flat and level, head up.
const turtle = (tilt: number): Pose => {
  const p: Pose = [90 + tilt, 0, 0, 0, 0, 112 + tilt, 20, 112 + tilt, 20, 90 + tilt, 130]
  const [hx, hy] = pos(p, 'hip')
  return reach(p, { hand: [hx + 14, hy + 34], farHand: [hx + 14, hy + 34] }, { k: { hand: 1, farHand: 1 } })
}

// Airchair: one hand under the hip, elbow in the back, body near vertical upside down, legs piked over.
const airchair = (legs: number): Pose => {
  const p: Pose = [-20, 0, 0, 120, 160, legs, legs - 30, legs + 12, legs - 18, -10, 0]
  const [hx] = pos(p, 'hip')
  return reach(p, { hand: [hx + 4, pos(p, 'shoulder')[1] + 34] }, { k: { hand: -1 } })
}

// Hollowback: handstand with the chest open, the back arched and the legs dropping over, knees bent.
const hollow = (drop: number): Pose => [-25 - drop, 0, 0, 0, 0, -150 - drop, -110 - drop * 2, -145 - drop, -100 - drop * 2, 5, 10]

// Back spin: on the rounded upper back, knees tucked, legs winding.
const spin = (k: number): Pose => [-70, -30 + k, 40, -60 + k, 10, 150 + k, 40 + k, 130 + k, 20 + k, -95, -110]

// Windmill (front view): rolling across the upper back and chest, legs in a wide V sweeping around.
const mill = (c: number, t: number): Pose => [t, t - 60, t - 100, t + 60, t + 100, c - 50, c - 50, c + 50, c + 50]

// Flare (front view): hips high on straight arms, wide straddle swinging under as the hands pass.
const flare = (s: number): Pose => [180 + s, s > 0 ? -55 : 0, s > 0 ? -70 : 0, s < 0 ? 55 : 0, s < 0 ? 70 : 0, 100, 100, -100, -100]

// Macaco: from a squat, reach one hand back low, throw the hips over it and land on the feet.
const macSit: Pose = plant([165, 60, 60, 60, 60, 0, 0, 0, 0, 170, 175], { foot: 22, farFoot: 22 }, 30)
const macReach: Pose = plant(plant([215, 0, 0, 140, 160, 0, 0, 0, 0, 230, 250], { foot: 28, farFoot: 28 }, 30), { hand: -46 }, 30, { k: { hand: 1 } })
const macOver: Pose = [345, 345, 345, 290, 290, 170, 150, 205, 225, 350, 355]
const macLand: Pose = rot(plant([165, 30, 40, 200, 200, 0, 0, 0, 0, 170, 175], { foot: 14, farFoot: -12 }, 46), 360)

// Swipe: bent over on the hands, whip the hips and legs round through a backbend, land on the hands again.
const swipeDown: Pose = plant([35, 0, 0, 0, 0, 0, 0, 0, 0, 25, 20], { hand: 56, farHand: 44, foot: -4, farFoot: 12 }, 70)
const swipeUp: Pose = [235, 315, 315, 290, 290, 75, 65, 125, 115, 260, 290]

export const MOVES: Record<string, Move> = {
  ginga: { keys: [ginga('far'), ginga('near')], ms: 1000 },
  cocorinha: { keys: [ginga('far'), squatGuard], ms: 800 },
  negativa: { keys: [ginga('far'), negativa], ms: 1000 },
  baby_freeze: { keys: [baby(0), baby(6)], ms: 1400 },
  qdr: { keys: [qdr([150, 20, 155, 30]), qdr([-80, -80, -70, -70])], ms: 1400 },
  au: { keys: [star(180, 30, 25), star(90, 57, 45), star(0, 25, 60), star(-90, 57, 45), star(-180, 30, 25)], mode: 'cycle', front: true, ms: 900 },
  chair_freeze: { keys: [chair(-50), chair(-55)], ms: 1400 },
  back_spin: { keys: [spin(0), spin(25), spin(50), spin(25)], mode: 'cycle', ms: 350 },
  macaco: { keys: [macSit, macReach, macOver, macLand], mode: 'cycle', ms: 750 },
  turtle_freeze: { keys: [turtle(-6), turtle(6)], ms: 900 },
  windmill: { keys: [mill(150, 95), mill(240, 85), mill(330, 95), mill(420, 85), mill(510, 95)], mode: 'cycle', front: true, ms: 400 },
  swipe: { keys: [swipeDown, swipeUp, rot(swipeDown, 360)], mode: 'cycle', ms: 650 },
  airchair: { keys: [airchair(140), airchair(150)], ms: 1400 },
  flare: { keys: [flare(-25), flare(25)], front: true, ms: 600 },
  hollowback: { keys: [hollow(0), hollow(15)], ms: 1400 },
}
