import { joints, LEN, type Beat, type Joint, type Move, type Pose, type Pt } from '../../core/figure'

const D = 180 / Math.PI
const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180

/** Two-segment reach: angles putting the end at (dx, dy) from the root; k picks the bend side (1 = toward +angle). */
export function ik(dx: number, dy: number, a: number, b: number, k: number): [number, number] {
  const d = Math.max(Math.abs(a - b) + 0.01, Math.min(Math.hypot(dx, dy), a + b - 0.01))
  const base = Math.atan2(dx, dy) * D
  const A = Math.acos((a * a + d * d - b * b) / (2 * a * d)) * D
  const u = base + k * A
  const l = u + wrap(Math.atan2(dx - Math.sin(u / D) * a, dy - Math.cos(u / D) * a) * D - u)
  return [u, l]
}
/** Thigh and shin angles reaching (dx, dy) from the hip; k = 1 bends the knee forward. */
export const leg = (dx: number, dy: number, k = 1) => ik(dx, dy, LEN.thigh, LEN.shin, k)
/** Upper and forearm angles reaching (dx, dy) from the shoulder; k = -1 bends the elbow back. */
export const arm = (dx: number, dy: number, k = -1) => ik(dx, dy, LEN.upper, LEN.fore, k)

type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
const SLOT: Record<Limb, number> = { hand: 1, farHand: 3, foot: 5, farFoot: 7 }

/** Root joint of a limb (shoulder or hip) in hip coordinates. */
function root(p: Pose, l: Limb, front: boolean): Pt {
  const b = joints(p, front)
  const i = SLOT[l]
  const mid = b[l === 'hand' ? 'elbow' : l === 'farHand' ? 'farElbow' : l === 'foot' ? 'knee' : 'farKnee']
  const len = i < 5 ? LEN.upper : LEN.thigh
  return { x: mid.x - Math.sin(p[i]! / D) * len, y: mid.y - Math.cos(p[i]! / D) * len }
}

/** Re-aims limbs so each end lands at a point given in hip coordinates. */
export function reach(p: Pose, to: Partial<Record<Limb, [number, number]>>, opts: { front?: boolean; k?: Partial<Record<Limb, number>> } = {}): Pose {
  const out = [...p] as Pose
  for (const [l, [x, y]] of Object.entries(to) as [Limb, [number, number]][]) {
    const r = root(out, l, !!opts.front)
    const k = opts.k?.[l] ?? (SLOT[l] < 5 ? -1 : 1)
    const [u, f] = SLOT[l] < 5 ? arm(x - r.x, y - r.y, k) : leg(x - r.x, y - r.y, k)
    out[SLOT[l]] = u
    out[SLOT[l] + 1] = f
  }
  return out
}

/**
 * Like `reach`, with every limb end on the line y = `floor` (hip coordinates) at the given x:
 * hands rest the palm on it, feet rest the lowest point of the sole.
 */
export function plant(p: Pose, to: Partial<Record<Limb, number>>, floor: number, opts: { front?: boolean; k?: Partial<Record<Limb, number>> } = {}): Pose {
  const at = (drop: Partial<Record<Limb, number>>) =>
    Object.fromEntries(Object.entries(to).map(([l, x]) => [l, [x, floor - (drop[l as Limb] ?? 0)]])) as Partial<Record<Limb, [number, number]>>
  let out = reach(p, at({}), opts)
  for (let i = 0; i < 4; i++) {
    const b = joints(out, !!opts.front)
    const drop: Partial<Record<Limb, number>> = {}
    if (to.foot !== undefined) drop.foot = Math.max(b.toe.y, b.heel.y) - b.foot.y
    if (to.farFoot !== undefined) drop.farFoot = Math.max(b.farToe.y, b.farHeel.y) - b.farFoot.y
    out = reach(p, at(drop), opts)
  }
  return out
}

/** Where a joint sits in hip coordinates. */
export const pos = (p: Pose, j: Joint | 'farKnee', front = false): [number, number] => {
  const b = joints(p, front)
  return [b[j].x, b[j].y]
}

