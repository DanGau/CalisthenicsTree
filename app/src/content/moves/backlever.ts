import { place, type Move, type Pose } from '../../core/figure'
import { solve } from './frontlever'
import { hold } from './pull'

// Rings side view. Back lever: face down, torso 90, legs -90, arms just behind vertical.
const rings = { t: 'rings', x: 0, y: -210 } as const
const hangOn = (keys: Pose[], ms = 1200): Move => ({ keys, x: 'hand', y: 'hand', at: [0, -210], props: [rings], ms })

const hang: Pose = [180, 180, 180, 180, 180, 0, 0, 0, 0]
const tuckHang: Pose = [180, 180, 180, 180, 180, 150, 0, 150, 0]
// Rolling backwards the torso turns past 270; angles keep increasing so the roll animates.
const invTuck: Pose = [360, 180, 180, 180, 180, 330, 180, 330, 180]
const invStraight: Pose = [360, 180, 180, 180, 180, 180, 180, 180, 180]
const german: Pose = [535, 180, 180, 180, 180, 345, 345, 345, 345]

const bl = (thighN: number, shinN: number, thighF = thighN, shinF = shinN): Pose => [90, 190, 190, 190, 190, thighN, shinN, thighF, shinF, 90, 90, -2]
// Hips a touch low on entry, then level.
const low = (p: Pose, d = 8): Pose => [p[0] + d, p[1], p[2], p[3], p[4], p[5] + d, p[6] + d, p[7] + d, p[8] + d, p[9]! + d, p[10]! + d, d < 0 ? -4 : 0]
const blHold = (p: Pose): Move => ({ ...hangOn([], 1000), ...hold(low(p), p, low(p, -2)) })

// Reverse plank: arms straight down, body one line solved so hands and heels both touch; chest lifts and head drops back.
const rpLine = (t: number): Pose => [t, 0, 0, 0, 0, t + 180, t + 180, t + 180, t + 180]
const rpT = solve(-140, -95, (t) => place({ keys: [] }, rpLine(t)).heel.y - place({ keys: [] }, rpLine(t)).hand.y)
const rp = (open: number): Pose => { const p = rpLine(rpT); p[9] = rpT - open; p[10] = rpT - open * 2; return p }

const slow = (hold: number[], dur: number[]): Move['beats'] => hold.map((h, i) => ({ hold: h, dur: dur[i] ?? 1 }))

export const MOVES: Record<string, Move> = {
  reverse_plank: { keys: [rp(0), rp(10)], x: 'hand', ms: 1000, beats: [{ hold: 0.5, dur: 1.6 }, { hold: 1 }] },
  inverted_hang: { ...hangOn([hang, tuckHang, invTuck, invStraight], 1000), beats: [{ hold: 0.4, dur: 1 }, { dur: 1.1 }, { dur: 0.9, ease: 'out' }, { hold: 1 }] },
  skin_cat: { ...hangOn([hang, tuckHang, invTuck, german], 1000), beats: [{ hold: 0.4, dur: 1 }, { dur: 1.1 }, { dur: 2.2 }, { hold: 1 }] },
  german_hang: { ...hangOn([[530, 180, 180, 180, 180, 338, 338, 338, 338], german], 1000), beats: slow([0.5, 0.5], [4]) },
  tuck_bl: blHold(bl(60, -90)),
  adv_tuck_bl: blHold(bl(0, -90)),
  straddle_bl: blHold(bl(-84, -84, -96, -96)),
  full_bl: blHold(bl(-90, -90)),
  bl_pullout: { ...hangOn([bl(-90, -90), [0, 180, 180, 180, 180, -180, -180, -180, -180]], 1000), mode: 'cycle', beats: [{ hold: 0.6, dur: 1.8 }, { hold: 0.3, dur: 2.5 }] },
}
