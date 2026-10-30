import { place, type Beat, type Joint, type Move, type Pose, type Prop } from '../../core/figure'
import { leg, plant, pos, reach, rot, tween } from './legs'
import { air, ball, unwrap } from './tumble'

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
const boxStand: Pose = plant([162, 40, 60, 40, 60, 0, 0, 0, 0, 166, 172], { foot: 12, farFoot: 12 }, 70)
const stepDown: Pose = plant(plant([168, 20, 40, -10, 0, 0, 0, 0, 0, 170, 175], { farFoot: 34 }, 44), { foot: -14 }, 44 + BOX)

/** Feet touching down out of a vertical jump: legs long under the hips, knees just soft. */
const touchDown: Pose = [174, 110, 115, 110, 115, 10, 2, 10, 2, 176, 176]
const FEET: ('foot' | 'farFoot')[] = ['foot', 'farFoot']

// Timing below is in seconds: every move here uses ms 1000.

/** Where a key sits: a hip shift on the floor, a joint at an x on the floor, or a joint at a point (lifted to it). */
type Spot = number | { j: Joint; x: number } | { j: Joint; at: P2 }
const spot = (p: Pose, s: Spot, turn = 0): Beat => {
  if (typeof s === 'number') return { shift: s }
  const b = place({ keys: [p], solid: true }, p, { turn })[s.j]
  return 'x' in s ? { shift: s.x - b.x } : { lift: b.y - s.at[1], shift: s.at[0] - b.x }
}
type Key = [Pose, Spot, Beat?]
const keyed = (ks: Key[]): { keys: Pose[]; beats: Beat[] } => ({ keys: ks.map((k) => k[0]), beats: ks.map(([p, s, b]) => ({ ...b, ...spot(p, s, b?.turn) })) })

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
    [stand, from, { hold: 0.2, dur: 0.5 }],
    [stand, from, { turn: 180, dur: 0.5 }],
    ...Array.from({ length: n - 1 }, (_, i): Key => [walk(i % 2 ? -1 : 1, h), from - 2 * h * (i + 1), { turn: 180, dur: 0.55 }]),
    ...(end ? [[stand, to, { turn: 180, dur: 0.55 }] as Key] : []),
  ]
}

// Drops: walk back to the box, step up facing it, turn round on top.
const stepOnto: Pose = plant(plant([160, 30, 40, -30, -20, 0, 0, 0, 0, 165, 172], { foot: 22 }, 98 - DROP), { farFoot: -16 }, 98)
const backOnBox = (from: number): Key[] => [...walkBack(from, 22, false), [stepOnto, 22, { turn: 180, dur: 0.8 }], [stand, 0, { lift: DROP, turn: 180, hold: 0.2, dur: 0.7 }]]

/**
 * Flight keys: poses at fractions τ of a T s flight, the hip moving steadily from x0 to x1, the centre of mass on
 * the parabola from lift `from` to `to` (see `air`). The last pose touches down; its beat takes `land`.
 */
const leap = (ks: [Pose, number][], T: number, x0: number, x1: number, land: Beat, o: { from?: number; to?: number } = {}): Key[] =>
  air(ks, T, o).map((b, i, all): Key => [ks[i][0], x0 + (x1 - x0) * ks[i][1], i === all.length - 1 ? { ...b, ...land } : b])
/** Step off the box edge and fall ≈0.3 s (free fall from 45) to touch down, then `land`. */
const offBox = (land: Beat): Key[] => [
  [stand, 0, { lift: DROP, hold: 0.4, dur: 0.35 }],
  ...leap([[stepOff, 0], [fall, 0.55], [touch, 0.95]], 0.3, 4, 22, land, { from: DROP, to: 0 }),
]
/** A planted in-between key rising from `low` at hip x to `top` at x + dx. */
const rising = (low: Pose, x: number, dx: number, top = stand): Key => [tween(low, top, 0.5, FEET), x + dx / 2, { dur: 0.3 }]

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

