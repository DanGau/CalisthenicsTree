import type { Move, Pose, Prop } from '../../core/figure'
import { leg, pos, reach, rot } from './legs'
import { ball } from './tumble'

type P2 = [number, number]

const stand: Pose = [180, 8, 14, -8, -10, 0, 0, 0, 0]
const load: Pose = [145, -50, -30, -50, -30, ...leg(22, 46), ...leg(22, 46)]
const flight: Pose = [155, 160, 160, 160, 160, -15, -25, -35, -45]
const land = (fx = 16): Pose => [140, 90, 90, 90, 90, ...leg(fx, 30), ...leg(fx, 30)]
const tuck: Pose = [175, 100, 130, 100, 130, 125, 10, 125, 10]
const air: Pick<Move, 'y' | 'at'> = { y: 'hip', at: [0, -77] }

// Strides: near knee drives, far leg pushes long behind; arms swing opposite.
const stride = (s: 1 | -1, drive = 80): Pose => {
  const a: [number, number] = [drive, 0]
  const b: [number, number] = [-35, -40]
  return s === 1 ? [170, -40, 30, 60, 120, ...a, ...b] : [170, 60, 120, -40, 30, ...b, ...a]
}

// Vaults: the near hand is pinned to the box top; feet are placed relative to that hand.
const H = 50
const vbox: Prop = { t: 'box', x: 0, w: 60, h: H }
const onBox: Pick<Move, 'x' | 'y' | 'at' | 'props'> = { x: 'hand', y: 'hand', at: [20, -H], props: [vbox] }
/** Torso t, near hand at `hand` from the hip; feet at offsets from that hand (y down from the box top). */
const vault = (t: number, hand: P2, feet: { foot?: P2; farFoot?: P2 }, legs: [number, number, number, number] = [0, 0, 0, 0], farHand?: P2, farArm: [number, number] = [70, 80]): Pose => {
  const arms: Record<string, P2> = { hand }
  if (farHand) arms.farHand = farHand
  const p = reach([t, 0, 0, ...farArm, ...legs], arms)
  const h = pos(p, 'hand')
  const to: Record<string, P2> = {}
  if (feet.foot) to.foot = [h[0] + feet.foot[0], h[1] + feet.foot[1]]
  if (feet.farFoot) to.farFoot = [h[0] + feet.farFoot[0], h[1] + feet.farFoot[1]]
  return reach(p, to)
}

const safety = [
  vault(125, [32, 18], { foot: [-22, 0], farFoot: [-60, H - 9] }),
  vault(150, [20, 30], { foot: [-8, 0], farFoot: [30, -14] }),
  vault(165, [-10, 30], { foot: [30, -10], farFoot: [70, H - 9] }),
]
const kong = [
  vault(70, [62, 20], {}, [-100, -100, -100, -100], [62, 20]),
  vault(135, [26, 34], { foot: [12, -16], farFoot: [12, -16] }, undefined, [26, 34]),
  vault(170, [-28, 18], { foot: [52, H - 9], farFoot: [52, H - 9] }, undefined, [-28, 18]),
]
const dash = [
  vault(205, [-30, 22], {}, [80, 80, 80, 80], [-30, 22]),
  vault(195, [-38, 16], {}, [70, 70, 70, 70], [-38, 16]),
  vault(175, [-34, 18], { foot: [60, H - 9], farFoot: [60, H - 9] }, undefined, [-34, 18]),
]
const lazy = [
  vault(160, [30, 20], { foot: [-30, H - 9], farFoot: [-50, H - 9] }),
  vault(210, [-20, 22], {}, [75, 75, 85, 85]),
  vault(175, [-36, 18], { foot: [60, H - 9], farFoot: [48, H - 9] }),
]
const speed = [
  vault(140, [36, 20], { foot: [-40, H - 9] }, [0, 0, -60, -60]),
  vault(125, [26, 28], {}, [75, 75, 85, 85]),
  vault(170, [-30, 20], { foot: [64, H - 9] }, [0, 0, -40, -100]),
]

