import { place, type Beat, type Move, type Pose, type Prop } from '../../core/figure'
import { leg, plant, pos, reach, rot } from './legs'
import { ball } from './tumble'

type P2 = [number, number]

const stand: Pose = [180, 8, 14, -8, -10, 0, 0, 0, 0, 180, 180]
// Jumps: hinge and swing the arms back, extend hips, knees and ankles in one line, land with hips back and knees over toes.
const load: Pose = plant([122, -45, -35, -45, -35, 0, 0, 0, 0, 130, 160], { foot: 0, farFoot: 0 }, 50)
const takeoff: Pose = [158, 150, 155, 150, 155, -22, -22, -22, -22, 160, 165]
const jumpUp: Pose = [176, 165, 170, 165, 170, -6, -6, -6, -6, 178, 182]
const land = (fx = 24, f = 34): Pose => plant([135, 90, 90, 90, 90, 0, 0, 0, 0, 145, 168], { foot: fx, farFoot: fx }, f)
/** Knees driven up and forward at the top of a jump. */
const apex: Pose = [152, 105, 115, 105, 115, 100, 15, 100, 15, 156, 165]
/** Feet reaching ahead to meet the ground. */
const reachLand: Pose = [150, 85, 90, 85, 90, 45, 15, 45, 15, 152, 166]
const tuck: Pose = [170, 100, 130, 100, 130, ...leg(22, 12), ...leg(22, 12), 160, 165]

// Strides: near knee drives, far leg pushes long behind; arms swing opposite.
const stride = (s: 1 | -1, drive = 80): Pose => {
  const a: P2 = [drive, 0]
  const b: P2 = [-35, -40]
  return s === 1 ? [168, -40, 30, 60, 120, ...a, ...b, 170, 175] : [168, 60, 120, -40, 30, ...b, ...a, 170, 175]
}

// Drops: stand on the box edge (feet over its corner), step off, fall with the legs long, meet the floor ahead of the box.
const DROP = 45
const dropBox: Prop = { t: 'box', x: -54, w: 60, h: DROP }
const stepOff: Pose = [178, 40, 60, -30, -20, 50, 20, 0, 0, 178, 178]
const fall: Pose = [176, 110, 120, 100, 110, 20, 10, 16, 6, 176, 178]
const touch: Pose = [170, 100, 100, 100, 100, 22, 22, 22, 22, 172, 174]
const soak: Pose = land(30, 56)
const rise: Pose = plant([172, 20, 30, -10, 0, 0, 0, 0, 0, 175, 178], { foot: 30, farFoot: 30 }, 78)
const dip: Pose = plant([150, -40, -30, -40, -30, 0, 0, 0, 0, 155, 170], { foot: 30, farFoot: 30 }, 64)
const rebound: Pose = [172, 165, 170, 165, 170, 20, 20, 20, 20, 175, 178]

// Box jump: feet start behind the box, land deep on top with the feet ahead, stand, step back down.
const BOX = 60
const jumpBox: Prop = { t: 'box', x: 18, w: 60, h: BOX }
const boxLand: Pose = land(34, 34)
const boxStand: Pose = plant([162, 40, 60, 40, 60, 0, 0, 0, 0, 166, 172], { foot: 34, farFoot: 34 }, 70)
const stepDown: Pose = plant(plant([168, 20, 40, -10, 0, 0, 0, 0, 0, 170, 175], { farFoot: 34 }, 44), { foot: -14 }, 44 + BOX)

