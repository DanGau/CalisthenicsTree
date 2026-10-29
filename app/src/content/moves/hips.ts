import { LEN, solid, type Beat, type Move, type Pose, type Stage } from '../../core/figure'
import { ang, H } from './mobility'

// Climbing hips. Every move is solid and built in world space: the hip is placed by `lift` (height) and
// `shift` (forward) on a hip pin, and each planted hand or foot is solved to its world point [x, height, z].

type V3 = [number, number, number]
type Limb = 'hand' | 'farHand' | 'foot' | 'farFoot'
/** Limb end (and optionally its elbow or knee) as world points; `pole` is the world direction the joint bends toward. */
type Tgt = { end: V3; mid?: V3; pole?: V3 }
export type Key = [Pose, Partial<Stage>]

const D = 180 / Math.PI
const S0: Stage = { lift: 0, shift: 0, turn: 0, trunk: 1, legs: 1, arms: 1, roll: 0, armOut: 0, farArmOut: 0, legOut: 0, farLegOut: 0, foreOut: 0, farForeOut: 0, shinOut: 0, farShinOut: 0, twist: 0 }
const SLOT: Record<Limb, number> = { hand: 1, farHand: 3, foot: 5, farFoot: 7 }
const OUT = { hand: 'armOut', farHand: 'farArmOut', foot: 'legOut', farFoot: 'farLegOut' } as const
const SUB = { hand: 'foreOut', farHand: 'farForeOut', foot: 'shinOut', farFoot: 'farShinOut' } as const
const ROOT = { hand: 'nearShoulder', farHand: 'farShoulder', foot: 'nearHip', farFoot: 'farHip' } as const
const PIN: Pick<Move, 'x' | 'y' | 'at'> = { x: 'hip', y: 'hip', at: [0, 0] }

const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len = (a: V3) => Math.hypot(...a)

/** Sagittal angle and swing out to side `s` of direction `d`, nearest the previous [angle, out]. */
const aim = (d: V3, s: number, [pa, po]: [number, number]): [number, number] => {
  const o = Math.asin(Math.max(-1, Math.min(1, (s * d[2]) / len(d)))) * D
  const a = ang(d[0], d[1])
  const c1: [number, number] = [pa + wrap(a - pa), o]
  const c2: [number, number] = [pa + wrap(a + 180 - pa), po + wrap(180 - o - po)]
  const cost = ([x, y]: [number, number]) => Math.abs(x - pa) + Math.abs(y - po)
  return cost(c1) <= cost(c2) ? c1 : c2
}

/**
 * Hip at world [x, height] (z 0), body turned `st.turn`; each limb in `to` reaches its world target.
 * Arms solve without `twist` or `roll`. `prev` keeps angles continuous between keys.
 */
export function fig(p: Pose, hip: [number, number], to: Partial<Record<Limb, Tgt>>, st: Partial<Stage> = {}, prev?: Key): Key {
  const yaw = (st.turn ?? 0) / D
  const [c, s] = [Math.cos(yaw), Math.sin(yaw)]
  const body = (w: V3, dir = false): V3 => {
    const [dx, dz] = [w[0] - (dir ? 0 : hip[0]), w[2]]
    return [dx * c + dz * s, (dir ? 0 : hip[1]) - w[1], -dx * s + dz * c]
  }
  const b = solid(p, { ...S0, ...st, turn: 0, roll: 0, twist: 0 })
  const out = [...p] as Pose
  const so: Partial<Stage> = { ...st, lift: hip[1], shift: hip[0] }
  for (const [l, t] of Object.entries(to) as [Limb, Tgt][]) {
    const i = SLOT[l]
    const side = l === 'hand' || l === 'foot' ? 1 : -1
    const [l1, l2] = i < 5 ? [LEN.upper, LEN.fore] : [LEN.thigh, LEN.shin]
    const r = b[ROOT[l]]
    const R: V3 = [r.x, r.y, r.z ?? 0]
    let E = body(t.end)
    let M: V3
    if (t.mid) M = body(t.mid)
    else {
      const v = sub(E, R)
      const L = len(v)
      const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(L, l1 + l2 - 0.01))
      const u = mul(v, 1 / L)
      const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
      const pl = body(t.pole ?? (i < 5 ? [-1, -1, 0] : [1, 0, 0]), true)
      const w = sub(pl, mul(u, dot(pl, u)))
      M = add(add(R, mul(u, along)), mul(w, Math.sqrt(Math.max(0, l1 * l1 - along * along)) / len(w)))
      E = add(R, mul(u, d))
    }
    const po = prev?.[1][OUT[l]] ?? 0
    const [a1, o1] = aim(sub(M, R), side, [prev?.[0][i] ?? p[i]!, po])
    const [a2, o2] = aim(sub(E, M), side, [prev?.[0][i + 1] ?? p[i + 1]!, po + (prev?.[1][SUB[l]] ?? 0)])
    ;[out[i], out[i + 1], so[OUT[l]], so[SUB[l]]] = [a1, a2, o1, o2 - o1]
  }
  return [out, so]
}

