import { place, type Move, type Pose, type Prop } from '../../core/figure'
import { plank, toeBox, toeRise } from './push'

const HS: Pose = [0, 0, 0, 0, 0, 180, 180, 180, 180]
const line = (t: number, a: number): Pose => [t, a, a, a, a, t - 180, t - 180, t - 180, t - 180]

/** A wall touching `joint` of the move's first key, on its right (+x) or left side. */
function wallAt(m: Move, side: 1 | -1, joint: 'foot' | 'hand' = 'foot'): Prop {
  const b = place(m, m.keys[0])
  return { t: 'wall', x: Math.round(side > 0 ? b[joint].x + 4 : b[joint].x - 16) }
}
const withWall = (m: Move, side: 1 | -1): Move => ({ ...m, props: [...(m.props ?? []), wallAt(m, side)] })

// Pike.
const pikeEntry = plank(70, 62, 62)
const pike = plank(50, 50, 50)
const pikeLow = plank(62, -45, 25)

// Elevated pike: feet on a box, hips at 90°.
const epH = toeRise(12, 12, 12, -80)
const epTop: Pose = [12, 12, 12, 12, 12, -80, -80, -80, -80]
const epBottom = plank(26, -55, 15, epH)

// Back-to-wall handstand (wall on the +x side, behind the back).
const bwTop: Pose = [0, 0, 0, 0, 0, 172, 172, 172, 172]
const bwBottom: Pose = [-14, 80, -20, 80, -20, 165, 165, 165, 165]
const dfBottom: Pose = [-14, 112, -20, 112, -20, 165, 165, 165, 165]

// Press from a pike fold.
const fold: Pose = [15, 60, 60, 60, 60, -8, -8, -8, -8]
const pressMid: Pose = [-5, 8, 8, 8, 8, -90, -90, -90, -90]
const pressTop: Pose = [0, 0, 0, 0, 0, -180, -180, -180, -180]

// Straddle press, front view.
const sFold: Pose = [0, -80, -40, 80, 40, -15, -15, 15, 15]
const sMid: Pose = [0, -20, -10, 20, 10, -95, -95, 95, 95]
const sTop: Pose = [0, 0, 0, 0, 0, -180, -180, 180, 180]

// Kick-up from a lunge.
const lunge: Pose = [168, 168, 170, 168, 170, 55, 5, -25, -25]
const kick: Pose = [20, 15, 15, 15, 15, 50, -20, 140, 140]

export const MOVES: Record<string, Move> = {
  pike_hold: { keys: [pikeEntry, pike], x: 'hand', ms: 1300 },
  wall_walk: { keys: [plank(115, 0, 0), line(60, 15), line(8, 4)], x: 'foot', at: [0, 0], props: [{ t: 'wall', x: -14 }], ms: 1100 },
  ctw_hs: { keys: [line(25, 8), line(7, 3)], x: 'foot', at: [0, 0], props: [{ t: 'wall', x: -14 }], ms: 1300 },
  pike_pu: { keys: [pike, pikeLow], x: 'hand' },
  wall_taps: { keys: [[0, 0, 0, 0, 0, 180, 180, 180, 180], [-6, 0, 0, 140, -100, 174, 174, 174, 174]], front: true, x: 'hand', ms: 700 },
  kickup: { keys: [lunge, kick, HS], x: 'hip', ms: 800 },
  elev_pike_pu: { ...(() => { const m: Move = { keys: [epTop, epBottom], x: 'hand' }; return { ...m, props: [toeBox(m)] } })() },
  heel_pulls: withWall({ keys: [bwTop, HS], x: 'hand', ms: 1200 }, 1),
  wall_hspu_neg: withWall({ keys: [bwTop, bwBottom], x: 'hand', ms: 1900 }, 1),
  free_hs: { keys: [[6, 4, 4, 4, 4, 168, 168, 168, 168], HS], x: 'hand', ms: 1400 },
  wall_hspu: withWall({ keys: [bwTop, bwBottom], x: 'hand' }, 1),
  hs_walk: { keys: [[-4, 0, 0, 0, 0, 176, 176, 176, 176], [-8, -35, -15, 0, 0, 174, 174, 174, 174], [-4, 0, 0, 0, 0, 176, 176, 176, 176], [-8, 0, 0, -35, -15, 174, 174, 174, 174]], mode: 'cycle', x: 'hip', ms: 450 },
  straddle_press: { keys: [sFold, sMid, sTop], front: true, x: 'hip', ms: 1200 },
  deficit_hspu: withWall({ keys: [bwTop, dfBottom], x: 'hand', y: 'hand', at: [0, -24], props: [{ t: 'bars', x: 0, y: -24 }] }, 1),
  hs_shapes: { keys: [HS, [0, 0, 0, 0, 0, -140, 60, -140, 60], [0, 0, 0, 0, 0, -130, -130, 130, 130], [0, 0, 0, 0, 0, -110, 150, 175, 175]], mode: 'cycle', x: 'hand', ms: 1000 },
  free_hspu: { keys: [HS, [-14, 80, -20, 80, -20, 186, 186, 186, 186]], x: 'hand', ms: 1100 },
  pike_press: { keys: [fold, pressMid, pressTop], x: 'hand', ms: 1200 },
  oahs: { keys: [[0, 0, 0, 0, 0, -140, -140, 140, 140], [-7, 0, 0, 95, 95, -133, -133, 147, 147]], front: true, x: 'hand', ms: 1300 },
  ninety_pu: { keys: [HS, [88, -92, 0, -92, 0, -92, -92, -92, -92]], x: 'hand', ms: 1200 },
}