// Hands on the box ≈0.3 s, about 0.6 s over it, absorb, then turn and come back at it (≈0.75 s).
const safety = overAndBack([
  [vault(130, 140, [36, 28], [0, 0, 0, 0], { foot: 8 }, { farFoot: -40 }), EDGE, { dur: 0.3 }],
  [vault(160, 165, [6, 40], [0, 0, 85, 10], { foot: 0 }), EDGE, { dur: 0.3 }],
  [vaultLand(12), 92, { hold: 0.3, dur: 0.75 }],
])
// Kong: hands reach first and block ≈0.2 s, knees tuck through, ≈0.3 s of flight after.
const kongKeys: Key[] = [
  [vault(72, 70, [62, 18], [-108, -108, -108, -108], {}, {}, true), EDGE, { dur: 0.2 }],
  [vault(120, 128, [30, 36], [100, 10, 100, 10], {}, {}, true), EDGE, { dur: 0.15, air: true }],
  [[150, 60, 60, 60, 60, 95, 20, 95, 20, 152, 165], { j: 'foot', at: [62, -H - 14] }, { dur: 0.25, air: true }],
]
const kong = overAndBack([...kongKeys, [vaultLand(14), 96, { hold: 0.3, dur: 0.75 }]])
const kongPre = overAndBack([
  ...kongKeys.slice(0, 2), [kongKeys[2][0], { j: 'foot', at: [84, -H - 20] }, { dur: 0.25, air: true }],
  [reachLand, { j: 'foot', at: [118, -8] }, { dur: 0.12, air: true }], [land(10, 50), 120, { hold: 0.5, dur: 0.9 }],
])
const dash = overAndBack([
  [vault(205, 200, [-24, 26], [80, 80, 80, 80], {}, {}, true), EDGE, { dur: 0.3 }],
  [vault(195, 190, [-40, 18], [65, 65, 65, 65], {}, {}, true), EDGE, { dur: 0.3 }],
  [vaultLand(14), 96, { hold: 0.3, dur: 0.75 }],
])
const lazy = overAndBack([
  [vault(150, 155, [32, 24], [65, 55, 0, 0], {}, { farFoot: -36 }), EDGE, { dur: 0.3 }],
  [vault(205, 200, [-14, 26], [86, 86, 84, 84]), EDGE, { dur: 0.25 }],
  [vaultLand(12), 90, { hold: 0.3, dur: 0.75 }],
])
const speed = overAndBack([
  [vault(140, 145, [36, 22], [0, 0, 60, 50], {}, { foot: -30 }), EDGE, { dur: 0.25 }],
  [vault(120, 130, [24, 30], [80, 80, 90, 90]), EDGE, { dur: 0.25 }],
  [vaultLand(14), 94, { hold: 0.3, dur: 0.7 }],
])

// Wall catch and climb: hands hook the top of a 150 wall whose face is at x 30.
const W = 150
const wall: Prop = { t: 'box', x: 30, w: 60, h: W }
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

/** Crouched on the wall top, hands on its edge, about to lower back down the face. */
const edgeCrouch: Pose = plant([140, 0, 0, 0, 0, 0, 0, 0, 0, 130, 150], { hand: 30, farHand: 30, foot: 0, farFoot: 0 }, 40)
const GRIP: Spot = { j: 'hand', at: [36, -W] }
// Climb-up: explosive pull ≈0.35 s, press to straight arms ≈0.5 s, step up ≈0.6 s; then turn and lower back down.
const climb = keyed([
  [hang, GRIP, { hold: 0.6, dur: 0.35, ease: 'snap' }], [pull, GRIP, { dur: 0.5 }], [press, GRIP, { dur: 0.6 }],
  [stand, { j: 'foot', at: [60, -W - 5] }, { hold: 0.4, dur: 0.5 }], [stand, { j: 'foot', at: [60, -W - 5] }, { turn: 180, dur: 0.6 }],
  [edgeCrouch, { j: 'hand', at: [34, -W] }, { turn: 180, hold: 0.2, dur: 1 }],
])

const flipPlant: Pose = [195, 160, 160, 160, 160, 55, 95, 0, 0, 205, 215]

