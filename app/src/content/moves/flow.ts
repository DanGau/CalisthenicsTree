import type { Beat, Joint, Move, Pose } from '../../core/figure'
import { plant, pos, reach } from './legs'
import { wheel } from './tumble'

type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
/** Lifts the given limb ends h off the floor mid-step (k: elbow and knee bend sides). */
const raise = (p: Pose, limbs: Limb[], k: Partial<Record<Limb, number>> = {}, h = 12): Pose =>
  reach(p, Object.fromEntries(limbs.map((l) => { const [x, y] = pos(p, l as Joint); return [l, [x, y - h]] })), { k })

/** Beast/bear: back flat, hands under the shoulders, knees hovering just off the floor. s staggers opposite hand and foot. */
const bear = (s: number): Pose =>
  plant([101, 0, 0, 0, 0, 0, 0, 0, 0, 100, 112], { hand: 46 + s, farHand: 46 - s, foot: -34 - s, farFoot: -34 + s }, 50)

/** Crab: belly up, hips lifted level, hands behind the shoulders with fingers back. */
const crab = (s: number, nearHand = true): Pose =>
  plant([-97, 0, 0, 0, 0, 0, 0, 0, 0, -97, -70], { ...(nearHand ? { hand: -50 + s } : {}), farHand: -50 - s, foot: 40 - s, farFoot: 40 + s }, 50, { k: { hand: 1, farHand: 1 } })

const duck = (s: number): Pose => plant([138, 90, 90, 90, 90, 0, 0, 0, 0, 150, 170], { foot: 16 + s, farFoot: 16 - s }, 30)

type Gait = {
  body: Pose; base: Partial<Record<Limb, number>>; floor: number; phase: Partial<Record<Limb, number>>
  duty: number; stride: number; time: number; lift?: number; bob?: number; k?: Partial<Record<Limb, number>>
}
/**
 * A gait as a tracking camera sees it, timed in seconds (ms 1000): each limb stands for `duty` of the cycle
 * starting at its `phase`, sliding back `stride` under the steadily moving hips, then swings forward in an arc
 * `lift` high. The hips bob `bob` twice a cycle. Travel per cycle is stride / duty.
 */
const gait = (g: Gait): Pick<Move, 'keys' | 'beats' | 'travel' | 'mode' | 'ms'> => {
  const n = 16
  const keys = Array.from({ length: n }, (_, i): Pose => {
    const f = i / n
    const x: Partial<Record<Limb, number>> = {}
    const up: [Limb, number][] = []
    for (const [l, o] of Object.entries(g.phase) as [Limb, number][]) {
      const u = (f - o + 1) % 1
      const w = (u - g.duty) / (1 - g.duty)
      x[l] = g.base[l]! + g.stride * (u < g.duty ? 0.5 - u / g.duty : w - 0.5)
      if (u >= g.duty) up.push([l, (g.lift ?? 8) * Math.sin(Math.PI * w)])
    }
    const p = plant(g.body, x, g.floor - (g.bob ?? 2) * Math.cos(4 * Math.PI * f), { k: g.k })
    return up.length ? reach(p, Object.fromEntries(up.map(([l, h]) => { const [px, py] = pos(p, l); return [l, [px, py - h]] })), { k: g.k }) : p
  })
  const travel = g.stride / g.duty
  return { keys, mode: 'cycle', ms: 1000, travel, beats: keys.map((_, i): Beat => ({ shift: (travel * i) / n, dur: g.time / n })) }
}
/** Opposite hand and foot step together. */
const DIAG = { hand: 0, farFoot: 0, farHand: 0.5, foot: 0.5 }

// Ape: hands reach far ahead, the feet hop up between them with the hips low, the hands reach again.
const apeReach: Pose = plant([112, 0, 0, 0, 0, 0, 0, 0, 0, 122, 150], { hand: 74, farHand: 68, foot: 10, farFoot: 10 }, 32)
const apeHop: Pose = plant([75, 0, 0, 0, 0, 115, 10, 105, 0, 80, 110], { hand: 40, farHand: 34 }, 58)
const apeLand: Pose = plant([125, 0, 0, 0, 0, 0, 0, 0, 0, 135, 160], { hand: 26, farHand: 20, foot: 14, farFoot: 14 }, 32)
/** Hands lift and swing forward to reach again (feet planted at 14 from the hip, 52 hip travel to go). */
const apeRaise: Pose = reach(apeLand, { hand: [50, 18], farHand: [44, 18] })
const apeSquat: Pose = plant([125, 0, 0, 0, 0, 0, 0, 0, 0, 135, 160], { hand: 46, farHand: 38, foot: 14, farFoot: 14 }, 32)

// Kickthrough: near hand and foot stay down, hips turn, the far leg threads under and kicks long, far hand lifts.
const kick: Pose = plant([140, 0, 0, 170, 175, 0, 0, 88, 86, 140, 150], { hand: 26, foot: -12 }, 40, { k: { hand: 1 } })

// Lizard: chest low, elbows bent back, one knee drives up to its elbow, the other leg long.
const lizardAt = (hand: number, farHand: number, foot: number, farFoot: number): Pose =>
  plant([92, 0, 0, 0, 0, 0, 0, 0, 0, 92, 100], { hand, farHand, foot, farFoot }, 20, { k: { hand: -1, farHand: -1, foot: 1, farFoot: 1 } })