// Wall catch and climb: hands hook the top corner of a 150 wall.
const W = 150
const wall: Prop = { t: 'box', x: 30, w: 60, h: W }
const onWall: Pick<Move, 'x' | 'y' | 'at' | 'props'> = { x: 'hand', y: 'hand', at: [34, -W], props: [wall] }
const catchReach = reach([140, 0, 0, 0, 0, -10, -80, -10, -80], { hand: [80, -64], farHand: [80, -64] })
const catchHold = reach([168, 0, 0, 0, 0, 0, 0, 0, 0], { hand: [22, -92], farHand: [22, -92], foot: [18, -22], farFoot: [18, -22] })
const hang = reach([178, 0, 0, 0, 0, 0, 0, 0, 0], { hand: [10, -100], farHand: [10, -100], foot: [10, 44], farFoot: [10, 44] })
const pull = reach([165, 0, 0, 0, 0, 0, 0, 0, 0], { hand: [26, -48], farHand: [26, -48], foot: [22, 14], farFoot: [22, 14] }, { k: { hand: -1, farHand: -1 } })
const press = reach([120, 0, 0, 0, 0, 0, 0, -10, -10], { hand: [36, 10], farHand: [36, 10], foot: [28, 2] })

// Wall moves in floor view: a 50-high footplant on a wall face 38 ahead.
const plant = (t: number, arms: number): Pose => [t, arms, arms, arms, arms, ...leg(38, 26), 0, 0]

export const MOVES: Record<string, Move> = {
  drop_land: { keys: [[178, 150, 150, 150, 150, 0, 8, 0, 8], land()], x: 'foot', props: [{ t: 'box', x: -90, w: 50, h: 45 }] },
  broad_jump: { keys: [load, flight, land(30)], mode: 'cycle', ms: 650 },
  precision: { keys: [load, flight, land(8)], mode: 'cycle', ms: 650 },
  safety_vault: { keys: safety, mode: 'cycle', ...onBox, ms: 600 },
  tuck_jump: { keys: [stand, tuck], ...air, ms: 500 },
  lazy_vault: { keys: lazy, mode: 'cycle', ...onBox, ms: 600 },
  cat_leap: { keys: [catchReach, catchHold], mode: 'cycle', ...onWall, ms: 700 },
  box_jump: {
    keys: [[150, -50, -30, -50, -30, ...leg(4, 70), ...leg(4, 70)], [170, 120, 120, 120, 120, ...leg(18, 6), ...leg(18, 6)], [140, 90, 90, 90, 90, ...leg(30, 12), ...leg(30, 12)]],
    mode: 'cycle', y: 'hip', at: [0, -72], props: [{ t: 'box', x: 14, w: 60, h: 60 }], ms: 650,
  },
  speed_vault: { keys: speed, mode: 'cycle', ...onBox, ms: 500 },
  climb_up: { keys: [hang, pull, press], ...onWall, ms: 800 },
  depth_jump: { keys: [land(), [180, 175, 175, 175, 175, 0, 10, 0, 10]], x: 'foot', props: [{ t: 'box', x: -90, w: 50, h: 45 }], ms: 450 },
  kong: { keys: kong, mode: 'cycle', ...onBox, ms: 550 },
  tic_tac: { keys: [stride(1), plant(195, 150), [200, 170, 170, 170, 170, 20, -30, 10, -40]], mode: 'cycle', props: [{ t: 'wall', x: 40 }], ms: 550 },
  bounding: { keys: [stride(1, 95), stride(-1, 95)], ms: 450 },
  dash_vault: { keys: dash, mode: 'cycle', ...onBox, ms: 550 },
  wall_run: { keys: [stride(1), plant(170, 175)], mode: 'cycle', props: [{ t: 'box', x: 46, w: 50, h: 170 }], ms: 550 },
  running_precision: { keys: [stride(1), [160, 150, 150, 150, 150, 110, 10, 100, 0], land(10)], mode: 'cycle', ms: 600 },
  kong_pre: { keys: [...kong, vault(175, [-40, 30], { foot: [56, H - 9], farFoot: [56, H - 9] }, undefined, [-40, 30], [90, 90])], mode: 'cycle', ...onBox, ms: 550 },
  wall_flip: { keys: [stand, plant(195, 160), ball(300), ball(420), rot(stand, 360)], mode: 'cycle', ...air, props: [{ t: 'wall', x: 40 }], ms: 500 },
}
