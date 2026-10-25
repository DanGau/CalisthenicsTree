import type { Move, Pose } from '../../core/figure'
import { plank } from './push'

const top = plank(115, 0, 0)
const lean = plank(106, -28, -28)
const ppLow = plank(100, -95, -30)

const frog: Pose = [95, -15, -15, -15, -15, 40, -70, 40, -70]
const tuck: Pose = [100, -20, -20, -20, -20, 62, -80, 62, -80]
const tuckLow: Pose = [100, -80, -25, -80, -25, 70, -100, 70, -100]
const advTuck: Pose = [90, -25, -25, -25, -25, 60, -95, 60, -95]
const straddle: Pose = [92, -30, -30, -30, -30, -86, -86, -95, -95]
const oneLeg: Pose = [90, -28, -28, -28, -28, 60, -95, -90, -90]
const full: Pose = [90, -30, -30, -30, -30, -90, -90, -90, -90]
const fullLow: Pose = [92, -100, -25, -100, -25, -92, -92, -92, -92]
const maltese: Pose = [90, -62, -62, -62, -62, -90, -90, -90, -90]

const m = (keys: Pose[], ms?: number): Move => ({ keys, x: 'hand', ms })

export const MOVES: Record<string, Move> = {
  plank: m([plank(121, 0, 0), top], 1300),
  scap_pu: m([plank(117, 3, 3), plank(112, -4, -4)], 700),
  planche_lean: m([top, lean], 1200),
  pp_pu: m([lean, ppLow]),
  tuck_planche: m([frog, tuck], 1100),
  tuck_planche_pu: m([tuck, tuckLow]),
  adv_tuck_planche: m([tuck, advTuck], 1100),
  straddle_planche: m([advTuck, straddle], 1200),
  one_leg_planche: m([advTuck, oneLeg], 1200),
  full_planche: m([advTuck, full], 1200),
  planche_pu: m([full, fullLow]),
  maltese: m([full, maltese], 1300),
}