// Jumps: arms back and dip ≈0.45 s, drive ≈0.25 s, flight on a parabola, touch down, absorb ≈0.3 s, stand.
const runTake: Pose = [160, 150, 150, 150, 150, 115, 10, -30, -40, 165, 170]
const broad = keyed([
  [stand, 0, { hold: 0.4, dur: 0.45 }], [load, 0, { dur: 0.25 }],
  ...leap([[takeoff, 0.12], [apex, 0.5], [reachLand, 0.82], [touch, 0.95]], 0.55, 30, 150, { dur: 0.3 }),
  [land(30), 150, { hold: 0.15, dur: 0.35 }], rising(land(30), 150, 30), ...walkBack(180, 0),
])
const precision = keyed([
  [stand, 0, { hold: 0.4, dur: 0.45 }], [load, 0, { dur: 0.25 }],
  ...leap([[takeoff, 0.12], [apex, 0.5], [reachLand, 0.82], [touch, 0.95]], 0.5, 30, 100, { dur: 0.3 }),
  [land(10, 50), 120, { hold: 0.6, dur: 0.35 }], rising(land(10, 50), 120, 10), ...walkBack(130, 0),
])
const runPrecision = keyed([
  [stand, -60, { hold: 0.3, dur: 0.4 }], [stride(1), -20, { dur: 0.35 }], [stride(-1), 25, { dur: 0.3 }],
  ...leap([[runTake, 0.12], [apex, 0.5], [reachLand, 0.82], [touch, 0.95]], 0.55, 60, 195, { dur: 0.3 }),
  [land(10, 50), 215, { hold: 0.6, dur: 0.35 }], rising(land(10, 50), 215, 10), ...walkBack(225, -60),
])
const drop = keyed([...offBox({ dur: 0.3 }), [soak, 20, { hold: 0.4, dur: 0.35 }], rising(soak, 20, 0, rise), [rise, 20, { dur: 0.6 }], ...backOnBox(50)])
// Depth jump: ground contact ≈0.22 s, rebound straight up.
const depth = keyed([
  ...offBox({ dur: 0.1 }), [dip, 20, { dur: 0.12 }],
  ...leap([[rebound, 0.12], [rebound, 0.5], [touchDown, 0.95]], 0.5, 20, 24, { dur: 0.3 }),
  [soak, 24, { hold: 0.3, dur: 0.35 }], rising(soak, 24, 0, rise), [rise, 24, { dur: 0.6 }], ...backOnBox(54),
])
const catLeap = keyed([
  [stand, -100, { hold: 0.4, dur: 0.45 }], [load, -100, { dur: 0.25 }], [takeoff, { j: 'foot', x: -100 }, { dur: 0.35 }],
  [catchReach, { j: 'hand', at: [26, -W - 12] }, { dur: 0.15 }], [catchHold, { j: 'hand', at: [36, -W] }, { dur: 0.35 }],
  [hang, { j: 'hand', at: [36, -W] }, { hold: 0.8, dur: 0.4 }], [release, { j: 'hand', at: [36, -W] }, { dur: 0.3 }],
  [land(10, 44), 2, { hold: 0.2, dur: 0.6 }], ...walkBack(12, -100),
])
// Tic-tac: one quick wall step ≈0.2 s pushes up and away.
const ticTac = keyed([
  [stand, -70, { hold: 0.3, dur: 0.35 }], [stride(1), -34, { dur: 0.3 }], [ticPlant, 0, { lift: 15, dur: 0.18 }],
  [ticPush, -8, { lift: 40, dur: 0.25, air: true }], [ticFly, -40, { lift: 50, dur: 0.3, air: true }], [ticLand, -70, { hold: 0.3, dur: 0.6 }],
])
const wallRun = keyed([
  [stand, -90, { hold: 0.3, dur: 0.4 }], [stride(1), -40, { dur: 0.35 }], [runPlant, 0, { lift: 12, dur: 0.2 }],
  [grabTop(runStep, 40), 0, { lift: 40, hold: 0.5, dur: 0.4 }], [runHang, { j: 'hand', at: [faceX(runPlant) + 4, -RUN] }, { hold: 0.3, dur: 0.3 }],
  [land(10, 44), -14, { hold: 0.2, dur: 0.5 }], ...walkBack(-4, -90),
])
// Wall flip: run, plant high on the wall, push off into a back tuck of ≈0.7 s, land, absorb.
const flipKeys = unwrap([flipPlant, ball(300), ball(420), rot(reachLand, 360), rot(touchDown, 360)])
const flipLand = rot(land(16, 44), 360)
const wallFlip = keyed([
  [stand, -60, { hold: 0.3, dur: 0.35 }], [stride(1), -30, { dur: 0.2 }],
  ...leap([[flipKeys[0], 0], [flipKeys[1], 0.35], [flipKeys[2], 0.65], [flipKeys[3], 0.85], [flipKeys[4], 0.95]], 0.7, 0, -58, { dur: 0.3 }),
  [flipLand, -60, { hold: 0.15, dur: 0.35 }], rising(flipLand, -60, 0, rot(stand, 360)), [rot(stand, 360), -60, { hold: 0.3, dur: 0.6 }],
])
const tuckJump = keyed([
  [stand, 0, { hold: 0.4, dur: 0.45 }], [load, 0, { dur: 0.25 }],
  ...leap([[jumpUp, 0.12], [tuck, 0.5], [jumpUp, 0.85], [touchDown, 0.95]], 0.6, 0, -12, { dur: 0.3 }),
  [land(16, 44), -16, { hold: 0.15, dur: 0.35 }], rising(land(16, 44), -16, 16),
])
const boxJump = keyed([
  [stand, 0, { hold: 0.4, dur: 0.45 }], [load, 0, { dur: 0.25 }],
  ...leap([[takeoff, 0.12], [tuck, 0.6], [touchDown, 0.95]], 0.6, 10, 20, { dur: 0.3 }, { to: BOX }),
  [boxLand, 0, { lift: BOX, hold: 0.1, dur: 0.6 }], [boxStand, 22, { lift: BOX, hold: 0.4, dur: 0.6 }], [stepDown, 0, { dur: 0.6 }],
])

