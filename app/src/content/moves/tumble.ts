import { joints, type Move, type Pose } from '../../core/figure'
import { plant, pos, reach, rot } from './legs'

// Rotations: forward rolls turn the figure by -360, backward ones by +360; the last key is the first turned once.

/** Tight tuck at torso angle t: back rounded, chin on the chest, knees in, hands on the shins. */
export const ball = (t: number): Pose => [t, t - 80, t - 150, t - 80, t - 150, t - 40, t - 175, t - 40, t - 175, t - 25, t - 70]
/** Tuck with the back rounded and hands by the ears, palms toward the floor beyond the head. */
const ears = (t: number): Pose => [t, t - 80, t + 50, t - 80, t + 50, t - 40, t - 175, t - 40, t - 175, t - 20, t - 60]

const stand: Pose = [180, 8, 14, -8, -10, 0, 0, 0, 0, 180, 180]
const reachUp: Pose = [180, 172, 176, 178, 182, 0, 0, 0, 0, 182, 186]
/** Squat with the hands on the floor ahead, chin tucked. */
const crouch = (t: number, hx: number, chin = 60): Pose =>
  plant([t, 0, 0, 0, 0, 0, 0, 0, 0, t - 15, chin], { hand: hx, farHand: hx, foot: 10, farFoot: 10 }, 42)
/** Squat with the arms forward (landing or sitting back). */
const squat = (t: number, arms = 90): Pose => plant([t, arms, arms, arms, arms, 0, 0, 0, 0, t + 5, 170], { foot: 18, farFoot: 18 }, 34)

/** Puts both palms on the floor (the lowest other body point) at dx from the shoulder. */
const palms = (p: Pose, dx: number, k = -1): Pose => {
  const b = joints(p)
  const floor = Math.max(b.hip.y, b.waist.y, b.shoulder.y, b.knee.y, b.foot.y, b.head.y + 11)
  return reach(p, { hand: [b.shoulder.x + dx, floor], farHand: [b.shoulder.x + dx, floor] }, { k: { hand: k, farHand: k } })
}

/** Front-view star at torso angle t: arms spread a from the line of the body, legs spread l. */
export const star = (t: number, a = 20, l = 30, nearArm?: number): Pose =>
  [t, nearArm ?? t - a, nearArm ?? t - a, t + a, t + a, t - 180 + l, t - 180 + l, t - 180 - l, t - 180 - l]

// Cartwheel: at the quarter turns the arm spread puts one palm level with the foot still down.
const cart = (one = false): Pose[] => {
  const tuck = (t: number) => (one ? t - 170 : undefined)
  return [star(180, 20, 12, tuck(180)), star(90, 57, 40, tuck(90)), star(0, 18, 48, tuck(0)), star(-90, 57, 40, tuck(-90)), star(-180, 20, 12, tuck(-180))]
}

const fwdRoll: Pose[] = [reachUp, crouch(118, 44), palms(ball(15), 8), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)]
const backRoll: Pose[] = [stand, squat(165, 100), ears(255), palms(ears(335), -6, 1), rot(crouch(120, 36, 160), 360), rot(stand, 360)]

const hs: Pose = [0, 0, 0, 0, 0, 180, 180, 180, 180, 0, 5]
// Handstand roll: arms bend, chin tucks late, the rounded back meets the floor.
const hsBend: Pose = (() => { const p: Pose = [8, 0, 0, 0, 0, 185, 185, 185, 185, -10, -45]; const s = pos(p, 'shoulder'); return reach(p, { hand: [s[0] + 6, s[1] + 34], farHand: [s[0] + 6, s[1] + 34] }, { k: { hand: 1, farHand: 1 } }) })()
const shoulderBall = (t: number): Pose => { const p = ball(t); p[1] = t - 95; p[2] = t - 95; return p }

// Walkovers: through a split handstand into a bridge. Forward ones decrease angles, backward ones increase.
const lungeDown: Pose = plant([45, 0, 0, 0, 0, 0, 0, -100, -100, 30, 20], { hand: 52, farHand: 52, foot: 22 }, 58)
const splitFwd: Pose = [0, 0, 0, 0, 0, -135, -135, -225, -225, 0, 10]
const bridgeFwd: Pose = plant([-70, 0, 0, 0, 0, 0, 0, -190, -190, -30, -10], { hand: -46, farHand: -46, foot: 40 }, 62)
const leanBack: Pose = [200, 200, 200, 200, 200, 0, 0, 80, 80, 225, 245]
const bridgeBack: Pose = plant([290, 0, 0, 0, 0, 0, 0, 170, 170, 330, 350], { hand: -46, farHand: -46, foot: 40 }, 62)
const splitBack: Pose = [360, 360, 360, 360, 360, 225, 225, 135, 135, 360, 355]

