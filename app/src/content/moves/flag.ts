import { place, type Move, type Pose } from '../../core/figure'
import { solve } from './frontlever'
import { reach } from './legs'

// Front view on a pole at x = 0. Human flag: torso -90 (shoulders toward the pole), near arm up
// at 225 and far arm down at -45 both land 88 left of the shoulders, so the hands stack on the pole.
const flag = (keys: Pose[], ms = 1300, y = -150): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [0, y], props: [{ t: 'pole', x: 0 }], ms })
const full: Pose = [-90, 225, 225, -45, -45, 90, 90, 90, 90]
const tuck: Pose = [-90, 225, 225, -45, -45, 110, -100, 110, -100]
const straddle: Pose = [-90, 225, 225, -45, -45, 115, 115, 65, 65]
// Vertical flag: body upside down beside the pole, hands stacked (near on top).
// Near hand 19 out and level with the hips; far hand 61 below, both 36 from the body line.
const vertical: Pose = [0, 200.6, 200.6, -78.9, -78.9, 180, 180, 180, 180]
const droop = (p: Pose, d = 1): Pose => [p[0] - 4 * d, p[1], p[2], p[3], p[4], p[5] - 6 * d, p[6] - 6 * d, p[7] - 6 * d, p[8] - 6 * d]
/** Settle from a droop into the flag, then squeeze the hips a touch higher and back. */
const flagHold = (p: Pose): Move => ({ ...flag([droop(p), p, droop(p, -0.4)], 1000), beats: [{ hold: 0.2, dur: 1, ease: 'out' }, { hold: 0.8, dur: 1.3 }, { hold: 1 }] })
// Clutch flag: pole 35 toward the head from the hips. Top hand high on it; bottom elbow jammed into the waist,
// forearm level to the pole, so the body lies across the pole on that arm.
const clutch = (legs: [number, number, number, number]): Pose =>
  reach([-90, 180, 180, 69, -38, ...legs, -90, -90], { hand: [-34, -62] }, { front: true, k: { hand: 1 } })

// Side plank (front view): far forearm flat under the shoulder, body one straight line solved so the far foot lands level with it.
const sp = (t: number): Pose => [t, 180, 180, 0, -90, t + 180, t + 180, t + 180, t + 180, t, t]
const front: Move = { keys: [], front: true }
const plankT = solve(-130, -60, (t) => place(front, sp(t)).farFoot.y + 5 - place(front, sp(t)).farElbow.y)
const armDown = (p: Pose): Pose => p.map((v, i) => (i === 1 || i === 2 ? p[0] + 180 : v)) as Pose
// Copenhagen: the top (near) leg rests on a bench, so the hips ride higher; the bottom leg hangs, then lifts to it.
const copen = (t: number, lifted: boolean): Pose => {
  const p = sp(t)
  if (lifted) return p
  const b = place(front, p)
  const dy = b.farElbow.y - 5 - b.farHip.y
  return reach(p, { farFoot: [b.farHip.x - b.hip.x + Math.sqrt(75.5 ** 2 - dy ** 2), b.farHip.y - b.hip.y + dy] }, { front: true })
}
/** A bench from the near knee (short) or ankle (long) to past the foot. */
const bench = (p: Pose, long: boolean) => {
  const b = place(front, p)
  const x0 = (long ? b.foot.x : b.knee.x) - 16
  return { t: 'box' as const, x: x0, w: b.foot.x + 14 - x0, h: -(long ? b.foot.y : b.knee.y) - 5 }
}
const cs = (lifted: boolean) => copen(-82, lifted)
const cl = (lifted: boolean) => copen(-84, lifted)

const hang: Pose = [180, 165, 165, 195, 195, 0, 0, 0, 0]
// Oblique raise: the pelvis swings out and up as the trunk side-bends, knees drawn high toward one elbow.
const oblique = (d: number): Pose => [180 - 28 * d, 165, 165, 195, 195, 180 - 55 * d, -20 * d, 180 - 60 * d, -25 * d, 180 - 6 * d, 180]

export const MOVES: Record<string, Move> = {
  side_plank: { keys: [armDown(sp(plankT)), sp(plankT)], front: true, ms: 1000, beats: [{ hold: 0.6, dur: 1.2 }, { hold: 1.2 }] },
  copen_short: { keys: [cs(false), cs(true)], front: true, props: [bench(cs(true), false)], ms: 1000, beats: [{ hold: 0.4, dur: 1, ease: 'out' }, { hold: 1, dur: 1.6 }], mode: 'cycle' },
  copen_long: { keys: [cl(false), cl(true)], front: true, props: [bench(cl(true), true)], ms: 1000, beats: [{ hold: 0.4, dur: 1, ease: 'out' }, { hold: 1, dur: 1.6 }], mode: 'cycle' },
  vertical_flag: { ...flag([[3, 200.6, 200.6, -78.9, -78.9, 177, 177, 183, 183], vertical], 1000, -120), beats: [{ hold: 0.6, dur: 1.4 }, { hold: 1.2 }] },
  oblique_raise: {
    keys: [hang, oblique(1), hang, oblique(-1)], mode: 'cycle', front: true, x: 'hand', y: 'hand', at: [26, -210], props: [{ t: 'bar', x: 0, y: -210 }], ms: 900,
    beats: [{ hold: 0.3, dur: 1 }, { hold: 0.3, dur: 1.5 }, { hold: 0.3, dur: 1 }, { hold: 0.3, dur: 1.5 }],
  },
  tuck_flag: flagHold(tuck),
  clutch_flag: { ...flag([clutch([110, -100, 110, -100]), clutch([90, 90, 90, 90]), clutch([92, 92, 92, 92])], 1000, -150), beats: [{ hold: 0.6, dur: 1.4 }, { hold: 0.8, dur: 1.3 }, { hold: 1 }] },
  straddle_flag: flagHold(straddle),
  full_flag: flagHold(full),
  flag_raise: { ...flag([vertical, full], 1000), mode: 'cycle', beats: [{ hold: 0.4, dur: 1.8 }, { hold: 0.6, dur: 1.2 }] },
}
