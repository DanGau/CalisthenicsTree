import { full, joints, LEN, place, type Beat, type Body, type Joint, type Move, type Pose, type Stage } from '../../core/figure'
import { plant, pos, reach, rot, tween } from './legs'

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

/** Wheels face the viewer (turn 90, travelling along x); the camera swings this far back so the body reads three-quarter front. */
export const FACE = -25
/**
 * Star (solid) rolled r degrees sideways from upright: arms spread a from the line of the body, legs spread l;
 * `tuck` keeps the near arm in at the side; `knee` bends the knees.
 */
export const star = (r: number, a = 20, l = 30, tuck = false, turn = 90, knee = 0): [Pose, Beat] =>
  [[180, 0, 0, 0, 0, knee, -knee, knee, -knee], { turn, roll: r, armOut: tuck ? 10 : 180 - a, farArmOut: 180 - a, legOut: l, farLegOut: l }]


const fwdRoll: Pose[] = [reachUp, crouch(118, 44), palms(ball(15), 8), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)]
const backRoll: Pose[] = [stand, squat(165, 100), ears(255), palms(ears(335), -6, 1), rot(crouch(120, 36, 160), 360), rot(stand, 360)]

const hs: Pose = [0, 0, 0, 0, 0, -180, -180, -180, -180, 0, 5]
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

// Timing below is in seconds: every move here uses ms 1000.

/**
 * Adds whole turns per channel so each limb turns less than about half a turn relative to the trunk between
 * consecutive keys (the torso itself turns less than half a turn).
 */
export const unwrap = (keys: Pose[]): Pose[] =>
  keys.reduce<Pose[]>((out, k) => {
    const p = out[out.length - 1]
    if (!p) return [k]
    const a = full(p)
    const q = full(k)
    const t = q[0] + 360 * Math.round((a[0] - q[0]) / 360)
    return [...out, q.map((v, i) => {
      if (i === 0) return t
      const want = a[i] + t - a[0]
      return Math.abs(v - want) <= 220 ? v : v + 360 * Math.round((want - v) / 360)
    }) as Pose]
  }, [])

/** Centre of mass height above the lowest body point (segment masses as fractions of the body). */
const up = (p: Pose, front = false, st?: Partial<Stage>) => {
  const b: Body = st ? place({ keys: [p], solid: true, view: FACE }, p, st) : joints(p, front)
  const mid = (a: { y: number }, c: { y: number }) => (a.y + c.y) / 2
  const com = 0.5 * mid(b.hip, b.shoulder) + 0.08 * b.head.y + 0.1 * (mid(b.hip, b.knee) + mid(b.hip, b.farKnee)) +
    0.05 * (mid(b.knee, b.foot) + mid(b.farKnee, b.farFoot)) + 0.03 * (mid(b.shoulder, b.elbow) + mid(b.shoulder, b.farElbow)) +
    0.02 * (mid(b.elbow, b.hand) + mid(b.farElbow, b.farHand))
  return Math.max(...Object.values(b).map((v) => v.y), b.head.y + LEN.head) - com
}

/**
 * Beats for a flight of T seconds through poses at fractions τ of it: lifts keep the centre of mass on the parabola
 * of apex gT²/8 above the line from lift `from` (at τ 0, CoM as in the first pose) to `to` (at τ 1). Key takeoff at
 * τ ≈ 0.12 and landing at ≈ 0.95, just off the floor, and leave eases to the spline: a key at lift 0 with speed
 * would make the spline dip into the floor.
 */
export const air = (ks: [Pose, number, Partial<Stage>?][], T: number, o: { front?: boolean; from?: number; to?: number } = {}): Beat[] => {
  const { front = false, from = 0, to = from } = o
  const h = (981 * T * T) / 8
  const h0 = up(ks[0][0], front, ks[0][2])
  return ks.map(([p, f, st], i) => ({ ...st, lift: Math.max(0, from + (to - from) * f + h0 + 4 * h * f * (1 - f) - up(p, front, st)), dur: ((ks[i + 1]?.[1] ?? 1) - f) * T }))
}

