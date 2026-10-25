import type { Move, Pose } from '../../core/figure'

const HS: Pose = [0, 0, 0, 0, 0, 180, 180, 180, 180]

// Frog: knees on bent elbows, feet float.
const frogIn: Pose = [55, -70, 30, -70, 30, 21, -63, 21, -63]
const frog: Pose = [58, -70, 30, -70, 30, 21, -100, 21, -100]
// Crow: arms near straight, knees in the armpits.
const crowIn: Pose = [58, -22, -8, -22, -8, 66, -40, 66, -40]
const crow: Pose = [50, -20, -8, -20, -8, 64, -120, 64, -120]
const crane: Pose = [42, -4, -4, -4, -4, 58, -135, 58, -135]
const sideCrow: Pose = [62, -40, 10, -40, 10, 80, 155, 74, 150]

// Tripod: head in front, hands behind it, elbows over the hands.
const tripodTuck: Pose = [-4, 92, 0, 92, 0, -150, -10, -150, -10]
const tripod: Pose = [0, 90, 0, 90, 0, 180, 180, 180, 180]

const pigeon: Pose = [55, -30, -5, -30, -5, 70, 105, -125, -125]
const grasshopper: Pose = [58, -28, -5, -28, -5, 78, 80, 25, -110]

// Elbow lever: body flat on elbows dug into the hips.
const leverTuck: Pose = [92, -112, 0, -112, 0, 85, -110, 85, -110]
const lever: Pose = [92, -112, 0, -112, 0, -97, -97, -97, -97]
const oaLever: Pose = [96, -116, 0, 80, 85, -100, -100, -100, -100]

// Forearm stand: upper arms vertical, forearms flat toward the face.
const faIn: Pose = [4, 0, -90, 0, -90, -110, -110, 175, 175]
const forearm: Pose = [0, 0, -90, 0, -90, 180, 180, 180, 180]
const scorpion: Pose = [-22, 0, -90, 0, -90, 135, -30, 135, -30]

const crowTuck: Pose = [10, -6, -6, -6, -6, -40, 60, -40, 60]

const m = (keys: Pose[], ms?: number): Move => ({ keys, x: 'hand', ms })

export const MOVES: Record<string, Move> = {
  frog_stand: m([frogIn, frog], 1200),
  crow: m([crowIn, crow], 1200),
  side_crow: m([crowIn, sideCrow], 1200),
  crane: m([crow, crane], 1200),
  tripod_hs: m([tripodTuck, tripod], 1300),
  flying_pigeon: m([crowIn, pigeon], 1300),
  elbow_lever: m([leverTuck, lever], 1200),
  forearm_stand: { keys: [faIn, forearm], x: 'elbow', ms: 1200 },
  grasshopper: m([crowIn, grasshopper], 1300),
  oa_elbow_lever: m([lever, oaLever], 1300),
  crow_to_hs: m([crow, crowTuck, HS], 1100),
  scorpion: { keys: [forearm, scorpion], x: 'elbow', ms: 1400 },
}
