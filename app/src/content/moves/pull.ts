import type { Move, Pose } from '../../core/figure'

// Front view: the bar is a line, near hand on the viewer's right. Hands sit 26 out from centre.
const front = (keys: Pose[], ms?: number, x = 26): Move => ({ keys, front: true, x: 'hand', y: 'hand', at: [x, -210], props: [{ t: 'bar', x: 0, y: -210 }], ms })
// Side view: the bar is a dot the hand holds.
const side = (keys: Pose[], ms?: number): Move => ({ keys, x: 'hand', y: 'hand', at: [0, -210], props: [{ t: 'bar', x: 0, y: -210 }], ms })

const hang: Pose = [180, 165, 165, 195, 195, 0, 0, 0, 0]
const mid: Pose = [180, 124, -159, -124, 159, 2, -2, -2, 2]
const top: Pose = [180, 82, -148, -82, 148, 4, -4, -4, 4]

const sHang: Pose = [180, 180, 180, 180, 180, 0, 0, 0, 0]
const sMid: Pose = [180, 132, -145, 132, -145, 4, -4, 4, -4]
const chin: Pose = [172, 79, -138, 79, -138, 12, -6, 12, -6]

// Archer: wide grip (hands 85 apart); pull to the near hand, far arm straight along the bar.
const wide: Pose = [180, 146, 146, 214, 214, 0, 0, 0, 0]
const archR: Pose = [180, 89, -130, -107, -107, 4, -4, -4, 4]
const archL: Pose = [180, 107, 107, -89, 130, 4, -4, -4, 4]

// One arm: the free arm hangs at the side.
const oaHang: Pose = [180, 180, 180, -25, -10, 0, 0, 3, -3]
const oaTop: Pose = [180, 107, -108, -40, 20, 4, -4, 6, -6]

// Muscle-up, side view: pull to the hips, lean over, press out.
const swing: Pose = [190, 182, 182, 182, 182, -18, -10, -18, -10]
const highPull: Pose = [172, -11, 56, -11, 56, 15, 0, 15, 0]
const turnover: Pose = [140, -60, 52, -60, 52, 10, -5, 10, -5]
const support: Pose = [176, -8, -8, -8, -8, 12, 2, 12, 2]

export const MOVES: Record<string, Move> = {
  dead_hang: front([hang, [180, 166, 166, 194, 194, 3, -3, -2, 2]], 1400),
  scap_pull: side([sHang, [188, 174, 174, 174, 174, -6, -2, -6, -2]], 1000),
  neg_pullup: { ...front([top, mid, hang], 1300), mode: 'cycle' },
  chinup: side([sHang, sMid, chin]),
  pullup: front([hang, mid, top]),
  lsit_pullup: side([[180, 180, 180, 180, 180, 90, 90, 90, 90], [180, 132, -145, 132, -145, 90, 90, 90, 90], [180, 84, -130, 84, -130, 90, 90, 90, 90]]),
  pullup_12: front([hang, mid, top], 600),
  ctb: side([sHang, [195, 120, -150, 120, -150, 6, -6, 6, -6], [200, 39, -172, 39, -172, 15, -5, 15, -5]]),
  archer_pullup: { ...front([wide, archR, wide, archL], 900, 42), mode: 'cycle' },
  high_pullup: side([swing, sHang, highPull], 500),
  typewriter: front([archR, archL], 1500, 42),
  oa_neg: { ...front([oaTop, [180, 140, -160, -35, 0, 2, -2, 4, -4], oaHang], 1500, 12), mode: 'cycle' },
  bar_mu: side([swing, highPull, turnover, support], 750),
  oa_assisted: front([[180, 180, 180, 215, 165, 0, 0, 2, -2], [180, 107, -108, 250, 200, 4, -4, 6, -6]], 1000, 12),
  ring_mu: { ...side([sHang, highPull, turnover, support], 900), props: [{ t: 'rings', x: 0, y: -210 }] },
  oapu: front([oaHang, oaTop], 1100, 12),
  strict_mu: side([sHang, highPull, turnover, support], 1200),
}