const SPREAD: [number, number][] = [[20, 12], [57, 40], [18, 48], [57, 40], [20, 12]]
/**
 * A wheel (front view) from upright through one turn: star keys every `step` degrees, spreads blended between the
 * quarter turns, pivots per quarter. `time` s for the turn, held `rest` s upright at each end.
 */
export const wheel = (o: { spread?: [number, number][]; pivots?: Joint[]; time: number; rest?: number; step?: number; tuck?: boolean; knee?: number }): Pick<Move, 'keys' | 'beats' | 'travel' | 'mode' | 'solid' | 'view'> => {
  const { spread = SPREAD, pivots = ['foot', 'farHand', 'hand', 'farFoot'], time, rest = 0.4, step = 15, tuck, knee = 0 } = o
  const n = 360 / step
  const ks: [Pose, Beat][] = []
  const by: (Joint | number)[] = []
  for (let i = 0; i <= n; i++) {
    const q = Math.min(3, Math.floor((i * 4) / n))
    const f = (i * 4) / n - q
    const [a, l] = [0, 1].map((j) => spread[q][j] + (spread[q + 1][j] - spread[q][j]) * f)
    ks.push(star(i * step, a, l, tuck, 90, knee))
    by.push(i < n ? pivots[q] : 0)
  }
  const beats = ks.map(([, st], i): Beat => ({ ...st, ...(i === 0 ? { hold: rest, dur: time / n } : i < n ? { dur: time / n } : { hold: rest, dur: 0.01 }) }))
  return travelled({ keys: ks.map((k) => k[0]), beats, mode: 'cycle', solid: true, view: FACE, ms: 1000 }, by)
}

/** Adds travel: each transition keeps the named joint still on the floor; a number moves that far (rolling, flight). */
export const travelled = (m: Move, by: (Joint | number)[]): Move => {
  const n = m.keys.length
  // World x: without the camera's view and tilt.
  const x = (i: number, j: Joint) => place({ ...m, view: 0, tilt: 0 }, m.keys[i % n], { ...m.beats?.[i % n], shift: 0 })[j].x
  let s = 0
  const beats = by.map((b, i): Beat => {
    const shift = s
    s += typeof b === 'number' ? b : x(i, b) - x(i + 1, b)
    return { ...m.beats?.[i], shift }
  })
  return { ...m, beats, travel: s }
}

type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
/**
 * Like `travelled`, after splitting the transitions out of the keys listed in `mids` with a planted in-between key
 * (the feet, or the limbs given with the index), so contacts hold while the body moves over them.
 */
export const planted = (m: Move, by: (Joint | number)[], mids: (number | [number, Limb[]])[]): Move => {
  const at = new Map(mids.map((v) => (typeof v === 'number' ? [v, ['foot', 'farFoot'] as Limb[]] : v)))
  const keys: Pose[] = []
  const beats: Beat[] = []
  const b2: (Joint | number)[] = []
  m.keys.forEach((k, i) => {
    const b = m.beats?.[i] ?? {}
    const limbs = at.get(i)
    if (!limbs) return void (keys.push(k), beats.push(b), b2.push(by[i]))
    const d = (b.dur ?? 1) / 2
    const half = typeof by[i] === 'number' ? (by[i] as number) / 2 : by[i]
    keys.push(k, tween(k, m.keys[i + 1], 0.5, limbs, { front: m.front }))
    beats.push({ ...b, dur: d, ease: b.ease === 'in' || b.ease === 'snap' ? b.ease : 'io' }, { dur: d, ease: b.ease === 'out' ? 'out' : 'io' })
    b2.push(half, half)
  })
  return travelled({ ...m, keys, beats }, b2)
}