// Handsprings: block off straight arms; the front one lands arched with the chest up.
const hurdle: Pose = plant([40, 30, 30, 30, 30, 0, 0, -110, -110, 32, 30], { foot: 30 }, 66)
const landArch: Pose = plant([-160, -150, -150, -150, -150, 0, 0, 0, 0, -150, -150], { foot: -8, farFoot: -8 }, 74)
const sit: Pose = plant([155, -35, -35, -35, -35, 0, 0, 0, 0, 160, 175], { foot: 30, farFoot: 30 }, 48)
const throwBack: Pose = plant([235, 235, 235, 235, 235, 0, 0, 0, 0, 255, 275], { foot: 26, farFoot: 26 }, 72)
const snap: Pose = [390, 390, 390, 390, 390, 320, 320, 320, 320, 385, 380]

const air: Pick<Move, 'y' | 'at'> = { y: 'hip', at: [0, -82] }
const airHigh: Pick<Move, 'y' | 'at'> = { y: 'hip', at: [0, -88] }

// Kip-up: on the back, rock the legs over, snap the hips up and land with the feet under.
const lie: Pose = [270, 180, 300, 180, 300, 90, 90, 90, 90, 270, 270]
const rock: Pose = [245, 165, 290, 165, 290, 215, 220, 215, 220, 255, 230]
const kipLand: Pose = plant([205, 150, 150, 150, 150, 0, 0, 0, 0, 220, 225], { foot: 8, farFoot: 8 }, 52)

export const MOVES: Record<string, Move> = {
  fwd_roll: { keys: fwdRoll, mode: 'cycle', ms: 600 },
  back_roll: { keys: backRoll, mode: 'cycle', ms: 650 },
  shoulder_roll: { keys: [reachUp, crouch(118, 44), shoulderBall(15), shoulderBall(-90), shoulderBall(-170), squat(-205, -270), rot(reachUp, -360)], mode: 'cycle', ms: 600 },
  cartwheel: { keys: cart(), mode: 'cycle', front: true, ms: 600 },
  back_ext_roll: { keys: [stand, squat(165, 100), ears(255), palms(ears(335), -6, 1), [360, 360, 360, 360, 360, 180, 180, 180, 180, 360, 360], snap, rot(stand, 360)], mode: 'cycle', ms: 600 },
  dive_roll: { keys: [reachUp, [50, 40, 40, 40, 40, -130, -130, -130, -130, 45, 40], palms(ball(15), 8), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)], mode: 'cycle', ms: 550 },
  roundoff: { keys: [star(180, 20, 12), star(90, 57, 40), star(0, 18, 10), star(-60, 25, 0), star(-180, 20, 0)], mode: 'cycle', front: true, ms: 550 },
  kip_up: { keys: [lie, rock, kipLand, squat(160), stand], mode: 'cycle', ms: 550 },
  one_hand_cart: { keys: cart(true), mode: 'cycle', front: true, ms: 600 },
  hs_roll: { keys: [hs, hsBend, palms(ball(-40), 4, 1), ball(-90), ball(-170), squat(-205, -270), rot(stand, -360)], mode: 'cycle', ms: 650 },
  front_walkover: { keys: [reachUp, lungeDown, splitFwd, bridgeFwd, rot(reachUp, -360)], mode: 'cycle', ms: 750 },
  back_walkover: { keys: [reachUp, leanBack, bridgeBack, splitBack, rot(reachUp, 360)], mode: 'cycle', ms: 750 },
  aerial: { keys: [star(180, 160, 4), star(90, 150, 50), star(0, 150, 50), star(-90, 150, 45), star(-180, 160, 4)], mode: 'cycle', front: true, ...airHigh, ms: 500 },
  front_handspring: { keys: [reachUp, hurdle, hs, landArch, rot(reachUp, -360)], mode: 'cycle', ms: 550 },
  back_handspring: { keys: [reachUp, sit, throwBack, [360, 360, 360, 360, 360, 180, 180, 180, 180, 360, 360], snap, rot(reachUp, 360)], mode: 'cycle', ms: 550 },
  butterfly_kick: { keys: [[130, 60, 60, 240, 240, 0, 0, -30, -30], [85, 160, 160, -20, -20, -40, -40, -130, -130, 90, 60], [85, 200, 200, 20, 20, -120, -120, -50, -50, 90, 60], [165, 120, 120, -60, -60, 0, 0, -50, -50]], mode: 'cycle', ...air, ms: 500 },
  back_tuck: { keys: [reachUp, ball(250), ball(370), ball(470), rot(reachUp, 360)], mode: 'cycle', ...air, ms: 450 },
  front_tuck: { keys: [reachUp, ball(110), ball(-10), ball(-110), rot(reachUp, -360)], mode: 'cycle', ...air, ms: 450 },
}
