import { blend, joints, type Move, type Pose } from '../../core/figure'
import { breathe, H, INSTEP, put, rep, repPath, where } from './mobility'

type Legs = [number, number, number, number]
const LEGS0: Legs = [0, 0, 0, 0]

/**
 * Bridge with hands at world x 0 and feet at x `feet`: the spine shape (t pelvis, c chest, head)
 * and the shoulder's x set the hip; arms reach the floor straight, knees bend to the feet.
 */
function bridge(t: number, c: number, head: number, sx: number, feet = 66, far?: Legs): Pose {
  const p: Pose = [t, 0, 0, 0, 0, ...(far ?? LEGS0), c, head]
  const s = joints(p).shoulder
  const hip: [number, number] = [sx - s.x, H.hand + Math.sqrt(53.8 ** 2 - sx ** 2) + s.y]
  const to = far ? { foot: [feet, H.ankle] as [number, number] } : { foot: [feet, H.ankle] as [number, number], farFoot: [feet, H.ankle] as [number, number] }
  return put(p, hip, { ...to, hand: [0, H.hand], farHand: [0, H.hand] }, { hand: 1, farHand: 1 })
}
const full = bridge(-100, -55, -10, -4)
// Supine, hands planted by the ears (elbows up), heels by the seat at x 78.
const lying = put([-90, 0, 0, 0, 0, 0, 0, 0, 0, -90, -90], [61, H.lie], { hand: [0, H.hand], farHand: [0, H.hand], foot: [78, H.ankle], farFoot: [78, H.ankle] })

const armsUp: Pose = [-180, -180, -180, -180, -180, 0, 0, 0, 0]

// Reverse tabletop: hands at x 0 under the shoulders, shins vertical.
const tableSit = put([-150, 0, 0, 0, 0, 0, 0, 0, 0, -150, -160], [30, 10], { hand: [0, H.hand], farHand: [0, H.hand], foot: [82, H.ankle], farFoot: [82, H.ankle] })
const tableTop = put([-97, 0, 0, 0, 0, 0, 0, 0, 0, -97, -60], [45.6, 52], { hand: [0, H.hand], farHand: [0, H.hand], foot: [82, H.ankle], farFoot: [82, H.ankle] })
/** `s` from sitting (0) to the tabletop (1); hands and feet stay planted. */
const table = (s: number): Pose =>
  put(blend(tableSit, tableTop, s, 'lin'), [30 + 15.6 * s, 10 + 42 * s], { hand: [0, H.hand], farHand: [0, H.hand], foot: [82, H.ankle], farFoot: [82, H.ankle] })

// Elevated bridge: hands on a box top (30) at x -6, shoulders pushed over them.
const BOX = 30
const boxBridge = (t: number, c: number, head: number, hip: [number, number]): Pose =>
  put([t, 0, 0, 0, 0, 0, 0, 0, 0, c, head], hip, { hand: [-6, BOX + H.hand], farHand: [-6, BOX + H.hand], foot: [55, H.ankle], farFoot: [55, H.ankle] }, { hand: 1, farHand: 1 })

// Camel: knees down at x 0; hips drive forward, chest lifts, hands find the heels.
const camel = (thigh: number, t: number, c: number, head: number, hands: [number, number]): Pose => {
  const hip: [number, number] = [-Math.sin((thigh * Math.PI) / 180) * 38, H.knee + Math.cos((thigh * Math.PI) / 180) * 38]
  return put([t, 0, 0, 0, 0, thigh, INSTEP, thigh, INSTEP, c, head], hip, { hand: hands, farHand: hands }, { hand: 1, farHand: 1 })
}
// Palms on the heels of the pointed feet.
const HEEL = ((): [number, number] => {
  const [x, h] = where([180, 0, 0, 0, 0, 0, INSTEP, 0, INSTEP], [0, H.knee + 38], 'heel', false, true)
  return [x, h + H.hand]
})()

// Bench opener: knees at x 0, elbows fixed on the bench edge, hands behind the head; the chest sinks.
const BENCH = { x: 52, h: 46 }
const opener = (thigh: number, t: number, c: number, head: number): Pose => {
  const hip: [number, number] = [-Math.sin((thigh * Math.PI) / 180) * 38, H.knee + Math.cos((thigh * Math.PI) / 180) * 38]
  const p: Pose = [t, 0, -85, 0, -85, thigh, INSTEP, thigh, INSTEP, c, head]
  const [sx, sy] = where(p, hip, 'shoulder')
  const u = (Math.atan2(BENCH.x + 8 - sx, sy - BENCH.h - 5) * 180) / Math.PI
  p[1] = p[3] = u
  return p
}

