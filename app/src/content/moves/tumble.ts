import { joints, type Beat, type Move, type Pose } from '../../core/figure'
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

// Jumps: dip with the arms back, drive up with the arms overhead, land with the hips back.
const load: Pose = plant([125, -45, -35, -45, -35, 0, 0, 0, 0, 132, 160], { foot: 0, farFoot: 0 }, 52)
const takeoff: Pose = [178, 170, 172, 170, 172, -6, -6, -6, -6, 182, 186]
/** Landing absorbed with the hips back and the arms forward, turned r degrees. */
const absorb = (r: number): Pose => rot(squat(140, 95), r)
/** Opening out of a tuck to spot the landing, turned r degrees. */
const opening = (r: number): Pose => rot([165, 120, 120, 120, 120, 20, 0, 20, 0, 170, 175], r)

// Handsprings: hurdle, block off straight arms, fly; the front one lands arched with the chest up.
const lunge: Pose = plant([168, 165, 170, 165, 170, 0, 0, -30, -30, 172, 176], { foot: 30, farFoot: -40 }, 72)
const reachDown: Pose = plant([100, 100, 100, 100, 100, 0, 0, -60, -60, 98, 95], { foot: 26 }, 76)
const hurdle: Pose = plant([40, 30, 30, 30, 30, 0, 0, -110, -110, 32, 30], { foot: 30 }, 66)
const flyFwd: Pose = [-95, -105, -105, -105, -105, 95, 95, 95, 95, -110, -120]
const landArch: Pose = plant([-160, -150, -150, -150, -150, 0, 0, 0, 0, -150, -150], { foot: -8, farFoot: -8 }, 74)
const archAbsorb: Pose = plant([-172, -130, -130, -130, -130, 0, 0, 0, 0, -168, -170], { foot: 4, farFoot: 4 }, 64)
const sit: Pose = plant([155, -35, -35, -35, -35, 0, 0, 0, 0, 160, 175], { foot: 30, farFoot: 30 }, 48)
const throwBack: Pose = plant([215, 215, 215, 215, 215, 0, 0, 0, 0, 230, 245], { foot: 24, farFoot: 24 }, 80)
const flyBack: Pose = [295, 320, 320, 320, 320, 105, 105, 105, 105, 315, 330]
const handsBack: Pose = [360, 360, 360, 360, 360, 180, 180, 180, 180, 360, 360]
const snap: Pose = [390, 390, 390, 390, 390, 320, 320, 320, 320, 385, 380]

// Kip-up: roll onto the shoulders with the legs over, whip them up and out, the hips pop and the feet land under.
const lie: Pose = [270, 95, 95, 95, 95, 90, 90, 90, 90, 270, 270]
const rockBack: Pose = palms([300, 0, 0, 0, 0, 205, 205, 205, 205, 312, 335], -14, 1)
const kick: Pose = palms([295, 0, 0, 0, 0, 150, 150, 150, 150, 300, 320], -14, 1)
const kipFly: Pose = [230, 110, 120, 110, 120, 60, 0, 60, 0, 222, 215]
const kipLand: Pose = plant([195, 100, 100, 100, 100, 0, 0, 0, 0, 205, 200], { foot: 8, farFoot: 8 }, 48)
const sitDown: Pose = [210, 100, 100, 100, 100, 125, 30, 125, 30, 215, 200]

// Butterfly kick: wind up bent over, the far leg swings, the body flies flat while the legs scissor.
const bfWind: Pose = plant([108, 165, 170, 205, 210, 0, 0, 0, 0, 112, 125], { foot: 22, farFoot: -22 }, 74)
const bfTake: Pose = [95, 200, 200, 30, 30, -12, -12, -105, -105, 95, 70]
const bfAir1: Pose = [88, 195, 195, 20, 20, -65, -65, -125, -125, 90, 70]
const bfAir2: Pose = [88, 165, 165, -15, -15, -120, -120, -60, -60, 90, 70]
const bfLand: Pose = plant([125, 120, 120, -50, -50, -75, -60, 0, 0, 135, 155], { farFoot: 0 }, 78)
const bfRise: Pose = [172, 40, 50, -30, -20, 0, 0, -8, -8, 172, 176]