/** Keys of `f` at each parameter, each continuous with the one before. */
export const chain = <T>(xs: T[], f: (x: T, prev?: Key) => Key) => xs.reduce<Key[]>((ks, x) => [...ks, f(x, ks.at(-1))], [])
const move = (ks: Key[], tm: Beat[], ms = 1000): Pick<Move, 'keys' | 'beats' | 'ms' | 'mode'> =>
  ({ keys: ks.map(([p]) => p), beats: ks.map(([, st], i) => ({ ...st, ...tm[i] })), ms, mode: 'cycle' })
/**
 * A stretch on the breath (as `breathe` in mobility.ts, with every key solved so contacts hold):
 * slide in through `path`, sink on the exhale, release to `rel` on the inhale, sink again, come out.
 */
const breath = (path: Key[], rel: Key, ms = 900) => {
  const s = (sec: number) => (sec * 1000) / ms
  const n = path.length
  const into: Beat[] = path.slice(0, -1).map((_, i) => ({ hold: i ? 0 : s(0.8), dur: s(3.5) / (n - 1) }))
  const out: Beat[] = path.slice(1, -1).map(() => ({ dur: s(2.5) / (n - 1) }))
  return move([...path, rel, path[n - 1], ...path.slice(1, -1).reverse()],
    [...into, { hold: s(0.5), dur: s(4.5) }, { hold: s(0.4), dur: s(4.5) }, { hold: s(0.6), dur: s(2.5) / (n - 1) }, ...out], ms)
}
/** Rep through `ks` (rest, ..., top) and back down: rise `up` s, hold the top `top` s breathing, lower `down` s. */
const repHold = (ks: Key[], top: Key, up = 1, topS = 2, down = 1.8, ms = 1000) => {
  const s = (sec: number) => (sec * 1000) / ms
  const n = ks.length
  const tm: Beat[] = [...ks.slice(0, -1).map((_, i): Beat => ({ hold: i ? 0 : s(0.5), dur: s(up) / (n - 1) })), { hold: s(0.2), dur: s(topS) / 2 },
    { dur: s(topS) / 2 }, { hold: s(0.2), dur: s(down) / (n - 1) }, ...ks.slice(1, -1).map(() => ({ dur: s(down) / (n - 1) }))]
  return move([...ks, top, ks[n - 1], ...ks.slice(1, -1).reverse()], tm, ms)
}
/**
 * Keys solved every 20 ms (ms 1000) as `u` runs through each segment's target in `sec` s (minimum-jerk), starting
 * from the last target, so planted hands and feet hold exactly all loop.
 */