// Wall walk-down: wall face at x 0, feet at x 72; hands walk down the wall to the floor.
const wallKey = (t: number, c: number, head: number, hip: [number, number], hand: number | null): Pose => {
  const p: Pose = [t, -150, -150, -150, -150, 0, 0, 0, 0, c, head]
  const to = { foot: [72, H.ankle] as [number, number], farFoot: [72, H.ankle] as [number, number] }
  return hand === null ? put(p, hip, to) : put(p, hip, { ...to, hand: [4, hand], farHand: [4, hand] }, { hand: 1, farHand: 1 })
}

// Kneeling drop-back: knees at x 0; hands land by the feet.
const kneelKey = (thigh: number, t: number, c: number, head: number, arms: number | [number, number]): Pose => {
  const hip: [number, number] = [-Math.sin((thigh * Math.PI) / 180) * 38, H.knee + Math.cos((thigh * Math.PI) / 180) * 38]
  const p: Pose = typeof arms === 'number' ? [t, arms, arms, arms, arms, thigh, INSTEP, thigh, INSTEP, c, head] : [t, -90, -90, -90, -90, thigh, INSTEP, thigh, INSTEP, c, head]
  return typeof arms === 'number' ? put(p, hip, {}) : put(p, hip, { hand: arms, farHand: arms }, { hand: 1, farHand: 1 })
}

// Standing to bridge and back, feet at x 66: hips push forward over the feet, arms reach back overhead.
const archFree = (t: number, c: number, head: number, arms: number, hip: [number, number]): Pose =>
  put([t, arms, arms, arms, arms, 0, 0, 0, 0, c, head], hip, { foot: [66, H.ankle], farFoot: [66, H.ankle] })

// High plank facing +x, hands at x 0 under the shoulders, on the toes.
const plank = put([116, 0, 0, 0, 0, -73, -73, -73, -73, 116, 122], [-25.5, 37], { hand: [0, H.hand], farHand: [0, H.hand] }, { hand: 1, farHand: 1 })
/** Spine a turn back, so the roll from the bridge (spine at -100) passes over the top. */
const over = (p: Pose): Pose => p.map((v, i) => (i === 0 || i === 9 || i === 10 ? (v ?? 0) - 360 : v)) as Pose

/** Far arm straight up off the floor. */
const farUp = (p: Pose): Pose => [p[0], p[1], p[2], -180, -180, ...p.slice(5)] as Pose

// Press to the top of the head first, elbows up, then drive through to straight arms.
const headTop = put([-110, 0, 0, 0, 0, 0, 0, 0, 0, -40, -5], [46, 39.8], { hand: [0, H.hand], farHand: [0, H.hand], foot: [78, H.ankle], farFoot: [78, H.ankle] }, { hand: -1, farHand: -1 })
const top = bridge(-100, -55, -10, 0, 78)
/** Between two hands-and-feet keys: hands stay at x 0, feet re-reach `feet`, so the contacts hold mid-move. */
const between = (a: Pose, b: Pose, t: number, feet: number): Pose => {
  const p = blend(a, b, t)
  const h = joints(p).hand
  return put(p, [-h.x, H.hand + h.y], { foot: [feet, H.ankle], farFoot: [feet, H.ankle] })
}

