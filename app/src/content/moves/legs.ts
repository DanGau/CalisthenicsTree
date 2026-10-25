import { joints, type Joint, type Move, type Pose, type Pt } from '../../core/figure'

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
export const leg = (dx: number, dy: number, k = 1) => ik(dx, dy, 38, 38, k)
/** Upper and forearm angles reaching (dx, dy) from the shoulder; k = -1 bends the elbow back. */
export const arm = (dx: number, dy: number, k = -1) => ik(dx, dy, 28, 26, k)

type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
const SLOT: Record<Limb, number> = { hand: 1, farHand: 3, foot: 5, farFoot: 7 }

/** Root joint of a limb (shoulder or hip) in hip coordinates. */
function root(p: Pose, l: Limb, front: boolean): Pt {
  const b = joints(p, front)
  const i = SLOT[l]
  const mid = b[l === 'hand' ? 'elbow' : l === 'farHand' ? 'farElbow' : l === 'foot' ? 'knee' : 'farKnee']
  const len = i < 5 ? 28 : 38
  return { x: mid.x - Math.sin(p[i] / D) * len, y: mid.y - Math.cos(p[i] / D) * len }
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

/** Where a joint sits in hip coordinates. */
export const pos = (p: Pose, j: Joint | 'farKnee', front = false): [number, number] => {
  const b = joints(p, front)
  return [b[j].x, b[j].y]
}

/** Adds r degrees to every angle (rotates the whole figure). */
export const rot = (p: Pose, r: number) => p.map((v) => v + r) as Pose

const armsFwd = (t: number, legs: [number, number, number, number]): Pose => [t, 90, 90, 90, 90, ...legs]

// Box squat: thighs level puts the hips 38 up, the box top.
const boxSit = armsFwd(150, [90, 0, 90, 0])
const deep = (t: number): Pose => armsFwd(t, [...leg(16, 26), ...leg(16, 26)] as [number, number, number, number])

// Cossack (front view): bent thigh at 105 puts the foot 28 below the hip; the straight leg reaches it at 68°.
const cossL: Pose = [175, 30, 150, -30, -150, 105, 0, -68, -68]
const cossR: Pose = [185, 30, 150, -30, -150, 68, 68, -105, 0]

const splitTop: Pose = [180, 8, 14, -8, -10, ...leg(32, 66), ...leg(-32, 66)]
const splitLow: Pose = [180, 8, 14, -8, -10, ...leg(30, 38), ...leg(-46, 36)]

// Step-up: near foot on a 40 box, far foot on the floor 40 lower.
const stepLow: Pose = [165, 20, 30, -20, -30, ...leg(22, 32), ...leg(-6, 69)]
const stepTop: Pose = [178, -15, 20, 15, 60, 0, 0, 90, 0]

// Shrimp: back knee lands under the hip; the near hand holds the back foot.
const shrimpPose = (t: number, h: number, kneeDown: boolean, both: boolean, pole: boolean): Pose => {
  const back: [number, number] = kneeDown ? [-20, -150] : [-10, -130]
  let p: Pose = [t, 0, 0, 90, 90, ...leg(12, h), ...back]
  const foot = pos(p, 'farFoot')
  p = reach(p, { hand: foot, ...(both ? { farHand: foot } : {}) }, { k: { hand: 1, farHand: 1 } })
  if (pole) {
    const s = pos(p, 'shoulder')
    p = reach(p, { farHand: [s[0] + 48, s[1]] })
  }
  return p
}
const shrimpTop = (both = false, pole = false) => shrimpPose(172, 74, false, both, pole)
const shrimpLow = (both = false, pole = false) => shrimpPose(145, 36, true, both, pole)

// Sissy: shin leans forward, thigh and torso one straight line leaning back from the knee.
const sissyLow = (pole: boolean): Pose => [215, pole ? 70 : 100, pole ? 90 : 100, pole ? 70 : 100, pole ? 90 : 100, 35, -55, 35, -55]
const sissyTop = (pole: boolean): Pose => [180, pole ? 60 : 90, pole ? 80 : 90, pole ? 60 : 90, pole ? 80 : 90, 0, 0, 0, 0]

// Pistol: deep near leg, far leg level and clear of the floor.
const pistolLow = (free: number): Pose => [130, 90, 90, 90, 90, 100, -30, free, free]
const pistolTop: Pose = [178, 90, 90, 90, 90, 0, 0, 70, 70]

// Bulgarian: near foot pinned on the floor, rear foot on a 40 bench 65 behind it.
const bulg = (h: number, fx: number): Pose => {
  const p: Pose = [178, 8, 14, -8, -10, ...leg(fx, h), 0, 0]
  return reach(p, { farFoot: [fx - 65, h - 40] })
}

// Reverse Nordic: kneel on the shins, lean the straight hip line back from the knee.
const kneel = (lean: number): Pose => [180 + lean, 100 + lean, 100 + lean, 100 + lean, 100 + lean, lean, -90, lean, -90]

export const MOVES: Record<string, Move> = {
  box_squat: { keys: [[178, 80, 90, 80, 90, 0, 0, 0, 0], boxSit], x: 'foot', props: [{ t: 'box', x: -58, w: 34, h: 38 }] },
  squat: { keys: [[178, 90, 90, 90, 90, 0, 0, 0, 0], deep(135)], x: 'foot' },
  cossack: { keys: [cossL, cossR], front: true, ms: 1300 },
  split_squat: { keys: [splitTop, splitLow] },
  step_up: { keys: [stepLow, stepTop], x: 'foot', y: 'foot', at: [0, -40], props: [{ t: 'box', x: -22, w: 50, h: 40 }] },
  assisted_shrimp: { keys: [shrimpTop(false, true), shrimpLow(false, true)], x: 'foot', props: [{ t: 'pole', x: 62 }] },
  bulgarian: { keys: [bulg(70, 26), bulg(38, 30)], x: 'foot', y: 'foot', at: [0, -1], props: [{ t: 'box', x: -84, w: 36, h: 40 }] },
  box_pistol: { keys: [pistolTop, armsFwd(150, [90, 0, 85, 85])], x: 'foot', props: [{ t: 'box', x: -58, w: 34, h: 38 }] },
  shrimp: { keys: [shrimpTop(), shrimpLow()], x: 'foot' },
  sissy: { keys: [sissyTop(true), sissyLow(true)], x: 'foot', props: [{ t: 'pole', x: 52 }] },
  pistol: { keys: [pistolTop, pistolLow(88)], x: 'foot' },
  adv_shrimp: { keys: [shrimpTop(true), shrimpPose(140, 40, false, true, false)], x: 'foot' },
  reverse_nordic: { keys: [kneel(0), kneel(55)], x: 'knee', ms: 1400 },
  deficit_pistol: { keys: [pistolTop, pistolLow(55)], x: 'foot', y: 'foot', at: [0, -40], props: [{ t: 'box', x: -22, w: 40, h: 40 }] },
  full_sissy: { keys: [sissyTop(false), sissyLow(false)], x: 'foot' },
  dragon_pistol: { keys: [[178, 90, 90, 90, 90, 0, 0, -20, 60], [130, 90, 90, 90, 90, 100, -30, 15, 100]], x: 'foot' },
}