export const sampled = (segs: { u: number; sec: number }[], f: (u: number, prev?: Key) => Key): Pick<Move, 'keys' | 'beats' | 'ms' | 'mode'> => {
  const us: number[] = []
  let a = segs.at(-1)!.u
  for (const g of segs) {
    const n = Math.max(1, Math.round(g.sec / 0.02))
    for (let k = 0; k < n; k++) { const t = k / n; us.push(a + (g.u - a) * t * t * t * (10 - 15 * t + 6 * t * t)) }
    a = g.u
  }
  const ks = chain(us, f)
  return { keys: ks.map(([p]) => p), beats: ks.map(([, st]) => ({ ...st, dur: 0.02 })), ms: 1000, mode: 'cycle' }
}
const steps01 = (n: number) => Array.from({ length: n }, (_, i) => i / (n - 1))
const breathK = (path: Key[], rel: (p: Key) => Key) => breath(path, rel(path.at(-1)!))
const repK = (ks: Key[], top: (p: Key) => Key, ...a: number[]) => repHold(ks, top(ks.at(-1)!), ...a)
const sideOf = (s: number, v: V3): V3 => [v[0], v[1], s * v[2]]
const pair = (s: number) => (s > 0 ? 'foot' : 'farFoot')

// Butterfly: seated tall, soles together, hands holding the feet; the knees sink on each exhale.
const bfly = (k: number, prev?: Key): Key => {
  const t = 174 - 10 * k
  const phi = (42 - 36 * k) / D
  const knee = (s: number): V3 => [0.15, Math.sin(phi), s * Math.cos(phi)]
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t + 4, t - 4], [0, 11], {
    foot: { end: [32, 7, 4], pole: knee(1) }, farFoot: { end: [32, 7, -4], pole: knee(-1) },
    hand: { end: [31, 13, 9], pole: [0, -1, 1] }, farHand: { end: [31, 13, -9], pole: [0, -1, -1] },
  }, {}, prev)
}

// Frog: on all fours, knees wide (`k` each side of the midline), shins straight back, hips rocked to `hx`
// (0 = knee line). The hip height follows from the thighs. `chest` low puts the chest toward the floor.
const frogKey = (k: number, hx: number, t: number, hand: number, prev?: Key): Key => {
  const hh = H.knee + Math.sqrt(LEN.thigh ** 2 - (k - 10) ** 2 - hx ** 2)
  const legs = Object.fromEntries([1, -1].map((s) => [pair(s), { mid: [0, H.knee, s * k], end: [-LEN.shin, H.knee, s * k] } satisfies Tgt]))
  const arms = { hand: { end: [hand, H.hand, 18] as V3, pole: [-0.3, 0.2, 1] as V3 }, farHand: { end: [hand, H.hand, -18] as V3, pole: [-0.3, 0.2, -1] as V3 } }
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t - 4, t - 12], [hx, hh], { ...legs, ...arms }, {}, prev)
}

// Standing turnout: feet `fz` each side at x 0, toes out; knees pushed out over the toes; hip at [hx, hh].
const turnout = (fz: number, hx: number, hh: number, t: number, c: number, arms: Partial<Record<Limb, Tgt>>, prev?: Key): Key =>
  fig([t, 0, 0, 0, 0, 0, 0, 0, 0, c, c], [hx, hh], {
    foot: { end: [0, H.ankle, fz], pole: [0.5, 0, 1] }, farFoot: { end: [0, H.ankle, -fz], pole: [0.5, 0, -1] }, ...arms,
  }, {}, prev)
const WALL = 24
const wallFrog = (hx: number, prev?: Key) =>
  turnout(32, hx, 62, 176, 184, { hand: { end: [WALL - 4, 102, 26], pole: [-1, -1, 1] }, farHand: { end: [WALL - 4, 102, -26], pole: [-1, -1, -1] } }, prev)
const prayer = (s: number, hx: number, hh: number): Tgt => ({ end: [hx + 22, hh + 32, s * 3], pole: [0, -1, s] })
const sumo = (hh: number, hx: number, prev?: Key) => turnout(36, hx, hh, 182, 180, { hand: prayer(1, hx, hh), farHand: prayer(-1, hx, hh) }, prev)

