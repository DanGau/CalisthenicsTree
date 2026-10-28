import type { Move, Pose, Stage } from '../../core/figure'
import { H, KNEEL, ang, put, put3, repPath } from './mobility'

/**
 * Supine with the shoulders on the floor at world x 0 and the hip h up: the torso runs from the
 * hip to the shoulder, arms flat along the floor, feet reaching `feet`.
 */
const supine = (h: number, feet: [number, number] | null, far?: [number, number]): Pose => {
  const hx = Math.sqrt(46 ** 2 - (h - H.lie) ** 2)
  const t = ang(-hx, h - H.lie)
  const p: Pose = [t, 0, 0, 0, 0, 0, 0, far?.[0] ?? 0, far?.[1] ?? 0, t, -90]
  const legs = feet ? (far ? { foot: feet } : { foot: feet, farFoot: feet }) : {}
  return put(p, [hx, h], { ...legs, hand: [52, H.hand], farHand: [52, H.hand] }, { hand: 1, farHand: 1 })
}
// Top: shoulder, hip and knee in one line, shin vertical over the foot at x 77.
const FEET: [number, number] = [77, H.ankle]
const TOP_THIGH = ang(42.3, -15.3)
const supPin = { x: 'shoulder' as const, at: [0, 0] as [number, number] }

// Hip thrust: upper back on a bench at shoulder height 43; foot at x 84 under the knee at the top.
const thrust = (h: number): Pose => {
  const hx = Math.sqrt(46 ** 2 - (h - 43) ** 2)
  const t = ang(-hx, h - 43)
  return put([t, 0, 0, 0, 0, 0, 0, 135, 100, t, -130], [hx, h], { foot: [84, H.ankle], hand: [-40, 37], farHand: [-40, 37] }, { hand: 1, farHand: 1 })
}

// Single-leg RDL: stance foot at x 0, rear leg in line with the flat back.
const rdl = (t: number, c: number, head: number, far: [number, number], farArm: [number, number] = [0, 0], hip: [number, number] = [-14, 75]): Pose =>
  put([t, 0, 0, ...farArm, 0, 0, ...far, c, head], hip, { foot: [0, H.ankle] })
/**
 * Hinge path (motion-reference §8), `s` 0 standing to 1 at the bottom: the knee softens 15-20° in the
 * first third and then stays put; the hips travel back while the trunk tips and the rear leg rises with it.
 */
const hinge = (s: number): Pose => {
  const k = Math.min(1, s / 0.3)
  const k2 = k * (2 - k)
  const lean = 87 * s
  return rdl(180 - lean, 180 - lean, 180 - lean + 3 * s, [-8 - 79 * s, -8 - 79 * s], [0, 0], [-14 * Math.sin((s * Math.PI) / 2), 81 - 6 * k2])
}

/**
 * Airplane, `r` 0 (square T, facing the floor) to 1 (open): the pelvis and trunk roll about the stance leg, whose
 * foot stays planted; the far arm reaches for the ceiling, the near hand hangs to the floor, the rear knee bends.
 */
const AIR_CAM = 30
const plane = (r: number): [Pose, Partial<Stage>] => {
  const hip: [number, number] = [-14, 75]
  const p: Pose = [93, 25 * r, 110 * r, 0, 0, 0, 0, -87, -87 - 50 * r, 96, 100]
  const [q, st] = put3(p, { roll: -80 * r }, hip, { foot: [0, H.ankle, 10] })
  return [q, { ...st, armOut: 80 * r, farArmOut: 85 * r, farLegOut: -15 * r }]
}
const [air0, air1] = [plane(0), plane(1)]

