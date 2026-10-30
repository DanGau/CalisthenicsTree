import { place, type Beat, type Move, type Pose } from '../../core/figure'
import { pos, reach } from './legs'
import { unwrap } from './tumble'
import { add3, body, grip3, hold, type K3, oa, onBar, p3, pinned, reach3, solid3 } from './pull'

const EDGE = -210
const board = (m: Move, y = EDGE): Move => ({ ...m, props: [{ t: 'board', x: 0, y }] })
type Legs = [number, number, number, number]

// Two-arm hangs, solid, hands 56 apart on the edge. `y`: hand above the shoulder centre (53 straight, less bent).
const hang = (y: number, s: number, legs: Legs = [2, -1, 2, -1], t = 180): K3 => grip3(body(t, t, t, legs, 180, s), {}, [2, y, 28], [2, y, -28])
const passive = hang(-52.8, 4)
const engaged = hang(-52.8, -3, [4, -2, 4, -2])
const bent = hang(-48, -3, [6, -2, 6, -2])
const bentTense = hang(-48, -4, [8, -3, 8, -3], 178)
// Repeaters and max hangs: feet stand on a box between reps; knees bend behind to come off it.
const off = hang(-50, 3, [2, 0, 2, 0])
const on = (y: number): K3 => hang(y, -3, [12, -80, 12, -80])
const boxUnder = (k: K3) => {
  const m: Move = { keys: [k.p], solid: true, x: 'hand', y: 'hand', at: [0, EDGE], beats: [k.s] }
  const b = place(m, k.p, k.s)
  return { t: 'box' as const, x: b.foot.x - 22, w: 44, h: -Math.max(b.heel.y, b.toe.y, b.foot.y + 5), z: 0 }
}
const BOX = boxUnder(off)

/** Hang for `on` s (two sways), off the edge for `rest` s, seconds with ms 1000. */
const reps = (a: K3, b: K3, on: number, rest: number): Move => {
  const m = onBar({ mode: 'cycle', keys: [off, a, b, a], beats: [{ hold: rest, dur: 0.6 }, { hold: on / 3 - 0.6, dur: 0.6 }, { hold: on / 3 - 0.6, dur: 0.6 }, { hold: on / 3 - 0.6, dur: 0.6 }] })
  return { ...board(m), props: [{ t: 'board', x: 0, y: EDGE }, BOX] }
}

// One arm (pull.ts `oa`): the free arm out for balance.
const oneArm = (legs: Legs, s: number, out: number): K3 => { const k = oa(-53.5, legs, s); return { p: k.p, s: { ...k.s, farArmOut: out } } }
// Pulley: the free hand holds a handle at chest height out to the side, the counterweight's rope above it.
const pulley = (k: K3): K3 => reach3({ p: k.p, s: { ...k.s, roll: 6, farArmOut: -20 } }, { farHand: add3(p3(k, 'hand'), [8, 70, -60]) })
const PK = pulley(oneArm([6, 0, 8, 0], -3, 0))

// Feet-on hangs, side view: hands on an edge above the head, feet on the floor; sitting back loads the fingers.
const AB: Move = { keys: [], x: 'foot', at: [0, 0], ms: 1000 }
const abBody = (sit: number): Pose => {
  const p = body(180 + sit * 0.2, 182, 178, [0, 0, 0, 0], 180, sit > 0 ? -3 : 2)
  const hipY = -81 + sit * 0.55
  return reach(p, { foot: [sit * 0.5, -hipY - 5], farFoot: [sit * 0.5, -hipY - 5] }, { k: { foot: 1, farFoot: 1 } })
}
const AB_EDGE = (() => { const b = place(AB, abBody(0)); return { x: b.shoulder.x + 6, y: b.shoulder.y - 38 } })()
const toEdge = (p: Pose): Pose => {
  const b = place(AB, p)
  const h: [number, number] = [AB_EDGE.x - b.hip.x, AB_EDGE.y - b.hip.y]
  return reach(p, { hand: h, farHand: h })
}

// Standing lifts (no-hang, pinch): the near arm straight down to a block held just off the floor.
const BLOCK = -78
const STANDING: Move = { keys: [], x: 'hand', ms: 1000 }
const lift = (s: number, h: number, sink: number): Pose => {
  const p: Pose = [180, 0, 0, -8, -12, sink, -sink, sink, -sink, 180, h, s]
  const hip = place(STANDING, p).hip
  return reach(p, { hand: [pos(p, 'shoulder')[0] + 2, BLOCK - hip.y] })
}

