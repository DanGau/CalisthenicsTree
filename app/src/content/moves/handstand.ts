import { blend, joints, LEN, place, type Beat, type Body, type Move, type Pose, type Stage } from '../../core/figure'
import { reach } from './legs'
import { armsTo, balance, com3, world, fit, fit3, frame, handOf, headDown, holdBeats, type Key3, legsTo, line, nudge, off, pikeTo, rep, set, solidMove, straight, tempo, toeBox, tween } from './push'

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
  const p: Pose = [168, 160, 162, 160, 162, 0, 0, -35, -35, 172, 170]
  const b = joints(p)
  const q = reach(p, { foot: [b.farFoot.x + 85, b.farToe.y - 5] })
  return q
})()
const kick = (() => {
  const p: Pose = [22, 18, 18, 18, 18, 0, 0, -150, -150, 16, 8]
  return fit((L) => set(p, [5, 6], L), (b) => b.toe.y - b.hand.y, -40, 40)
})()

// Solid keys. Inverted the belly faces -x; legs at 180 point up.
const inv = (t: number, u: number, legs: [number, number, number, number], st: Partial<Stage> = {}, scap = 5): Key3 =>
  ({ p: [t, u, u, u, u, ...legs, t, t, scap], st: { armOut: 4, farArmOut: 4, ...st } })
const turnBy = (k: Key3, v: number): Key3 => ({ p: k.p.map((a, i) => (i <= 10 ? a! + v : a)) as Pose, st: k.st })
const midHands = (b: Body) => (b.hand.x + b.farHand.x) / 2
/** k turned about the hands until the centre of mass is over them. */
const upright = (k: Key3) => fit3(([v]) => turnBy(k, v), [0], (b) => [com3(b).x - midHands(b)])
const UP: [number, number, number, number] = [180, 180, 180, 180]
const legsOut = (o: number) => ({ legOut: o, farLegOut: o })
const sHS = upright(inv(2, 2, UP, {}))
const sStraddle = upright(inv(2, 2, UP, legsOut(45)))
// Stag: the belly-side knee drops forward bent, the other leg reaches back.
const sStag = upright(inv(2, 2, [215, 125, 160, 160]))
// Diamond: knees bent out to the sides, soles together over the hips.
const sDiamond = upright(inv(2, 2, [180, 180, 180, 180], { ...legsOut(45), shinOut: -92, farShinOut: -92 }))
const oneArm = (() => {
  // Hips shift over the near hand: the body rolls until the centre of mass is over it, the free arm out to the side.
  const k = (r: number, v: number): Key3 => turnBy({ p: sStraddle.p, st: { ...sStraddle.st, roll: r, farArmOut: 80 } }, v)
  return fit3(([r, v]) => k(r, v), [0, 0], (b) => [com3(b).x - b.hand.x, com3(b).z - (b.hand.z ?? 0)])
})()

/**
 * Chest to wall, seen from behind and above the hands: the body rolls over one hand and the other hand lifts
 * to tap its own shoulder. Hands stay where the straight key plants them (hip fixed).
 */