// Nordic: knees at x 0, heels anchored; the body leans from the knee as one straight piece, hands crossed on the chest.
const lean = (d: number): Pose => {
  const T = 180 - d
  return [T, T - 172, T - 20, T - 172, T - 20, -d, KNEEL, -d, KNEEL, T, T]
}
const catchAt = (d: number): Pose => {
  const T = 180 - d
  const hip: [number, number] = [Math.sin((d * Math.PI) / 180) * 38, H.knee + Math.cos((d * Math.PI) / 180) * 38]
  const sx = hip[0] + Math.sin((T * Math.PI) / 180) * 46
  return put([T, -90, 0, -90, 0, -d, KNEEL, -d, KNEEL, T, T - 10], hip, { hand: [sx + 4, H.hand], farHand: [sx + 4, H.hand] })
}
const nordicPin = { x: 'knee' as const, at: [0, 0] as [number, number] }
/** Lower to `d` at a steady speed (keys every third), pause, curl back up. */
const nordic = (d: number, down: number, up: number): Move => ({
  keys: [lean(0), lean(d / 3), lean((2 * d) / 3), lean(d)], ...nordicPin, mode: 'cycle', ms: 1000,
  beats: [{ hold: 0.4, dur: down / 3 }, { dur: down / 3 }, { dur: down / 3 }, { hold: 0.3, dur: up }],
})

// Back extension: hips on the bench edge, legs anchored behind; torso from hanging to in line with the legs.
const ghd = { t: 'box', x: -70, w: 66, h: 70 } as const
const ext = (t: number, c: number, head: number): Pose => [t, c - 172, c - 20, c - 172, c - 20, -90, -90, -90, -90, c, head]

export const MOVES: Record<string, Move> = {
  // Drive up fast, squeeze at the top, lower slowly.
  glute_bridge: { ...repPath((s) => supine(H.lie + (29 - H.lie) * s, FEET), 0.8, 1.5, 0.3, 0.6), ...supPin },
  sl_bridge: { ...repPath((s) => supine(H.lie + (29 - H.lie) * s, FEET, [125 + (TOP_THIGH - 125) * s, 125 + (TOP_THIGH - 125) * s]), 0.8, 1.6, 0.3, 0.6), ...supPin },
  // Bridge on straight legs, then curl the heels in under the knees; hips stay up. Slide out slowly.
  slider_curl: { ...repPath((s) => supine(25 + 4 * s, [117 - 40 * s, H.ankle]), 1, 1.8, 0.3, 0.4), ...supPin },
  sl_hip_thrust: { ...repPath((s) => thrust(15 + 28 * s), 0.8, 1.6, 0.3, 0.6), x: 'foot', at: [84, 0], props: [{ t: 'box', x: -45, w: 50, h: 33 }] },
  // Hinge down slowly, the rear leg rising as a counterweight; drive the hip forward to stand.
  sl_rdl: { ...repPath(hinge, 1.9, 1.1, 0.4, 0.3), x: 'foot', ms: 1000 },
  // Hips open: the pelvis turns about the stance leg, chest to the side, free arm to the ceiling, rear knee bends out. Slow both ways.
  airplane: {
    keys: [air0[0], air1[0]], solid: true, view: AIR_CAM,
    beats: [{ ...air0[1], hold: 0.4, dur: 1.8 }, { ...air1[1], hold: 0.8, dur: 1.8 }],
    mode: 'cycle', x: 'foot', ms: 1000,
  },
  // Near-constant speed to the break point, then a fall caught on the hands; push back up.
  nordic_neg: {
    keys: [lean(0), lean(18), lean(36), lean(52), lean(66), catchAt(75)], ...nordicPin, mode: 'cycle', ms: 1000,
    beats: [{ hold: 0.4, dur: 1 }, { dur: 0.9 }, { dur: 0.9 }, { dur: 0.45 }, { dur: 0.2 }, { hold: 0.6, dur: 1.4 }],
  },
  // Lower to the pause, hold, then lower and catch.
  nordic_pause: {
    keys: [lean(0), lean(22), lean(45), lean(47), lean(62), catchAt(75)], ...nordicPin, mode: 'cycle', ms: 1000,
    beats: [{ hold: 0.4, dur: 1.1 }, { dur: 1.1 }, { hold: 1.4, dur: 0.5 }, { dur: 0.5 }, { dur: 0.25 }, { hold: 0.6, dur: 1.4 }],
  },
  // Lower at a steady 3-5 s under control, curl back up with the hamstrings.
  nordic: nordic(66, 3.6, 1.8),
  nordic_strict: nordic(80, 4.5, 2.2),
  back_ext: { ...repPath((s) => ext(8 + 82 * s, -2 + 92 * s, -8 + 100 * s), 1, 1.6, 0.3, 0.6), x: 'hip', y: 'hip', at: [0, -80], props: [ghd] },
}
