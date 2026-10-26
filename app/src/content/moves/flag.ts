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
const droop = (p: Pose): Pose => [p[0] - 4, p[1], p[2], p[3], p[4], p[5] - 6, p[6] - 6, p[7] - 6, p[8] - 6]

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

export const MOVES: Record<string, Move> = {
  side_plank: { keys: [armDown(sp(plankT)), sp(plankT)], front: true, ms: 1300 },
  copen_short: { keys: [cs(false), cs(true)], front: true, props: [bench(cs(true), false)], ms: 1100 },
  copen_long: { keys: [cl(false), cl(true)], front: true, props: [bench(cl(true), true)], ms: 1100 },
  vertical_flag: flag([[3, 200.6, 200.6, -78.9, -78.9, 177, 177, 183, 183], vertical], 1300, -120),
  oblique_raise: {
    keys: [hang, [180, 165, 165, 195, 195, 120, 10, 120, 10], hang, [180, 165, 165, 195, 195, -120, -10, -120, -10]],
    mode: 'cycle', front: true, x: 'hand', y: 'hand', at: [26, -210], props: [{ t: 'bar', x: 0, y: -210 }], ms: 1000,
  },
  tuck_flag: flag([droop(tuck), tuck]),
  clutch_flag: flag([[-90, 225, 225, 100, -95, 110, -100, 110, -100], [-90, 225, 225, 100, -95, 90, 90, 90, 90]]),
  straddle_flag: flag([droop(straddle), straddle]),
  full_flag: flag([droop(full), full]),
  flag_raise: flag([vertical, full], 1600),
}
