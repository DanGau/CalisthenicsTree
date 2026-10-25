import type { Move, Pose } from '../../core/figure'
import { leg, reach, rot } from './legs'

// Rotations: forward rolls turn the figure by -360, backward ones by +360; the last key is the first turned once.

/** Tight tuck with the torso at angle t, knees to the chest, hands on the shins. */
export const ball = (t: number): Pose => [t, t - 80, t - 150, t - 80, t - 150, t - 45, t - 180, t - 45, t - 180]
/** Tuck with the hands by the ears, ready to push. */
const ears = (t: number): Pose => [t, t + 15, t - 160, t + 15, t - 160, t - 45, t - 180, t - 45, t - 180]

const stand: Pose = [180, 8, 14, -8, -10, 0, 0, 0, 0]
const reachUp: Pose = [180, 172, 176, 188, 184, 0, 0, 0, 0]
const crouch = (t: number, hx: number): Pose => {
  const p: Pose = [t, 60, 60, 60, 60, ...leg(14, 44), ...leg(14, 44)]
  return reach(p, { hand: [hx, 44], farHand: [hx, 44] })
}
const sitCrouch: Pose = [165, 70, 80, 70, 80, ...leg(20, 30), ...leg(20, 30)]

/** Front-view star at torso angle t: arms spread a from the line of the body, legs spread l. */
export const star = (t: number, a = 20, l = 30, nearArm?: number): Pose =>
  [t, nearArm ?? t - a, nearArm ?? t - a, t + a, t + a, t - 180 + l, t - 180 + l, t - 180 - l, t - 180 - l]

const fwdRoll: Pose[] = [reachUp, crouch(100, 40), ball(10), ball(-90), ball(-200), rot(reachUp, -360)]
const backRoll: Pose[] = [stand, sitCrouch, ears(270), ears(360), rot(crouch(110, 30), 360), rot(stand, 360)]

const hs: Pose = [0, 0, 0, 0, 0, 180, 180, 180, 180]
const shoulderBall = (t: number): Pose => { const p = ball(t); p[1] = t - 100; p[2] = t - 100; return p }

// Walkovers and handsprings in side view: forward ones decrease angles.
const bridgeFwd: Pose = reach([-40, -10, -10, -10, -10, -330, -330, -330, -330], { hand: [-48, 66], farHand: [-48, 66] })
const bridgeBack: Pose = reach([320, 350, 350, 350, 350, 30, 30, 30, 30], { hand: [-48, 66], farHand: [-48, 66] })

const air: Pick<Move, 'y' | 'at'> = { y: 'hip', at: [0, -77] }
const airHigh: Pick<Move, 'y' | 'at'> = { y: 'hip', at: [0, -87] }

export const MOVES: Record<string, Move> = {
  fwd_roll: { keys: fwdRoll, mode: 'cycle', ms: 650 },
  back_roll: { keys: backRoll, mode: 'cycle', ms: 650 },
  shoulder_roll: { keys: [reachUp, crouch(100, 40), shoulderBall(20), shoulderBall(-90), shoulderBall(-200), rot(reachUp, -360)], mode: 'cycle', ms: 650 },
  cartwheel: { keys: [star(180, 20, 12), star(90, 35, 45), star(0, 20, 45), star(-90, 35, 45), star(-180, 20, 12)], mode: 'cycle', front: true, ms: 600 },
  back_ext_roll: { keys: [stand, sitCrouch, ears(270), [360, 360, 360, 360, 360, 180, 180, 180, 180], rot(stand, 360)], mode: 'cycle', ms: 650 },
  dive_roll: { keys: [reachUp, [70, 55, 55, 55, 55, -110, -110, -110, -110], ball(10), ball(-90), ball(-200), rot(reachUp, -360)], mode: 'cycle', ms: 600 },
  roundoff: { keys: [star(180, 20, 12), star(90, 35, 45), star(0, 20, 0), star(-90, 20, 0), star(-180, 20, 0)], mode: 'cycle', front: true, ms: 550 },
  kip_up: { keys: [[270, 270, 100, 270, 100, 90, 90, 90, 90], [270, 270, 100, 270, 100, 215, 220, 215, 220], [215, 260, 200, 260, 200, 70, 60, 70, 60], [160, 100, 100, 100, 100, ...leg(14, 40), ...leg(14, 40)]], mode: 'cycle', ms: 550 },
  one_hand_cart: { keys: [star(180, 20, 12, 360), star(90, 35, 45, 270), star(0, 20, 45, 180), star(-90, 35, 45, 90), star(-180, 20, 12, 0)], mode: 'cycle', front: true, ms: 600 },
  hs_roll: { keys: [hs, [-5, -40, 40, -40, 40, 185, 185, 185, 185], ball(-90), ball(-200), rot(stand, -360), rot(crouch(100, 45), -360)], mode: 'cycle', ms: 700 },
  front_walkover: { keys: [reachUp, [60, 30, 30, 30, 30, -10, -10, 40, 40], [0, 0, 0, 0, 0, -220, -220, -140, -140], bridgeFwd, rot(reachUp, -360)], mode: 'cycle', ms: 750 },
  back_walkover: { keys: [reachUp, [230, 210, 210, 210, 210, 10, 10, 120, 120], bridgeBack, [360, 360, 360, 360, 360, 220, 220, 140, 140], rot(reachUp, 360)], mode: 'cycle', ms: 750 },
  aerial: { keys: [star(180, 160, 4), star(90, 150, 50), star(0, 150, 50), star(-90, 150, 45), star(-180, 160, 4)], mode: 'cycle', front: true, ...airHigh, ms: 500 },
  front_handspring: { keys: [reachUp, [50, 40, 40, 40, 40, -20, -20, 60, 60], hs, [-110, -110, -110, -110, -110, -300, -300, -300, -300], rot(reachUp, -360)], mode: 'cycle', ms: 550 },
  back_handspring: { keys: [reachUp, [160, 20, 20, 20, 20, ...leg(35, 40), ...leg(35, 40)], [270, 330, 330, 330, 330, 60, 60, 60, 60], [360, 360, 360, 360, 360, 180, 180, 180, 180], rot(reachUp, 360)], mode: 'cycle', ms: 550 },
  butterfly_kick: { keys: [[130, 60, 60, 240, 240, 0, 0, -30, -30], [85, 160, 160, -20, -20, -40, -40, -130, -130], [85, 200, 200, 20, 20, -120, -120, -50, -50], [165, 120, 120, -60, -60, 0, 0, -50, -50]], mode: 'cycle', ...air, ms: 500 },
  back_tuck: { keys: [reachUp, ball(270), ball(390), ball(480), rot(reachUp, 360)], mode: 'cycle', ...air, ms: 450 },
  front_tuck: { keys: [reachUp, ball(90), ball(-30), ball(-120), rot(reachUp, -360)], mode: 'cycle', ...air, ms: 450 },
}