/** A roll: keys unwrapped, timed in seconds, ms 1000. */
const rolled = (keys: Pose[], durs: number[], by: (Joint | number)[], mids: (number | [number, Limb[]])[] = []): Move =>
  planted({
    keys: unwrap(keys), mode: 'cycle', ms: 1000, flow: 0.05,
    beats: durs.map((dur, i): Beat => (i === 0 ? { hold: 0.5, dur } : i === durs.length - 1 ? { hold: 0.4, dur: 0.01 } : { dur, ease: i === durs.length - 2 ? 'out' : 'io' })),
  }, by, [0, durs.length - 2, ...mids])

// Dive: leave the floor leaning forward, the body long and near level at the top, hands reaching for the floor.
const launch: Pose = [150, 140, 150, 140, 150, -30, -30, -30, -30, 150, 150]
const dive: Pose = [85, 85, 90, 85, 90, -95, -95, -95, -95, 85, 80]
/** Landing contact out of a flip, turned r: knees just bending, arms forward. */
const contact = (r: number): Pose => rot(plant([162, 110, 115, 110, 115, 0, 0, 0, 0, 165, 170], { foot: 12, farFoot: 12 }, 72), r)

/** A standing salto: dip with the arms back, drive, flight of T s through the air poses, land, absorb, stand. */
const salto = (sign: 1 | -1, airPoses: [Pose, number][], T: number, drift: number): Move => {
  const r = 360 * sign
  const keys = unwrap([reachUp, load, takeoff, ...airPoses.map((a) => a[0]), contact(r), absorb(r), rot(reachUp, r)])
  const fly = air([[keys[2], 0.12], ...airPoses.map(([, f], i): [Pose, number] => [keys[3 + i], f]), [keys[3 + airPoses.length], 0.95]], T)
  return planted({
    keys, mode: 'cycle', ms: 1000, flow: 0.05,
    beats: [{ hold: 0.5, dur: 0.45 }, { dur: 0.25 }, ...fly.slice(0, -1), { ...fly[fly.length - 1], dur: 0.3 }, { hold: 0.1, dur: 0.6 }, { hold: 0.4, dur: 0.01 }],
  }, ['foot', 'foot', ...fly.slice(0, -1).map((b) => (drift * (b.dur ?? 0)) / T), 'foot', 'foot', 0], [0, keys.length - 2])
}

const rollBy: (Joint | number)[] = ['foot', 'hand', 40, 35, 30, 'foot', 0]
const fwdDurs = [0.55, 0.25, 0.25, 0.25, 0.3, 0.45, 0]

const bfAir = air([[bfTake, 0.12], [bfAir1, 0.4], [bfAir2, 0.75], [bfLand, 0.95]], 0.5)
const kipAir = air([[kick, 0.12], [kipFly, 0.5], [kipLand, 0.95]], 0.5)

