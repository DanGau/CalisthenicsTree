import type { Move, Pose, Prop } from '../../core/figure'
import { leg, plant, pos, reach, rot } from './legs'
import { ball } from './tumble'

type P2 = [number, number]

const stand: Pose = [180, 8, 14, -8, -10, 0, 0, 0, 0, 180, 180]
// Jumps: hinge and swing the arms back, extend hips, knees and ankles in one line, land with hips back and knees over toes.
const load: Pose = plant([122, -45, -35, -45, -35, 0, 0, 0, 0, 130, 160], { foot: 0, farFoot: 0 }, 50)
const takeoff: Pose = [158, 150, 155, 150, 155, -22, -22, -22, -22, 160, 165]
const land = (fx = 24): Pose => plant([135, 90, 90, 90, 90, 0, 0, 0, 0, 145, 168], { foot: fx, farFoot: fx }, 34)
const reachDown: Pose = [180, 150, 150, 150, 150, 4, 6, -4, 6, 180, 175]
const air: Pick<Move, 'y' | 'at'> = { y: 'hip', at: [0, -82] }

// Strides: near knee drives, far leg pushes long behind; arms swing opposite.
const stride = (s: 1 | -1, drive = 80): Pose => {
  const a: P2 = [drive, 0]
  const b: P2 = [-35, -40]
  return s === 1 ? [168, -40, 30, 60, 120, ...a, ...b, 170, 175] : [168, 60, 120, -40, 30, ...b, ...a, 170, 175]
}

// Vaults: the near hand is pinned to the near edge of a 50 box (box x 0 to 60, hand at x 20).
// Each pose gives the hand from the hip; feet are planted on the box top (hand level) or the floor (50 lower).
const H = 50
const vbox: Prop = { t: 'box', x: 0, w: 60, h: H }
const onBox: Pick<Move, 'x' | 'y' | 'at' | 'props'> = { x: 'hand', y: 'hand', at: [20, -H], props: [vbox] }
type Feet = { foot?: number; farFoot?: number }
/** Torso t (chest c), both hands (or only the near one) at `hand` from the hip, feet on the box (`top`) or floor (`low`). */
const vault = (t: number, c: number, hand: P2, legs: [number, number, number, number], top: Feet = {}, low: Feet = {}, both = false, farArm: P2 = [70, 80]): Pose => {
  let p = reach([t, 0, 0, ...farArm, ...legs, c, c + 5], both ? { hand, farHand: hand } : { hand })
  const [, hy] = pos(p, 'hand')
  if (Object.keys(top).length) p = plant(p, top, hy)
  if (Object.keys(low).length) p = plant(p, low, hy + H)
  return p
}

const safety = [
  vault(130, 140, [36, 28], [0, 0, 0, 0], { foot: 8 }, { farFoot: -40 }),
  vault(160, 165, [6, 40], [0, 0, 85, 10], { foot: 0 }),
  vault(165, 170, [-34, 30], [-20, -100, 0, 0], {}, { farFoot: 30 }),
]
const kong = [
  vault(72, 70, [62, 18], [-108, -108, -108, -108], {}, {}, true),
  vault(135, 140, [24, 36], [100, 10, 100, 10], {}, {}, true),
  vault(165, 168, [-30, 20], [0, 0, 0, 0], {}, { foot: 32, farFoot: 32 }, true),
]
const dash = [
  vault(205, 200, [-24, 26], [80, 80, 80, 80], {}, {}, true),
  vault(195, 190, [-40, 18], [65, 65, 65, 65], {}, {}, true),
  vault(170, 170, [-36, 20], [0, 0, 0, 0], {}, { foot: 36, farFoot: 36 }, true),
]
const lazy = [
  vault(150, 155, [32, 24], [65, 55, 0, 0], {}, { farFoot: -36 }),
  vault(205, 200, [-14, 26], [86, 86, 84, 84]),
  vault(170, 172, [-36, 20], [0, 0, 0, 0], {}, { foot: 34, farFoot: 18 }),
]
const speed = [
  vault(140, 145, [36, 22], [0, 0, 60, 50], {}, { foot: -30 }),
  vault(120, 130, [24, 30], [80, 80, 90, 90]),
  vault(168, 170, [-32, 20], [0, 0, -40, -90], {}, { foot: 36 }),
]