const ctwBase = upright(inv(2, 0, [184, 184, 184, 184]))
// Hands planted a little closer than straight arms reach, so the shoulders can travel over either hand.
const HAND = { near: off(frame(ctwBase).hand, frame(ctwBase).hip, [0, 3, 0]), far: off(frame(ctwBase).farHand, frame(ctwBase).hip, [0, 3, 0]) } as unknown as Record<string, [number, number, number]>
type Tap = 'near' | 'far' | null
const TAP_ARM = [-25, 150]
/** The shoulders lean `ROLL` over the supporting hand. */
const ROLL = 6
function tapKey(tap: Tap, roll: number): Key3 {
  const p = ctwBase.p
  const build = ([nu, nf, ao, fu, ff, fo]: number[]): Key3 => ({ p: [p[0], nu, nf, fu, ff, ...p.slice(5)] as Pose, st: { roll, armOut: ao, farArmOut: fo } })
  const tip = (b: Body, h: 'hand' | 'farHand') => off(b[h], h === 'hand' ? b.nearShoulder : b.farShoulder, [-7, 9, 0])
  const [n, f] = [tap === 'near' ? TAP_ARM : [0, 0], tap === 'far' ? TAP_ARM : [0, 0]]
  return fit3(build, [n[0], n[1], 4, f[0], f[1], 4], (b) => [
    ...(tap === 'near' ? tip(b, 'hand') : off(b.hand, b.hip, HAND.near)),
    ...(tap === 'far' ? tip(b, 'farHand') : off(b.farHand, b.hip, HAND.far)),
  ])
}
const taps: [Key3, Beat][] = [
  [tapKey(null, 0), { hold: 0.3, dur: 0.7 }], [tapKey(null, -ROLL), { dur: 0.5 }], [tapKey('near', -ROLL), { hold: 0.2, dur: 0.5 }], [tapKey(null, -ROLL), { dur: 0.7 }],
  [tapKey(null, 0), { hold: 0.3, dur: 0.7 }], [tapKey(null, ROLL), { dur: 0.5 }], [tapKey('far', ROLL), { hold: 0.2, dur: 0.5 }], [tapKey(null, ROLL), { dur: 0.7 }],
]
const tapMove = (() => {
  const m = solidMove(taps.map(([k]) => k), taps.map(([, b]) => b), 55, { mode: 'cycle', x: 'hip', ms: 700 })
  const b = world(m)
  return { ...m, props: [{ t: 'wall', x: Math.round(Math.min(b.toe.x, b.farToe.x, b.shoulder.x - 8)) - 2 } as const] }
})()

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
const swayBelly = hs(1, 4, -3, 6)
/** Wrist correction: forearms tip by w against the upper arms. */
const wrist = (p: Pose, w: number) => nudge(p, { 2: w, 4: w })
/**
 * Free handstand, seconds: the body sways about 0.3 Hz (one sway 3.3 s), hips 2-3 cm, corrected mostly at the
 * wrists about once a second; the spine breathes a little.
 */
const SWAY: [Pose, number][] = [
  [hs(3, 0, 0), 0.6], [wrist(hs(3.5, -2.5, 1), 1), 0.5], [wrist(hs(4, -3, 1.5, 4.5), -1.2), 0.6],
  [hs(3, -0.5, 0.5), 0.55], [wrist(hs(2, 2.5, -1), -1), 0.5], [wrist(hs(1.5, 3, -1.5, 5.5), 1.2), 0.6],
]

// Kick-up, seconds: step in with the arms high, reach and plant, swing the kick leg, push leg follows bent and
// straightens last, the body overshoots into a hollow and settles.
const plant = set(kick, [7, 8], -100)
const follow: Pose = [12, 8, 8, 8, 8, -150, -105, -178, -178, 4, -2, 3]

// 90° push-up: lower from handstand to a level body on bent arms, centre of mass over the hands.
const ninety = balance((f) => [90, -88, f, -88, f, 269, 269, 269, 269, 86, 105], -60, 60)

/** Press, seconds: lean 1.2, hips rise 1.4 (toes drag, then float), legs close 1.3 and settle with a small overshoot. */
const press = (keys: Pose[]): Move => ({
  keys, x: 'hand', ms: 1000, beats: [{ hold: 0.5, dur: 1.2 }, { dur: 0.7 }, { dur: 0.7 }, { dur: 1.1 }, { dur: 0.4 }, { hold: 0.8 }],
})
const pressFloat = legsTo(blend(pressLean, pressMid, 0.5, 'lin'), 8, -175, -5)

/**
 * Straddle press, solid and seen from the front: from a straddled fold the hips rise over the hands, the
 * legs sweep out to the sides and up, then close overhead. Toes leave the floor only once balanced.
 */
const pressKey = (t: number, u: number, L: number, o: number) => inv(t, t + u, [L, L, L, L], legsOut(o), 3)
// Fold: trunk near level, shoulders ahead of the hands, legs wide; then the shoulders lean on until balanced, toes still down.
const pressFold = fit3(([t]) => pressKey(t, -80, 0, 40), [62], (b) => [b.toe.y - b.hand.y])
const toeFromHand = (k: Key3) => { const b = frame(k); return b.toe.x - b.hand.x }
const sPressLean = fit3(([v, a, t]) => turnBy(pressKey(t, a, 4, 42), v), [0, -80, 55], (b) => [com3(b).x - midHands(b), b.toe.y - b.hand.y, b.toe.x - b.hand.x - toeFromHand(pressFold)])
// Down: legs split, the belly-side leg steps down to its straddle spot, then the other follows into the fold.
const DOWN = -180
const sHSdown = upright(inv(2, 2, [DOWN, DOWN, DOWN, DOWN]))
const split = upright(inv(2, 2, [DOWN + 55, DOWN + 55, DOWN - 20, DOWN - 20], { legOut: 15, farLegOut: 15 }))
const stepDown = (() => {
  const b0 = frame(pressFold)
  const toe = off(b0.toe, b0.hand) as [number, number, number]
  const f = pressFold.p
  return fit3(([v, L, t, F]) => turnBy({ p: [t, ...(f.slice(1, 5) as number[]), L, L, F, F, t, t, 3] as unknown as Pose, st: { ...pressFold.st, farLegOut: 25 } }, v),
    [0, f[5]!, f[0], -120], (b) => [...off(b.toe, b.hand, toe), com3(b).x - (b.hand.x + b.toe.x) / 2 - 20])
})()
const straddlePress = solidMove(
  [pressFold, sPressLean, upright(pressKey(28, -35, -60, 75)), upright(pressKey(8, -8, -120, 85)), upright(pressKey(2, 0, -165, 45)), sHSdown, split, stepDown],
  [{ hold: 0.5, dur: 1 }, { dur: 1 }, { dur: 1.1 }, { dur: 1 }, { dur: 0.9, ease: 'out' }, { hold: 0.8, dur: 0.9 }, { dur: 0.8 }, { hold: 0.2, dur: 0.6 }], -40, { x: 'hand', mode: 'cycle' },
)