// Forearm work, sitting on a box: forearm along the thigh, the hand past the knee works.
const SIT = { t: 'box' as const, x: -30, w: 40, h: 44 }
const seated = (fore: number): Pose => [180, 25, fore, 25, fore, 88, 2, 88, 2, 165, 160]
// Band: elbows at the sides, forearms forward; hands open against the band.
const band = (open: number): K3 => ({ p: [180, 8, 92, 8, 92, 0, 0, 0, 0, 180, 176], s: { armOut: 6, farArmOut: 6, foreOut: -14 + open, farForeOut: -14 + open } })

/**
 * Campus board, side view: rungs every 22 up the face at x 0. Each state is the hip and both hands in the scene;
 * dense keys every 20 ms carry the hands exactly on the rungs (or along a short arc in flight).
 */
const RUNG = 22
const R1 = -200
const rung = (n: number) => R1 - (n - 1) * RUNG
type St = { hip: [number, number]; hand: number | null; far: number | null; legs: Legs; t?: number; dur: number; ease?: 'io' | 'in' | 'out' }
// Each starts and ends at rest (no speed jump between states); `in` peaks late, `out` early.
const ease = { io: (u: number) => u * u * (3 - 2 * u), in: (u: number) => u ** 3 * (4 - 3 * u), out: (u: number) => 1 - (1 - u) ** 3 * (1 + 3 * u) }
/** `feet`: both feet on a foothold at this point (foot-on campus), solved every sample too. */
const campus = (states: St[], feet?: [number, number]): Move => {
  const ms = 20
  const keys: Pose[] = []
  const beats: Beat[] = []
  // A hand in flight (null) moves from its previous rung to its next one.
  const where = (i: number, k: 'hand' | 'far'): number => {
    const n = states.length
    for (let j = 0; j < n; j++) { const v = states[(i - j + n) % n][k]; if (v !== null) return rung(v) }
    return R1
  }
  const next = (i: number, k: 'hand' | 'far'): number => {
    const n = states.length
    for (let j = 1; j <= n; j++) { const v = states[(i + j) % n][k]; if (v !== null) return rung(v) }
    return R1
  }
  states.forEach((a, i) => {
    const b = states[(i + 1) % states.length]
    const steps = Math.max(1, Math.round((a.dur * 1000) / ms))
    for (let s = 0; s < steps; s++) {
      const u = ease[a.ease ?? 'io'](s / steps)
      const hip: [number, number] = [a.hip[0] + (b.hip[0] - a.hip[0]) * u, a.hip[1] + (b.hip[1] - a.hip[1]) * u]
      const legs = a.legs.map((v, j) => v + (b.legs[j] - v) * u) as Legs
      const t = (a.t ?? 180) + ((b.t ?? 180) - (a.t ?? 180)) * u
      // A hand flies from where it let go to where it catches: up the face along a small arc out from it.
      const hy = (k: 'hand' | 'far'): [number, number] => {
        const fixed = a[k] !== null && b[k] !== null && a[k] === b[k]
        if (fixed) return [0, rung(a[k]!)]
        const [y0, y1] = a[k] === null ? [where(i, k), next(i, k)] : [rung(a[k]!), b[k] === null ? next(i, k) : rung(b[k]!)]
        // The arc spans the whole flight; this segment covers part of it.
        const f0 = a[k] === null ? 0.5 : 0
        const f1 = b[k] === null ? 0.5 : 1
        const f = f0 + (f1 - f0) * u
        return [-10 * Math.sin(Math.PI * f), y0 + (y1 - y0) * f]
      }
      const p = body(t, t + 2, t, legs, 180, -2)
      const [h, fh] = [hy('hand'), hy('far')]
      const f: [number, number] | undefined = feet && [feet[0] - hip[0], feet[1] - 6 - hip[1]]
      keys.push(reach(p, { hand: [h[0] - hip[0], h[1] - hip[1]], farHand: [fh[0] - hip[0], fh[1] - hip[1]], ...(f ? { foot: [f[0] - 3, f[1]], farFoot: [f[0] - 3, f[1]] } : {}) }))
      beats.push({ lift: -hip[1], shift: hip[0], dur: ms / 1000 })
    }
  })
  return {
    // IK wraps arm angles into one turn; a dense key must not swing the long way round.
    keys: unwrap(keys), beats, mode: 'cycle', x: 'hip', y: 'hip', at: [0, 0], ms: 1000, floor: false,
    props: [...[1, 2, 3, 4, 5].map((n) => ({ t: 'board' as const, x: 0, y: rung(n) })), ...(feet ? [{ t: 'board' as const, x: feet[0], y: feet[1] }] : [])],
  }
}
// Hip below the hands: 100 straight-armed, 64 pulled in, about 4 behind the rungs.
const L: Legs = [24, -6, 18, -10]
const T: Legs = [40, -20, 34, -24]
const ladder = campus([
  { hip: [-4, rung(1) + 94], hand: 1, far: 1, legs: L, dur: 0.5 },
  { hip: [-2, rung(1) + 66], hand: 1, far: 1, legs: T, t: 178, dur: 0.25, ease: 'out' },
  { hip: [-2, rung(1) + 60], hand: null, far: 1, legs: T, t: 178, dur: 0.15, ease: 'out' },
  { hip: [-4, rung(1) + 70], hand: 2, far: 1, legs: L, dur: 0.3, ease: 'out' },
  { hip: [-2, rung(2) + 82], hand: 2, far: 1, legs: T, t: 178, dur: 0.22, ease: 'out' },
  { hip: [-2, rung(2) + 74], hand: 2, far: null, legs: T, t: 178, dur: 0.15, ease: 'out' },
  { hip: [-4, rung(2) + 72], hand: 2, far: 3, legs: L, dur: 0.35, ease: 'out' },
  { hip: [-4, rung(3) + 80], hand: 2, far: 3, legs: L, dur: 0.25 },
  { hip: [-3, rung(3) + 74], hand: null, far: 3, legs: L, dur: 0.15, ease: 'out' },
  { hip: [-4, rung(3) + 94], hand: 3, far: 3, legs: L, dur: 0.6 },
  // Down the same way: a hand lowers, the body follows on bent arms.
  { hip: [-4, rung(3) + 90], hand: null, far: 3, legs: L, dur: 0.2, ease: 'out' },
  { hip: [-4, rung(3) + 86], hand: 2, far: 3, legs: L, dur: 0.3 },
  { hip: [-4, rung(2) + 82], hand: 2, far: null, legs: L, dur: 0.2, ease: 'out' },
  { hip: [-4, rung(2) + 90], hand: 2, far: 1, legs: L, dur: 0.3 },
  { hip: [-4, rung(1) + 90], hand: null, far: 1, legs: L, dur: 0.2, ease: 'out' },
  { hip: [-4, rung(1) + 94], hand: 1, far: 1, legs: L, dur: 0.4 },
])
// Double dyno 1 to 3 and back down: both hands leave at the top of an explosive pull, the hips peak, both catch.
const double = campus([
  { hip: [-4, rung(1) + 94], hand: 1, far: 1, legs: L, dur: 0.6 },
  { hip: [-6, rung(1) + 90], hand: 1, far: 1, legs: L, t: 182, dur: 0.35, ease: 'in' },
  { hip: [-1, rung(1) + 62], hand: 1, far: 1, legs: T, t: 176, dur: 0.28, ease: 'out' },
  { hip: [-1, rung(1) + 50], hand: null, far: null, legs: T, t: 176, dur: 0.22, ease: 'in' },
  { hip: [-4, rung(3) + 86], hand: 3, far: 3, legs: L, dur: 0.3, ease: 'out' },
  { hip: [-4, rung(3) + 94], hand: 3, far: 3, legs: L, dur: 0.6 },
  { hip: [-2, rung(3) + 76], hand: 3, far: 3, legs: T, t: 178, dur: 0.3, ease: 'out' },
  { hip: [-2, rung(3) + 82], hand: null, far: null, legs: T, t: 178, dur: 0.25, ease: 'in' },
  { hip: [-4, rung(1) + 84], hand: 1, far: 1, legs: L, dur: 0.45, ease: 'out' },
])