/** Flight beats: drive off the floor, rise to `lift`, fall to the landing, absorb. */
const flight = (lift: number, dur = 0.5): Beat[] => [{ dur: 0.55, ease: 'out' }, { lift, dur, ease: 'in' }]

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
const ticPush: Pose = [202, 160, 170, 140, 150, 78, 90, -10, -70, 205, 215]
const ticFly: Pose = [190, 150, 160, 140, 150, 40, -20, 30, -40, 190, 186]
const ticLand: Pose = plant([140, 150, 160, 40, 60, 0, 0, 0, 0, 150, 175], { foot: 10, farFoot: 10 }, 44)
const runPlant = wallPlant(170, 172)
const RUN = 175
const runBox: Prop = { t: 'box', x: faceX(runPlant), w: 50, h: RUN }
/** Second wall step: the far foot drives higher up the face, arms reach for the top. */
const runStep: Pose = reach([172, 175, 178, 175, 178, 20, 0, 70, 95, 175, 185], { farFoot: [faceX(runPlant) - 6, 8] })
/** Hands hooked on the top of the run wall at this lift. */
const grabTop = (p: Pose, lift: number): Pose => {
  const dy = place({ keys: [p] }, p, { lift }).hip.y
  const top: P2 = [faceX(runPlant) + 4, -RUN - dy]
  return reach(p, { hand: top, farHand: top })
}

const flipPlant: Pose = [195, 160, 160, 160, 160, 55, 95, 0, 0, 205, 215]

const vaultBeats: Beat[] = [{ dur: 0.6, ease: 'out' }, { dur: 0.55, ease: 'in' }, { hold: 0.3, dur: 0.9 }]
const reset: Beat = { hold: 0.5, dur: 0.01 }

