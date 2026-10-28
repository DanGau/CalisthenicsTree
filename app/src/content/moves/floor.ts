import { full, joints, place, type Beat, type Move, type Pose } from '../../core/figure'
import { plant, pos, reach, rot } from './legs'
import { ball, unwrap, wheel } from './tumble'

/** Lowest point of the head and trunk, in hip coordinates. */
const base = (p: Pose, front = false) => {
  const b = joints(p, front)
  return Math.max(b.hip.y, b.waist.y, b.shoulder.y, b.head.y + 11)
}
/** Arm angles that hold the hand in front of the face (guard). */
const GUARD: [number, number] = [145, 235]

// Ginga: rocking lunge, one arm guarding the face, the rear foot on its ball; the feet pass through a square base.
const ginga = (back: 'near' | 'far'): Pose => {
  const arms: [number, number, number, number] = back === 'far' ? [...GUARD, -35, -10] : [-35, -10, ...GUARD]
  return plant([158, ...arms, 0, 0, 0, 0, 165, 175], back === 'far' ? { foot: 24, farFoot: -46 } : { foot: -46, farFoot: 24 }, 62)
}
const gingaBase: Pose = plant([168, 30, 80, 30, 80, 0, 0, 0, 0, 170, 176], { foot: -10, farFoot: -10 }, 68)

// Cocorinha: heels-down squat, near hand brushes the floor, far forearm over the head.
const squatGuard: Pose = (() => {
  const p = plant([140, 0, 0, 175, 265, 0, 0, 0, 0, 152, 175], { foot: 20, farFoot: 20 }, 30)
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [s[0] + 12, 30] })
})()

// Negativa: sit low on the near foot and near hand (behind), far leg long and low, head turned away.
const negativa: Pose = (() => {
  const p = plant([215, 0, 0, ...GUARD, 0, 0, 84, 88, 205, 230], { foot: 18 }, 24)
  return plant(p, { hand: -44 }, 24, { k: { hand: 1 } })
})()

// Baby freeze: from a crouch, tip onto the side of the head, hips high; the near elbow posts under the hips
// and both knees rest on top of it.
const babyIn: Pose = plant([125, 0, 0, 0, 0, 0, 0, 0, 0, 115, 100], { hand: 42, farHand: 42, foot: 4, farFoot: 4 }, 40)
const baby = (b: number): Pose => {
  const p: Pose = [45 + b, 0, 0, 0, 0, 0, 0, 0, 0, 45 + b, 25]
  const f = base(p)
  const S = joints(p).shoulder
  // Elbow E: an upper arm (29) from the shoulder, and a thigh (38) from the hip to a knee resting on top of it.
  const [dx, dy] = [-S.x, 13 - S.y]
  const d = Math.hypot(dx, dy)
  const a = (29 * 29 - 38 * 38 + d * d) / (2 * d)
  const h = Math.sqrt(29 * 29 - a * a)
  const E = { x: S.x + (a * dx + h * dy) / d, y: S.y + (a * dy - h * dx) / d }
  const q = reach(p, { hand: [E.x + Math.sqrt(25 ** 2 - (f - E.y) ** 2), f], farHand: [S.x + 26, f] }, { k: { hand: -1, farHand: -1 } })
  const thigh = (Math.atan2(E.x, E.y - 13) * 180) / Math.PI
  return [q[0], q[1], q[2], q[3], q[4], thigh, thigh - 150, thigh + 8, thigh - 140, q[9], q[10]]
}

// Queda de rins: torso tipped to the floor on the near elbow under the ribs, head just off the floor.
const qdr = (legs: [number, number, number, number]): Pose => {
  const p: Pose = [70, 0, 0, 0, 0, ...legs, 82, 100]
  const s = pos(p, 'shoulder')
  const f = pos(p, 'hip')[1] + 18
  return reach(p, { hand: [s[0] - 6, f], farHand: [s[0] + 24, f] }, { k: { hand: 1, farHand: 1 } })
}

// Chair freeze: head and near hand down, elbow in the small of the back, legs in a figure four, looking up.
const chair = (t: number): Pose => {
  const p: Pose = [t, 0, 0, 150, 200, 150, 40, 95, 175, t + 20, t + 50]
  const s = pos(p, 'shoulder')
  return reach(p, { hand: [s[0] + 10, base(p)] }, { k: { hand: -1 } })
}

// Turtle: both elbows in the hips, body flat and level, head up.
const turtle = (tilt: number): Pose => {
  const p: Pose = [90 + tilt, 0, 0, 0, 0, 112 + tilt, 20, 112 + tilt, 20, 90 + tilt, 130]
  const [hx, hy] = pos(p, 'hip')
  return reach(p, { hand: [hx + 14, hy + 34], farHand: [hx + 14, hy + 34] }, { k: { hand: 1, farHand: 1 } })
}

