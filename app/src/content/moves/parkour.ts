import { place, type Beat, type Joint, type Move, type Pose, type Prop } from '../../core/figure'
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

/** Where a key sits: a hip shift on the floor, a joint at an x on the floor, or a joint at a point (lifted to it). */
type Spot = number | { j: Joint; x: number } | { j: Joint; at: P2 }
const spot = (p: Pose, s: Spot): Beat => {
  if (typeof s === 'number') return { shift: s }
  const b = place({ keys: [p] }, p)[s.j]
  return 'x' in s ? { shift: s.x - b.x } : { lift: b.y - s.at[1], shift: s.at[0] - b.x }
}
type Key = [Pose, Spot, Beat?]
const keyed = (ks: Key[]): { keys: Pose[]; beats: Beat[] } => ({ keys: ks.map((k) => k[0]), beats: ks.map(([p, s, b]) => ({ ...b, ...spot(p, s) })) })

/** Arms swinging opposite the legs, feet h ahead and behind. */
const walk = (s: 1 | -1, h: number): Pose => plant([178, 8 - 22 * s, 14 - 14 * s, -8 + 22 * s, -10 + 14 * s, 0, 0, 0, 0, 178, 178], { foot: s * h, farFoot: -s * h }, 79)
/**
 * Stand over the feet at x `from`, turn round, walk back to x `to`. With `end`, finish standing turned round
 * at `to`, so the wrap to a standing first key turns back to face forward.
 */
const walkBack = (from: number, to: number, end = true): Key[] => {
  const n = Math.max(2, Math.round((from - to) / 44))
  const h = (from - to) / n / 2
  return [
    [stand, from, { hold: 0.2, dur: 0.7 }],
    [stand, from, { turn: 180, dur: 0.6 }],
    ...Array.from({ length: n - 1 }, (_, i): Key => [walk(i % 2 ? -1 : 1, h), from - 2 * h * (i + 1), { turn: 180, dur: 0.7, ease: 'lin' }]),
    ...(end ? [[stand, to, { turn: 180, dur: 0.7 }] as Key] : []),
  ]
}

// Drops: walk back to the box, step up facing it, turn round on top.
const stepOnto: Pose = plant(plant([160, 30, 40, -30, -20, 0, 0, 0, 0, 165, 172], { foot: 22 }, 98 - DROP), { farFoot: -16 }, 98)
const backOnBox = (from: number): Key[] => [...walkBack(from, 22, false), [stepOnto, 22, { turn: 180, dur: 1 }], [stand, 0, { lift: DROP, turn: 180, hold: 0.2, dur: 0.8 }]]
const offBox: Key[] = [
  [stand, 0, { lift: DROP, hold: 0.4, dur: 0.6 }], [stepOff, 4, { lift: DROP, dur: 0.5, ease: 'in' }],
  [fall, 18, { lift: 22, dur: 0.25, ease: 'in' }], [touch, 20, { dur: 0.5, ease: 'out' }],
]

// Vaults over a 50 box (x 0 to 60): the near hand plants on its near edge, the landing is beyond it.
// The loop vaults back the other way turned round, mirrored about the box centre.
const H = 50
const vbox: Prop = { t: 'box', x: 0, w: 60, h: H }
const EDGE: Spot = { j: 'hand', at: [20, -H] }
type Feet = { foot?: number; farFoot?: number }
/** Torso t (chest c), both hands (or only the near one) at `hand` from the hip, feet on the box (`top`) or floor (`low`). */
const vault = (t: number, c: number, hand: P2, legs: [number, number, number, number], top: Feet = {}, low: Feet = {}, both = false, farArm: P2 = [70, 80]): Pose => {
  let p = reach([t, 0, 0, ...farArm, ...legs, c, c + 5], both ? { hand, farHand: hand } : { hand })
  const [, hy] = pos(p, 'hand')
  if (Object.keys(top).length) p = plant(p, top, hy)
  if (Object.keys(low).length) p = plant(p, low, hy + H)
  return p
}
const overAndBack = (ks: Key[]): Pick<Move, 'keys' | 'beats' | 'mode' | 'props'> => {
  const { keys, beats } = keyed(ks)
  return { keys: [...keys, ...keys], beats: [...beats, ...beats.map((b) => ({ ...b, turn: 180, shift: 60 - (b.shift ?? 0) }))], mode: 'cycle', props: [vbox] }
}
/** Landing beyond the box: knees bent over the toes, chest forward, arms forward for balance. */
const vaultLand = (fx: number): Pose => plant([142, 100, 105, 100, 105, 0, 0, 0, 0, 150, 168], { foot: fx, farFoot: fx }, 46)