/** Beats for a roll: tip in, roll at a steady speed through n keys, stand up, restart seamlessly. */
const roll = (n: number, tip = 1): Beat[] => [
  { hold: 0.4, dur: 1 }, { dur: tip, ease: 'in' },
  ...Array.from({ length: n }, (_, i): Beat => ({ dur: 0.65, ease: i === n - 1 ? 'out' : 'lin' })),
  { dur: 1, ease: 'out' }, { hold: 0.3, dur: 0.01 },
]
const wheel: Beat[] = [{ hold: 0.4, dur: 1, ease: 'in' }, { dur: 1, ease: 'lin' }, { dur: 1, ease: 'lin' }, { dur: 1.1, ease: 'out' }, { hold: 0.3, dur: 0.01 }]
/** Beats for a tuck: dip, drive, two flight keys, open, land, stand. */
const salto: Beat[] = [
  { hold: 0.4, dur: 1 }, { hold: 0.1, dur: 0.5, ease: 'snap' }, { dur: 0.6, ease: 'out' }, { lift: 70, dur: 0.6, ease: 'lin' },
  { lift: 62, dur: 0.6, ease: 'in' }, { lift: 12, dur: 0.3, ease: 'in' }, { dur: 1.2, ease: 'out' }, { hold: 0.3, dur: 0.01 },
]