/** Adds r degrees to every angle (rotates the whole figure). */
export const rot = (p: Pose, r: number) => p.map((v) => v! + r) as Pose

/** Standing tall, arms relaxed. */
export const STAND: Pose = [180, 8, 14, -8, -10, 0, 0, 0, 0, 180, 180]
/** Arms reaching forward at shoulder height; c = chest, h = head. */
const fwd = (t: number, c = t, h = 172): Pose => [t, 90, 90, 90, 90, 0, 0, 0, 0, c, h]

// Box squat: hips back to a 38 box, shins near vertical, chest leans to balance.
const boxTop = fwd(180, 180, 180)
const boxSit = plant(fwd(145, 152), { foot: 30, farFoot: 30 }, 44)
const deep = plant(fwd(132, 145, 168), { foot: 22, farFoot: 22 }, 30)

// Cossack (front view): bent thigh at 105 puts the foot 28 below the hip; the straight leg reaches it at 68 degrees.
const cossL: Pose = [175, 30, 150, -30, -150, 105, 0, -68, -68, 172, 180]
const cossR: Pose = [185, 30, 150, -30, -150, 68, 68, -105, 0, 188, 180]

// Split squat: front shin near vertical, back knee drops to just off the floor.
const splitTop = plant([180, 8, 14, -8, -10, 0, 0, 0, 0], { foot: 30, farFoot: -36 }, 76)
const splitLow = plant([180, 8, 14, -8, -10, 0, 0, 0, 0], { foot: 36, farFoot: -42 }, 44)

// Step-up: near foot on a 40 box, far foot on the floor; top: stand tall on the box, far knee up.
const stepLow = plant(plant([160, 30, 40, -30, -20, 0, 0, 0, 0, 165, 172], { foot: 22 }, 58), { farFoot: -16 }, 98)
const stepTop: Pose = [180, -10, 20, 10, 60, 0, 0, 90, 0, 180, 180]

// Shrimp: back knee lands under the hip; the near hand holds the back foot.
const shrimpPose = (t: number, f: number, back: [number, number], both: boolean, pole: boolean): Pose => {
  let p = plant([t, 0, 0, 90, 90, 0, 0, ...back, t + 6, 172], { foot: 12 }, f)
  const foot = pos(p, 'farFoot')
  p = reach(p, { hand: foot, ...(both ? { farHand: foot } : {}) }, { k: { hand: 1, farHand: 1 } })
  if (pole) {
    const s = pos(p, 'shoulder')
    p = reach(p, { farHand: [s[0] + 44, s[1] + 6] })
  }
  return p
}
const shrimpTop = (both = false, pole = false) => shrimpPose(172, 79, [-12, -150], both, pole)
const shrimpLow = (both = false, pole = false, f = 42) => shrimpPose(142, f, [-Math.acos(Math.min(1, (f - 4) / 38)) * 180 / Math.PI - 4, -150], both, pole)

// Sissy: shin leans forward, thigh and torso one straight line leaning back from the knee.
const sissyArms = (pole: boolean): [number, number, number, number] => (pole ? [60, 90, 60, 90] : [100, 100, 100, 100])
const toPole = (p: Pose, pole: boolean): Pose => {
  if (!pole) return p
  const [fx] = pos(p, 'foot')
  const [, sy] = pos(p, 'shoulder')
  return reach(p, { hand: [fx + 46, sy + 14], farHand: [fx + 46, sy + 14] })
}
const sissyLow = (pole: boolean): Pose => toPole([218, ...sissyArms(pole), 38, -58, 38, -58, 218, 190], pole)
const sissyTop = (pole: boolean): Pose => toPole([180, ...sissyArms(pole), 0, 0, 0, 0, 180, 180], pole)

// Pistol: deep near leg, heel down, far leg straight and clear of the floor.
const pistolLow = (free: number): Pose => plant([125, 90, 90, 90, 90, 0, 0, free, free, 138, 165], { foot: 26 }, 24)
const pistolTop: Pose = [180, 90, 90, 90, 90, 0, 0, 70, 70, 180, 180]