// Airchair: body near flat on one bent arm, the forearm a post from the floor to the elbow in the small of the back,
// head just off the floor, legs bent like a chair above, free arm reaching out.
const airchair = (legs: number): Pose => {
  const p: Pose = [-72, 0, 0, 120, 140, legs, legs - 95, legs + 15, legs - 70, -80, -110]
  const w = joints(p).waist
  return reach(p, { hand: [w.x + 4, w.y + 30] }, { k: { hand: 1 } })
}
const airIn: Pose = plant([115, 0, 0, 120, 140, 0, 0, 0, 0, 105, 95], { hand: 36, foot: 4, farFoot: 4 }, 40)

// Hollowback: handstand with the chest open, the back arched and the legs dropping over, knees bent.
const hollow = (drop: number): Pose => [-25 - drop, 0, 0, 0, 0, -150 - drop, -110 - drop * 2, -145 - drop, -100 - drop * 2, 5, 10]

// Back spin: sit, whip the legs round and roll onto the upper back, spin tucked, open out to slow down.
const spinSit: Pose = plant([205, 0, 0, 0, 0, 125, 30, 125, 30, 210, 195], { hand: -34, farHand: -34 }, 14, { k: { hand: 1, farHand: 1 } })
const spinWind: Pose = [240, 150, 170, 60, 80, 110, 100, 60, 10, 245, 230]
const spinTuck = (w: number): Pose => {
  const p = ball(300)
  return [p[0], p[1]! + w, p[2]! + w, p[3]! - w, p[4]! - w, p[5]! + w, p[6]! + w, p[7]! - w, p[8]! - w, p[9], p[10]]
}
const spinOpen: Pose = [255, 160, 170, 160, 170, 140, 110, 125, 95, 262, 250]

// Windmill (solid): rolling round across the upper back and chest about the body's long axis, arms reaching
// forward along it, hands together, so they clear the floor. The legs stay up behind in a wide V that sweeps round with the roll, so the hips flex over
// the back and open over the chest.
const D = 180 / Math.PI
const mill = (r: number): [Pose, Beat] => {
  const [cr, sr] = [Math.cos(r / D), Math.sin(r / D)]
  const leg = (s: number) => {
    // World direction: up behind (elevation 55), spread 34 to each side across the rolled body.
    const [e, h] = [55 / D, 34 / D]
    const w = [-Math.cos(e) * Math.cos(h), -Math.sin(e) * Math.cos(h) - s * Math.sin(h) * sr, s * Math.sin(h) * cr]
    const l = Math.hypot(...w)
    // Undo the roll to get the body-frame direction, then its sagittal angle and swing out.
    const [x, y, z] = [w[0] / l, (w[1] * cr + w[2] * sr) / l, (-w[1] * sr + w[2] * cr) / l]
    return [Math.atan2(x, y) * D, Math.asin(s * z) * D]
  }
  const [[n, no], [f, fo]] = [leg(1), leg(-1)]
  return [[86, 84, 84, 84, 84, n, n, f, f, 84, 70], { roll: r, armOut: -18, farArmOut: -18, legOut: no, farLegOut: fo, dur: 0.1, ease: 'lin' }]
}
const MILL = [0, 45, 90, 135, 180, 225, 270, 315].map(mill)

// Flare (solid): body near level on straight arms, hips high, legs in a wide V circling with the turn. The weight
// passes hand to hand at the half turns; the free side rolls up and its hand lifts as the legs sweep past it, and
// the V swings toward that side. The support hand stays put (shift cancels its drift).
/** Camera looks down this far on the spinning moves, so floor-plane circles read. */
const TILT = 25
const flare = (): Pick<Move, 'keys' | 'beats'> => {
  const keys: Pose[] = []
  const beats: Beat[] = []
  for (let k = 0; k < 12; k++) {
    const phi = k * 30
    const s = Math.sin((phi * Math.PI) / 180)
    const [up, nearUp] = [Math.max(0, s), Math.max(0, -s)]
    // The V tilts as it circles: one leg high, the other low, crossing over at the quarter turns.
    const tilt = 18 * Math.cos((phi * Math.PI) / 180)
    const p: Pose = [95, 20 * nearUp, 40 * nearUp, 20 * up, 40 * up, -112 - tilt, -112 - tilt, -112 + tilt, -112 + tilt, 98, 60]
    const st = { turn: phi, roll: -22 * s, armOut: s > 0 ? 22 * s : 45 * nearUp, farArmOut: s < 0 ? -22 * s : 45 * up, legOut: 58 - 22 * s, farLegOut: 58 + 22 * s }
    const b = place({ keys: [p], solid: true, tilt: TILT }, p, st)
    keys.push(p)
    beats.push({ ...st, shift: -(s >= 0 ? b.hand.x : b.farHand.x), dur: 0.8 / 12, ease: 'lin' })
  }
  return { keys, beats }
}

// Macaco: from a squat, reach one hand back low, throw the hips over it and land on the feet.
const macSit: Pose = plant([165, 60, 60, 60, 60, 0, 0, 0, 0, 170, 175], { foot: 22, farFoot: 22 }, 30)
const macReach: Pose = plant(plant([215, 0, 0, 140, 160, 0, 0, 0, 0, 230, 250], { foot: 28, farFoot: 28 }, 30), { hand: -46 }, 30, { k: { hand: 1 } })
const macOver: Pose = [345, 345, 345, 290, 290, 170, 150, 205, 225, 350, 355]
const macLand: Pose = rot(plant([165, 30, 40, 200, 200, 0, 0, 0, 0, 170, 175], { foot: 14, farFoot: -12 }, 46), 360)

