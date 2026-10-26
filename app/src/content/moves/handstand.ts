import { joints, LEN, place, type Body, type Move, type Pose } from '../../core/figure'
import { reach } from './legs'
import { armsTo, balance, fit, handOf, headDown, line, pikeTo, set, solve, straight, toeBox } from './push'

// Inverted, the belly faces -x and the back +x.
/** Handstand: hollow bows the spine toward the back (ribs in), lean tips the legs toward the belly. */
const hs = (hollow = 3, lean = 0, u = 0): Pose => [hollow, u, u, u, u, 180 + lean, 180 + lean, 180 + lean, 180 + lean, -hollow, -hollow]
const HS = hs()
/** Same pose with the legs wound back a turn, so a blend from legs behind the body swings them up over the back. */
const back = (p: Pose): Pose => p.map((v, i) => (i >= 5 && i <= 8 ? v! - 360 : v)) as Pose

const footPts = (b: Body) => [b.toe, b.heel, b.foot, b.farToe, b.farHeel, b.farFoot]
const minX = (b: Body) => Math.min(...footPts(b).map((p) => p.x))
const maxX = (b: Body) => Math.max(...footPts(b).map((p) => p.x))
/** Rightmost (side 1) or leftmost (side -1) foot point of a placed key. */
const footEdge = (m: Move, p: Pose, side: 1 | -1) => (side > 0 ? maxX : minX)(place(m, p))

// Pike: hands 95 ahead of the toes. Entry has the shoulders behind the hands; the hold opens them past the ears.
const PD = 95
const pikeEntry = pikeTo(PD, 28, 0)
const pike = pikeTo(PD, 0, -25)
const pikeLow = headDown(PD, 0, 22)

// Wall walk: feet on the wall, hands on the floor walk in. Chest to wall: hands 15 out, toes touch the wall.
const CTW = -15
const ctw = (hollow: number) => fit((L) => set(hs(hollow), [5, 6, 7, 8], L), (b) => minX(b) - b.hand.x - CTW - 1, 180, 200)
const ctwArch = fit((L) => set([-5, 0, 0, 0, 0, 0, 0, 0, 0, 8, 14], [5, 6, 7, 8], L), (b) => minX(b) - b.hand.x - CTW - 1, 180, 200)
const ctwHold = ctw(4)
const walkUp = [straight((t) => line(t, -6), 0), line(52, -4), back(ctwHold)]
const walkM: Move = { keys: walkUp, x: 'foot', at: [0, 0] }

// Elevated pike: hips at 90°, feet on a box; the head lands ahead of the hands.
const epTop: Pose = [10, 10, 10, 10, 10, -80, -80, -80, -80, 10, -5]
const epH = handOf(epTop)
const epBottom = headDown(epH.x, -epH.y)

// Back to the wall (+x): heels rest on it with a slight arch.
const bwTop = hs(-5, -9)
const wallX = (m: Move) => Math.round(footEdge(m, m.keys[0], 1) + 1)
const withWall = (m: Move): Move => ({ ...m, props: [...(m.props ?? []), { t: 'wall', x: wallX(m) }] })
/** HSPU bottom: head on the floor 24 toward the belly, elbows back over the hands, heels sliding down the wall at wx. */
function hspuBottom(wx: number | null, drop = 0, t = -10): Pose {
  const shape = (L: number): Pose => {
    const p: Pose = [t, 0, 0, 0, 0, L, L, L, L, t + 4, t - 10]
    const b = joints(p)
    const to = { x: b.head.x + 24, y: b.head.y + LEN.head - drop }
    // Elbows back over the hands, toward the wall side.
    const [a, c] = [-1, 1].map((k) => armsTo(p, to, k))
    return joints(a).elbow.x > joints(c).elbow.x ? a : c
  }
  if (wx === null) return balance(shape, 150, 215)
  return fit(shape, (b) => maxX(b) - b.hand.x - wx, 150, 215)
}
const bwM: Move = { keys: [bwTop], x: 'hand' }
const WX = wallX(bwM)
const bwBottom = hspuBottom(WX)
const dfBottom = hspuBottom(WX, 22)

// Press: hands fixed. Fold, then lean the shoulders past the hands so the hips rise with the toes dragging, then float.
const fold = fit((u) => set([12, u, u, u, u, -4, -4, -4, -4, 4, -10], [1, 2, 3, 4], u), (b) => b.toe.y - b.hand.y, 0, 90)
const pressLean = (spread: number) => {
  const shape = (t: number): Pose => [t, -24, -24, -24, -24, -12 - spread, -12 - spread, -12 + spread, -12 + spread, t - 10, t - 20]
  return fit(shape, (b) => b.toe.y - b.hand.y, 10, 80)
}
const pressMid = (spread: number) => balance((L) => set(set([32, -26, -26, -26, -26, 0, 0, 0, 0, 22, 10], [5, 6], L - spread), [7, 8], L + spread), -175, -40)