// Hand and foot strides match (56), so the planted pair stays put while the hips travel.
const lizard = (side: 1 | -1): Pose => (side === 1 ? lizardAt(74, 18, 4, -52) : lizardAt(18, 74, -52, 4))
const lizardWalk = [lizard(1), raise(lizardAt(46, 46, -24, -24), ['farHand', 'farFoot']), lizard(-1), raise(lizardAt(46, 46, -24, -24), ['hand', 'foot'])]

// Frogger: hips sink deep between the knees, chest proud; then hands plant and the hips pop up.
const frogLow: Pose = plant([125, 0, 0, 0, 0, 0, 0, 0, 0, 140, 165], { hand: 50, farHand: 50, foot: 22, farFoot: 22 }, 24)
const frogHigh: Pose = plant([35, 0, 0, 0, 0, -20, -20, -20, -20, 30, 40], { hand: 60, farHand: 60 }, 75)

// Scorpion: from beast the far leg lifts and curls over toward the far side, eyes on the foot.
const scorpion: Pose = (() => { const p = bear(0); p[7] = -150; p[8] = 110; p[10] = 140; return p })()
/** The far knee lifts first, clear of the floor, before the leg curls over. */
const scorpionLift: Pose = (() => { const p = bear(0); p[8] = p[7] - 100; p[7] -= 25; p[10] = 125; return p })()

// Crab reach: hips drive up, chest opens, the far arm sweeps overhead.
const crabReach: Pose = plant([-62, 0, 0, -165, -175, 0, 0, 0, 0, -45, -20], { hand: -56, foot: 36, farFoot: 36 }, 66, { k: { hand: 1 } })

const reachHold: Beat[] = [{ hold: 0.3, dur: 1.3 }, { hold: 0.9, dur: 1.3 }]

export const MOVES: Record<string, Move> = {
  bear_crawl: gait({ body: bear(0), base: { hand: 46, farHand: 46, foot: -34, farFoot: -34 }, floor: 50, phase: DIAG, duty: 0.65, stride: 30, time: 1.2 }),
  crab_walk: gait({ body: crab(0), base: { hand: -50, farHand: -50, foot: 40, farFoot: 40 }, floor: 50, phase: DIAG, duty: 0.65, stride: 26, time: 1.4, bob: 3, k: { hand: 1, farHand: 1 } }),
  duck_walk: gait({ body: duck(0), base: { foot: 16, farFoot: 16 }, floor: 30, phase: { foot: 0, farFoot: 0.5 }, duty: 0.62, stride: 30, time: 1.2, lift: 10, bob: 1.5 }),
  ape_walk: {
    keys: [apeReach, apeHop, apeLand, apeRaise], mode: 'cycle', ms: 500, flow: 0.1, travel: 52,
    beats: [{ hold: 0.1, dur: 0.6, ease: 'snap' }, { shift: 34, dur: 0.6, ease: 'in' }, { shift: 48, hold: 0.25, dur: 0.4 }, { shift: 48, dur: 0.4, ease: 'out' }],
  },
  kickthrough: { keys: [bear(0), kick], mode: 'cycle', ms: 700, flow: 0.1, beats: [{ hold: 0.3, dur: 0.6, ease: 'snap' }, { hold: 0.4, dur: 1 }] },
  lizard: { keys: lizardWalk, mode: 'cycle', ms: 420, travel: 112, beats: [{ hold: 0.15, dur: 1, ease: 'in' }, { shift: 28, dur: 1, ease: 'out' }, { shift: 56, hold: 0.15, dur: 1, ease: 'in' }, { shift: 84, dur: 1, ease: 'out' }] },
  frogger: { keys: [frogLow, frogHigh], mode: 'cycle', ms: 650, beats: [{ hold: 0.35, dur: 0.6, ease: 'snap' }, { hold: 0.2, dur: 1.1 }] },
  underswitch: { keys: [bear(0), kick, crab(0, false), crab(0)], ms: 650, flow: 0.1, beats: [{ dur: 0.8 }, { dur: 0.7 }, { dur: 0.6, ease: 'out' }, { hold: 0.4 }] },
  // Side monkey: a low wheel, knees tucked, hips up over the hands and down beyond them.
  side_monkey: wheel({ spread: [[110, 30], [80, 35], [40, 30], [80, 35], [110, 30]], knee: 70, time: 0.8, rest: 0.3 }),
  flow_linked: {
    keys: [bear(10), bear(-10), kick, crab(0), frogLow, lizard(1)], mode: 'cycle', ms: 650, flow: 0.1,
    beats: [{ dur: 0.8 }, { dur: 0.6, ease: 'snap' }, { dur: 0.9 }, { dur: 1.1 }, { dur: 1 }, { hold: 0.2, dur: 1 }],
  },
  scorpion_reach: { keys: [bear(0), scorpionLift, scorpion], ms: 1000, beats: [{ hold: 0.4, dur: 0.6 }, { dur: 0.7 }, { hold: 1 }] },
  crab_reach: { keys: [crab(0), crabReach], ms: 900, beats: reachHold },
  ground_improv: {
    keys: [bear(10), apeSquat, kick, crab(0), duck(14), lizard(-1)], mode: 'cycle', ms: 750, flow: 0.1,
    beats: [{ dur: 0.9 }, { dur: 0.6, ease: 'snap' }, { hold: 0.2, dur: 1 }, { dur: 1 }, { dur: 0.9 }, { hold: 0.2, dur: 1 }],
  },
}