// Bulgarian: front foot on the floor, rear instep on a 40 bench behind.
const bulg = (f: number, fx: number): Pose =>
  plant(plant([180, 8, 14, -8, -10, 0, 0, 0, 0, 180, 180], { foot: fx }, f), { farFoot: -44 }, f - 40)

// Reverse Nordic: kneel on the shins, lean the straight hip line back from the knee.
const kneel = (lean: number): Pose => [180 + lean, 90 + lean, 90 + lean, 90 + lean, 90 + lean, lean, -90, lean, -90, 180 + lean, 180 + lean * 0.6]

/** One strength rep as a loop: pause on top, lower over `down`, pause, drive up over `up` (eccentric slower). */
export const rep = (top: Pose, bottom: Pose, down = 1.8, up = 1, pause = 0.15): Pick<Move, 'keys' | 'mode' | 'beats'> => ({
  keys: [top, bottom], mode: 'cycle', beats: [{ hold: 0.35, dur: down }, { hold: pause, dur: up }],
})
/** Beats for a two-key hold: ease into the second key, breathe there. */
export const holdBeats = (enter = 1.2, hold = 1.4): Beat[] => [{ hold: 0.3, dur: enter, ease: 'out' }, { hold, dur: enter }]

export const MOVES: Record<string, Move> = {
  box_squat: { ...rep(boxTop, boxSit, 1.8, 1, 0.3), x: 'foot', props: [{ t: 'box', x: -64, w: 36, h: 38 }] },
  squat: { ...rep(boxTop, deep), x: 'foot' },
  cossack: { keys: [cossL, cossR], front: true, ms: 1300, beats: [{ hold: 0.4 }, { hold: 0.4 }] },
  split_squat: rep(splitTop, splitLow),
  step_up: { keys: [stepLow, stepTop], mode: 'cycle', beats: [{ hold: 0.2, dur: 1 }, { hold: 0.35, dur: 1.6 }], x: 'foot', y: 'foot', at: [0, -45], props: [{ t: 'box', x: -26, w: 52, h: 40 }] },
  assisted_shrimp: { ...rep(shrimpTop(false, true), shrimpLow(false, true), 1.8, 1.1), x: 'foot', props: [{ t: 'pole', x: 60 }] },
  bulgarian: { ...rep(bulg(78, 24), bulg(46, 30)), x: 'foot', props: [{ t: 'box', x: -88, w: 36, h: 40 }] },
  box_pistol: { ...rep(pistolTop, plant([145, 90, 90, 90, 90, 0, 0, 86, 86, 152, 170], { foot: 30 }, 44), 2, 1.1, 0.3), x: 'foot', props: [{ t: 'box', x: -64, w: 36, h: 38 }] },
  shrimp: { ...rep(shrimpTop(), shrimpLow(), 1.9, 1.1), x: 'foot' },
  sissy: { ...rep(sissyTop(true), sissyLow(true), 2, 1.2), x: 'foot', props: [{ t: 'pole', x: 50 }] },
  pistol: { ...rep(pistolTop, pistolLow(87), 2, 1.1), x: 'foot' },
  adv_shrimp: { ...rep(shrimpTop(true), shrimpLow(true, false, 50), 2, 1.2), x: 'foot' },
  reverse_nordic: { ...rep(kneel(0), kneel(55), 2.2, 1.3), x: 'knee', ms: 1100 },
  deficit_pistol: { ...rep(pistolTop, pistolLow(55), 2, 1.2), x: 'foot', y: 'foot', at: [0, -45], props: [{ t: 'box', x: -26, w: 44, h: 40 }] },
  full_sissy: { ...rep(sissyTop(false), sissyLow(false), 2.1, 1.2), x: 'foot' },
  dragon_pistol: { ...rep([180, 90, 90, 90, 90, 0, 0, -15, 40, 180, 180], plant([125, 90, 90, 90, 90, 0, 0, 55, 95, 138, 165], { foot: 26 }, 24), 2.2, 1.3), x: 'foot' },
}