// 90/90 (as pigeon_9090): seated, feet planted wide in front, both knees resting to the near side. A knee lifts
// about its hip-foot line, foot down: the front (near) knee is external rotation, the back (far) knee internal.
const NINETY_FOOT: V3 = [26, H.ankle, 30]
const CHEST_ARMS = { armOut: 20, farArmOut: 20, foreOut: -60, farForeOut: -60 }
const ninety = (near: number, far: number, prev?: Key): Key => {
  // The lifting leg's foot rolls onto its edge, so its ankle rises a little.
  const roll = (a: number) => Math.max(0, a + 4) / 8
  const knee = (a: number): V3 => [0.2, Math.sin(a / D), Math.cos(a / D)]
  return fig([180, 30, 150, 30, 150, 0, 0, 0, 0, 180, 180], [0, 10.6], {
    foot: { end: NINETY_FOOT, pole: knee(near) }, farFoot: { end: add(sideOf(-1, NINETY_FOOT), [0, roll(far), 0]), pole: knee(far) },
  }, CHEST_ARMS, prev)
}

// Active high step: hands on the hips, standing on the far leg; the near knee lifts, turned out a little.
const highStep = (thigh: number, shin: number, out: number, t = 180): Key => {
  const p: Pose = [t, 0, 0, 0, 0, thigh, shin, 0, 0, t, t]
  return fig(p, [0, 81], { hand: { end: [6, 103, 22], pole: [-1, 0, 1] }, farHand: { end: [6, 103, -22], pole: [-1, 0, -1] }, farFoot: { end: [0, H.ankle, -10] } }, { legOut: out, shinOut: -out / 2 })
}

// Loaded high step onto a box (front edge at x 22, top 50): foot up, rock over, stand with the back foot passive.
const BOX = { t: 'box', x: 22, w: 46, h: 50 } as const
const ON_BOX: V3 = [40, BOX.h + H.ankle, 10]
const stepKey = (hip: [number, number], t: number, near: V3, far: V3 | null, farLeg: [number, number], prev?: Key): Key =>
  fig([t, -10, 10, 10, 30, 0, 0, farLeg[0], farLeg[1], t, t], hip, { foot: { end: near }, ...(far ? { farFoot: { end: far } } : {}) }, {}, prev)

// Active straddle: seated, legs straight 45° out, hands planted in front; both heels lift.
const straddle = (heel: number, t: number, prev?: Key): Key => {
  const foot = (s: number): V3 => [52, heel, s * 63]
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t - 6, t - 10], [0, 11], {
    foot: { end: foot(1), pole: [0, 1, 0] }, farFoot: { end: foot(-1), pole: [0, 1, 0] },
    hand: { end: [44, H.hand, 14], pole: [-1, 0, 0.3] }, farHand: { end: [44, H.hand, -14], pole: [-1, 0, -0.3] },
  }, {}, prev)
}

// Drop knee facing a wall: feet wide, the near knee turns in and down, the hips turn the near side to the wall,
// the near hand reaches up it; the near heel lifts as the foot pivots on its ball. `s` 0 (square) to 1 (dropped).
const DK_WALL = 42
const dropKnee = (s: number, prev?: Key): Key => {
  const e = (1 - Math.cos(Math.PI * s)) / 2
  const t = 180 - 8 * e
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t + 6 * e, t + 10 * e], [3 + 6 * e, 74 - 16 * e], {
    foot: { end: [0, H.ankle + 7 * e, 34], pole: [1 - 0.6 * e, -0.7 * e, 1 - 2 * e] },
    farFoot: { end: [0, H.ankle, -34], pole: [1, 0, -0.5] },
    hand: { end: [DK_WALL - 4, 122 + 32 * e, 26 - 12 * e], pole: [-0.5, -1, 1] },
    farHand: { end: [DK_WALL - 4, 116, -30], pole: [-0.5, -1, -1] },
  }, { turn: -50 * e }, prev)
}