export const MOVES: Record<string, Move> = {
  fwd_roll: { keys: fwdRoll, mode: 'cycle', ms: 600, beats: roll(3), flow: 0.1 },
  back_roll: { keys: backRoll, mode: 'cycle', ms: 650, beats: roll(2, 0.8), flow: 0.1 },
  shoulder_roll: { keys: [reachUp, crouch(118, 44), shoulderBall(15), shoulderBall(-90), shoulderBall(-170), squat(-205, -270), rot(reachUp, -360)], mode: 'cycle', ms: 600, beats: roll(3), flow: 0.1 },
  cartwheel: { keys: cart(), mode: 'cycle', front: true, ms: 650, beats: wheel },
  back_ext_roll: {
    keys: [stand, squat(165, 100), ears(255), palms(ears(335), -6, 1), handsBack, snap, absorb(360), rot(stand, 360)], mode: 'cycle', ms: 600,
    beats: [{ hold: 0.4, dur: 1 }, { dur: 0.7, ease: 'in' }, { dur: 0.6, ease: 'lin' }, { dur: 0.5, ease: 'snap' }, { hold: 0.15, dur: 0.5, ease: 'in' }, { lift: 10, dur: 0.4, ease: 'in' }, { dur: 1, ease: 'out' }, { hold: 0.3, dur: 0.01 }],
  },
  dive_roll: {
    keys: [reachUp, load, [50, 40, 40, 40, 40, -130, -130, -130, -130, 45, 40], palms(ball(15), 8), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)], mode: 'cycle', ms: 550, flow: 0.15,
    beats: [{ hold: 0.4, dur: 1 }, { hold: 0.1, dur: 0.6, ease: 'out' }, { lift: 45, dur: 0.6, ease: 'in' }, { dur: 0.6, ease: 'lin' }, { dur: 0.6, ease: 'lin' }, { dur: 0.7, ease: 'out' }, { dur: 1, ease: 'out' }, { hold: 0.3, dur: 0.01 }],
  },
  roundoff: {
    keys: [star(180, 20, 12), star(90, 57, 40), star(0, 18, 10), star(-60, 25, 0), star(-180, 20, 0)], mode: 'cycle', front: true, ms: 550,
    beats: [{ hold: 0.4, dur: 1, ease: 'in' }, { dur: 0.9, ease: 'lin' }, { dur: 0.6, ease: 'snap' }, { lift: 25, dur: 0.6, ease: 'in' }, { hold: 0.4, dur: 0.01 }],
  },
  kip_up: {
    keys: [lie, rockBack, kick, kipFly, kipLand, squat(160), stand, squat(165), sitDown], mode: 'cycle', ms: 550, flow: 0.12,
    beats: [{ hold: 0.4, dur: 1.1 }, { hold: 0.15, dur: 0.35, ease: 'snap' }, { dur: 0.45, ease: 'out' }, { lift: 32, dur: 0.45, ease: 'in' }, { dur: 0.5, ease: 'out' }, { dur: 1, ease: 'out' }, { hold: 0.8, dur: 1 }, { dur: 0.9, ease: 'in' }, { dur: 1, ease: 'out' }],
  },
  one_hand_cart: { keys: cart(true), mode: 'cycle', front: true, ms: 650, beats: wheel },
  hs_roll: {
    keys: [reachUp, lungeDown, hs, hsBend, palms(ball(-40), 4, 1), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)], mode: 'cycle', ms: 650,
    beats: [{ hold: 0.3, dur: 0.9 }, { dur: 0.8, ease: 'out' }, { hold: 1, dur: 1.4 }, { dur: 0.7, ease: 'in' }, { dur: 0.6, ease: 'lin' }, { dur: 0.6, ease: 'lin' }, { dur: 0.6, ease: 'out' }, { dur: 1, ease: 'out' }, { hold: 0.3, dur: 0.01 }],
  },
  front_walkover: { keys: [reachUp, lungeDown, splitFwd, bridgeFwd, rot(reachUp, -360)], mode: 'cycle', ms: 750, beats: [{ hold: 0.4, dur: 1 }, { dur: 0.9, ease: 'out' }, { hold: 0.1, dur: 1.1 }, { hold: 0.2, dur: 1.3 }, { hold: 0.3, dur: 0.01 }] },
  back_walkover: { keys: [reachUp, leanBack, bridgeBack, splitBack, rot(reachUp, 360)], mode: 'cycle', ms: 750, beats: [{ hold: 0.4, dur: 1.2 }, { dur: 1.1, ease: 'in' }, { hold: 0.2, dur: 0.9, ease: 'out' }, { dur: 1.1 }, { hold: 0.3, dur: 0.01 }] },
  aerial: {
    keys: [star(180, 160, 4), star(170, 170, 14), star(90, 150, 50), star(0, 150, 50), star(-90, 150, 45), star(-180, 160, 8), star(-180, 160, 4)], mode: 'cycle', front: true, ms: 500, flow: 0.15,
    beats: [{ hold: 0.3, dur: 1 }, { dur: 0.6, ease: 'out' }, { lift: 40, dur: 0.6, ease: 'lin' }, { lift: 55, dur: 0.6, ease: 'lin' }, { lift: 35, dur: 0.6, ease: 'in' }, { dur: 0.8, ease: 'out' }, { hold: 0.3, dur: 0.01 }],
  },
  front_handspring: {
    keys: [reachUp, lunge, reachDown, hurdle, hs, flyFwd, landArch, archAbsorb, rot(reachUp, -360)], mode: 'cycle', ms: 550, flow: 0.15,
    beats: [{ hold: 0.4, dur: 0.8 }, { dur: 0.4, ease: 'in' }, { dur: 0.35, ease: 'lin' }, { dur: 0.4, ease: 'in' }, { dur: 0.45, ease: 'snap' }, { lift: 62, dur: 0.5, ease: 'in' }, { dur: 0.4, ease: 'out' }, { dur: 1, ease: 'out' }, { hold: 0.3, dur: 0.01 }],
  },
  back_handspring: {
    keys: [reachUp, sit, throwBack, flyBack, handsBack, snap, absorb(360), rot(reachUp, 360)], mode: 'cycle', ms: 550, flow: 0.15,
    beats: [{ hold: 0.4, dur: 0.9 }, { hold: 0.05, dur: 0.45, ease: 'snap' }, { dur: 0.45, ease: 'out' }, { lift: 60, dur: 0.45, ease: 'in' }, { dur: 0.35, ease: 'snap' }, { lift: 14, dur: 0.4, ease: 'in' }, { dur: 1, ease: 'out' }, { hold: 0.3, dur: 0.01 }],
  },
  butterfly_kick: {
    keys: [bfRise, bfWind, bfTake, bfAir1, bfAir2, bfLand], mode: 'cycle', ms: 500, flow: 0.2,
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.05, dur: 0.6, ease: 'snap' }, { dur: 0.45, ease: 'out' }, { lift: 62, dur: 0.45, ease: 'lin' }, { lift: 55, dur: 0.45, ease: 'in' }, { dur: 1, ease: 'out' }],
  },
  back_tuck: { keys: [reachUp, load, takeoff, ball(290), ball(410), opening(360), absorb(360), rot(reachUp, 360)], mode: 'cycle', ms: 450, flow: 0.15, beats: salto },
  front_tuck: { keys: [reachUp, load, takeoff, ball(70), ball(-50), opening(-360), absorb(-360), rot(reachUp, -360)], mode: 'cycle', ms: 450, flow: 0.15, beats: salto },
}
