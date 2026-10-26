# Animated figure

Each skill has a looping cartoon in `app/src/content/moves/<branch>.ts`, keyed by skill id. Engine: `src/core/figure.ts` (pure) and `src/ui/figure.ts` (SVG).

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
- `props`: `bar`, `rings`, `wall`, `pole`, `box {x,w,h}`, `bars` (parallel bars end-on). `floor: false` hides the floor.
- `ms`: base transition time (default 900). Holds use 2 keys: entry, then the hold with a small change (breathing, tension).

## Timing and momentum

Motion must read as a person moving mass, not a puppet between poses. `beats` (one per key) and `flow` do this:

- `dur`: relative length of the transition to the next key. Strength reps: lowering 1.5-2, rising 1 (controlled eccentric, strong concentric). Explosive moves: load 1, drive 0.4-0.6.
- `ease`: `io` default; `snap` for explosive drives (jump, kip, clap, muscle-up pull); `out` rising into an apex or settling into a hold; `in` falling, dropping into a catch; `lin` for steady gaits and crawls (`cycle`).
- `hold`: pause on a key. Default 0.3 only at a bounce's turnarounds. Short pause at the top/bottom of reps; none mid-flight.
- `lift`: height above the pinned placement. Flight phases use it: takeoff key lift 0 with `ease: 'out'`, apex key with lift and `ease: 'in'`, landing lift 0. The figure must actually leave the floor.
- `flow`: 0.1-0.25 on swings, jumps, throws, kicks and rolls so forearms, shins and head trail the body. Leave it 0 when hands or feet are planted (contacts would slide).
- Add anticipation and follow-through as keys: dip before a jump, absorb after a landing, swing back before a kip.

## Rules

- Tests require one move per skill and nothing sinking below the floor.
- Use geometry, not guesses: contacts (hands on floor or bar, feet on box) must touch. Helpers `leg`/`arm` (IK) in `moves/legs.ts`.
- Show the biomechanics that the cues name: scapula and spine position, hip hinge vs squat, knee tracking, lockout, lean.
- Check with `MSYS_NO_PATHCONV=1 npm run -s eye -- '#/moves/<branch>' <name>` and look at the screenshot. The review page shows the live loop then each key.