// Heel hook curl: on the back, near heel on a bench, far leg straight up; the hamstring drags the hips up.
// Shoulder blades stay planted at x -46, so the trunk pivots there.
const BENCH = { t: 'box', x: 52, w: 40, h: 40 } as const
const HEEL: V3 = [60, BENCH.h + H.ankle, 16]
const heelKey = (u: number, prev?: Key): Key => {
  const hh = H.lie + 30 * u
  const hx = -46 + Math.sqrt(46 ** 2 - (hh - H.lie) ** 2)
  const t = ang(-46 - hx, hh - H.lie)
  return fig([t, 0, 0, 0, 0, 0, 0, t + 245, t + 245, t, -90], [hx, hh], {
    foot: { end: HEEL, pole: [0, 1, 0.2] },
    hand: { end: [-30, H.hand, 30], pole: [0, 1, 1] }, farHand: { end: [-30, H.hand, -30], pole: [0, 1, -1] },
  }, { farLegOut: -4 }, prev)
}

// Toe hook: hanging straight-armed from a bar, near toe hooked under a lower bar in front; the toe pulls the
// hips up toward it as the body leans back. Far leg hangs.
const BAR = 220
const HOOK: [number, number] = [68, 128]
const toeKey = (u: number, prev?: Key): Key => {
  const [t, A] = [180 + 60 * u, 180 - 20 * u]
  const sh: [number, number] = [-54 * Math.sin(A / D), BAR + 54 * Math.cos(A / D)]
  const hip: [number, number] = [sh[0] - 46 * Math.sin(t / D), sh[1] + 46 * Math.cos(t / D)]
  return fig([t, A, A, A, A, 0, 0, 15, 5, t, t - 10 * u], hip, {
    hand: { end: [0, BAR, 18] }, farHand: { end: [0, BAR, -18] },
    foot: { end: [HOOK[0], HOOK[1], 10], pole: [0, 1, 0] },
  }, {}, prev)
}

// Flagging facing a wall: weight onto the far foot, the near leg flags long out and behind, the far hand reaches
// up and across; the near hand holds. `s` 0 (both feet down) to 1 (flagged), `w` a balance wobble.
const flagKey = (s: number, w = 0, prev?: Key): Key => {
  const e = (1 - Math.cos(Math.PI * s)) / 2
  const t = 180 + 4 * w
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t - 3 * e, t], [2, 80 - 2 * e], {
    farFoot: { end: [0, H.ankle, -10] },
    foot: { end: [-18 * e + w, H.ankle + 40 * e, 12 + 40 * e], pole: [1, 0, 0.2] },
    hand: { end: [36, 128, 24], pole: [-0.5, -1, 1] },
    farHand: { end: [36 + 2 * e, 128 + 30 * e, -26 - 16 * e], pole: [-0.5, -1, -1] },
  }, {}, prev)
}

const frogMoves = (k: number, hx: [number, number, number], t: [number, number, number], hand: number) => {
  const path = chain(steps01(4), (u, p) => frogKey(k, hx[0] + (hx[1] - hx[0]) * u, t[0] + (t[1] - t[0]) * u, hand, p))
  return { ...breath(path, frogKey(k, hx[2], t[2], hand, path.at(-1))), ...PIN, solid: true, view: -125, tilt: 35, point: true }
}

const nine = (lift: (u: number) => [number, number]) => repK(chain(steps01(10), (u, p) => ninety(...lift(u), p)), (p) => ninety(...lift(1.04), p), 1, 3, 1.8)

const steps = chain([0, 1, 2, 3, 4], (i, prev) => [
  stepKey([0, 81], 180, [0, H.ankle, 10], [0, H.ankle, -10], [0, 0], prev),
  stepKey([-2, 80], 176, ON_BOX, [0, H.ankle, -10], [0, 0], prev),
  stepKey([20, 74], 150, ON_BOX, [0, H.ankle, -10], [0, 0], prev),
  stepKey([34, 104], 160, ON_BOX, null, [-10, -30], prev),
  stepKey([40, 131], 180, ON_BOX, null, [-4, -12], prev),
][i])