// Swipe: bent over on the hands, whip the hips and legs round through a backbend, land on the hands again.
const swipeDown: Pose = plant([35, 0, 0, 0, 0, 0, 0, 0, 0, 25, 20], { hand: 56, farHand: 44, foot: -4, farFoot: 12 }, 70)
const swipeUp: Pose = [235, 315, 315, 290, 290, 75, 65, 125, 115, 260, 290]


// Timing below is in seconds (ms 1000).

/**
 * A freeze: hit it from `entry` in 0.4 s, overshoot 2° along the way in and settle, hold two beats easing to
 * `breath`, come back down.
 */
const freeze = (entry: Pose, f: Pose, breath: Pose): Pick<Move, 'keys' | 'beats' | 'mode' | 'ms'> => {
  const [E, F] = [full(entry), full(f)]
  const over = F.map((v, i) => v + Math.sign(v - E[i]) * Math.min(2, Math.abs(v - E[i]) * 0.05)) as Pose
  return { keys: [entry, over, f, breath], mode: 'cycle', ms: 1000, beats: [{ hold: 0.5, dur: 0.4 }, { dur: 0.25 }, { dur: 1.2 }, { hold: 0.3, dur: 0.7 }] }
}
/** Drawn solid, the camera `view` degrees round. */
const seen = <M extends Move>(m: M, view: number): M => ({ ...m, solid: true, view })
/** A balance held between two keys, swaying at the real ≈0.3 Hz rhythm (1.5 s each way). */
const sway = (half = 1.5): Pick<Move, 'beats' | 'ms'> => ({ ms: 1000, beats: [{ hold: 0.3, dur: half }, { hold: 0.3 }] })

export const MOVES: Record<string, Move> = {
  ginga: { keys: [ginga('far'), gingaBase, ginga('near'), gingaBase], mode: 'cycle', ms: 1000, flow: 0.05, beats: [{ hold: 0.1, dur: 0.5 }, { dur: 0.5 }, { hold: 0.1, dur: 0.5 }, { dur: 0.5 }] },
  cocorinha: { keys: [ginga('far'), squatGuard], mode: 'cycle', ms: 1000, flow: 0.05, beats: [{ hold: 0.3, dur: 0.45 }, { hold: 0.5, dur: 0.7 }] },
  negativa: { keys: [ginga('far'), negativa], mode: 'cycle', ms: 1000, flow: 0.05, beats: [{ hold: 0.3, dur: 0.6 }, { hold: 0.8, dur: 0.9 }] },
  baby_freeze: seen(freeze(babyIn, baby(0), baby(3)), 25),
  qdr: { keys: [qdr([150, 20, 155, 30]), qdr([-80, -80, -70, -70])], ...sway(1.2) },
  au: wheel({ spread: [[30, 25], [57, 45], [25, 60], [57, 45], [30, 25]], time: 1.8 }),
  chair_freeze: { keys: [chair(-50), chair(-53)], ...sway() },
  back_spin: {
    keys: [spinSit, spinWind, spinTuck(0), spinTuck(14), spinTuck(0), spinTuck(14), spinOpen], mode: 'cycle', solid: true, tilt: TILT, x: 'shoulder', ms: 1000, flow: 0.05,
    beats: [{ hold: 0.3, dur: 0.45 }, { turn: 30, dur: 0.2, ease: 'snap' }, ...[120, 240, 360, 480].map((turn): Beat => ({ turn, dur: 0.22, ease: 'lin' })), { turn: 560, dur: 0.6, ease: 'out' }],
  },
  macaco: { keys: [macSit, macReach, macOver, macLand], mode: 'cycle', ms: 1000, flow: 0.05, beats: [{ hold: 0.3, dur: 0.6 }, { dur: 0.3, ease: 'snap' }, { dur: 0.4 }, { hold: 0.3, dur: 0.8 }] },
  turtle_freeze: { keys: [turtle(-6), turtle(6)], ms: 1000, beats: [{ hold: 0.2, dur: 1 }, { hold: 0.2, dur: 1 }] },
  windmill: { keys: unwrap(MILL.map((k) => k[0])), beats: MILL.map((k) => k[1]), mode: 'cycle', solid: true, tilt: TILT, view: 30, x: 'shoulder', ms: 1000 },
  swipe: { keys: [swipeDown, swipeUp, rot(swipeDown, 360)], mode: 'cycle', ms: 1000, beats: [{ hold: 0.5, dur: 0.3 }, { lift: 22, dur: 0.35 }, { hold: 0.3, dur: 0.01 }] },
  airchair: seen(freeze(airIn, airchair(140), airchair(144)), 30),
  flare: { ...flare(), mode: 'cycle', solid: true, tilt: TILT, ms: 1000 },
  hollowback: { keys: [hollow(0), hollow(12)], ...sway() },
}
