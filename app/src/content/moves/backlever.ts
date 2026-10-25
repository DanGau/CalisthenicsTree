import type { Move, Pose } from '../../core/figure'

// Rings side view. Back lever: face down, torso 90, legs -90, arms just behind vertical.
const rings = { t: 'rings', x: 0, y: -210 } as const
const hangOn = (keys: Pose[], ms = 1200): Move => ({ keys, x: 'hand', y: 'hand', at: [0, -210], props: [rings], ms })

const hang: Pose = [180, 180, 180, 180, 180, 0, 0, 0, 0]
const tuckHang: Pose = [180, 180, 180, 180, 180, 150, 0, 150, 0]
// Rolling backwards the torso turns past 270; angles keep increasing so the roll animates.
const invTuck: Pose = [360, 180, 180, 180, 180, 330, 180, 330, 180]
const invStraight: Pose = [360, 180, 180, 180, 180, 180, 180, 180, 180]
const german: Pose = [535, 180, 180, 180, 180, 345, 345, 345, 345]

const bl = (thighN: number, shinN: number, thighF = thighN, shinF = shinN): Pose => [90, 190, 190, 190, 190, thighN, shinN, thighF, shinF]
// Hips a touch low on entry, then level.
const low = (p: Pose): Pose => [p[0] + 8, p[1], p[2], p[3], p[4], p[5] + 8, p[6] + 8, p[7] + 8, p[8] + 8]

export const MOVES: Record<string, Move> = {
  // Plank at 25° puts the shoulders 54 up: one straight arm under them.
  reverse_plank: { keys: [[-110, 0, 0, 0, 0, 70, 70, 70, 70], [-115, 0, 0, 0, 0, 65, 65, 65, 65]], x: 'hand', ms: 1300 },
  inverted_hang: hangOn([hang, tuckHang, invTuck, invStraight]),
  skin_cat: hangOn([hang, tuckHang, invTuck, german], 1300),
  german_hang: hangOn([[530, 180, 180, 180, 180, 338, 338, 338, 338], german], 1500),
  tuck_bl: hangOn([low(bl(60, -90)), bl(60, -90)]),
  adv_tuck_bl: hangOn([low(bl(0, -90)), bl(0, -90)]),
  straddle_bl: hangOn([low(bl(-84, -84, -96, -96)), bl(-84, -84, -96, -96)]),
  full_bl: hangOn([low(bl(-90, -90)), bl(-90, -90)]),
  bl_pullout: hangOn([bl(-90, -90), [0, 180, 180, 180, 180, -180, -180, -180, -180]], 1600),
}