const safety = overAndBack([
  [vault(130, 140, [36, 28], [0, 0, 0, 0], { foot: 8 }, { farFoot: -40 }), EDGE, { dur: 0.6, ease: 'out' }],
  [vault(160, 165, [6, 40], [0, 0, 85, 10], { foot: 0 }), EDGE, { dur: 0.55, ease: 'in' }],
  [vaultLand(12), 92, { hold: 0.3, dur: 1 }],
])
const kongKeys: Key[] = [
  [vault(72, 70, [62, 18], [-108, -108, -108, -108], {}, {}, true), EDGE, { dur: 0.5, ease: 'out' }],
  [vault(120, 128, [30, 36], [100, 10, 100, 10], {}, {}, true), EDGE, { dur: 0.4, ease: 'snap' }],
  [[150, 60, 60, 60, 60, 95, 20, 95, 20, 152, 165], { j: 'foot', at: [62, -H - 14] }, { dur: 0.45, ease: 'in' }],
]
const kong = overAndBack([...kongKeys, [vaultLand(14), 96, { hold: 0.3, dur: 1 }]])
const kongPre = overAndBack([
  ...kongKeys.slice(0, 2), [kongKeys[2][0], { j: 'foot', at: [84, -H - 20] }, { dur: 0.6, ease: 'in' }],
  [reachLand, { j: 'foot', at: [118, -8] }, { dur: 0.2, ease: 'in' }], [land(10, 50), 120, { hold: 0.6, dur: 1 }],
])
const dash = overAndBack([
  [vault(205, 200, [-24, 26], [80, 80, 80, 80], {}, {}, true), EDGE, { dur: 0.6, ease: 'out' }],
  [vault(195, 190, [-40, 18], [65, 65, 65, 65], {}, {}, true), EDGE, { dur: 0.55, ease: 'in' }],
  [vaultLand(14), 96, { hold: 0.3, dur: 1 }],
])
const lazy = overAndBack([
  [vault(150, 155, [32, 24], [65, 55, 0, 0], {}, { farFoot: -36 }), EDGE, { dur: 0.6, ease: 'out' }],
  [vault(205, 200, [-14, 26], [86, 86, 84, 84]), EDGE, { dur: 0.55, ease: 'in' }],
  [vaultLand(12), 90, { hold: 0.3, dur: 1 }],
])
const speed = overAndBack([
  [vault(140, 145, [36, 22], [0, 0, 60, 50], {}, { foot: -30 }), EDGE, { dur: 0.6, ease: 'out' }],
  [vault(120, 130, [24, 30], [80, 80, 90, 90]), EDGE, { dur: 0.55, ease: 'in' }],
  [vaultLand(14), 94, { hold: 0.3, dur: 1 }],
])

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
/** Lowered down the face to the floor, about to let go. */
const release = onFace(174, [14, -64], 0, [8, -4, 8, -4])

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
const runHang: Pose = reach([176, 0, 0, 0, 0, 6, -2, 6, -2, 176, 182], { hand: [8, -94], farHand: [8, -94] })

const flipPlant: Pose = [195, 160, 160, 160, 160, 55, 95, 0, 0, 205, 215]