// Kick-up: lunge with arms overhead, hands plant, the back leg swings up over the back, the push leg follows.
const lunge = (() => {
  const p: Pose = [168, 160, 162, 160, 162, 0, 0, -22, -22, 172, 170]
  const b = joints(p)
  const q = reach(p, { foot: [b.farFoot.x + 98, b.farToe.y - 5] })
  return q
})()
const kick = (() => {
  const p: Pose = [22, 18, 18, 18, 18, 0, 0, -150, -150, 16, 8]
  return fit((L) => set(p, [5, 6], L), (b) => b.toe.y - b.hand.y, -40, 40)
})()

// Front view: near limbs on the viewer's left.
const front = (t: number, nu: number, fu: number, nl: number, fl: number, ns = nl, fs = fl): Pose => [t, nu, nu, fu, fu, nl, ns, fl, fs]
const fHS = front(0, 0, 0, -180, 180)
/** Shift the hips over the far hand, the near hand taps its shoulder. */
const tap = (() => {
  const p = front(-3, 0, -9, -183, 177)
  const b = joints(p, true)
  return reach(p, { hand: [b.nearShoulder.x - 4, b.nearShoulder.y - 6] }, { front: true, k: { hand: 1 } })
})()
const straddleF = front(0, 0, 0, -135, 135)
const diamond = (() => {
  const s = solve((s) => joints(front(0, 0, 0, -148, 148, s, -s), true).foot.x, 179, 60)
  return front(0, 0, 0, -148, 148, s, -s)
})()
const oneArm = balance((t) => front(t, -100, 0, -140 + t, 140 + t), -30, 30, (b) => b.farHand.x, true)

// Walk: lean toward the belly, legs counter; hands step on a treadmill under the hips.
const walk = (near: number, far: number, lift: 'near' | 'far' | null): Pose => {
  const p = hs(1, 8, 8)
  const b = joints(p)
  const at = (dx: number, up: boolean) => ({ x: b.hand.x + dx, y: b.hand.y - (up ? 7 : 0) })
  return armsTo(armsTo(p, at(near, lift === 'near'), 1, 'near'), at(far, lift === 'far'), 1, 'far')
}

// 90° push-up: lower from handstand to a level body on bent arms, centre of mass over the hands.
const ninety = balance((f) => [90, -88, f, -88, f, 269, 269, 269, 269, 86, 105], -60, 60)

export const MOVES: Record<string, Move> = {
  pike_hold: { keys: [pikeEntry, pike], x: 'hand', ms: 1300 },
  wall_walk: { ...walkM, props: [{ t: 'wall', x: Math.round(Math.min(...walkUp.map((p) => footEdge(walkM, p, -1))) - 13) }], ms: 1100 },
  ctw_hs: { keys: [ctwArch, ctwHold], x: 'hand', props: [{ t: 'wall', x: CTW - 12 }], ms: 1300 },
  pike_pu: { keys: [pike, pikeLow], x: 'hand' },
  wall_taps: { keys: [fHS, tap], front: true, x: 'farHand', ms: 800 },
  kickup: { keys: [lunge, kick, back(HS)], x: 'hand', ms: 800 },
  elev_pike_pu: (() => { const m: Move = { keys: [epTop, epBottom], x: 'hand' }; return { ...m, props: [toeBox(m)] } })(),
  heel_pulls: withWall({ keys: [bwTop, HS], x: 'hand', ms: 1200 }),
  wall_hspu_neg: withWall({ keys: [bwTop, bwBottom], x: 'hand', ms: 1900 }),
  free_hs: { keys: [hs(-2, -6, 4), HS], x: 'hand', ms: 1400 },
  wall_hspu: withWall({ keys: [bwTop, bwBottom], x: 'hand' }),
  hs_walk: { keys: [walk(-10, 10, null), walk(0, -10, 'far'), walk(10, -10, null), walk(-10, 0, 'near')], mode: 'cycle', x: 'hip', ms: 450 },
  straddle_press: { keys: [fold, pressLean(6), pressMid(6), back(HS)], x: 'hand', ms: 1200 },
  deficit_hspu: withWall({ keys: [bwTop, dfBottom], x: 'hand', y: 'hand', at: [0, -24], props: [{ t: 'bars', x: 0, y: -24 }] }),
  hs_shapes: { keys: [fHS, straddleF, diamond], front: true, mode: 'cycle', x: 'hip', ms: 1000 },
  free_hspu: { keys: [HS, hspuBottom(null)], x: 'hand', ms: 1100 },
  pike_press: { keys: [fold, pressLean(0), pressMid(0), back(HS)], x: 'hand', ms: 1200 },
  oahs: { keys: [straddleF, oneArm], front: true, x: 'farHand', ms: 1300 },
  ninety_pu: { keys: [HS, ninety], x: 'hand', ms: 1200 },
}