// Foot raise facing a wall at arm's length, hands on it: the near foot lifts and is placed as high on the wall as it
// goes, hips square, standing leg straight. `u` 0 (down) to 1 (placed at shoulder height), above 1 a breath.
const FR_WALL = 52
const footRaise = (u: number, prev?: Key): Key => {
  const e = Math.min(u, 1)
  const b = Math.max(0, u - 1) / 0.04
  const t = 180 - 5 * e - b
  const lift = Math.min(1, e / 0.6)
  const foot: V3 = [8 + (FR_WALL - 12) * e - 22 * Math.sin(Math.PI * e), H.ankle + 118 * e * e + 30 * Math.sin(Math.PI * e) * (1 - e), 10]
  return fig([t, 0, 0, 0, 0, 0, 0, 0, 0, t, t + 2], [-6 * e, 81 - 6 * lift], {
    foot: { end: foot, pole: [1, 0.6, 0.1] }, farFoot: { end: [0, H.ankle, -10] },
    hand: { end: [FR_WALL - 4, 132, 24], pole: [-0.3, -1, 1] }, farHand: { end: [FR_WALL - 4, 132, -24], pole: [-0.3, -1, -1] },
  }, {}, prev)
}

// Lateral foot reach facing the wall, hips to it: the far foot stays, the near foot steps out sideways on its toe,
// knee turned out; the hips sink as the feet spread. `u` 0 to 1 (reach 88 between feet), above 1 a breath.
const LR_WALL = 24
const lateralReach = (u: number, prev?: Key): Key => {
  const e = Math.min(u, 1)
  const b = Math.max(0, u - 1) / 0.04
  const z = 14 + 56 * e
  const hh = Math.min(80, H.ankle + 2 + Math.sqrt(73 ** 2 - (z - 9) ** 2 - 8 ** 2)) - b
  return fig([178, 0, 0, 0, 0, 0, 0, 0, 0, 184, 184], [8, hh], {
    foot: { end: [0, H.ankle + 2 + 5 * Math.sin(Math.PI * e), z], pole: [0.4, 0, 1] }, farFoot: { end: [0, H.ankle, -18], pole: [0.4, 0, -1] },
    hand: { end: [LR_WALL - 4, hh + 40, 26], pole: [-1, -1, 1] }, farHand: { end: [LR_WALL - 4, hh + 40, -26], pole: [-1, -1, -1] },
  }, {}, prev)
}

