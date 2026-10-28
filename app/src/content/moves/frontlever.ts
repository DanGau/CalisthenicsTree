import { place, type Body, type Move, type Pose } from '../../core/figure'
import { pos, reach } from './legs'
import { body, chestPt, grip, hold, pinned, rep } from './pull'

/** Root of f in [lo, hi] by bisection (f must change sign). */
export const solve = (lo: number, hi: number, f: (x: number) => number) => {
  const s = Math.sign(f(lo))
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (Math.sign(f(mid)) === s) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
/** Scene y of a joint (0 = floor, negative = up). */
export const yOf = (m: Move, p: Pose, j: keyof Body) => place(m, p)[j].y

// Rows: face up, head to the left, heels fixed on the floor, hands fixed on the bar. The bottom angle `t0`
// sets the hand point; the top rotates the straight body about the heels until the chest meets it.
const straight = (t: number): Pose => body(t, t, t - 4, [t + 180, t + 180, t + 180, t + 180], t + 270)
type Arms = (p: Pose) => Pose
/** Top of a row: blades squeezed together, chest proud toward the hands, chin tucked. */
const squeeze = (p: Pose): Pose => { const q = [...p] as Pose; q[9] = p[0] - 10; q[10] = p[0] - 2; q[11] = -3; return q }
/** Shifts each key's angles by whole turns to sit nearest the previous key, so blends take the short way. */
const unwrap = (keys: Pose[]): [Pose, null, Pose[]] => {
  const out = keys.reduce<Pose[]>((acc, k) => {
    const prev = acc.at(-1)
    return [...acc, prev ? (k.map((v, i) => v! - Math.round((v! - prev[i]!) / 360) * 360) as Pose) : k]
  }, [])
  return [out[0], null, out.slice(1)]
}
const rowMove = (t0: number, prop: 'bar' | 'rings', top: Arms = (p) => p, bottom: Arms = (p) => p, ms = 900): Move => {
  const m: Move = { keys: [], x: 'foot', at: [60, 0], ms }
  const H = place(m, straight(t0)).hand
  const gap = (t: number) => {
    const b = place(m, straight(t))
    const c = chestPt(straight(t), 0.7, 16)
    return Math.hypot(b.hip.x + c[0] - H.x, b.hip.y + c[1] - H.y)
  }
  let t1 = t0
  for (let t = t0; t > t0 - 80; t -= 0.25) if (gap(t) < gap(t1)) t1 = t
  // Hands stay on the bar through the pull: intermediate keys re-aim the arms at it.
  const at = (f: number): Pose => {
    const q = straight(t0 + (t1 - t0) * f)
    const p = f === 1 ? squeeze(q) : q
    const hip = place(m, p).hip
    const h: [number, number] = [H.x - hip.x, H.y - hip.y]
    return reach(p, { hand: h, farHand: h }, { k: { hand: -1, farHand: -1 } })
  }
  // Re-aim between keys too: the far arm only when both hands hold the bar.
  const [a, b] = [pos(bottom(at(0)), 'hand'), pos(bottom(at(0)), 'farHand')]
  const both = Math.hypot(a[0] - b[0], a[1] - b[1]) < 1
  const fix = (p: Pose): Pose => {
    const hip = place(m, p).hip
    const h: [number, number] = [H.x - hip.x, H.y - hip.y]
    return reach(p, both ? { hand: h, farHand: h } : { hand: h }, { k: { hand: -1, farHand: -1 } })
  }
  const move = { ...m, ...rep(...unwrap([bottom(at(0)), bottom(at(0.4)), top(at(0.75)), top(at(1))]), { rise: 1, lower: 1.7 }), props: [{ t: prop, x: H.x, y: H.y }] }
  return pinned(move, fix)
}
const oneArm: Arms = (p) => [p[0], p[1], p[2], 90, 90, ...p.slice(5)] as Pose
// Archer: the far arm stays straight, reaching to its ring.
const straightFar: Arms = (p) => [...p.slice(0, 3), p[0] + 255, p[0] + 255, ...p.slice(5)] as Pose

// Feet on a box above hand height: the body tips feet-high; the top key keeps the heels on the box.
const feetUpBase: Move = { keys: [], x: 'hand', y: 'hand', at: [0, -110], props: [], ms: 1000 }
const fuBottom = straight(-82)
const heelY = yOf(feetUpBase, fuBottom, 'heel')
const pulled = (t: number): Pose => { const p = squeeze(straight(t)); return grip(p, chestPt(p, 0.7, 16), -1, true) }
const fuTop = pulled(solve(-120, -60, (t) => yOf(feetUpBase, pulled(t), 'heel') - heelY))
const fb = place(feetUpBase, fuBottom)
const heel = { x: fb.heel.x, y: Math.max(fb.heel.y, fb.foot.y) + 3 }

// Levers: arms straight, hands over the upper chest, face up, head to the left. Shoulders depressed, ribs down.
const bar = { t: 'bar', x: 0, y: -210 } as const
const pin: Move = { keys: [], x: 'hand', y: 'hand', at: [0, -210], props: [bar] }
const lever = (keys: Pose[], ms = 1200): Move => ({ ...pin, keys, ms })
const L = (legs: [number, number, number, number], t = 270, a = 166, s = -3): Pose => body(t, t - 4, t - 6, legs, a, s)
const fl = L([90, 90, 90, 90])
const tuck = L([228, 96, 228, 96], 268, 172)
const advTuck = L([180, 90, 180, 90])
const inverted: Pose = body(360, 360, 360, [180, 180, 180, 180], 180)
// Hips sag before locking level.
const sag = (p: Pose, d = 8): Pose => p.map((v, i) => (i === 0 || i >= 5 && i <= 8 ? v! - d : v)) as Pose
// Squeeze: hips a touch higher, blades pressed down harder.
const tense = (p: Pose): Pose => { const q = sag(p, -2); q[11] = -5; return q }
const lhold = (p: Pose): Move => ({ ...pin, ...hold(sag(p), p, tense(p)), ms: 1000 })
// Bar to the hips with the body level: arms row in to the belly.
const leverRow = (p: Pose) => grip(p, chestPt(p, 0.05, 16), 1, true)
// Pull-up to the bar, chest over, then the straight-arm lean back to a lever.
const chinBody = body(186, 196, 186, [12, 4, 12, 4])
const chinOver = grip(chinBody, chestPt(chinBody, 1, 15), -1, true)

export const MOVES: Record<string, Move> = {
  incline_row: rowMove(-122, 'bar'),
  row: rowMove(-104, 'rings'),
  feet_up_row: { ...feetUpBase, ...rep(fuBottom, null, [fuTop], { rise: 1, lower: 1.7 }), props: [{ t: 'rings', x: 0, y: -110 }, { t: 'box', x: heel.x - 30, w: 50, h: -heel.y }] },
  archer_row: rowMove(-104, 'rings', straightFar),
  tuck_fl: lhold(tuck),
  oa_row: rowMove(-104, 'rings', oneArm, oneArm, 1000),
  adv_tuck_fl: lhold(advTuck),
  tuck_fl_row: { ...pin, ...rep(tuck, null, [leverRow(tuck)], { rise: 1.5, lower: 2.2, top: 0.3, bottom: 0.3 }), ms: 1000 },
  oneleg_fl: { ...lever([L([90, 90, 180, 90]), L([180, 90, 90, 90])], 1000), beats: [{ hold: 1.2, dur: 2 }, { hold: 1.2 }] },
  ice_cream: { ...lever([chinOver, fl], 1000), mode: 'cycle', beats: [{ hold: 0.3, dur: 2.4 }, { hold: 0.6, dur: 1.6 }] },
  straddle_fl: lhold(L([82, 82, 98, 98])),
  full_fl: lhold(fl),
  fl_raise: { ...lever([inverted, fl], 1000), mode: 'cycle', beats: [{ hold: 0.3, dur: 2.5 }, { hold: 0.6, dur: 1.7 }] },
  fl_pullup: { ...pin, ...rep(fl, null, [leverRow(fl)], { rise: 1.6, lower: 2.4, top: 0.3, bottom: 0.3 }), ms: 1000 },
}