export const MOVES: Record<string, Move> = {
  drop_land: {
    keys: [stand, stepOff, fall, touch, soak, rise], mode: 'cycle', props: [dropBox], ms: 600,
    beats: [{ lift: DROP, hold: 0.4, dur: 0.6 }, { lift: DROP, dur: 0.5, ease: 'in' }, { lift: 22, dur: 0.25, ease: 'in' }, { dur: 0.5, ease: 'out' }, { hold: 0.5, dur: 1.2 }, reset],
  },
  broad_jump: {
    keys: [stand, load, takeoff, apex, reachLand, land(30)], mode: 'cycle', ms: 600, flow: 0.15,
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.12, dur: 0.45, ease: 'snap' }, ...flight(55), { lift: 18, dur: 0.25, ease: 'in' }, { hold: 0.2, dur: 1.1, ease: 'out' }],
  },
  precision: {
    keys: [stand, load, takeoff, apex, reachLand, land(10, 50)], mode: 'cycle', ms: 600, flow: 0.15,
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.12, dur: 0.45, ease: 'snap' }, ...flight(45), { lift: 14, dur: 0.25, ease: 'in' }, { hold: 0.8, dur: 1.1, ease: 'out' }],
  },
  safety_vault: { keys: safety, mode: 'cycle', ...onBox, ms: 550, flow: 0.15, beats: vaultBeats },
  tuck_jump: {
    keys: [stand, load, jumpUp, tuck, jumpUp, land(16, 44)], mode: 'cycle', ms: 500, flow: 0.15,
    beats: [{ hold: 0.2, dur: 0.8 }, { hold: 0.08, dur: 0.4, ease: 'snap' }, { dur: 0.5, ease: 'out' }, { lift: 62, dur: 0.4, ease: 'lin' }, { lift: 30, dur: 0.35, ease: 'in' }, { hold: 0.2, dur: 1, ease: 'out' }],
  },
  lazy_vault: { keys: lazy, mode: 'cycle', ...onBox, ms: 550, flow: 0.15, beats: vaultBeats },
  cat_leap: { keys: [catchReach, catchHold], mode: 'cycle', ...onWall, ms: 700, flow: 0.15, beats: [{ hold: 0.2, dur: 0.4, ease: 'in' }, { hold: 0.8, dur: 1 }] },
  box_jump: {
    keys: [stand, load, takeoff, tuck, boxLand, boxStand, stepDown], mode: 'cycle', props: [jumpBox], ms: 600, flow: 0.12,
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.12, dur: 0.45, ease: 'snap' }, ...flight(85, 0.45), { lift: BOX, hold: 0.1, dur: 1, ease: 'out' }, { lift: BOX, hold: 0.4, dur: 0.9 }, { dur: 0.9 }],
  },
  speed_vault: { keys: speed, mode: 'cycle', ...onBox, ms: 480, flow: 0.15, beats: vaultBeats },
  climb_up: { keys: [hang, pull, press], ...onWall, ms: 800, beats: [{ hold: 0.5, dur: 0.6, ease: 'snap' }, { dur: 0.8, ease: 'out' }, { hold: 0.6 }] },
  depth_jump: {
    keys: [stand, stepOff, fall, touch, dip, rebound, rebound, soak, rise], mode: 'cycle', props: [dropBox], ms: 600, flow: 0.12,
    beats: [
      { lift: DROP, hold: 0.4, dur: 0.6 }, { lift: DROP, dur: 0.5, ease: 'in' }, { lift: 22, dur: 0.25, ease: 'in' }, { dur: 0.2, ease: 'out' },
      { dur: 0.35, ease: 'snap' }, { dur: 0.5, ease: 'out' }, { lift: 55, dur: 0.5, ease: 'in' }, { hold: 0.3, dur: 1.1 }, reset,
    ],
  },
  kong: { keys: kong, mode: 'cycle', ...onBox, ms: 500, flow: 0.15, beats: vaultBeats },
  tic_tac: {
    keys: [stride(1), ticPlant, ticPush, ticFly, ticLand], mode: 'cycle', props: [{ t: 'wall', x: faceX(ticPlant) }], ms: 550, flow: 0.15,
    beats: [{ dur: 0.7, ease: 'lin' }, { lift: 15, dur: 0.3, ease: 'snap' }, { lift: 40, dur: 0.45, ease: 'out' }, { lift: 50, dur: 0.5, ease: 'in' }, { hold: 0.25, dur: 1 }],
  },
  bounding: {
    keys: [stride(1, 95), stride(1, 100), stride(-1, 95), stride(-1, 100)], mode: 'cycle', ms: 330, flow: 0.15,
    beats: [{ dur: 0.9, ease: 'out' }, { lift: 30, dur: 0.9, ease: 'in' }, { dur: 0.9, ease: 'out' }, { lift: 30, dur: 0.9, ease: 'in' }],
  },
  dash_vault: { keys: dash, mode: 'cycle', ...onBox, ms: 500, flow: 0.15, beats: vaultBeats },
  wall_run: {
    keys: [stride(1), runPlant, grabTop(runStep, 40)], mode: 'cycle', props: [runBox], ms: 550, flow: 0.12,
    beats: [{ dur: 0.7, ease: 'lin' }, { lift: 12, dur: 0.45, ease: 'out' }, { lift: 40, hold: 0.5, dur: 1, ease: 'in' }],
  },
  running_precision: {
    keys: [stride(1), stride(-1), [160, 150, 150, 150, 150, 115, 10, -30, -40, 165, 170], apex, reachLand, land(10, 50)], mode: 'cycle', ms: 550, flow: 0.15,
    beats: [{ dur: 0.7, ease: 'lin' }, { dur: 0.6, ease: 'snap' }, ...flight(55), { lift: 14, dur: 0.25, ease: 'in' }, { hold: 0.7, dur: 1.1 }],
  },
  kong_pre: {
    keys: [...kong, vault(172, 175, [-40, 30], [0, 0, 0, 0], {}, { foot: 44, farFoot: 44 }, true, [90, 90])], mode: 'cycle', ...onBox, ms: 500, flow: 0.15,
    beats: [{ dur: 0.6, ease: 'out' }, { dur: 0.55, ease: 'in' }, { dur: 0.6, ease: 'in' }, { hold: 0.5, dur: 0.9 }],
  },
  wall_flip: {
    keys: [stride(1), flipPlant, ball(300), ball(420), rot(reachLand, 360), rot(land(16, 44), 360), rot(stand, 360)], mode: 'cycle', props: [{ t: 'wall', x: faceX(flipPlant) }], ms: 500, flow: 0.15,
    beats: [{ dur: 0.7, ease: 'lin' }, { dur: 0.4, ease: 'snap' }, { lift: 70, dur: 0.55, ease: 'lin' }, { lift: 60, dur: 0.45, ease: 'in' }, { lift: 14, dur: 0.25, ease: 'in' }, { hold: 0.2, dur: 1, ease: 'out' }, { hold: 0.2, dur: 0.9 }],
  },
}