// Foot-on ladder 1-2-3 and back, smooth and steady: hips back from the board, feet on a low rung, torso leaning in.
const FT: [number, number] = [0, -96]
const F: Legs = [60, -20, 60, -20]
const fo = (y: number, hand: number | null, far: number | null, dur: number): St => ({ hip: [-34, y + 88], hand, far, legs: F, t: 160, dur, ease: 'io' })
const footOn = campus([
  fo(rung(1), 1, 1, 0.5), fo(rung(1) - 4, null, 1, 0.3), fo(rung(1) - 11, 2, 1, 0.35), fo(rung(1) - 15, 2, null, 0.3), fo(rung(2) - 11, 2, 3, 0.35),
  fo(rung(2) - 15, null, 3, 0.3), fo(rung(3), 3, 3, 0.6), fo(rung(3) + 4, null, 3, 0.3), fo(rung(2) - 11, 2, 3, 0.35), fo(rung(2) - 7, 2, null, 0.3),
  fo(rung(1) - 11, 2, 1, 0.35), fo(rung(1) - 7, null, 1, 0.3),
], FT)
// One foot down, the other knee lifted: long light hangs.
const abOne = (sit: number): Pose => { const p = abBody(sit); p[7] = 50; p[8] = -40; return p }

const breathe: Beat[] = [{ hold: 0.3, dur: 1.2 }, { hold: 0.3 }]

