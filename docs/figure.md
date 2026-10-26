# Animated figure

Each skill has a looping cartoon in `app/src/content/moves/<branch>.ts`, keyed by skill id. Engine: `src/core/figure.ts` (pure) and `src/ui/figure.ts` (SVG).

## Pose

`Pose` = 9 to 11 absolute angles in degrees: `[torso, nearUpper, nearFore, farUpper, farFore, nearThigh, nearShin, farThigh, farShin, chest?, head?]`.

- `torso` is pelvis→waist; `chest` is waist→shoulders (default = torso), so the spine can hollow, arch or round. `head` (default = chest) nods or looks up. Use them: a hollow body, a cat-cow, a bridge or a dragon flag reads only with a bent spine.

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
- `ms`: transition time (default 900). Holds use 2 keys: entry, then the hold with a small change.

## Rules

- Tests require one move per skill and nothing sinking below the floor.
- Use geometry, not guesses: contacts (hands on floor or bar, feet on box) must touch. Helpers `leg`/`arm` (IK) in `moves/legs.ts`.
- Show the biomechanics that the cues name: scapula and spine position, hip hinge vs squat, knee tracking, lockout, lean.
- Check with `MSYS_NO_PATHCONV=1 npm run -s eye -- '#/moves/<branch>' <name>` and look at the screenshot. The review page shows the live loop then each key.
