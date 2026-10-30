# Animated figure

Each skill has a looping cartoon in `app/src/content/moves/<branch>.ts`, keyed by skill id. Engine: `src/core/figure.ts` (pure) and `src/ui/figure.ts` (SVG). Real-body timing and kinematics: [motion-reference.md](motion-reference.md).

## Pose

`Pose` = 9 to 11 absolute angles in degrees: `[torso, nearUpper, nearFore, farUpper, farFore, nearThigh, nearShin, farThigh, farShin, chest?, head?, scap?]`.

- `torso` is pelvis→waist; `chest` is waist→shoulders (default = torso), so the spine can hollow, arch or round. `head` (default = chest) nods or looks up. Use them: a hollow body, a cat-cow, a bridge or a dragon flag reads only with a bent spine. `scap` slides the shoulders along the chest: + shrug or elevate (hanging passive, overhead reach), - depress (active hang, support, dip top), about -5..6.

- 0 = straight down, 90 = forward (+x, the way the figure faces, to the right), 180 = up, -90 = back.
- Each angle is the direction of that segment from its parent joint: torso hip→shoulder (180 = upright), upper arm shoulder→elbow, forearm elbow→hand, thigh hip→knee, shin knee→ankle.
- Angles never wrap: 0 → 360 animates a full turn. Use this for rolls and flips.
- Body: median US man, about 7 heads tall. Lengths (`LEN`): waist 22 + chest 24 = trunk 46, neck to head centre 18, head radius 11, upper arm 29, forearm 25 (hand = palm), thigh 38, shin 38, sole 5 below the ankle, foot 13. Arm 54, leg 76 + sole.
- Feet are automatic (`footAngle`): flat when the shin is near vertical, square to the shin in a plank, pointed when inverted. y grows downward; the floor is y = 0.
- Drawn as a solid cartoon: tapered limbs, shaped chest and belly, blue shorts mark the pelvis so hip hinge vs spine bend is visible.

## Move