export const MOVES: Record<string, Move> = {
  fwd_roll: rolled(fwdRoll, fwdDurs, rollBy),
  back_roll: rolled(backRoll, [0.5, 0.3, 0.3, 0.3, 0.45, 0], ['foot', -30, -35, -30, 'foot', 0]),
  shoulder_roll: rolled([reachUp, crouch(118, 44), shoulderBall(15), shoulderBall(-90), shoulderBall(-170), squat(-205, -270), rot(reachUp, -360)], fwdDurs, rollBy),
  cartwheel: wheel({ time: 1.2 }),
  back_ext_roll: (() => {
    const keys = unwrap([stand, squat(165, 100), ears(255), palms(ears(335), -6, 1), handsBack, snap, contact(360), absorb(360), rot(stand, 360)])
    const fly = air([[keys[5], 0.12], [keys[6], 0.95]], 0.25)
    return planted({
      keys, mode: 'cycle', ms: 1000, flow: 0.05,
      beats: [{ hold: 0.5, dur: 0.5 }, { dur: 0.3 }, { dur: 0.3 }, { dur: 0.25 }, { hold: 0.1, dur: 0.2 }, fly[0], { ...fly[1], dur: 0.25 }, { hold: 0.1, dur: 0.6 }, { hold: 0.4, dur: 0.01 }],
    }, ['foot', -30, -35, 'hand', -20, -12, 'foot', 'foot', 0], [0, 7])
  })(),
  dive_roll: (() => {
    const fly = air([[launch, 0.12], [dive, 0.5], [palms(ball(15), 8), 0.95]], 0.5)
    return travelled({
      keys: unwrap([reachUp, load, launch, dive, palms(ball(15), 8), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)]), mode: 'cycle', ms: 1000, flow: 0.05,
      beats: [{ hold: 0.5, dur: 0.45 }, { dur: 0.25 }, fly[0], fly[1], { ...fly[2], dur: 0.25 }, { dur: 0.25 }, { dur: 0.3 }, { dur: 0.45, ease: 'out' }, { hold: 0.4, dur: 0.01 }],
    }, ['foot', 'foot', 55, 55, 40, 35, 30, 'foot', 0])
  })(),
  roundoff: (() => {
    // Enters side-on running right, turns to face the viewer on the hands, snaps down facing back the way it came.
    const ks = [star(0, 20, 12, false, 0), star(90, 57, 40, false, 90), star(135, 38, 25, false, 90), star(180, 18, 10, false, 90), star(210, 22, 5, false, 92), star(240, 25, 0, false, 95), star(300, 22, 0, false, 165), star(360, 20, 0, false, 180)]
    const fly = air([[ks[5][0], 0.12, ks[5][1]], [ks[6][0], 0.5, ks[6][1]]], 0.3)
    return travelled({
      keys: ks.map((k) => k[0]), mode: 'cycle', solid: true, ms: 1000,
      beats: [{ ...ks[0][1], hold: 0.5, dur: 0.4 }, { ...ks[1][1], dur: 0.1 }, { ...ks[2][1], dur: 0.1 }, { ...ks[3][1], dur: 0.08 }, { ...ks[4][1], dur: 0.07, ease: 'in' }, ...fly, { ...ks[7][1], hold: 0.4, dur: 0.5 }],
    }, ['foot', 'farHand', 'farHand', 'hand', 'hand', 10, 10, 0])
  })(),
  kip_up: {
    keys: [lie, rockBack, kick, kipFly, kipLand, squat(160), stand, squat(165), sitDown], mode: 'cycle', ms: 1000, flow: 0.05,
    beats: [{ hold: 0.4, dur: 0.6 }, { hold: 0.1, dur: 0.2, ease: 'snap' }, ...kipAir.slice(0, 2), { ...kipAir[2], dur: 0.3 }, { dur: 0.55, ease: 'out' }, { hold: 0.5, dur: 0.55 }, { dur: 0.5, ease: 'in' }, { dur: 0.55, ease: 'out' }],
  },
  one_hand_cart: wheel({ time: 1.3, tuck: true, pivots: ['foot', 'farHand', 'farHand', 'farFoot'] }),
  hs_roll: rolled([reachUp, lungeDown, hs, hsBend, palms(ball(-40), 4, 1), ball(-90), ball(-170), squat(-205, -270), rot(reachUp, -360)], [0.6, 0.7, 0.6, 0.35, 0.3, 0.3, 0.3, 0.45, 0],
    ['foot', 'hand', 'hand', 'hand', 35, 30, 30, 'foot', 0], [[1, ['hand', 'farHand']], [2, ['hand', 'farHand']]]),
  front_walkover: planted({ keys: unwrap([reachUp, lungeDown, splitFwd, bridgeFwd, rot(reachUp, -360)]), mode: 'cycle', ms: 1000, beats: [{ hold: 0.5, dur: 0.6 }, { dur: 0.8 }, { dur: 0.9 }, { hold: 0.2, dur: 0.9 }, { hold: 0.4, dur: 0.01 }] }, ['foot', 'hand', 'hand', 'foot', 0], [[1, ['hand', 'farHand']], [2, ['hand', 'farHand']], [3, ['foot']]]),
  back_walkover: planted({ keys: unwrap([reachUp, leanBack, bridgeBack, splitBack, rot(reachUp, 360)]), mode: 'cycle', ms: 1000, beats: [{ hold: 0.5, dur: 1 }, { dur: 0.7 }, { hold: 0.2, dur: 0.8 }, { dur: 0.8 }, { hold: 0.4, dur: 0.01 }] }, ['foot', 'foot', 'hand', 'foot', 0], [0, 1, [2, ['hand', 'farHand']]]),
  aerial: (() => {
    const ks = [star(0, 160, 4), star(10, 170, 14), star(90, 150, 50), star(180, 150, 50), star(270, 150, 45), star(360, 160, 8), star(360, 160, 4)]
    const fly = air(([1, 2, 3, 4, 5] as const).map((i, j): [Pose, number, Beat] => [ks[i][0], [0.12, 0.3, 0.52, 0.74, 0.95][j], ks[i][1]]), 0.5)
    return travelled({ keys: ks.map((k) => k[0]), mode: 'cycle', solid: true, view: FACE, ms: 1000, flow: 0.05, beats: [{ ...ks[0][1], hold: 0.5, dur: 0.35 }, ...fly.slice(0, -1), { ...fly[4], dur: 0.35 }, { ...ks[6][1], hold: 0.4, dur: 0.01 }] }, ['foot', 30, 40, 40, 30, 'farFoot', 0])
  })(),
  front_handspring: (() => {
    const keys = unwrap([reachUp, lunge, reachDown, hurdle, hs, flyFwd, landArch, archAbsorb, rot(reachUp, -360)])
    const fly = air([[keys[4], 0.12], [keys[5], 0.5], [keys[6], 0.95]], 0.45)
    return travelled({
      keys, mode: 'cycle', ms: 1000, flow: 0.05,
      beats: [{ hold: 0.5, dur: 0.35 }, { dur: 0.25 }, { dur: 0.25 }, { dur: 0.2 }, fly[0], fly[1], { ...fly[2], dur: 0.3 }, { dur: 0.6, ease: 'out' }, { hold: 0.4, dur: 0.01 }],
    }, [30, 'foot', 'foot', 'hand', 50, 40, 'foot', 'foot', 0])
  })(),
  back_handspring: (() => {
    const keys = unwrap([reachUp, sit, throwBack, flyBack, handsBack, snap, contact(360), absorb(360), rot(reachUp, 360)])
    const fly = air([[keys[2], 0.12], [keys[3], 0.5]], 0.3)
    const fly2 = air([[keys[5], 0.12], [keys[6], 0.95]], 0.25)
    return planted({
      keys, mode: 'cycle', ms: 1000, flow: 0.05,
      beats: [{ hold: 0.5, dur: 0.35 }, { dur: 0.2 }, ...fly, { dur: 0.2 }, fly2[0], { ...fly2[1], dur: 0.25 }, { hold: 0.1, dur: 0.6 }, { hold: 0.4, dur: 0.01 }],
    }, ['foot', 'foot', -40, -40, 'hand', -24, -6, 'foot', 0], [0, 7])
  })(),
  butterfly_kick: {
    keys: [bfRise, bfWind, bfTake, bfAir1, bfAir2, bfLand], mode: 'cycle', ms: 1000, flow: 0.05,
    beats: [{ hold: 0.4, dur: 0.5 }, { dur: 0.3 }, ...bfAir.slice(0, 3), { ...bfAir[3], dur: 0.6, ease: 'out' }],
  },
  back_tuck: salto(1, [[ball(240), 0.35], [ball(350), 0.55], [ball(450), 0.75], [opening(330), 0.88]], 0.65, -20),
  front_tuck: salto(-1, [[ball(120), 0.35], [ball(10), 0.55], [ball(-90), 0.75], [opening(-330), 0.88]], 0.65, 20),
}
