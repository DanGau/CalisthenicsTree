import type { Move, Pose } from '../../core/figure'

// Front view hangs: near hand on the viewer's right, 26 out from centre.
const hang: Pose = [180, 165, 165, 195, 195, 0, 0, 0, 0]
const frontHang = (keys: Pose[], props: Move['props'], x = 26, ms = 1400): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [x, -210], props, ms })
const ringPair = [{ t: 'rings', x: -26, y: -210 }, { t: 'rings', x: 26, y: -210 }] as const

// Side view ring work.
const sideRings = (keys: Pose[], ms?: number, y = -210): Move => ({ keys, x: 'hand', y: 'hand', at: [0, y], props: [{ t: 'rings', x: 0, y }], ms })

// Rope: the near hand holds a fixed point, so each key reads as the next grab up the rope.
const rope = (keys: Pose[]): Move => ({ keys, x: 'hand', y: 'hand', at: [8, -200], props: [{ t: 'pole', x: 8 }], mode: 'bounce', ms: 1000 })

// Iron cross: arms straight out to the rings, shoulders level with the hands.
const cross: Pose = [180, 90, 90, -90, -90, 0, 0, 0, 0]
const crossRings = [{ t: 'rings', x: -66, y: -210 }, { t: 'rings', x: 66, y: -210 }] as const

export const MOVES: Record<string, Move> = {
  ring_hang: frontHang([hang, [180, 166, 166, 194, 194, 3, -3, -2, 2]], [...ringPair]),
  towel_hang: frontHang([[180, 175, 175, 185, 185, 0, 0, 0, 0], [180, 175, 175, 185, 185, 25, -15, 25, -15]],
    [{ t: 'bar', x: 0, y: -262 }, { t: 'rings', x: -17, y: -206 }, { t: 'rings', x: 17, y: -206 }], 17),
  rope_legs: rope([[180, 178, 178, 150, 200, 110, 0, 110, 0], [180, 150, -160, 178, 178, 0, 0, 0, 0]]),
  false_grip: sideRings([[180, 180, 180, 180, 180, 0, 0, 0, 0], [180, 170, 205, 170, 205, 3, -3, 3, -3]], 1400),
  // Push-up geometry raised onto the fingertips.
  fingertip_pu: { keys: [[115, 0, 0, 0, 0, -65, -65, -65, -65], [98, -108, 0, -108, 0, -82, -82, -82, -82]], x: 'hand' },
  rope_legless: rope([[180, 178, 178, 150, 200, 25, 15, 25, 15], [180, 150, -160, 178, 178, 20, 10, 20, 10]]),
  false_grip_pullup: sideRings([[180, 170, 200, 170, 200, 0, 0, 0, 0], [180, 132, -145, 132, -145, 4, -4, 4, -4], [172, 79, -138, 79, -138, 12, -6, 12, -6]]),
  oa_hang: frontHang([[180, 180, 180, -50, -20, 0, 0, 0, 0], [180, 180, 180, -55, -25, 4, -4, 3, -3]], [{ t: 'bar', x: 0, y: -210 }], 12),
  ring_lsit: sideRings([[180, 0, 0, 0, 0, 84, 84, 84, 84], [180, 0, 0, 0, 0, 90, 90, 90, 90]], 1200, -120),
  cross_assist: { ...frontHang([[180, 85, 85, -85, -85, 0, 0, 0, 0], cross], [...crossRings, { t: 'box', x: -25, w: 50, h: 74 }], 66), ms: 1200 },
  iron_cross: frontHang([[180, 86, 86, -86, -86, 2, -2, -2, 2], cross], [...crossRings], 66, 1200),
}
