import { place, type Move, type Pose, type Prop } from '../../core/figure'

// Geometry helpers shared by the pushing branches.
const cos = (d: number) => Math.cos((d * Math.PI) / 180)

/** Straight-leg angle (pointing back) that rests the toes `h` above the hands (negative: below). */
export function legFor(t: number, u: number, f: number, h = 0): number {
  const handY = 50 * cos(t) + 28 * cos(u) + 26 * cos(f)
  const toeY = (L: number) => 76 * cos(L) + 10 * cos(L + 90)
  let lo = -100, hi = 0
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (toeY(mid) < handY - h) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** Height of the toes above the hands for a given straight-leg angle. */
export const toeRise = (t: number, u: number, f: number, L: number) =>
  50 * cos(t) + 28 * cos(u) + 26 * cos(f) - 76 * cos(L) - 10 * cos(L + 90)

/** Plank-type pose: both arms alike, legs straight and solved so the toes land `h` above the hands. */
export const plank = (t: number, u: number, f: number, h = 0): Pose => {
  const L = legFor(t, u, f, h)
  return [t, u, f, u, f, L, L, L, L]
}

/** A box under the toes of the move's first key. */
export function toeBox(m: Move, w = 44): Prop {
  const b = place(m, m.keys[0])
  return { t: 'box', x: Math.round(b.toe.x - w / 2), w, h: Math.round(-b.toe.y) }
}

/** A box under the hands of the move's first key. */
export function handBox(m: Move, w = 40): Prop {
  const b = place(m, m.keys[0])
  return { t: 'box', x: Math.round(b.hand.x - w / 2), w, h: Math.round(-b.hand.y) }
}

const withProps = (m: Move, ...fns: ((m: Move) => Prop)[]): Move => ({ ...m, props: [...(m.props ?? []), ...fns.map((f) => f(m))] })

// Plank at 25°: shoulders one straight arm up.
const top = plank(115, 0, 0)
const bottom = plank(98, -108, 0)
const pushup: Move = { keys: [top, bottom], x: 'hand' }

// Wall: standing lean, hands on the wall at shoulder height.
const wallTop: Pose = [158, 92, 92, 92, 92, -22, -22, -22, -22]
const wallBottom: Pose = [146, -40, 95, -40, 95, -34, -34, -34, -34]

// Incline: hands on a box 45 high.
const incTop = plank(135, 0, 0, -45)
const incBottom = plank(118, -110, 10, -45)

// Diamond: hands together under the chest, elbows squeezed back.
const diaTop = plank(115, -12, -12)
const diaBottom = plank(106, -135, -15)

// Hindu: pike, dive low, cobra.
const hPike = plank(55, 50, 50)
const hDive = plank(95, -110, 0)
const hCobra = plank(140, 5, 5)

// Decline: toes on a box 40 high.
const decTop = plank(100, 0, 0, 40)
const decBottom = plank(83, -110, 0, 40)

// Archer: near arm bends, far arm slides out straight.
const arcBottom = (() => {
  const p = plank(98, -108, 0)
  return [p[0], p[1], p[2], 71, 71, p[5], p[6], p[7], p[8]] as Pose
})()

// Clap: toes pinned, chest pops off the floor.
const clapAir: Pose = [128, 92, 95, 92, 95, top[5], top[6], top[7], top[8]]
const bbAir: Pose = [128, -60, -40, -60, -40, top[5], top[6], top[7], top[8]]
const footAt = (p: Pose): [number, number] => {
  const b = place({ keys: [p], x: 'hand' }, p)
  return [b.foot.x, b.foot.y]
}

// Rings: hands on rings 20 above the floor.
const RING = { t: 'rings', x: 0, y: -22 } as const
const ringTop = plank(124, 0, 0, -22)
const ringBottom = plank(104, -110, 0, -22)
const rtoTop = plank(124, 12, 12, -22)

// One arm: free hand on the back.
const oneArm = (p: Pose, onBack = true): Pose => [p[0], p[1], p[2], p[0] - (onBack ? 215 : 200), p[0] - (onBack ? 150 : 175), p[5], p[6], p[7], p[8]]

// Aztec: pushup, then a pike in the air with hands to toes. Head pinned so the jump stays airborne.
const aztecAir: Pose = [35, 70, 70, 70, 70, 78, 78, 78, 78]
const headAt = (p: Pose): [number, number] => {
  const b = place({ keys: [p], x: 'hand' }, p)
  return [b.head.x, b.head.y]
}

export const MOVES: Record<string, Move> = {
  wall_pu: { keys: [wallTop, wallBottom], x: 'hand', at: [0, 0], props: [{ t: 'wall', x: 0 }] },
  incline_pu: withProps({ keys: [incTop, incBottom], x: 'hand' }, handBox),
  pushup,
  diamond_pu: { keys: [diaTop, diaBottom], x: 'hand' },
  hindu_pu: { keys: [hPike, hDive, hCobra], x: 'hand', ms: 1000 },
  decline_pu: withProps({ keys: [decTop, decBottom], x: 'hand' }, toeBox),
  archer_pu: { keys: [top, arcBottom], x: 'hand' },
  clap_pu: { keys: [bottom, top, clapAir], x: 'foot', y: 'foot', at: footAt(top), ms: 600 },
  ring_pu: { keys: [ringTop, ringBottom], x: 'hand', y: 'hand', at: [0, -22], props: [RING] },
  oap_incline: withProps({ keys: [oneArm(incTop), oneArm(incBottom)], x: 'hand' }, handBox),
  bb_clap: { keys: [bottom, top, bbAir], x: 'foot', y: 'foot', at: footAt(top), ms: 600 },
  rto_pu: { keys: [rtoTop, ringBottom], x: 'hand', y: 'hand', at: [0, -22], props: [RING], ms: 1200 },
  one_arm_pu: { keys: [oneArm(top, false), oneArm(bottom, false)], x: 'hand' },
  aztec_pu: { keys: [top, aztecAir], x: 'hand', y: 'head', at: headAt(top), ms: 650 },
  ring_archer: { keys: [ringTop, (() => { const p = ringBottom; return [p[0], p[1], p[2], 71, 71, p[5], p[6], p[7], p[8]] as Pose })()], x: 'hand', y: 'hand', at: [0, -22], props: [RING, { t: 'rings', x: 71, y: -22 }] },
  oapu_tight: { keys: [oneArm(top), oneArm(bottom)], x: 'hand', ms: 1200 },
}