- `keys`: poses in order. `mode: 'bounce'` (default) plays them back in reverse for reps; `'cycle'` loops last → first.
- Placement: `x` names the joint pinned horizontally to `at[0]` (default `hip`). `y` is `'floor'` (default: lowest point rests on the floor) or a joint pinned to `at[1]` (hangs: `x: 'hand', y: 'hand', at: [0, -210]`).
- `front: true` draws a front view: angles mean left/right (-90 = viewer's left, 90 = right); near limbs sit on the viewer's left. Use it for archer, cossack, side plank, flag, middle split, cartwheel.
- `props`: `bar`, `rings`, `wall`, `pole`, `box {x,w,h}`, `bars` (parallel bars end-on), `stall` (stall bars: rungs every 13 at `RUNG(k)`, wall behind; edge-on flat, a ladder in solid). `floor: false` hides the floor.
- `ms`: base transition time (default 900). Holds use 2 keys: entry, then the hold with a small change (breathing, tension).

## Timing and momentum

Motion must read as a person moving mass, not a puppet between poses. `beats` (one per key) and `flow` do this:

- `dur`: relative length of the transition to the next key. Strength reps: lowering 1.5-2, rising 1 (controlled eccentric, strong concentric). Explosive moves: load 1, drive 0.4-0.6.
- Interpolation: keys are points on one smooth path per joint (monotone cubic spline), so motion flows through intermediate keys and stops only on holds and where a joint reverses. Add keys to shape a path; don't expect each key to be a stop.
- `ease`: a speed hint at the segment ends: `in` starts from rest and arrives fast (falling, dropping into a catch); `out` leaves fast and arrives at rest (rising to an apex, settling); `snap` leaves very fast (explosive drives). `io` and `lin` leave it to the spline.
- `hold`: pause on a key. Default 0.3 only at a bounce's turnarounds. Short pause at the top/bottom of reps; none mid-flight.
- Move-level `climb`: height gained per loop (rope climbs); the view follows up.
- `shift`: forward offset within a loop (broad jump distance, pushing off a wall). Move-level `travel`: distance per loop for gaits, runs, crawls, walks; the view follows the figure and the floor marks slide past, so the loop is seamless.
- `protract` (beat): shoulders slide round the ribs, + protraction, - retraction (about -5..6). With hands planted the ribcage moves instead (scap push-up). `scap` is elevation along the chest.
- `turn`: degrees about the vertical axis; 180 is mirrored. Animate 0 → 180 to roll over or turn round (bridge rotation, turning back to the box).
- `solid: true`: a true 3D body, for anything that twists, straddles or turns (flare, windmill, back spin, straddles, archer, maltese, 90/90, rotations). Sagittal angles as usual, plus per-key `armOut`/`farArmOut`/`legOut`/`farLegOut` (degrees each limb swings out to its side), `roll` (about the body's forward axis) and `turn` (a real rotation about the vertical: 0 side, 90 facing the viewer, 180 facing left). Parts are drawn by depth and shaded darker behind the trunk; the face shows profile, front or back. Prefer this over `front`, `trunk`/`legs`/`arms` foreshortening and squashed turns.
- `view` (solid): camera turn, props included (bar, rings with optional `z`, parallettes with optional half-spacing `z`, pole, wall plane, box, parallettes are 3D and depth-sorted with the body). Use `view` for the camera angle and `turn` only when the body itself turns. `tilt`: camera looks down; the floor becomes a plane.
- `back: true` (with `front`): seen from behind, no face.
- `trunk`: trunk length scale to foreshorten a trunk pointing at the viewer in front view (pancake, wipers, flare).
- Loops must restart honestly: no teleports. Climb back onto the box, walk back, or travel.
- `lift`: height above the pinned placement. Flight phases use it: takeoff key lift 0 with `ease: 'out'`, apex key with lift and `ease: 'in'`, landing lift 0. The figure must actually leave the floor.
- `flow`: 0.1-0.25 on swings, jumps, throws, kicks and rolls so forearms, shins and head trail the body. Leave it 0 when hands or feet are planted (contacts would slide).
- Add anticipation and follow-through as keys: dip before a jump, absorb after a landing, swing back before a kip.

## Physics

`src/content/physics.test.ts` samples every move every 20 ms (`core/physics.ts`: contacts, centre of mass from Winter segment masses in `core` `com`, g from `LEN` as a 1.75 m man):

- Still (joints < 8 units/s for 200 ms): COM within 6 of the weight-bearing contacts in x (and z, solid). Wall, pole, stall or box-face contact skips it (flags, wall holds); `ANCHORED` lists feet-hooked or gripped torque holds (nordics, back extension, dragon flags).
- Airborne ≥ 160 ms: COM vertical acceleration 0.6-1.5 g, within 3 of its fitted parabola, horizontal acceleration < 0.4 g; flips (trunk turns ≥ 90°, no turn about the vertical) keep sagittal angular momentum within 30 % (sd/mean).
- Flights ≤ 0.9 s; `holdBeats`-style sways ≥ 1.2 s one way.

Engine help:

- `air: true` on a beat: that transition is airborne. Core solves `lift`/`shift` so the COM rides gravity's parabola between the run's first and last keys, and in flips turns the whole body so angular momentum stays constant (faster tucked). `air()` in `tumble.ts` sets it; takeoff and landing keys sit on the floor.
- `ballistic(m, from, to)`: retimes a captured flight (ms window) to the time gravity needs for its rise and fall, and marks it `air` (`back_tuck`, `aerial`).
- `balance: true` with `x: 'hand'`: the arms turn about the pinned hand so the COM stays over or under it (levers, dips, supports, L-sits, hanging leg raises).

## Mocap

Some moves come from real capture (`src/content/mocap/<id>.ts`, rows built by `clip()`), generated offline by `app/tools/mocap/` (not shipped; clips cached in git-ignored `app/.mocap-cache/`). Sources and licenses: [mocap-sources.md](mocap-sources.md).

- `npm run -s mocap -- sheet <clip> [from] [to] [step] [--tilt d]`: contact sheet of the raw skeleton with frame numbers, plus spin/straddle/height stats, to find a range in a long clip.
- `npm run -s mocap -- build <clip> <from> <to> <id> [--mode cycle|bounce] [--pin hip|foot] [--yaw d] [--view d] [--tilt d] [--mirror] [--tol deg]`: forward kinematics, per-segment direction fit to our `solid` Pose and Stage (scaled to `LEN`, unwrapped), keys at stops and wherever the spline strays past `tol`, real timing in `dur`/`hold`. Writes the module and `screenshots/mocap-<id>.png`: raw, per-frame fit, keyed, and the current move.
- Cycles ease their last `--seam` seconds (default 0.15, `off`) into the start so loops don't snap; `--match n` first cuts the end at the sample (of the last n) whose pose best matches the start.
- `--plant auto` (or `foot,farFoot,hand,farHand`; tune `--plant-height`, `--plant-speed`) finds where a hand or foot is down (near the floor and the frame's lowest joint) and still, trims or drops windows the figure can't hold under the slip limit, and emits `plants`: core `at` then holds that joint at its mean place, at its lowest height in the window, by shift and limb IK (no lift while planted). `moves.test.ts` samples every 20 ms: slip < 2.5.
- Props: `--on farFoot:box[:w]` plants a limb at its own lowest height (bench, box) and places the box under it; `--grip bar:-210` (rings, bars) pins the near hand on that prop and the body hangs from it (no lift or shift); `:auto` sets the height to the hand's median height above the feet, so `--plant foot,farFoot` can also hold the feet on the floor (rows). With a hand pinned, plants move only the limbs, not the body.
- `npm run -s mocap:all [-- id...]` rebuilds every wired move from `tools/mocap/clips.json` (id → clip, frames, flags; `video: true` with a landmarks JSON, `args` for credits).
- Wire a result into its branch file only when it reads better than the hand-made move. Live: `back_tuck` (CMU 88_01), `aerial` (CMU 90_08), `bulgarian` (video).
- Video route: `app/tools/video/landmarks.py` (MediaPipe Pose Landmarker heavy, world landmarks; setup in its header, venv in git-ignored `app/.venv-video/`) writes `app/.video-cache/<video>.json`; `npm run -s mocap -- video <json> <from> <to> <id> [--ground low|foot|hand] [--jump f] [--vis v] [--flat k] --title --author --license --url` plus build's flags. Low-visibility points and person swaps are interpolated, then One-Euro smoothed both ways. `--flat k` scales limb depth by k (side-on clips: depth is the noisy side-to-side axis), keeping lengths. Videos and models stay in the cache; never commit media.
- Game assets: `npm run -s mocap -- gltf <file.glb> [anim] [from] [to] [id] [--fps n] --title --author --license --url` plus build's flags. No anim lists the clips; no id writes a contact sheet. Samples the skin's node hierarchy; bone names: Mixamo, Unreal (UAL2) and Rigify `DEF-` (UAL1). GLBs stay in `app/.mocap-cache/`.
- Video attribution: only public-domain, CC BY, CC BY-SA or Pexels-licensed clips, license read on the source page. The module header names title, author, license and URL; CC BY-SA keys are marked CC BY-SA. Credit each wired-in video move on the moves review page.
- Tried, kept hand-made (2026-10): macaco 90_19 (hand never reaches the floor while inverted), cartwheel 88_07/90_02 (bent, collapsed), front_handspring 90_14 (squat entry, arched landing), roundoff 88_05 (fit breaks); deep_squat, sit_rise, shinbox, CARs, airplane/needle, fwd_fold/jefferson, dead_hang, kneel_drop/camel: mapped clips show other motions (box lift, hand-pushed get-up, warm-up swings, one-leg knee raise, shallow bend, kip swing, dance).
- Pilot (2026-10): side-on push-up (Army HRP) fits cleanly but its bottom is a hand-release rest, so `pushup` stays hand-made; Airflare (spinning, inverted) fails; no side-on full-body Pexels pull-up found.
- YouTube CC BY pass (2026-10, `yt-dlp` in `.venv-video`, search filter `sp=EgIwAQ%3D%3D`, license read per video): `bulgarian` wired (ExperienceLifeMag wXasPD_vKqQ, `--flat 0.3 --on farFoot:box`). Kept hand-made: pistol (DHpYd8cvc3M, shallow in the video), pike_pu (Lance Goyke iFRP0DDex9k, gxXiSwi9npg: cramped arms), chinup (Lance Goyke J4dk43o3VDI, 3/4 view, small range even with `--grip`), row (ROwEJt4VNDY), glute_bridge (Get Strong with Em FKqiXZVTVS4, low hip), reverse_nordic (Italo Calisthenics SIqFFPlrz7Q, hips break), bear_crawl (Sqh0NbtiHqw, 76vnSUhEmrs: slow steps with long pauses, no gait loop). Second pass: pushup (Italo Calisthenics 98J9aiV69p8: bent lockout, shallow), hindu_pu (Bootcamp Ideas kRbV0JVSUiA: bent-arm pike, hands split), sissy (Fitness Volt OfLQh20uKkI: shallow, no pole), dead_bug (Lance Goyke YR3hSpEhmak: limbs tangle), decline_pu (David Kimmerle 9AxdN8zN028: shallow), row with rings and feet planted (ROwEJt4VNDY: low bar, hips sag). Front-on, cropped, or slow-motion with pauses: pull-up, bench dip, bar dip, squat, cossack, step-up, lunge with a kettlebell, sl_rdl, leg raises, frog, butterfly, pancake, front lever, planche lean.
- Credit: "Some motion derived from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), created with funding from NSF EIA-0196217." Shown on the moves review page; each module's header names subject, trial and frames.

## Rules

- Tests require one move per skill and nothing sinking below the floor.
- Use geometry, not guesses: contacts (hands on floor or bar, feet on box) must touch. Helpers `leg`/`arm` (IK) in `moves/legs.ts`.
- Show the biomechanics that the cues name: scapula and spine position, hip hinge vs squat, knee tracking, lockout, lean.
- Check with `MSYS_NO_PATHCONV=1 npm run -s eye -- '#/moves/<branch>' <name>` and look at the screenshot. The review page shows the live loop then each key.
- `point: true` points the toes all loop (prone, kneeling with the tops of the feet down).