// Wall catch and climb: hands hook the top of a 150 wall whose face is at x 30.
const W = 150
const wall: Prop = { t: 'box', x: 30, w: 60, h: W }
const onWall: Pick<Move, 'x' | 'y' | 'at' | 'props'> = { x: 'hand', y: 'hand', at: [36, -W], props: [wall] }
/** Hands at `hand` from the hip; feet pressed to the wall face (6 left of the hand) at depth `fy` below the hip. */
const onFace = (t: number, hand: P2, fy: number, legs: [number, number, number, number] = [0, 0, 0, 0]): Pose => {
  const p = reach([t, 0, 0, 0, 0, ...legs, t, t + 10], { hand, farHand: hand })
  const fx = hand[0] - 6 - 14
  return fy ? reach(p, { foot: [fx, fy], farFoot: [fx, fy] }) : p
}
const catchReach: Pose = reach([150, 0, 0, 0, 0, 10, -80, -5, -95, 150, 165], { hand: [34, -92], farHand: [34, -92] })
const catchHold = onFace(160, [40, -92], 22)
const hang = onFace(165, [24, -96], 30)
const pull = onFace(150, [30, -42], 26)
const press: Pose = (() => {
  const p = plant(reach([115, 0, 0, 0, 0, 0, 0, 10, 20, 110, 130], { hand: [34, 14], farHand: [34, 14] }), { foot: 10 }, 14)
  return reach(p, { farFoot: [14, 40] })
})()

// Wall kicks: the foot meets the wall face with the shin level, at the height of `plant`.
const wallPlant = (t: number, arms: number): Pose => [t, arms, arms, arms, arms, 60, 92, -20, -10, t, t + 5]
const faceX = (p: Pose) => pos(p, 'foot')[0] + 6
const ticPlant = wallPlant(190, 150)
const runPlant = wallPlant(170, 172)

const flipPlant: Pose = [195, 160, 160, 160, 160, 55, 95, 0, 0, 205, 215]

export const MOVES: Record<string, Move> = {
  drop_land: { keys: [reachDown, land()], x: 'foot', props: [{ t: 'box', x: -96, w: 50, h: 45 }], ms: 700 },
  broad_jump: { keys: [load, takeoff, land(30)], mode: 'cycle', ms: 650 },
  precision: { keys: [load, takeoff, land(10)], mode: 'cycle', ms: 650 },
  safety_vault: { keys: safety, mode: 'cycle', ...onBox, ms: 600 },
  tuck_jump: { keys: [stand, [170, 100, 130, 100, 130, ...leg(22, 12), ...leg(22, 12), 160, 165]], ...air, ms: 500 },
  lazy_vault: { keys: lazy, mode: 'cycle', ...onBox, ms: 600 },
  cat_leap: { keys: [catchReach, catchHold], mode: 'cycle', ...onWall, ms: 700 },
  box_jump: {
    keys: [takeoff, [160, 120, 120, 120, 120, ...leg(28, 4), ...leg(28, 4), 165, 170], plant([140, 90, 90, 90, 90, 0, 0, 0, 0, 150, 168], { foot: 26, farFoot: 26 }, 30)],
    mode: 'cycle', y: 'hip', at: [0, -90], props: [{ t: 'box', x: 4, w: 60, h: 60 }], ms: 650,
  },
  speed_vault: { keys: speed, mode: 'cycle', ...onBox, ms: 500 },
  climb_up: { keys: [hang, pull, press], ...onWall, ms: 800 },
  depth_jump: { keys: [reachDown, plant([150, -40, -30, -40, -30, 0, 0, 0, 0, 155, 170], { foot: 14, farFoot: 14 }, 62), takeoff], x: 'foot', props: [{ t: 'box', x: -96, w: 50, h: 45 }], ms: 450 },
  kong: { keys: kong, mode: 'cycle', ...onBox, ms: 550 },
  tic_tac: { keys: [stride(1), ticPlant, [205, 170, 170, 170, 170, 30, -20, 10, -40, 200, 195]], mode: 'cycle', props: [{ t: 'wall', x: faceX(ticPlant) }], ms: 550 },
  bounding: { keys: [stride(1, 95), stride(-1, 95)], ms: 450 },
  dash_vault: { keys: dash, mode: 'cycle', ...onBox, ms: 550 },
  wall_run: { keys: [stride(1), runPlant], mode: 'cycle', props: [{ t: 'box', x: faceX(runPlant), w: 50, h: 175 }], ms: 550 },
  running_precision: { keys: [stride(1), [160, 150, 150, 150, 150, 115, 10, 105, 0, 165, 170], land(10)], mode: 'cycle', ms: 600 },
  kong_pre: { keys: [...kong, vault(172, 175, [-40, 30], [0, 0, 0, 0], {}, { foot: 44, farFoot: 44 }, true, [90, 90])], mode: 'cycle', ...onBox, ms: 550 },
  wall_flip: { keys: [stand, flipPlant, ball(300), ball(420), rot(stand, 360)], mode: 'cycle', ...air, props: [{ t: 'wall', x: faceX(flipPlant) }], ms: 500 },
}
