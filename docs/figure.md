# Animated figure

Each skill has a looping cartoon in `app/src/content/moves/<branch>.ts`, keyed by skill id. Engine: `src/core/figure.ts` (pure) and `src/ui/figure.ts` (SVG).

## Pose

`Pose` = 9 absolute angles in degrees: `[torso, nearUpper, nearFore, farUpper, farFore, nearThigh, nearShin, farThigh, farShin]`.

- 0 = straight down, 90 = forward (+x, the way the figure faces, to the right), 180 = up, -90 = back.
- Each angle is the direction of that segment from its parent joint: torso hip→shoulder (180 = upright), upper arm shoulder→elbow, forearm elbow→hand, thigh hip→knee, shin knee→ankle.
- Angles never wrap: 0 → 360 animates a full turn. Use this for rolls and flips.
- Lengths: torso 50, neck to head centre 17, head radius 10, upper arm 28, forearm 26, thigh 38, shin 38. Arm 54, leg 76.
- Feet point at shin + 90 (side view). y grows downward; the floor is y = 0.

## Move

- `keys`: poses in order. `mode: 'bounce'` (default) plays them back in reverse for reps; `'cycle'` loops last → first.
- Placement: `x` names the joint pinned horizontally to `at[0]` (default `hip`). `y` is `'floor'` (default: lowest point rests on the floor) or a joint pinned to `at[1]` (hangs: `x: 'hand', y: 'hand', at: [0, -210]`).
- `front: true` draws a front view: angles mean left/right (-90 = viewer's left, 90 = right); near limbs sit on the viewer's left. Use it for archer, cossack, side plank, flag, middle split, cartwheel.
- `props`: `bar`, `rings`, `wall`, `pole`, `box {x,w,h}`, `bars` (parallel bars end-on). `floor: false` hides the floor.
- `ms`: transition time (default 900). Holds use 2 keys: entry, then the hold with a small change.

## Rules

- Tests require one move per skill and nothing sinking below the floor.
- Use geometry: e.g. a push-up plank at 25° puts the shoulders 54 up, exactly one straight arm.
- Check with `MSYS_NO_PATHCONV=1 npm run -s eye -- '#/moves/<branch>' <name>` and look at the screenshot. The review page shows the live loop then each key.
