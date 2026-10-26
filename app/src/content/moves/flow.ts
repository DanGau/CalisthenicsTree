import type { Beat, Joint, Move, Pose } from '../../core/figure'
import { plant, pos, reach } from './legs'

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

// Gaits as a tracking camera sees them: planted limbs slide back, the swinging diagonal lifts and reaches forward.
const bearWalk = [bear(10), raise(bear(0), ['farHand', 'foot']), bear(-10), raise(bear(0), ['hand', 'farFoot'])]
const crabWalk = [crab(10), raise(crab(0), ['farHand', 'foot'], { farHand: 1 }), crab(-10), raise(crab(0), ['hand', 'farFoot'], { hand: 1 })]
const duckWalk = [duck(14), raise(duck(0), ['farFoot']), duck(-14), raise(duck(0), ['foot'])]

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

// Side monkey (front view): squat, hands plant to the right, hips turn up and over, land low on the right.
const monkeySquat: Pose = plant([180, 15, 5, -15, -5, 0, 0, 0, 0], { foot: -26, farFoot: 26 }, 34, { front: true, k: { foot: -1, farFoot: 1 } })
const monkeyOver: Pose = plant([105, 0, 0, 0, 0, -150, -110, -175, -135], { hand: 64, farHand: 34 }, 44, { front: true, k: { hand: 1, farHand: 1 } })

// Scorpion: from beast the far leg lifts and curls over toward the far side, eyes on the foot.
const scorpion: Pose = (() => { const p = bear(0); p[7] = -150; p[8] = 110; p[10] = 140; return p })()

// Crab reach: hips drive up, chest opens, the far arm sweeps overhead.
const crabReach: Pose = plant([-62, 0, 0, -165, -175, 0, 0, 0, 0, -45, -20], { hand: -56, foot: 36, farFoot: 36 }, 66, { k: { hand: 1 } })

/** Four-key gait moving `travel` per loop: the hips advance steadily, so planted limbs stay put on the ground. */
const gait = (travel: number): Pick<Move, 'beats' | 'travel'> => ({ travel, beats: [0, 1, 2, 3].map((i): Beat => ({ shift: (travel * i) / 4, ease: 'lin' })) })
const reachHold: Beat[] = [{ hold: 0.3, dur: 1.3 }, { hold: 0.9, dur: 1.3 }]

export const MOVES: Record<string, Move> = {
  bear_crawl: { keys: bearWalk, mode: 'cycle', ms: 330, ...gait(40) },
  crab_walk: { keys: crabWalk, mode: 'cycle', ms: 360, ...gait(40) },
  duck_walk: { keys: duckWalk, mode: 'cycle', ms: 330, ...gait(56) },
  ape_walk: {
    keys: [apeReach, apeHop, apeLand, apeRaise], mode: 'cycle', ms: 500, flow: 0.1, travel: 52,
    beats: [{ hold: 0.1, dur: 0.6, ease: 'snap' }, { shift: 34, dur: 0.6, ease: 'in' }, { shift: 48, hold: 0.25, dur: 0.4 }, { shift: 48, dur: 0.4, ease: 'out' }],
  },
  kickthrough: { keys: [bear(0), kick], mode: 'cycle', ms: 700, flow: 0.1, beats: [{ hold: 0.3, dur: 0.6, ease: 'snap' }, { hold: 0.4, dur: 1 }] },
  lizard: { keys: lizardWalk, mode: 'cycle', ms: 420, travel: 112, beats: [{ hold: 0.15, dur: 1, ease: 'in' }, { shift: 28, dur: 1, ease: 'out' }, { shift: 56, hold: 0.15, dur: 1, ease: 'in' }, { shift: 84, dur: 1, ease: 'out' }] },
  frogger: { keys: [frogLow, frogHigh], mode: 'cycle', ms: 650, beats: [{ hold: 0.35, dur: 0.6, ease: 'snap' }, { hold: 0.2, dur: 1.1 }] },
  underswitch: { keys: [bear(0), kick, crab(0, false), crab(0)], ms: 650, flow: 0.1, beats: [{ dur: 0.8 }, { dur: 0.7 }, { dur: 0.6, ease: 'out' }, { hold: 0.4 }] },
  side_monkey: { keys: [monkeySquat, monkeyOver, monkeySquat], mode: 'cycle', front: true, ms: 650, flow: 0.12, beats: [{ hold: 0.3, dur: 0.55, ease: 'snap' }, { dur: 0.7, ease: 'in' }, { hold: 0.2, dur: 0.01 }] },
  flow_linked: {
    keys: [bear(10), bear(-10), kick, crab(0), frogLow, lizard(1)], mode: 'cycle', ms: 650, flow: 0.1,
    beats: [{ dur: 0.8 }, { dur: 0.6, ease: 'snap' }, { dur: 0.9 }, { dur: 1.1 }, { dur: 1 }, { hold: 0.2, dur: 1 }],
  },
  scorpion_reach: { keys: [bear(0), scorpion], ms: 900, beats: reachHold },
  crab_reach: { keys: [crab(0), crabReach], ms: 900, beats: reachHold },
  ground_improv: {
    keys: [bear(10), apeSquat, kick, crab(0), duck(14), lizard(-1)], mode: 'cycle', ms: 750, flow: 0.1,
    beats: [{ dur: 0.9 }, { dur: 0.6, ease: 'snap' }, { hold: 0.2, dur: 1 }, { dur: 1 }, { dur: 0.9 }, { hold: 0.2, dur: 1 }],
  },
}