export const MOVES: Record<string, Move> = {
  pike_hold: { keys: [pikeEntry, pike, pikeTo(PD, -5, -28)], x: 'hand', ms: 1000, beats: holdBeats(1.4, 2) },
  wall_walk: { ...walkM, props: [{ t: 'wall', x: Math.round(Math.min(...walkUp.map((p) => footEdge(walkM, p, -1))) - 13) }], ms: 1100, beats: [{ hold: 0.5, dur: 1.4 }, { dur: 1.2, ease: 'out' }, { hold: 0.8 }] },
  ctw_hs: { keys: [ctwArch, ctwHold, ctw(7)], x: 'hand', props: [{ t: 'wall', x: CTW - 12 }], ms: 1000, beats: holdBeats(1.4, 2) },
  pike_pu: { x: 'hand', ...rep(pike, pikeLow, (f) => tween(pike, pikeLow, f), 1.6, 1) },
  wall_taps: tapMove,
  kickup: {
    keys: [lunge, plant, kick, follow, back(hs(5, 0, -1.5)), back(HS)], x: 'hand', ms: 1000,
    beats: [{ hold: 0.5, dur: 0.6 }, { dur: 0.3 }, { dur: 0.3 }, { dur: 0.3 }, { dur: 0.35 }, { hold: 0.8, dur: 0.8 }],
  },
  elev_pike_pu: (() => { const m: Move = { x: 'hand', ...rep(epTop, epBottom, (f) => tween(epTop, epBottom, f), 1.7, 1) }; return { ...m, props: [toeBox(m)] } })(),
  heel_pulls: withWall({ keys: [bwTop, HS, swayBelly], x: 'hand', ms: 1000, beats: [{ hold: 0.6, dur: 1.2, ease: 'out' }, { dur: 1.5 }, { hold: 0.3 }] }),
  wall_hspu_neg: withWall({ keys: [bwTop, bwBottom], x: 'hand', ...tempo(3.5, 1.3, 0.5, 0.4) }),
  free_hs: { keys: SWAY.map(([p]) => p), mode: 'cycle', x: 'hand', point: true, ms: 1000, beats: SWAY.map(([, dur]) => ({ dur })) },
  wall_hspu: withWall({ keys: [bwTop, bwBottom], x: 'hand', ...tempo(1.8, 1.1) }),
  hs_walk: { keys: walkKeys, mode: 'cycle', x: 'hip', travel: 8 * STEP, ms: 230 },
  straddle_press: straddlePress,
  deficit_hspu: withWall({ keys: [bwTop, dfBottom], x: 'hand', y: 'hand', at: [0, -24], props: [{ t: 'bars', x: 0, y: -24 }], ...tempo(2, 1.2) }),
  hs_shapes: solidMove([sHS, sStraddle, sDiamond, sStag], [{ hold: 0.5 }, { hold: 0.5 }, { hold: 0.5 }, { hold: 0.5 }], -50, { mode: 'cycle', x: 'hand' }),
  free_hspu: { keys: [HS, hspuBottom(null)], x: 'hand', ...tempo(2, 1.2) },
  pike_press: press([fold, pressLean, pressFloat, pressMid, back(hs(5, 0, -1.5)), back(HS)]),
  oahs: solidMove([sStraddle, oneArm, turnBy(oneArm, 1)], holdBeats(1.5, 1.5), -55, { x: 'hand' }),
  ninety_pu: { keys: [HS, ninety], x: 'hand', ...tempo(2.2, 1.5) },
}
