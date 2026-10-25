import type { Move, Pose } from '../../core/figure'

const bar = { t: 'bar', x: 0, y: -210 } as const
const hangPin = { x: 'hand' as const, y: 'hand' as const, at: [0, -210] as [number, number], props: [bar] }
const hang: Pose = [180, 180, 180, 180, 180, 0, 0, 0, 0]
const table: Pose = [-90, 180, 180, 180, 180, 180, 90, 180, 90]
const hollow: Pose = [-100, -100, -100, -100, -100, 100, 100, 100, 100]
const rock = (p: Pose, d: number) => p.map((a) => a + d) as Pose
// Parallettes 30 up: hip sits 34 up, so level legs clear the floor.
const bars = { t: 'bars', x: 0, y: -30 } as const
const supportPin = { x: 'hand' as const, y: 'hand' as const, at: [0, -30] as [number, number], props: [bars] }
const feetDown: Pose = [180, 0, 0, 0, 0, 100, 0, 100, 0]
const tuck: Pose = [180, 0, 0, 0, 0, 145, 10, 145, 10]
const ell: Pose = [180, 0, 0, 0, 0, 90, 90, 90, 90]
// Dragon flag: shoulders on a bench, body pivots as one piece from the shoulders.
const bench = { t: 'box', x: -70, w: 70, h: 40 } as const
const dragonPin = { x: 'shoulder' as const, y: 'shoulder' as const, at: [-10, -50] as [number, number], props: [bench] }
const dragon = (t: number, tuckIt = false): Pose =>
  [t, -100, -10, -100, -10, tuckIt ? t + 130 : t + 180, tuckIt ? t + 10 : t + 180, tuckIt ? t + 130 : t + 180, tuckIt ? t + 10 : t + 180]

export const MOVES: Record<string, Move> = {
  dead_bug: {
    keys: [table, [-90, -95, -95, 180, 180, 180, 90, 95, 95], table, [-90, 180, 180, -95, -95, 95, 95, 180, 90]],
    mode: 'cycle', ms: 1100,
  },
  hollow_hold: { keys: [hollow, [-102, -102, -102, -102, -102, 102, 102, 102, 102]], ms: 1400 },
  arch_hold: { keys: [[95, 95, 95, 95, 95, -95, -95, -95, -95], [108, 108, 108, 108, 108, -106, -106, -106, -106]], ms: 1300 },
  hollow_rock: { keys: [rock(hollow, -14), rock(hollow, 14)], ms: 700 },
  knee_raise: { keys: [hang, [176, 175, 175, 175, 175, 140, 10, 140, 10]], ...hangPin },
  rollout_knee: { keys: [[109, 0, 0, 0, 0, -10, -105, -10, -105], [97, 62, 62, 62, 62, -60, -105, -60, -105]], x: 'knee', ms: 1200 },
  tuck_lsit: { keys: [feetDown, tuck], ...supportPin, ms: 1000 },
  leg_raise: { keys: [hang, [176, 178, 178, 178, 178, 90, 90, 90, 90]], ...hangPin },
  tuck_dragon: { keys: [dragon(0, true), dragon(-70, true)], ...dragonPin, ms: 1500 },
  lsit: { keys: [tuck, ell], ...supportPin, ms: 1000 },
  ttb: { keys: [hang, [200, 160, 160, 160, 160, 170, 170, 170, 170]], ...hangPin, ms: 1000 },
  dragon_flag: { keys: [dragon(0), dragon(-75)], ...dragonPin, ms: 1600 },
  lsit_30: { keys: [ell, [181, 0, 0, 0, 0, 93, 93, 93, 93]], ...supportPin, ms: 2000 },
  wipers: {
    keys: [[180, 180, 180, 180, 180, 150, 150, 150, 150], [180, 180, 180, 180, 180, 210, 210, 210, 210]],
    front: true, ...hangPin, ms: 1100,
  },
  standing_rollout: {
    keys: [[62, 0, 0, 0, 0, 0, 0, 0, 0], [96, 59, 59, 59, 59, -80, -80, -80, -80]], x: 'foot', ms: 1400,
  },
  vsit: { keys: [[200, -5, -5, -5, -5, 90, 90, 90, 90], [200, -5, -5, -5, -5, 130, 130, 130, 130]], ms: 1200 },
  v120: { keys: [[205, -10, -10, -10, -10, 130, 130, 130, 130], [212, -10, -10, -10, -10, 172, 172, 172, 172]], ms: 1200 },
  manna: { keys: [[212, -10, -10, -10, -10, 172, 172, 172, 172], [235, 30, 30, 30, 30, 205, 205, 205, 205]], ms: 1400 },
}
