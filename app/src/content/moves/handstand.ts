import { joints, LEN, place, type Beat, type Body, type Move, type Pose } from '../../core/figure'
import { reach } from './legs'
import { armsTo, balance, fit, handOf, headDown, holdBeats, line, pikeTo, set, solve, straight, tempo, toeBox } from './push'

// Inverted, the belly faces -x and the back +x.
/** Handstand: hollow bows the spine toward the back (ribs in), lean tips the legs toward the belly, shoulders elevated (pushed tall). */
const hs = (hollow = 3, lean = 0, u = 0, scap = 5): Pose => [hollow, u, u, u, u, 180 + lean, 180 + lean, 180 + lean, 180 + lean, -hollow, -hollow, scap]
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
const bwTop = hs(-6, -13)
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
const pressLean = fit((t): Pose => [t, -24, -24, -24, -24, -12, -12, -12, -12, t - 10, t - 20], (b) => b.toe.y - b.hand.y, 10, 80)
const pressMid = balance((L) => set([32, -26, -26, -26, -26, 0, 0, 0, 0, 22, 10], [5, 6, 7, 8], L), -175, -40)

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
const ARM = LEN.upper + LEN.fore
const front = (t: number, nu: number, fu: number, nl: number, fl: number, ns = nl, fs = fl): Pose => [t, nu, nu, fu, fu, nl, ns, fl, fs, t, t, 5]
const fHS = front(0, 0, 0, -180, 180)
/**
 * Chest to wall, seen from behind: the hips shift `d` toward the far hand (negative: the near hand) and the
 * unloaded hand lifts to tap its own shoulder. `shift` = d keeps the hands planted.
 */
const tapPose = (d: number, tap: 'near' | 'far' | null): Pose => {
  const p = front(0, 0, 0, -180, 180)
  const b = joints(p, true)
  const y = b.shoulder.y + Math.sqrt((ARM - 0.3) ** 2 - d * d)
  const to: Partial<Record<'hand' | 'farHand', [number, number]>> = {
    hand: tap === 'near' ? [b.nearShoulder.x + 2, b.nearShoulder.y + 4] : [b.nearShoulder.x - d, y],
    farHand: tap === 'far' ? [b.farShoulder.x - 2, b.farShoulder.y + 4] : [b.farShoulder.x - d, y],
  }
  // Elbows bend out to the side.
  const [a, c] = [1, -1].map((k) => reach(p, to, { front: true, k: { hand: k, farHand: -k } }))
  const out = (q: Pose) => { const j = joints(q, true); return j.farElbow.x - j.elbow.x }
  return out(a) > out(c) ? a : c
}
const TAP = 13
const taps: [number, 'near' | 'far' | null, Beat][] = [
  [0, null, { hold: 0.3, dur: 0.7 }], [TAP, null, { dur: 0.5 }], [TAP, 'near', { hold: 0.2, dur: 0.5 }], [TAP, null, { dur: 0.7 }],
  [0, null, { hold: 0.3, dur: 0.7 }], [-TAP, null, { dur: 0.5 }], [-TAP, 'far', { hold: 0.2, dur: 0.5 }], [-TAP, null, { dur: 0.7 }],
]
const tapMove: Move = {
  keys: taps.map(([d, t]) => tapPose(d, t)), front: true, back: true, mode: 'cycle', x: 'hip', ms: 700,
  beats: taps.map(([d, , b]) => ({ ...b, shift: d })),
}
const straddleF = front(0, 0, 0, -135, 135)
const diamond = (() => {
  const s = solve((s) => joints(front(0, 0, 0, -148, 148, s, -s), true).foot.x, 179, 60)
  return front(0, 0, 0, -148, 148, s, -s)
})()
const oneArm = balance((t) => front(t, -100, 0, -140 + t, 140 + t), -30, 30, (b) => b.farHand.x, true)

// Walk: legs lean over the back (+x) and the body travels that way. Each hand is planted 6/8 of the loop,
// sliding back under the hips as they pass, and swings 2/8 ahead. Hand positions in eighths of the stride.
const STEP = 6
const walk = (near: number | null, far: number | null): Pose => {
  const p = hs(2, -6, 0)
  const b = joints(p)
  const at = (e: number | null) => ({ x: b.hand.x + (e ?? 0) * STEP, y: b.hand.y - (e === null ? 16 : 0) })
  return armsTo(armsTo(p, at(near), 1, 'near'), at(far), 1, 'far')
}
const NEAR = [-3, null, 3, 2, 1, 0, -1, -2]
const FAR = [1, 0, -1, -2, -3, null, 3, 2]
const walkKeys = NEAR.map((n, i) => walk(n, FAR[i]))

// Balance: legs drift over the back (palms push) then toward the belly (fingers grip), hips and shoulders correcting.
const swayBack = hs(4, -5, 3, 4)
const swayBelly = hs(1, 4, -3, 6)