// All solid, so turning round to walk back is a real turn.
const SIDE: Record<string, Move> = {
  drop_land: { ...drop, mode: 'cycle', props: [dropBox], ms: 1000 },
  broad_jump: { ...broad, mode: 'cycle', ms: 1000, flow: 0.05 },
  precision: { ...precision, mode: 'cycle', ms: 1000, flow: 0.05 },
  safety_vault: { ...safety, ms: 1000, flow: 0.05 },
  tuck_jump: { ...tuckJump, mode: 'cycle', ms: 1000, flow: 0.05 },
  lazy_vault: { ...lazy, ms: 1000, flow: 0.05 },
  cat_leap: { ...catLeap, mode: 'cycle', props: [wall], ms: 1000, flow: 0.05 },
  box_jump: { ...boxJump, mode: 'cycle', props: [jumpBox], ms: 1000, flow: 0.05 },
  speed_vault: { ...speed, ms: 1000, flow: 0.05 },
  climb_up: { ...climb, mode: 'cycle', props: [wall], ms: 1000 },
  depth_jump: { ...depth, mode: 'cycle', props: [dropBox], ms: 1000, flow: 0.05 },
  kong: { ...kong, ms: 1000, flow: 0.05 },
  tic_tac: { ...ticTac, mode: 'cycle', props: [{ t: 'wall', x: faceX(ticPlant) }], ms: 1000, flow: 0.05 },
  bounding: {
    keys: [stride(1, 95), stride(1, 100), stride(-1, 95), stride(-1, 100)], mode: 'cycle', ms: 1000, flow: 0.05, travel: 200,
    beats: [{ dur: 0.3 }, { lift: 30, shift: 50, dur: 0.3 }, { shift: 100, dur: 0.3 }, { lift: 30, shift: 150, dur: 0.3 }],
  },
  dash_vault: { ...dash, ms: 1000, flow: 0.05 },
  wall_run: { ...wallRun, mode: 'cycle', props: [runBox], ms: 1000, flow: 0.05 },
  running_precision: { ...runPrecision, mode: 'cycle', ms: 1000, flow: 0.05 },
  kong_pre: { ...kongPre, ms: 1000, flow: 0.05 },
  wall_flip: { ...wallFlip, mode: 'cycle', props: [{ t: 'wall', x: faceX(flipPlant) }], ms: 1000, flow: 0.05 },
}
export const MOVES: Record<string, Move> = Object.fromEntries(Object.entries(SIDE).map(([k, m]) => [k, { ...m, solid: true }]))
