# Climbing skills (proposal)

Off-wall training for climbers: hips, fingers, locking, tension. Not yet in `tree.ts`.

## Research summary

**Elite benchmarks** (treat as ceilings, not targets):

- **Alex Megos.** His staple is 7s on / 3s off repeaters plus one-arm pull-ups ([Lacrux](https://www.lacrux.com/en/training/aufwaermen-am-fels-alexander-megos/)). He calls a one-arm hang on a 20–23 mm edge "pretty much world class". He films one-arm pull-ups and one-arm lock-offs ([Lacrux video](https://www.lacrux.com/it/dei-video/con-alex-megos-nel-video-del-pull-up-con-un-braccio-solo/)). One forum post credits him with a one-arm hang at 130% bodyweight on 20 mm. It is unverified, so we don't use it.
- **Lattice Training.** 20 mm is their standard test edge. The figure commonly quoted for V7–8 is a 10s two-arm half-crimp hang at about +50% BW. Climbers around V5 typically hang +20–30%. Lattice's own data is skewed toward heavy hangboarders ([MP thread](https://www.mountainproject.com/forum/message/123908403)).
- **Eric Hörst.** Max hangs are 10s at 85–95% effort. Campus only after about 2 years of steady climbing, at age 18 or older, and only once you have a solid base on 20 mm.
- **Tyler Nelson (Camp4).** Low-load, long-duration "density hangs" and feet-on, no-hang pulls for tendon health. Train extensors and wrists as antagonists.
- **Emil Abrahamsson.** "Abrahangs": daily feet-assisted hangs at about 30–60% effort for 10s, repeated. Safe for beginners and on rest days.
- **Hooper's Beta.** Finger injury prevention, rehab, and antagonist work. Flexor-tendon pulley injuries are the top climbing injury.
- **One-arm hang progression** ([Climbing.com](https://www.climbing.com/skills/how-to-do-one-arm-hangs/)): start with an unloading pulley on 20 mm, reach bodyweight, then shrink the edge.

**Safety gates** (enforced as `requires` and challenge numbers):

1. **Age.** No max hangs or campus board under 16, and no campus before 18. Before then, use feet-on and no-hang work only.
2. **Experience.** Max hangs come after about 1 year of climbing plus repeaters. Campus comes after about 2 years plus a 10s hang on 20 mm at +20% BW.
3. **Grips.** Use open hand and half crimp only. No full crimp on the hangboard.
4. **Warm-up.** Do a 10-minute ramp before any limit hang. Stop at the first sharp finger pain.
5. **Volume.** Limit finger work to 2–3 sessions a week, with 48 h between limit sessions.

## Branches

Two new branches, placed beside `grip` and `pull` (fingers) and beside `mobility` and `flex` (hips):

- **`fingers`**, "Fingers" (strength): hangboard, campus, pinch, sloper, antagonists.
- **`hips`**, "Climbing Hips" (mobility): turnout, high step, drop knee, hooks, flagging.

Lock-off and pulling skills extend `pull`. Body-tension skills extend `core` and `frontlever`.

## Proposed skills

Format matches `Raw`: id, name, tier, lane, requires, what, cues, challenges. The last challenge is the mastery test.

### `hips` (new)

| id | name | tier | lane | requires | what | cues | challenges |
|---|---|---|---|---|---|---|---|
| butterfly | Butterfly Stretch | 1 | 0 | [] | Soles together, knees fall open. The first turnout. | Tall spine \| Knees drop, don't push \| Breathe out | Knees 20 cm off floor \| 15 cm \| Knees within 10 cm, 2 min |
| frog | Frog Stretch | 2 | 0 | butterfly | On all fours, knees wide, shins parallel, rock hips back. The climber's turnout stretch. | Ankles in line with knees \| Rock back slow \| Low back neutral | 1 min, knees 90 cm apart \| 2 min, hips at knee line \| 3 min, chest to floor, hips in line |
| ext_rot | Hip External Rotation | 3 | -1 | frog, pigeon_9090 | Seated 90/90 front-leg lifts and figure-4 holds. Active turnout. | Rotate from the hip \| Knee leads \| No leaning | 10 front-knee lifts each \| 10 back-knee lifts each \| 10 each, no hands, 3s holds |
| wall_frog | Wall Frog | 4 | 0 | frog | Lie belly down and press your hips to the wall in a frog. This is the position for keeping your hips to the wall. | Hips to wall \| Feet turned out \| Lift chest | 1 min, 10 cm gap \| 2 min, 5 cm gap \| 3 min, hips touching |
| high_step | Active High Step | 3 | 1 | hip_cars, half_split | Standing, lift a knee as high as you can with no hands and hold it. | Stand tall \| Pull with the hip, not the back \| Hold the top | Knee to hip height 10s \| Foot to hip-height box, no hands \| Foot to chest-height box from standing, 5 each |
| active_straddle | Active Straddle Lift | 4 | 1 | high_step, straddle_sit | Seated straddle, hands in front, lift the heels. Active range for wide stems. | Lean forward \| Toes up \| Lift both heels | 5 lifts \| 10 lifts 2s \| 10 lifts, heels 5 cm up, 5s |
| int_rot | Hip Internal Rotation | 4 | -1 | ext_rot | 90/90 back-leg lifts and prone internal rotation. Drop-knee range. | Back knee leads \| Hips stay square \| Slow | 5 back-leg lifts each \| 10 each \| 10 each, 5s top hold |
| drop_knee | Drop Knee Drill | 5 | -1 | int_rot, deep_squat | On a box or rail: turn the knee in and down, rotate the hips to the wall, reach. | Turn on the ball of the foot \| Hip to wall \| Reach long | 10 each side on floor \| 10 each from a 40 cm box \| 10 each deep, knee below hip, 3s holds |
| heel_hook | Heel Hook Curl | 5 | 0 | wall_frog, slider_curl | Lie on the back with a heel on a bench and drag the hips up with the hamstring. Builds heel-hook pull. | Pull with the heel \| Hips square \| Toes out | 3×8 two legs \| 3×6 one leg \| 3×8 one leg, 3s hold |
| toe_hook | Toe Hook Pull | 5 | 1 | active_straddle, knee_raise | Hanging, hook a toe under a bar or strap and pull your hips up toward it. | Toe pulls up \| Shin flexes \| Core holds tension | 10s hook, bent knee \| 10s, straight leg \| 3×5 one-leg pull-ins, straight leg |
| flag | Flagging Balance | 5 | 2 | high_step | Standing on one leg, extend the other behind or across to counterbalance a reach. | Weight over the foot \| Flag leg long \| Reach opposite | Back flag 20s each \| Inside flag 20s each \| Reach 1 m across, 5 each side, no wobble |
| turnout_squat | Turnout Squat Hold | 6 | 0 | wall_frog, deep_squat | Sumo squat with toes out and knees behind the toes, hips forward. | Knees back \| Hips forward \| Chest tall | 1 min, toes 45° \| 2 min, toes 60° \| 3 min, toes 75°, hips at knee height |
| high_step_load | Loaded High Step | 7 | 1 | high_step, active_straddle | Step onto a box at hip height and stand up with no push-off from the back foot. | Rock over \| Back foot passive \| Drive through the heel | 3×5 each knee-height \| 3×5 each hip-height \| 3×5 each hip-height, hands on head |
| frog_master | Full Frog | 8 | 0 | turnout_squat, middle_split | Frog with the hips sitting fully at knee line and the pelvis flat on the floor. | Pelvis flat \| Breathe \| Let go | Pelvis 10 cm up \| 5 cm \| Pelvis flat 2 min |


### `fingers` (new)

| id | name | tier | lane | requires | what | cues | challenges |
|---|---|---|---|---|---|---|---|
| ext_band | Finger Extensors | 1 | -1 | [] | Open the fingers against a rubber band. The antagonist to every grip. | Spread wide \| Slow return \| Both hands | 3×15 \| 3×25 \| 3×30 thick band |
| wrist_curls | Wrist Curls and Rollers | 2 | -1 | ext_band, wrist_prep | Flexion, extension, pronation and supination with a light weight or hammer. | Slow \| Full range \| Light | 3×15 at 2 kg \| 3×15 at 4 kg \| 3×15 at 6 kg, all four directions |
| abrahangs | Feet-on Hangs | 1 | 0 | [] | Daily hangs on a 20 mm edge with the feet on the floor, at 30–60% effort. The safe start for any age. | Half crimp \| Feet take the rest \| Never strain | 6×10s \| 10×10s daily, 2 weeks \| 10×10s at 60% effort, 4 weeks |
| no_hang | No-hang Lifts | 2 | 0 | abrahangs | Standing, lift a weight with a block or loading pin edge. Fingers load with no shoulder strain. | Half crimp \| Pull straight up \| 10s holds | 20 mm, 40% BW 10s \| 50% BW each hand \| 20 mm, 70% BW each hand 10s |
| hang_jug | Edge Hang 30 mm | 2 | 1 | abrahangs, dead_hang | Two-arm dead hang on a 30 mm edge, open hand. | Shoulders engaged \| Open hand \| Breathe | 10s \| 20s \| 30s |
| hang_20 | Edge Hang 20 mm | 3 | 1 | hang_jug | Two-arm hang on the 20 mm benchmark edge. | Half crimp \| Thumb off \| Arms slightly bent | 10s \| 20s \| 30s half crimp |
| open_hand | Open Hand and Three Finger Drag | 4 | 0 | hang_20 | 20 mm hangs in open-hand and three-finger drag. The slopers-and-pockets grip. | Fingers flat \| Wrist under \| No crimping | 10s open hand \| 10s three-finger drag \| 10s three-finger drag at +10% BW |
| pinch | Pinch Block | 3 | -1 | no_hang | Lift a pinch block or plate pinch. Thumb strength. | Thumb opposes \| Squeeze hard \| Lift straight | 10s at 15 kg \| 10s at 20 kg \| 10s at 30% BW each hand |
| repeaters | Repeaters 7/3 | 4 | 1 | hang_20 | Megos's protocol: 7s on, 3s off, 6 reps on 20 mm. | Half crimp \| Stop at failure of form \| 3 min between sets | 3 sets bodyweight \| 5 sets bodyweight \| 6 sets at +10% BW |
| sloper | Sloper Hang | 5 | -1 | open_hand, pinch | Hang a 20° sloper or ball. | Wrist low \| Open hand \| Hips under | 10s \| 20s \| 30s on a 35° sloper |
| hang_15 | Edge Hang 15 mm | 5 | 1 | repeaters | Smaller edge, bodyweight. | Half crimp \| Thumb off \| Quiet shoulders | 5s \| 10s \| 15s |
| max_hang | Max Hangs | 6 | 0 | repeaters | 10s on 20 mm with added weight at 85–95% effort. Needs 1 year of climbing and age 16+. | 10 min warm-up \| Half crimp \| Stop at any sharp pain | 10s at +10% BW \| +25% BW \| +40% BW |
| campus_ladder | Campus Ladders | 6 | 2 | max_hang | Campus board ladders on big rungs. Needs 2 years of climbing, age 18+, and a 10s hang at +20% BW on 20 mm. | Hands only \| Hit, don't slap \| Fresh only | 1-2-3 on jugs \| 1-2-3-4-5 on jugs \| 1-2-3-4-5 on medium rungs, both leads |
| hang_10 | Edge Hang 10 mm | 7 | 1 | hang_15, max_hang | Two-arm bodyweight hang on 10 mm. | Half crimp \| Pull into the edge \| Tight body | 5s \| 7s \| 10s |
| oa_hang_assist | Assisted One-arm Hang | 7 | 0 | max_hang, oa_hang | One-arm hang on 20 mm with a pulley counterweight. | Shoulder engaged \| Slight bent arm \| Remove weight slowly | 10s with -30% BW \| 10s with -15% BW \| 10s with -5% BW, each arm |
| campus_power | Campus Doubles and Max Moves | 7 | 2 | campus_ladder | Bump and double-dyno campus moves, plus a max 1-to-far rung. | Explode \| Catch with bent arms \| 3 sets max | 1-3-5 \| 1-4-7 \| 1-5-9 on medium rungs |
| oa_hang_20 | One-arm Hang 20 mm | 8 | 0 | oa_hang_assist | Bodyweight one-arm hang on 20 mm, half crimp. Megos rates 20–23 mm world class. | Pull the shoulder down \| Free hand loose \| Don't twist | 3s each \| 7s each \| 10s each |
| max_hang_50 | Max Hang +50% | 8 | 1 | hang_10, max_hang | Lattice's V7–8 benchmark: 10s on 20 mm at +50% BW. | Warm up fully \| Half crimp \| One attempt | +45% BW \| +50% BW \| +60% BW |
| oa_hang_15 | One-arm Hang 15 mm | 9 | 0 | oa_hang_20, max_hang_50 | One arm on a 15 mm edge. Elite. | Exact grip \| Quiet body \| Stop if pulleys complain | 3s each \| 5s each \| 10s each |

### `pull` (extend)

| id | name | tier | lane | requires | what | cues | challenges |
|---|---|---|---|---|---|---|---|
| lockoff | Lock-off Holds | 5 | 1 | pullup_12 | Hold two-arm at the top, 90° and 120°. | Shoulder down \| Elbow tight \| No sag | 10s each angle \| 20s each \| 30s each |
| offset_pull | Offset Pull-up | 6 | -1 | pullup_12, towel_hang | One hand on the bar, one on a towel 30–50 cm lower. | Top hand does the work \| Pull to the high hand \| Switch sides | 3×3 each, 30 cm \| 3×5 each, 40 cm \| 3×5 each, 50 cm |
| weighted_pull | Weighted Pull-up | 6 | 1 | pullup_12 | Strict pull-ups with weight added. | Dead hang start \| Chin over \| Control down | 1 rep at +25% BW \| +40% BW \| 1 rep at +60% BW |
| oa_lockoff | One-arm Lock-off | 8 | -1 | oa_neg, lockoff | Hold one arm at the top, 90° and 120°. Megos films these. | Elbow tucked \| Squeeze hard \| Body still | 3s top each \| 5s top and 90° each \| 5s at 120° each |
| oapu_edge | One-arm Pull-up on Edge | 9 | -1 | oapu, oa_hang_20 | One-arm pull-up on a 20 mm hangboard edge. | Half crimp \| Shoulder first \| Chin over the board | Jug \| 30 mm \| 20 mm, each arm |

`typewriter`, `archer_pullup`, `oa_neg`, `oapu`, `oa_hang` already exist and stay.

### `core` / `frontlever` (extend)

| id | name | tier | lane | requires | what | cues | challenges |
|---|---|---|---|---|---|---|---|
| tension_board | Overhang Tension Hold | 5 | 2 | hollow_hold, leg_raise | Hanging from a bar with the feet on a low box in front, keep the hips up with straight arms. | Feet press the box \| Hips up \| Straight arms | 20s \| 40s \| 60s with the box at hip height |
| toe_hook_lever | Toe-hook Lever | 7 | 2 | toe_hook, adv_tuck_fl | In a hang, toe-hook a second bar and raise the body horizontal. Toe-hook tension on a roof. | Pull with the toes \| Hips level \| Shoulders depressed | 5s \| 10s \| 10s, then release the hook and hold 3s straddle lever |
| cut_loose | Cut-loose Control | 6 | 2 | ttb, scap_pull | Swing, then stop the swing dead and raise the feet to the bar. | Brake with the lats \| Feet back up fast \| Quiet | Stop within 3 swings \| Within 1 swing \| Stop and toes to bar, 5 reps |

`full_fl` stays the body-tension mastery skill.

## Check-in questions

```ts
{ id: 'climb', ask: 'Do you climb?', options: [
  { label: 'No' },
  { label: 'Under 1 year', grants: ['abrahangs'] },
  { label: '1–2 years', grants: ['hang_20'] },
  { label: '2+ years', grants: ['repeaters'] },
] },
{ id: 'hangboard', ask: 'Best 10s hang on a 20 mm edge?', options: [
  { label: 'Never tried' },
  { label: 'Bodyweight', grants: ['hang_20'] },
  { label: '+25% BW', grants: ['max_hang'] },
  { label: '+50% BW', grants: ['max_hang_50'] },
  { label: 'One arm', grants: ['oa_hang_20'] },
] },
{ id: 'frog', ask: 'Frog stretch, hips at knee line?', options: [
  { label: 'Not close' },
  { label: 'Halfway', grants: ['frog'] },
  { label: 'Hips touch a wall', grants: ['wall_frog'] },
] },
```

Add `{ label: 'Climbing', focus: ['fingers', 'hips', 'pull'] }` to `goals`, and `{ label: 'Fingers', focus: ['fingers'] }` to `pain` (it routes to the antagonist and feet-on work).

Gates such as campus at 18+ rely on the check-in `climb` answer and on the cues. A future `age` question could hide `campus_*`.