// 90° push-up: lower from handstand to a level body on bent arms, centre of mass over the hands.
const ninety = balance((f) => [90, -88, f, -88, f, 269, 269, 269, 269, 86, 105], -60, 60)

const press = (keys: Pose[]): Move => ({ keys, x: 'hand', ms: 900, beats: [{ hold: 0.5, dur: 1.3 }, { dur: 1.5 }, { dur: 1.3, ease: 'out' }, { hold: 0.8 }] })

// Straddle press seen from the front: the trunk points at the viewer in the fold (foreshortened) and rises
// to vertical as the straddled legs leave the floor, sweep out level, then close overhead.
const straddleAt = (trunk: number, lift: number): Pose => {
  const at = (L: number) => front(0, -4, 4, -L, L)
  return at(solve((L) => { const b = joints(at(L), true, false, trunk); return b.hand.y - b.foot.y - LEN.sole - lift }, 5, 90))
}
const SP = [0.2, 0.45, 1, 1]
const straddlePress: Move = {
  keys: [straddleAt(SP[0], 0), straddleAt(SP[1], 4), front(0, -2, 2, -95, 95), fHS], front: true, x: 'hip', ms: 900,
  beats: ([{ hold: 0.5, dur: 1.3 }, { dur: 1.5 }, { dur: 1.3, ease: 'out' }, { hold: 0.8 }] as Beat[]).map((b, i) => ({ ...b, trunk: SP[i] })),
}

export const MOVES: Record<string, Move> = {
  pike_hold: { keys: [pikeEntry, pike, pikeTo(PD, -5, -28)], x: 'hand', beats: holdBeats(1.4, 1.6) },
  wall_walk: { ...walkM, props: [{ t: 'wall', x: Math.round(Math.min(...walkUp.map((p) => footEdge(walkM, p, -1))) - 13) }], ms: 1100, beats: [{ hold: 0.5, dur: 1.4 }, { dur: 1.2, ease: 'out' }, { hold: 0.8 }] },
  ctw_hs: { keys: [ctwArch, ctwHold, ctw(7)], x: 'hand', props: [{ t: 'wall', x: CTW - 12 }], beats: holdBeats(1.4, 1.8) },
  pike_pu: { keys: [pike, pikeLow], x: 'hand', ...tempo(), ms: 800 },
  wall_taps: tapMove,
  kickup: { keys: [lunge, kick, back(HS)], x: 'hand', ms: 800, flow: 0.15, beats: [{ hold: 0.5, dur: 1.1, ease: 'in' }, { dur: 0.8, ease: 'out' }, { hold: 0.8 }] },
  elev_pike_pu: (() => { const m: Move = { keys: [epTop, epBottom], x: 'hand', ...tempo(), ms: 800 }; return { ...m, props: [toeBox(m)] } })(),
  heel_pulls: withWall({ keys: [bwTop, HS, swayBelly], x: 'hand', ms: 900, beats: [{ hold: 0.6, dur: 1.2, ease: 'out' }, { dur: 1 }, { hold: 0.3 }] }),
  wall_hspu_neg: withWall({ keys: [bwTop, bwBottom], x: 'hand', ...tempo(3.2, 1.2, 0.5, 0.4), ms: 900 }),
  free_hs: { keys: [swayBack, HS, swayBelly], x: 'hand', ms: 900, beats: [{ hold: 0.15, dur: 1.4 }, { dur: 1.1 }, { hold: 0.2 }] },
  wall_hspu: withWall({ keys: [bwTop, bwBottom], x: 'hand', ...tempo(), ms: 800 }),
  hs_walk: { keys: walkKeys, mode: 'cycle', x: 'hip', travel: 8 * STEP, ms: 230, beats: walkKeys.map(() => ({ ease: 'lin' })) },
  straddle_press: straddlePress,
  deficit_hspu: withWall({ keys: [bwTop, dfBottom], x: 'hand', y: 'hand', at: [0, -24], props: [{ t: 'bars', x: 0, y: -24 }], ...tempo(2, 1.2), ms: 800 }),
  hs_shapes: { keys: [fHS, straddleF, diamond], front: true, mode: 'cycle', x: 'hip', ms: 1000, beats: [{ hold: 0.5 }, { hold: 0.5 }, { hold: 0.5 }] },
  free_hspu: { keys: [HS, hspuBottom(null)], x: 'hand', ...tempo(2, 1.2), ms: 800 },
  pike_press: press([fold, pressLean, pressMid, back(HS)]),
  oahs: { keys: [straddleF, oneArm], front: true, x: 'farHand', ms: 1300 },
  ninety_pu: { keys: [HS, ninety], x: 'hand', ...tempo(2, 1.3), ms: 800 },
}
