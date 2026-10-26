import type { Move, Pose } from '../../core/figure'
import { H, KNEEL, ang, put } from './mobility'

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

// Single-leg RDL: stance foot at x 0, soft knee, rear leg in line with the flat back.
const rdlTop: Pose = [180, 0, 0, 0, 0, 0, 0, -8, -8]
const rdl = (t: number, c: number, head: number, far: [number, number], farArm: [number, number] = [0, 0]): Pose =>
  put([t, 0, 0, ...farArm, 0, 0, ...far, c, head], [-14, 75], { foot: [0, H.ankle] })

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

// Back extension: hips on the bench edge, legs anchored behind; torso from hanging to in line with the legs.
const ghd = { t: 'box', x: -70, w: 66, h: 70 } as const
const ext = (t: number, c: number, head: number): Pose => [t, c - 172, c - 20, c - 172, c - 20, -90, -90, -90, -90, c, head]

export const MOVES: Record<string, Move> = {
  glute_bridge: { keys: [supine(H.lie, FEET), supine(29, FEET)], ...supPin },
  sl_bridge: { keys: [supine(H.lie, FEET, [125, 125]), supine(29, FEET, [TOP_THIGH, TOP_THIGH])], ...supPin },
  // Bridge on straight legs, then curl the heels in under the knees; hips stay up.
  slider_curl: { keys: [supine(25, [117, H.ankle]), supine(29, FEET)], ...supPin, ms: 1100 },
  sl_hip_thrust: { keys: [thrust(15), thrust(43)], x: 'foot', at: [84, 0], props: [{ t: 'box', x: -45, w: 50, h: 33 }] },
  sl_rdl: { keys: [rdlTop, rdl(93, 93, 96, [-87, -87])], x: 'foot', ms: 1100 },
  // Hips open: chest turns up, free arm to the ceiling, rear knee bends out.
  airplane: { keys: [rdl(93, 93, 96, [-87, -87]), rdl(98, 118, 145, [-100, -150], [178, 178])], x: 'foot', ms: 1300 },
  nordic_neg: { keys: [lean(0), lean(40), lean(68), catchAt(75)], ...nordicPin, mode: 'cycle', ms: 1100 },
  nordic_pause: { keys: [lean(0), lean(45), lean(47), catchAt(75)], ...nordicPin, mode: 'cycle', ms: 1300 },
  nordic: { keys: [lean(0), lean(66)], ...nordicPin, ms: 1400 },
  nordic_strict: { keys: [lean(0), lean(80)], ...nordicPin, ms: 1900 },
  back_ext: { keys: [ext(8, -2, -8), ext(90, 90, 92)], x: 'hip', y: 'hip', at: [0, -80], props: [ghd] },
}