export const MOVES: Record<string, Move> = {
  // Knees sink toward the floor on the exhale; the spine stays long, hands on the feet.
  butterfly: { ...breathK(chain(steps01(8), bfly), (p) => bfly(0.8, p)), ...PIN, solid: true, view: 60, tilt: 15 },
  // Seen from above and behind: hips rock forward toward the knee line on the exhale, shins parallel.
  frog: frogMoves(38, [-20, -8, -11], [104, 106, 105], 46),
  // Knees wider, hips at the knee line and the pelvis near the floor; chest down on bent arms.
  frog_master: frogMoves(47, [-7, 0, -2], [96, 94, 95], 58),
  // Standing frog facing the wall: feet out, knees wide, hips press to the wall while the chest stays off it.
  wall_frog: { ...breathK(chain([-2, 3, 8], wallFrog), (p) => wallFrog(5, p)), ...PIN, solid: true, view: -135, tilt: 30, props: [{ t: 'wall', x: WALL }] },
  // Front view: sumo squat, toes out, knees back over them; the hips settle forward to knee height.
  turnout_squat: { ...breathK(chain([[70, 0], [60, 3.5], [50, 7]] as const, ([h, x], p) => sumo(h, x, p)), (p) => sumo(53, 6, p)), ...PIN, solid: true, view: 80, tilt: 10 },
  // 90/90 front-knee lift: the near knee rises off the floor, foot down, torso tall.
  ext_rot: { ...nine((u) => [-4 + 50 * u, -4]), ...PIN, solid: true, view: 60, tilt: 20 },
  // 90/90 back-knee lift: the far knee rises, hips square.
  int_rot: { ...nine((u) => [-4, -4 + 42 * u]), ...PIN, solid: true, view: 60, tilt: 20 },
  // Knee drives up past hip height, held, lowered with control; the torso stays tall.
  high_step: {
    ...repHold([highStep(0, 0, 0), highStep(60, -20, 10), highStep(122, 15, 22)], highStep(124, 14, 23, 179), 0.9, 2.5, 1.5),
    ...PIN, solid: true, view: 50, tilt: 10,
  },
  // Foot onto the box, rock over it, stand up with the back foot passive; step down the same way.
  high_step_load: {
    keys: steps.map(([p]) => p), ...PIN, solid: true, view: 40, tilt: 10, props: [BOX], ms: 1000,
    beats: steps.map(([, st], i) => ({ ...st, ...[{ hold: 0.6, dur: 1 }, { hold: 0.3, dur: 0.9 }, { dur: 0.7 }, { dur: 0.7 }, { hold: 0.8 }][i] })),
  },
  // Lean in, hands down, and lift both straight legs off the floor; hold 2 s.
  active_straddle: { ...repK(chain([[H.ankle, 150], [8.5, 148.5], [12, 147]] as const, ([h, t], p) => straddle(h, t, p)), (p) => straddle(13, 146, p), 0.7, 2, 1.2), ...PIN, solid: true, view: 60, tilt: 15 },
  // From behind: near knee turns in and down, hips turn to the wall, near hand reaches high; 3 s hold.
  drop_knee: { ...repK(chain(steps01(8), dropKnee), (p) => dropKnee(0.96, p), 1.2, 3, 1.5), ...PIN, solid: true, view: -140, tilt: 15, props: [{ t: 'wall', x: DK_WALL }] },
  // One leg: heel pulls into the bench and the hips lift; 3 s hold at the top.
  heel_hook: { ...repK(chain(steps01(6), heelKey), (p) => heelKey(0.97, p), 1, 3, 1.8), ...PIN, solid: true, view: 30, tilt: 15, props: [BENCH] },
  // Toe pulls the hips up and in toward the lower bar, leg straight.
  toe_hook: {
    ...repK(chain(steps01(6), toeKey), (p) => toeKey(0.97, p), 1.2, 1, 1.8), ...PIN, solid: true, view: 35, floor: false,
    props: [{ t: 'bar', x: 0, y: -BAR }, { t: 'bar', x: HOOK[0], y: -(HOOK[1] + 9) }],
  },
  // Back flag: weight over the far foot, near leg long behind, far hand reaches across; small balance wobble.
  flagging: {
    ...move([flagKey(0), flagKey(0.5), flagKey(1), flagKey(1, 1.5), flagKey(1, -1)], [{ hold: 0.6, dur: 0.8 }, { dur: 0.8 }, { hold: 0.2, dur: 1.5 }, { dur: 1.5 }, { hold: 0.3, dur: 1.6 }]),
    ...PIN, solid: true, view: -130, tilt: 10, props: [{ t: 'wall', x: 40 }],
  },
  // Lift, place the toe high on the wall, hold 2 s breathing, lower.
  foot_raise: {
    ...sampled([{ u: 0, sec: 0.6 }, { u: 1, sec: 1.4 }, { u: 1.04, sec: 1.2 }, { u: 1, sec: 1.2 }, { u: 0, sec: 1.2 }], footRaise),
    ...PIN, solid: true, view: -125, tilt: 10, props: [{ t: 'wall', x: FR_WALL }],
  },
  // Near foot steps out along the wall, hold 2 s, steps back.
  lateral_reach: {
    ...sampled([{ u: 0, sec: 0.6 }, { u: 1, sec: 1.6 }, { u: 1.04, sec: 1.2 }, { u: 1, sec: 1.2 }, { u: 0, sec: 1.2 }], lateralReach),
    ...PIN, solid: true, view: -140, tilt: 25, props: [{ t: 'wall', x: LR_WALL }],
  },
}