const broad = keyed([
  [stand, 0, { hold: 0.3, dur: 1 }], [load, 0, { hold: 0.12, dur: 0.45, ease: 'snap' }], [takeoff, { j: 'foot', x: 0 }, flight(0)[0]],
  [apex, 80, flight(55)[1]], [reachLand, 128, { lift: 18, dur: 0.25, ease: 'in' }], [land(30), 150, { hold: 0.2, dur: 1.1, ease: 'out' }], ...walkBack(180, 0),
])
const precision = keyed([
  [stand, 0, { hold: 0.3, dur: 1 }], [load, 0, { hold: 0.12, dur: 0.45, ease: 'snap' }], [takeoff, { j: 'foot', x: 0 }, flight(0)[0]],
  [apex, 58, flight(45)[1]], [reachLand, 92, { lift: 14, dur: 0.25, ease: 'in' }], [land(10, 50), 120, { hold: 0.8, dur: 1.1, ease: 'out' }], ...walkBack(130, 0),
])
const runPrecision = keyed([
  [stand, -60, { hold: 0.2, dur: 0.8 }], [stride(1), -20, { dur: 0.7, ease: 'lin' }], [stride(-1), 25, { dur: 0.6, ease: 'snap' }],
  [[160, 150, 150, 150, 150, 115, 10, -30, -40, 165, 170], 65, flight(0)[0]], [apex, 130, flight(55)[1]],
  [reachLand, 190, { lift: 14, dur: 0.25, ease: 'in' }], [land(10, 50), 215, { hold: 0.7, dur: 1.1 }], ...walkBack(225, -60),
])
const drop = keyed([...offBox, [soak, 20, { hold: 0.5, dur: 1.2 }], [rise, 20, { dur: 0.8 }], ...backOnBox(50)])
const depth = keyed([
  ...offBox.slice(0, 3), [touch, 20, { dur: 0.2, ease: 'out' }], [dip, 20, { dur: 0.35, ease: 'snap' }], [rebound, 20, { dur: 0.5, ease: 'out' }],
  [rebound, 22, { lift: 55, dur: 0.5, ease: 'in' }], [soak, 24, { hold: 0.3, dur: 1.1 }], [rise, 24, { dur: 0.8 }], ...backOnBox(54),
])
const catLeap = keyed([
  [stand, -100, { hold: 0.3, dur: 0.9 }], [load, -100, { hold: 0.1, dur: 0.45, ease: 'snap' }], [takeoff, { j: 'foot', x: -100 }, { dur: 0.6, ease: 'out' }],
  [catchReach, { j: 'hand', at: [26, -W - 12] }, { dur: 0.3, ease: 'in' }], [catchHold, { j: 'hand', at: [36, -W] }, { dur: 0.6, ease: 'out' }],
  [hang, { j: 'hand', at: [36, -W] }, { hold: 0.8, dur: 0.7 }], [release, { j: 'hand', at: [36, -W] }, { dur: 0.45, ease: 'in' }],
  [land(10, 44), 2, { hold: 0.2, dur: 0.9, ease: 'out' }], ...walkBack(12, -100),
])
const ticTac = keyed([
  [stand, -70, { hold: 0.2, dur: 0.6 }], [stride(1), -34, { dur: 0.6, ease: 'lin' }], [ticPlant, 0, { lift: 15, dur: 0.3, ease: 'snap' }],
  [ticPush, -8, { lift: 40, dur: 0.45, ease: 'out' }], [ticFly, -40, { lift: 50, dur: 0.5, ease: 'in' }], [ticLand, -70, { hold: 0.25, dur: 1 }],
])
const wallRun = keyed([
  [stand, -90, { hold: 0.2, dur: 0.7 }], [stride(1), -40, { dur: 0.7, ease: 'lin' }], [runPlant, 0, { lift: 12, dur: 0.45, ease: 'out' }],
  [grabTop(runStep, 40), 0, { lift: 40, hold: 0.5, dur: 0.7 }], [runHang, { j: 'hand', at: [faceX(runPlant) + 4, -RUN] }, { hold: 0.3, dur: 0.5, ease: 'in' }],
  [land(10, 44), -14, { hold: 0.2, dur: 0.9, ease: 'out' }], ...walkBack(-4, -90),
])
const wallFlip = keyed([
  [stand, -60, { hold: 0.2, dur: 0.7 }], [stride(1), -30, { dur: 0.7, ease: 'lin' }], [flipPlant, 0, { dur: 0.4, ease: 'snap' }],
  [ball(300), -14, { lift: 70, dur: 0.55, ease: 'lin' }], [ball(420), -34, { lift: 60, dur: 0.45, ease: 'in' }], [rot(reachLand, 360), -50, { lift: 14, dur: 0.25, ease: 'in' }],
  [rot(land(16, 44), 360), -60, { hold: 0.2, dur: 1, ease: 'out' }], [rot(stand, 360), -60, { hold: 0.2, dur: 0.9 }],
])