export const MOVES: Record<string, Move> = {
  abrahangs: pinned({
    ...AB, mode: 'cycle', keys: [abBody(0), abBody(14), abBody(16), abBody(14)].map(toEdge),
    beats: [{ hold: 0.8, dur: 1 }, { hold: 0.6, dur: 1.2 }, { hold: 0.6, dur: 1.2 }, { dur: 1 }],
    props: [{ t: 'board', x: AB_EDGE.x, y: AB_EDGE.y }],
  }, toEdge, 20),
  hang_jug: board(onBar({ keys: [passive, engaged], beats: breathe })),
  ext_band: { ...solid3({ mode: 'cycle', keys: [band(0), band(16)], beats: [{ hold: 0.3, dur: 0.8 }, { hold: 0.5, dur: 1.4 }] }, 50), ms: 1000 },
  no_hang: { ...STANDING, keys: [lift(2, 176, 10), lift(-3, 180, 0)], beats: [{ hold: 0.6, dur: 1, ease: 'out' }, { hold: 2.5, dur: 1 }], props: [{ t: 'board', x: 0, y: BLOCK }] },
  hang_20: board(onBar({ keys: [engaged, bent], beats: breathe })),
  wrist_curls: { keys: [seated(78), seated(104)], mode: 'cycle', ms: 1000, beats: [{ hold: 0.2, dur: 1 }, { hold: 0.3, dur: 1.5 }], props: [SIT] },
  pinch: { ...STANDING, keys: [lift(2, 176, 8), lift(-4, 180, 0)], beats: [{ hold: 0.6, dur: 1, ease: 'out' }, { hold: 2.5, dur: 1 }], props: [{ t: 'board', x: 0, y: BLOCK }] },
  repeaters: reps(on(-50), on(-49), 3.5, 1.5),
  open_hand: board(onBar({ keys: [passive, hang(-53, -2, [3, -1, 3, -1])], beats: breathe })),
  hang_15: board(onBar(hold(engaged, bent, bentTense))),
  sloper: board(onBar({ keys: [hang(-53.5, 3, [0, 0, 0, 0]), hang(-53.5, -1, [2, -1, 2, -1])], beats: breathe })),
  max_hang: reps(on(-48), on(-47), 5, 3),
  hang_10: board(onBar(hold(engaged, bentTense, hang(-47, -5, [10, -4, 10, -4], 177)))),
  oa_hang_assist: { ...board(onBar({ keys: [PK, pulley(oneArm([4, 0, 9, -2], -4, 0))], beats: breathe }, { free: true })), props: [{ t: 'board', x: 0, y: EDGE }, { t: 'rings', x: 8, y: EDGE + 70, z: -60 }] },
  campus_ladder: ladder,
  oa_hang_20: board(onBar({ keys: [oneArm([6, 0, 8, 0], 3, 45), oneArm([4, 0, 9, -2], -3, 50)], beats: breathe }, { free: true })),
  max_hang_50: reps(on(-47), on(-46), 5, 3),
  campus_power: double,
  oa_hang_15: board(onBar(hold(oneArm([6, 0, 8, 0], 3, 45), oneArm([4, 0, 9, -2], -3, 50), oneArm([5, -1, 10, -3], -4, 52)), { free: true })),
  density_hang: pinned({
    ...AB, mode: 'cycle', keys: [abBody(0), abOne(8), abOne(10), abOne(8), abBody(0)].map(toEdge),
    beats: [{ hold: 0.6, dur: 1 }, { hold: 1.5, dur: 2 }, { hold: 1.5, dur: 2 }, { dur: 1 }, { hold: 0.4, dur: 0.6 }],
    props: [{ t: 'board', x: AB_EDGE.x, y: AB_EDGE.y }],
  }, toEdge, 20),
  max_test: reps(on(-48), on(-47), 7, 4),
  repeater_test: reps(on(-50), on(-47.5), 7, 3),
  campus_curve: footOn,
}