export const MOVES: Record<string, Move> = {
  // Lumbar then thoracic extension; hips stay down, neck long.
  cobra: {
    ...breathe([
      put([96, 0, 0, 0, 0, -92, -92, -92, -92, 112, 112], [0, H.lie], { hand: [38, H.hand], farHand: [38, H.hand] }),
      put([118, 0, 0, 0, 0, -92, -92, -92, -92, 160, 165], [0, H.lie], { hand: [38, H.hand], farHand: [38, H.hand] }),
    ]),
    x: 'hip', point: true,
  },
  table: { ...repPath(table, 0.9, 1.5, 0.3, 0.7), x: 'hand', ms: 1000 },
  bridge_box: {
    ...repPath((s) => boxBridge(-135 - 15 * s, -95, -60 + 20 * s, [24 - 4 * s, 50 + 12 * s]), 1, 1.6, 0.3, 0.9),
    x: 'hand', at: [-6, 0], props: [{ t: 'box', x: -40, w: 40, h: BOX }], ms: 1000,
  },
  camel: { ...breathe([camel(0, 180, 180, 180, [-10, 62]), camel(-28, 210, 275, 305, HEEL)], 900, camel(-26, 206, 266, 298, HEEL)), x: 'knee', point: true },
  wall_angels: { front: true, ms: 1000, ...rep([180, 90, 180, -90, -180, 0, 0, 0, 0, 180, 180, -3], [180, 155, 170, -155, -170, 0, 0, 0, 0, 180, 180, 4], 1.6, 1.6, 0.4, 0.4) },
  // Press to the head, then drive up with momentum; lower slowly back through the head.
  full_bridge: {
    keys: [lying, between(lying, headTop, 0.5, 78), headTop, between(headTop, top, 0.5, 78), top, between(headTop, top, 0.5, 78), headTop, between(lying, headTop, 0.5, 78)],
    mode: 'cycle', x: 'hand', ms: 900,
    beats: [
      { hold: 0.5, dur: 0.4, ease: 'in' }, { dur: 0.4, ease: 'out' }, { hold: 0.15, dur: 0.35, ease: 'in' }, { dur: 0.5, ease: 'out' },
      { hold: 1, dur: 0.8, ease: 'in' }, { dur: 0.8, ease: 'out' }, { hold: 0.2, dur: 0.6, ease: 'in' }, { dur: 0.6, ease: 'out' },
    ],
  },
  bench_opener: { ...breathe([opener(10, 98, 100, 90), opener(18, 96, 68, 55)]), x: 'knee', point: true, props: [{ t: 'box', x: BENCH.x, w: 40, h: BENCH.h }] },
  // Shift over the hands first, then the free leg points up.
  one_leg_bridge: {
    keys: [full, bridge(-100, -50, -10, -8, 66, [0, 0, 165, 165])], x: 'hand', ms: 1000,
    beats: [{ hold: 0.5, dur: 1.3, ease: 'io' }, { hold: 0.9 }],
  },
  // Walk the hands down the wall slowly; walk back up.
  bridge_walk: {
    keys: [
      wallKey(184, 196, 205, [76, 80], null),
      wallKey(205, 245, 260, [80, 74], 130),
      wallKey(225, 285, 310, [80, 68], 60),
      bridge(260, 305, 350, 8, 72),
    ],
    x: 'foot', at: [72, 0], props: [{ t: 'wall', x: -12 }], ms: 1000,
    beats: [{ hold: 0.5, dur: 1.5 }, { hold: 0.2, dur: 1.5 }, { hold: 0.2, dur: 1.3, ease: 'in' }, { hold: 0.8 }],
  },
  // Chest pushes through until the arms are vertical; legs straighten.
  straight_bridge: { ...breathe([full, bridge(-115, -25, 0, 0)]), x: 'hand' },
  // Lower slowly, then the last part is a fast drop onto the hands; drive back up.
  kneel_drop: {
    keys: [kneelKey(0, -180, -180, -180, -180), kneelKey(-22, -165, -120, -95, -120), kneelKey(-35, -150, -65, -20, [-36, H.hand]), kneelKey(-22, -165, -120, -95, -120)],
    mode: 'cycle', x: 'knee', ms: 900, point: true,
    beats: [{ hold: 0.5, dur: 1.8 }, { dur: 0.45 }, { hold: 0.5, dur: 0.6, ease: 'snap' }, { dur: 1.1, ease: 'out' }],
  },
  // Lean back slowly, then fall the last part onto the hands.
  stand_to_bridge: {
    keys: [armsUp, archFree(-168, -140, -120, -140, [74, 79]), full],
    x: 'foot', at: [66, 0], ms: 900,
    beats: [{ hold: 0.6, dur: 2 }, { dur: 0.6 }, { hold: 0.8 }],
  },
  // Rock the shoulders over the hands (anticipation), then drive the hips and stand with momentum.
  bridge_stand: {
    keys: [full, bridge(-106, -64, -24, 6), bridge(-112, -75, -40, 12), archFree(-160, -140, -140, -120, [72, 77]), armsUp],
    x: 'foot', at: [66, 0], ms: 900,
    beats: [{ hold: 0.6, dur: 0.6 }, { dur: 0.5 }, { dur: 0.7 }, { dur: 1 }, { hold: 0.6 }],
  },
  // Far hand reaches up and over as the hips turn; the body rolls round the near hand to face the floor in a plank, and back.
  bridge_rotation: {
    keys: [full, farUp(bridge(-112, -120, -130, -2)), over(farUp(plank)), over(plank)],
    x: 'hand', y: 'hand', at: [0, -H.hand], ms: 1000,
    beats: [{ hold: 0.5, dur: 1 }, { turn: 60, dur: 0.6, ease: 'lin' }, { turn: 120, dur: 1, ease: 'out' }, { turn: 180, hold: 0.8 }],
  },
  // Rock over the hands, kick through handstand and back down.
  tick_tock: {
    keys: [
      full,
      put([-50, 0, 0, 0, 0, 30, 10, 170, 170, -20, -5], [25, 95], { hand: [0, H.hand], farHand: [0, H.hand], foot: [66, H.ankle] }, { hand: 1, farHand: 1 }),
      [0, 0, 0, 0, 0, 180, 180, 180, 180, 0, 10],
    ],
    x: 'hand', y: 'hand', at: [0, -H.hand], ms: 900,
    beats: [{ hold: 0.4, dur: 1.1 }, { dur: 0.6, ease: 'snap' }, { hold: 0.5 }],
  },
}