export const MOVES: Record<string, Move> = {
  drop_land: { ...drop, mode: 'cycle', props: [dropBox], ms: 600 },
  broad_jump: { ...broad, mode: 'cycle', ms: 600, flow: 0.15 },
  precision: { ...precision, mode: 'cycle', ms: 600, flow: 0.15 },
  safety_vault: { ...safety, ms: 550, flow: 0.15 },
  tuck_jump: {
    keys: [stand, load, jumpUp, tuck, jumpUp, land(16, 44)], mode: 'cycle', ms: 500, flow: 0.15,
    beats: [{ hold: 0.2, dur: 0.8 }, { hold: 0.08, dur: 0.4, ease: 'snap' }, { dur: 0.5, ease: 'out' }, { lift: 62, dur: 0.4, ease: 'lin' }, { lift: 30, dur: 0.35, ease: 'in' }, { hold: 0.2, dur: 1, ease: 'out' }],
  },
  lazy_vault: { ...lazy, ms: 550, flow: 0.15 },
  cat_leap: { ...catLeap, mode: 'cycle', props: [wall], ms: 550, flow: 0.12 },
  box_jump: {
    keys: [stand, load, takeoff, tuck, boxLand, boxStand, stepDown], mode: 'cycle', props: [jumpBox], ms: 600, flow: 0.12,
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.12, dur: 0.45, ease: 'snap' }, ...flight(85, 0.45), { lift: BOX, hold: 0.1, dur: 1, ease: 'out' }, { lift: BOX, hold: 0.4, dur: 0.9 }, { dur: 0.9 }],
  },
  speed_vault: { ...speed, ms: 480, flow: 0.15 },
  climb_up: { keys: [hang, pull, press], ...onWall, ms: 800, beats: [{ hold: 0.5, dur: 0.6, ease: 'snap' }, { dur: 0.8, ease: 'out' }, { hold: 0.6 }] },
  depth_jump: { ...depth, mode: 'cycle', props: [dropBox], ms: 600, flow: 0.12 },
  kong: { ...kong, ms: 500, flow: 0.15 },
  tic_tac: { ...ticTac, mode: 'cycle', props: [{ t: 'wall', x: faceX(ticPlant) }], ms: 550, flow: 0.15 },
  bounding: {
    keys: [stride(1, 95), stride(1, 100), stride(-1, 95), stride(-1, 100)], mode: 'cycle', ms: 330, flow: 0.15, travel: 200,
    beats: [{ dur: 0.9, ease: 'out' }, { lift: 30, shift: 50, dur: 0.9, ease: 'in' }, { shift: 100, dur: 0.9, ease: 'out' }, { lift: 30, shift: 150, dur: 0.9, ease: 'in' }],
  },
  dash_vault: { ...dash, ms: 500, flow: 0.15 },
  wall_run: { ...wallRun, mode: 'cycle', props: [runBox], ms: 550, flow: 0.12 },
  running_precision: { ...runPrecision, mode: 'cycle', ms: 550, flow: 0.15 },
  kong_pre: { ...kongPre, ms: 500, flow: 0.15 },
  wall_flip: { ...wallFlip, mode: 'cycle', props: [{ t: 'wall', x: faceX(flipPlant) }], ms: 500, flow: 0.15 },
}
