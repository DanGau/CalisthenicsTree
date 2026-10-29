// Pose-estimated (MediaPipe Pose Landmarker) from video "Bulgarian Split Squat" by ExperienceLifeMag, CC BY 3.0, https://www.youtube.com/watch?v=wXasPD_vKqQ, frames 24-84 at 23.98 fps.
// Generated: npm run mocap -- video .video-cache/yt-wXasPD_vKqQ.json 24 84 bulgarian --plant auto --plant-height 20 --plant-speed 80 --flat 0.3 --on farFoot:box --title Bulgarian Split Squat --author ExperienceLifeMag --license CC BY 3.0 --url https://www.youtube.com/watch?v=wXasPD_vKqQ
import { clip } from './clip'

// torso nearUpper nearFore farUpper farFore nearThigh nearShin farThigh farShin chest head scap | lift shift turn roll twist
// armOut farArmOut foreOut farForeOut legOut farLegOut shinOut farShinOut | dur hold
export const bulgarian = clip({ mode: 'cycle', props: [{'t':'box','x':-62,'w':36,'h':41}] }, [
  [178, -2, 75, 0, 108, -3, -11, -14, -85, 178, 143, 0, 0, 0, 0, -6, -3, -1, -9, 11, -25, 9, 0, -1, 12, 0.58, 0],
  [177, -8, 70, 1, 107, 24, -30, -11, -103, 177, 142, 0, 0, 0, -2, -5, 4, -3, -9, 9, -21, 18, 0, -19, 12, 0.83, 0],
  [173, -14, 66, -3, 104, 56, -30, -18, -126, 173, 141, 0, 0, 0, -7, -3, 10, -7, -4, 12, -25, 27, 7, -37, 5, 0.33, 0],
  [174, -11, 64, -2, 106, 39, -28, -11, -112, 174, 141, 0, 0, 0, -6, -3, 8, -5, -5, 11, -26, 22, 3, -29, 11, 0.21, 0],
  [174, -5, 70, -1, 106, 14, -20, -7, -98, 174, 141, 0, 0, 0, -2, -4, 3, -3, -6, 9, -24, 14, 1, -12, 13, 0.58, 0],
], [
  { joint: 'foot', from: 0, to: 2.503 },
  { joint: 'farFoot', from: 0, to: 2.503 },
])
