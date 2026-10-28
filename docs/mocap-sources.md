# Mocap sources

Real motion capture to ground the figure's moves. Researched 2026-10. Licenses quoted from the source pages; re-check before shipping.

## Verdict

- **Use: CMU Graphics Lab Mocap.** The only large set that is free to use and redistribute, and the only one with acrobatics and breaking. Covers about 40 of our 286 skills.
- **Maybe: 100STYLE** (CC BY 4.0). Locomotion styles only; useful for walks/runs/crouch gaits, not skills.
- **Look, but can't commit derived data:** AIST++, Bandai Namco, LaFAN1, AMASS/HumanML3D, Motion-X, Fit3D, BONES-SEED, Mixamo. Fine to study by eye; derived keyframes in a public repo breach their terms.
- **Nothing open covers** pull, dip, push-up, planche, levers, flag, core holds, crawls, most mobility and yoga. Those stay hand-keyed from [motion-reference.md](motion-reference.md).

## Datasets

| Dataset | License (key clause) | Public derived data? | Format / skeleton | Access, size | Relevant content |
|---|---|---|---|---|---|
| [CMU Mocap](http://mocap.cs.cmu.edu/) | [FAQ](http://mocap.cs.cmu.edu/faqs.php): "may be copied, modified, or redistributed without permission." Asks for acknowledgment. | **Yes** | ASF/AMC, C3D, 120 fps. BVH: [cgspeed conversion](https://sites.google.com/a/cgspeed.com/cgspeed/motion-capture) (author: "no additional restrictions"), mirrored at [una-dinosauria/cmu-mocap](https://github.com/una-dinosauria/cmu-mocap) (`data/090/90_04.bvh`, 31 joints, Z-Y-X Euler, inches-ish units) | Direct per-file download; ~2,500 clips, ~1 GB BVH | Subjects 49, 85, 87–90 acrobatics/breaking; squats, jumps, hops, playground, get-ups, stretches |
| [100STYLE](https://www.ianxmason.com/100style/) | "Creative Commons Attribution 4.0" ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)); credit "The 100STYLE Dataset - Ian Mason" | **Yes**, with attribution | BVH, 60 fps, Xsens 28 bones | Zenodo zip, 4M frames | 100 styles × walk/run/sidestep/idle. No skills |
| [Cologne MoCap DB](https://mocap.web.th-koeln.de/about.php) | "licensed under a Creative Commons Attribution 4.0" | Yes | BVH, C3D | Web search UI; contents not verified (search page broken) | Unknown |
| [AIST++](https://google.github.io/aistplusplus_dataset/download.html) | Bound by [AIST Dance DB terms](https://aistdancedb.ongaaccel.jp/terms_of_use/): "may not be used for any purpose other than academic research"; "Unauthorized redistribution of any content … is prohibited" | No | SMPL `.pkl` (24 joints), COCO 3D keypoints (17) | Direct, 306 MB motion | Has breaking (`gBR_*`) incl. powermoves; study only |
| [Bandai Namco Research](https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset) | CC BY-NC 4.0 (repo README) | Non-commercial with attribution: legally OK for us, but nothing useful | BVH, 30 fps | GitHub, 421k frames | Walk, run, kick, punch, dance, gestures. No skills |
| [LaFAN1](https://github.com/ubisoft/ubisoft-laforge-animation-dataset) | CC BY-NC-ND 4.0 | No (no derivatives) | BVH | GitHub | Locomotion, falls, crawling, obstacles |
| [AMASS](https://amass.is.tue.mpg.de/license.html) (and HumanML3D, KIT-ML via AMASS) | "non-commercial scientific research"; "shall not be copied, shared, distributed" | No | SMPL-H npz | Registration | Includes CMU, so use CMU directly |
| [Motion-X](https://github.com/IDEA-Research/Motion-X) | Request form, non-commercial; per-subset licenses; mocap subsets not redistributed | No | SMPL-X npy, 30 fps | Form | Video-estimated, noisy |
| [Fit3D](https://fit3d.imar.ro/legal) | "shall not be copied, shared, distributed"; no third-party access | No | GHUM/SMPL-X, 25-joint 3D | Registration | 37 fitness exercises (closest to push/squat/lunge), but locked |
| [BONES-SEED](https://bones.studio/info/seed-license) | Academic/startup only; bars uploading "to a public repository on … GitHub" | No | BVH | Gated HF | Sport, stunts, dance |
| Mixamo | Adobe FAQ: can't "distribute the raw character and animation files" | No (key frames of a clip are its data) | FBX | Adobe login | Breakdance, flips, push-ups, pull-ups (hand-animated/cleaned) |
| Human3.6M, MoVi, FLAG3D | Research-only licenses (not re-verified) | No | Various | Registration | Everyday, fitness |
| [BRACE](https://github.com/dmoltisanti/brace) | S-Lab 1.0, non-commercial | Yes (NC) but **2D only** | COCO 2D keypoints from Red Bull BC One videos | GitHub | Breaking: toprock/footwork/powermove; 2D, can guide timing only |

## Skill → CMU clip

Clip id = `subject_trial` (BVH `data/0SS/SS_TT.bvh`). Descriptions are CMU's own; frame ranges are not published, so every clip needs a look in a BVH viewer to trim. Match: **good** = the skill itself; **fair** = close variant or must be cut from a sequence; **inspect** = description suggests it, unconfirmed.

| Skill | Clip(s) | Match |
|---|---|---|
| cartwheel | 49_06, 49_07, 49_08, 87_05, 88_07, 90_02–90_04 | good |
| kickup (bail) | 88_02 "handstands", 85_05 "HandStandKicks", 89_05 | fair |
| free_hs | 88_02, 89_05 | fair |
| oahs | 89_03 "flip and stand on one hand", 89_04 | fair |
| wall_hspu / free_hspu | 88_02 "vertical pushups" | inspect |
| back_tuck | 87_03, 87_04, 88_01 "backflip" | good |
| back_handspring | 88_08 "crouch and flip backward on hands" | inspect |
| front_handspring | 90_14, 90_15 "front hand flip" | inspect |
| front_walkover / hs_roll | 90_09 "flip forward onto hands and back again" | inspect |
| aerial | 90_08 "side flip" | inspect |
| roundoff | 88_05 "cartwheel into backflip" (entry) | fair |
| dive_roll | 127_23, 127_24, 128_10, 128_11 "run dive over roll" | good |
| fwd_roll / shoulder_roll | 128_09 "run roll underneath"; 90_34–90_36 "wide leg roll" | fair |
| macaco | 90_19 "monkey backflip", 90_20, 90_21 | inspect |
| butterfly_kick | 87_01 "jump with kick and spin", 88_06 | fair |
| flare, windmill, back_spin, swipe, baby_freeze, airchair | 85_08 "Helicopter", 85_12 "LongSequenceGood", 85_14 "BreakSequencewithFlips", 90_28 "breakdance" | inspect: cut from sequences; which powermoves are present is unknown |
| ginga / toprock | 85_04 "FancyFootWork", 85_03/85_11 "UpRightSequence" | fair |
| squat / box_squat | 13_29, 13_30, 14_06, 14_14, 86_02, 86_08; 22_14 "alternating squats" | good |
| deep_squat | 115_06–115_09 "picking box up, bending knees" | fair |
| sit_rise | 140_08, 140_09 "get up from ground laying on back", 143_18 | good |
| shinbox | 140_03, 140_04 "get up laying on side" | fair |
| broad_jump | 13_11, 16_05–16_10, 75_15, 83_42, 83_47 | good |
| tuck_jump | 118_01–118_30 "jump", 16_03 "high jump" | fair |
| box_jump | 75_12 "box jump" | good |
| drop_land / depth_jump | 82_02–82_04 "jump off ledge" | good / fair |
| precision / running_precision | 75_01–75_03 "run jump" | fair |
| bounding | 83_40–83_50 hops, 75_04 | fair |
| safety_vault / speed_vault / lazy_vault | 127_25–127_28 "run jump over", 127_33–127_36 "run over" | inspect |
| climb_up | 1_12 "climb, pull up"; 81_14 "climb backwards off ledge" | fair |
| dead_hang | 1_03 "hang, swing", 43_02, 43_03 "grip bar, swing body" | fair |
| bear_crawl / ape_walk | 55_28 "monkey/bear", 54_xx "monkey" pantomime | fair |
| needle / airplane | 49_18–49_20 "balance on one leg, outstretched arms" | fair |
| fwd_fold / jefferson | 115_01–115_05 "bend from waist" | fair |
| hip_cars / shoulder_cars | 42_01 "rotate head, shoulders, arms, legs" | fair |
| kneel_drop / camel | 5_04, 5_18 "bending back" | inspect |

Count: about 50 skill ids touched; ~12 good, ~25 fair, rest inspect.

**Gaps (no open clip):** all of pull, grip, dip, push (bar 88_02), planche, frontlever, backlever, flag, core (holds, raises, rollouts, dragon flag), armbal (crow, elbow lever), handstand drills and presses, legs (pistol, shrimp, sissy, cossack, nordic, lunges/split squat), hinge (bridges, RDL), flex splits and pancakes, backbend bridges, most flow crawls (crab, lizard, frogger, kickthrough), kip_up, wall_run, tic_tac, kong, wall_flip, one_hand_cart, front_tuck. Fit3D and Mixamo cover several (push-ups, lunges, pull-ups) but their terms forbid committing derived data.

## Pipeline

Offline in Node, under `app/tools/mocap/` (not shipped). Commit only derived keys plus attribution.

1. **Fetch** one BVH from the cgspeed mirror into a git-ignored folder (`curl` the raw GitHub URL). No bulk download.
2. **Parse** with three.js `BVHLoader.parse(text)` (MIT, already a common dep, works in Node with no DOM) or [`parse-bvh`](https://www.npmjs.com/package/parse-bvh) (MIT, tiny, unmaintained). A hand-written parser is ~80 lines: hierarchy offsets, channel order, per-frame Euler (CMU: `Zrotation Yrotation Xrotation`).
3. **Forward kinematics** → world joint positions per frame: hips, spine/neck/head, shoulders, elbows, wrists, hip joints, knees, ankles, toes. Y up; flip to our y-down.
4. **Body frame.** Facing = horizontal component of (left hip − right hip) × up. For `solid` moves keep 3D; for side-view moves project onto the sagittal plane.
5. **Fit our pose** per frame:
   - Sagittal angle of each segment: `atan2(dx_forward, -dy)` in degrees, our convention (0 down, 90 forward, 180 up). Unwrap across frames so flips accumulate to 360.
   - `torso` = pelvis→spine mid, `chest` = mid→neck, `head` = neck→head; `scap` from shoulder height relative to neck.
   - `armOut`/`legOut` = angle of the limb out of the sagittal plane; `roll` = pelvis lateral axis tilt about the forward axis; `turn` = facing yaw relative to the start; spine twist = shoulder-line yaw minus hip-line yaw.
   - Near/far = side nearer the camera after `view`.
6. **Reduce to keys.** Resample to 30 fps, then pick keys at velocity minima and joint reversals (matches our spline, which stops only there); Ramer–Douglas–Peucker on the angle curves at ~3° tolerance. Durations between keys → `beats.dur`; holds where velocity ≈ 0.
7. **Normalise.** Scale root travel to our `LEN` (CMU leg ≈ 17 BVH units), root height → `lift`, horizontal travel → `shift`/`travel`. Snap contacts (hands/feet within a few px of the floor) so tests' floor rule holds; the engine's IK keeps them planted.
8. **Emit** a `Move` TS literal into `moves/<branch>.ts` with a comment `// CMU mocap 90_04, frames 120–480`. Add a credits line (CMU and, if used, 100STYLE CC BY) to an about/credits view and `docs/`.
9. **Check** with `npm run eye` and adjust by hand; mocap is a reference, not a final pose.

Attribution text: "Some motion derived from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), created with funding from NSF EIA-0196217."
