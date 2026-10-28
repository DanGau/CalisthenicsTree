# Motion reference

Numbers for making the figure move like a body. Model terms (`dur`, `hold`, `ease`, `flow`, `lift`, `shift`) are from [figure.md](figure.md). "est." marks coaching or video-derived estimates, not measured data.

Scale: figure ≈ 175 px tall for a 1.75 m man, so **1 px ≈ 1 cm**, **g ≈ 981 px/s²**.

## 1. Universal rules

### 1.1 Velocity is bell-shaped, not linear

Point-to-point human movement follows a minimum-jerk profile ([Flash & Hogan 1985](https://doi.org/10.1523/JNEUROSCI.05-07-01688.1985)):

- position `s(τ) = 10τ³ − 15τ⁴ + 6τ⁵`, τ = t/T
- peak speed at τ = 0.5, **1.875× mean speed**
- progress at τ = 0.25 / 0.5 / 0.75: **0.10 / 0.50 / 0.90**

A linear tween spends 25 % of its distance in the first quarter; a body spends 10 %. Any isolated rep or reach with a stop at both ends should look like this. Loaded strength reps skew it: the peak comes early in a concentric (≈35-45 % of T) then slows through the sticking point, and late in an eccentric (gravity accelerates, the brake comes near the bottom) (est., consistent with barbell velocity curves, [Kompf & Arandjelović 2016](https://doi.org/10.1007/s40279-016-0526-1)).

Model: a bounce turnaround with `hold` gives the stop. For a single segment that must look minimum-jerk, use `ease: 'io'` with a hold at each end; never `lin` for a body segment.

### 1.2 Proximal leads distal

Power moves sequence proximal to distal: trunk/hips, then knees/shoulders, then ankles/elbows/wrists, ≈30-60 ms between adjacent joints in a jump or throw ([Bobbert & van Ingen Schenau 1988](https://doi.org/10.1016/0021-9290(88)90280-3); [Putnam 1993](https://doi.org/10.1016/0021-9290(93)90084-R)). Peak hip extension velocity precedes peak knee, which precedes peak ankle.

Model: `flow` 0.1-0.25 does this for distal segments. Where a contact pins the distal end (feet in a squat jump until takeoff), put the lag in the keys instead: the key where hips open should have knees still ≈10-20° short of their final angle.

### 1.3 Anticipation, follow-through, settle

| Event | Real body | Model |
|---|---|---|
| Countermovement before a jump | 0.3-0.5 s dip, knee to ≈90-110° flexion (§3) | 1 key, `dur` 1, ease `out` into bottom |
| Landing absorption | peak force at ≈70 ms; knee flexion 37° (stiff) to 55° (soft) more than contact ([SpringerOpen](https://sportsmedicine-open.springeropen.com/articles/10.1186/s40798-016-0072-x/figures/1); [PMC3867085](https://pmc.ncbi.nlm.nih.gov/articles/PMC3867085)); stop ≈0.2-0.35 s after contact (est.) | contact key ease `in`, absorb key dur 0.3-0.4 of a load, then a rise back |
| Settle after a fast stop | 1 small overshoot, ≈5-10 % of the move, damped by ≈0.3 s (est.) | extra key with a 2-5° overshoot, `dur` 0.3 |
| Arm swing in a jump | adds ≈10 % jump height; arms swing back during unweighting and forward-up during propulsion, peaking just before takeoff ([Lees et al. 2004](https://doi.org/10.1016/j.jbiomech.2004.01.008)) | arms are their own keys, lead legs by ≈0.1 s |

### 1.4 Holds are never still

- Quiet standing: sway ≈0.1-0.5 Hz, CoM ≈1 cm amplitude AP ([Winter 1995](https://doi.org/10.1016/0966-6362(95)99067-U)).
- Handstand: CoM sway dominant ≈**0.3 Hz**, hand pressure corrections ≈**1.2 Hz**; corrected mostly at the wrists, other joints fairly still ([sport-iat](https://lida.sport-iat.de/ta/Record/4016720?lng=en); [Kerwin & Trewartha 2001](https://doi.org/10.1097/00005768-200107000-00024)). Amplitude ≈1-3 cm at the hips for skilled, larger for novices (est.).
- Breathing at rest: 12-16 /min (≈4-5 s); slow stretching breath 5-6 /min (≈10 s) ([Russo et al. 2017](https://doi.org/10.1183/20734735.009817)).

Model: a hold is 2 keys (entry, then hold variant) bouncing. Make the second key differ by 1-3° of torso/chest (breath) or wrist/torso (balance), and set the hold loop to the real period:

| Hold | half-period (one way) | delta |
|---|---|---|
| Handstand, planche, levers | ≈1.5 s (0.3 Hz) | torso ±1-2°, wrist (forearm) ±1° |
| Static stretch | ≈4-5 s (slow breath) | chest ±2-3°, deepening 1-2° on exhale |
| Plank, L-sit, hollow | ≈2 s (breath) | chest ±1°, slight shake hint ok |

Use `ease: 'io'`, `hold` ≈0.2-0.5.

## 2. Strength reps (push, dip, pull, planche, levers, flag, core)

### 2.1 Tempo

Self-paced bodyweight reps: ≈**1.5-2 s down, 1 s up**, short pauses ([Sakamoto & Sinclair 2006](https://doi.org/10.1519/R-17604.1); [Wilk et al. 2021](https://doi.org/10.1007/s40279-020-01368-1) for tempo conventions). Typical rep 2.5-3.5 s.

| Skill | Ecc. | Pause bottom | Con. | Pause top | dur ratio (down:up) |
|---|---|---|---|---|---|
| Push-up | 1.5 s | 0.1-0.3 | 0.8-1 s | 0.2 | 1.7 : 1 |
| Dip | 1.5-2 | 0.2 | 1 | 0.2 | 1.7 : 1 |
| Pull-up / chin-up | 1.5-2 | 0.2 (dead hang) | 1-1.2 | 0.1-0.3 (chin over) | 1.6 : 1 |
| Pistol / squat | 1.5-2 | 0.2 | 1-1.2 | 0.2 | 1.6 : 1 |
| Lever / planche push or pull | 2-3 | 0.3 | 1.5-2 | 0.3 | 1.3 : 1 |
| Explosive (clap push-up, kipping) | 0.4-0.6 load | 0 (stretch-shortening, <0.25 s) | 0.2-0.3 | — | 1 : 0.5 |

`ms` ≈ 900-1100 with these ratios gives realistic speed for push/pull reps.

### 2.2 Sequencing inside a rep

- **Push-up**: down: elbows flex 0→90°+, scapulae retract late in descent (est.); up: elbows lead, scapulae protract in the last ≈20 % (the "plus"). Elbow at ≈45° from torso in front view. Body line rigid; hips must not lag (that is a fault) ([Cogley et al. 2005](https://doi.org/10.1519/R-15724.1)). Sticking point ≈ just above bottom (elbow ≈90-100°): slowest speed there.
- **Pull-up**: scapula depresses/retracts **first** (first ≈10-15 % of rise, ≈0.15-0.2 s, body rises ≈3-5 cm with straight arms), then elbows flex. Sticking point mid-range (elbow ≈90°), then faster to chin over. Lowering: elbows extend, scapula elevates only in the last ≈15 % ([Prinold & Bull 2016](https://doi.org/10.1016/j.jsams.2015.07.016)). Model: key with `scap` −5, arms unchanged, `dur` 0.3; then the pull.
- **Dip**: shoulder extension and elbow flexion together; torso leans 20-40° forward deeper in the rep (more for chest). Top: `scap` −5 (depressed), elbows locked.
- **Muscle-up** (est., video-based; no published phase times found): swing back 0.6-0.8 s → hollow-to-arch kip ≈0.6 s → explosive pull to sternum 0.3-0.4 s → transition (wrists over bar, chest over hands) 0.2-0.3 s → press-out 0.5-0.7 s. Hip drive peaks *before* the pull; torso pitches forward ≈40-60° during transition.
- **Kip (bar)**: glide/swing forward ≈0.8-1 s, pike (feet to bar) at the end of the forward swing, then leg extension and arm pull-down together ≈0.3-0.4 s. Skilled kippers keep a straighter body and later hip-flexion peak ([ISBS kip](https://ojs.ub.uni-konstanz.de/cpa/article/view/671)).
- **Levers, planche, flag**: entries are slow (2-3 s), from tuck → advanced tuck etc. Scap fixed (planche protracted/depressed, front lever depressed/retracted). Holds per §1.4.

### 2.3 Model recipe

```
keys: top, mid (optional, at sticking point), bottom
beats: top {dur 1.6, hold 0.2}, mid {dur 0.6}, bottom {dur 1, hold 0.15}
ease: lowering key 'io'; bottom 'io'; no snap except explosive
flow: 0 (hands/feet planted)
```

Add the mid key only where a joint path is non-monotone (scap phase in pull-up, lean change in dip). Ups that should "grind" get a mid key at the sticking point with a longer `dur` after it (≈0.6 before, 0.4 after → slowing then accelerating).

## 3. Jumps (legs, plyometric, precision, broad, box)

### 3.1 Countermovement jump phases

([McMahon et al. 2018](https://eprints.chi.ac.uk/id/eprint/3266/); [IJES](https://pmc.ncbi.nlm.nih.gov/articles/PMC10464753/table/t2-ijes-16-4-1038))

| Phase | Duration | Notes |
|---|---|---|
| Unweighting | 0.3-0.45 s | CoM accelerates down; arms swing back |
| Braking | 0.15-0.25 s | stop the descent; deepest at end; knee ≈90-110°, hip ≈60-80° flex, trunk lean ≈40-50° |
| Propulsion | 0.2-0.3 s | hip → knee → ankle extension (§1.2); arms drive up |
| Flight | 0.45-0.6 s (h ≈25-45 cm) | body straight, ankles plantar-flexed |
| Landing to stop | 0.2-0.35 s | knee flexion 40-60° |

Countermovement time 0.5-0.7 s. Total for 1 jump ≈1.5-2 s plus recovery.

Squat jump (no countermovement) propulsion ≈0.35-0.4 s. Depth / drop jump ground contact ≈0.2-0.25 s. Pogo / ankle hop contact ≈0.15-0.2 s, flight ≈0.25-0.35 s (est.). Broad jump: takeoff angle ≈30-45°, flight ≈0.5-0.6 s, distance 2-2.5 m for a fit man (est.).

### 3.2 Flight is a parabola

Flight time T (s) gives apex `h = g·T²/8` (px with g = 981):

| T | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 |
|---|---|---|---|---|---|---|
| h px | 11 | 20 | 31 | 44 | 60 | 78 |

Lift at fraction τ of flight: `lift = 4h·τ(1−τ)`. Keys:

| τ | 0 | 0.25 | 0.5 | 0.75 | 1 |
|---|---|---|---|---|---|
| lift | 0 | 0.75h | h | 0.75h | 0 |
| ease | `out` | — | `in` | — | land key |

With the spline, 3 keys (takeoff `out`, apex `in`, landing) suffice when nothing else changes; add τ = 0.25 / 0.75 keys when the body shape changes in the air (tuck, pike, leg cycling). Each key's `dur` is its share of T; with `ms` = 900, a 0.5 s flight is total dur ≈0.55.

Horizontal: `shift` is linear in time during flight (no horizontal force). Use ease `lin` on shift-only progress or keep shift deltas equal per equal-time key.

Body rotation in flight is also linear in time once airborne (constant angular momentum), but angular velocity rises when tucking and falls when opening. Tuck ≈ 2-3× faster spin than layout (moment of inertia ratio, est.).

### 3.3 Model recipe (vertical jump)

```
stand        dur 1.0  ease 'io'   hold 0.2
bottom       dur 0.5  ease 'snap' (braking ends, drive)   lift 0
takeoff      dur T/2  ease 'out'  lift 0   (toes pointed, arms high)
apex         dur T/2  ease 'in'   lift h
land         dur 0.3  ease 'out'  lift 0   (contact, knees ~20°)
absorb       dur 0.8  ease 'io'   knees 50-60°, then back to stand
flow 0.15
```

Arms lead the legs (arms reach the bottom swing ~0.1 s early and peak overhead at takeoff).

## 4. Tumbling (rolls, cartwheel, round-off, handsprings, saltos)

| Skill | Phases and times | Source |
|---|---|---|
| Forward roll | squat → hands → tuck roll ≈0.8-1 s → stand ≈0.4 s | est. |
| Cartwheel | ≈1-1.4 s total; hand 1, hand 2 ≈0.15-0.2 s apart; legs pass vertical straddled | est. |
| Round-off | hurdle ≈0.4 s, hand contact ≈0.2-0.25 s per hand overlapping, snap-down ≈0.15 s; leaves with backward momentum | est. |
| Back handspring | sit/arm swing 0.3-0.4 s, takeoff, flight 1 ≈0.25-0.35 s (long, low), hand contact ≈0.15-0.25 s, flight 2 ≈0.15-0.25 s, snap-down to feet; total ≈1 s | [Huang & Hsu ISBS](https://ojs.ub.uni-konstanz.de/cpa/article/view/3237/3039), est. |
| Back tuck (standing) | set 0.3-0.4 s, flight ≈0.6-0.75 s (CoM rise ≈50-70 cm), landing absorb 0.25-0.35 s | est. from flight equation |
| Front tuck | similar flight 0.55-0.7 s, block with arms, hips rise over shoulders | est. |
| Aerial | like cartwheel without hands, flight ≈0.5 s | est. |

Joint order:

- **Back handspring**: arms swing up first, hips push back ("sit"), then knees/ankles drive; shoulders open before hips; at hand contact body arched ≈30-40° (est.); snap-down: hips flex, shoulders block, feet come under the CoM.
- **Saltos**: jump straight up (arms up, chest up), knees pulled to chest *after* leaving the floor; open at ≈3/4 rotation; spot the floor (head leads the opening).

Model: rotation angles unwrapped (0 → 360). Torso angle over time should be roughly linear in flight, faster during tuck. Give the tuck key ≈40 % of flight dur but ≈60 % of rotation. `flow` 0.2 for limbs and head. `travel`/`shift` for handsprings ≈1.2-1.5 m per skill (est.).

## 5. Gaits (walk, run, crawls, animal flow)

### 5.1 Walking and running

| | Walk | Run (easy) | Sprint |
|---|---|---|---|
| Cadence | 100-120 steps/min (stride ≈1.0-1.2 s) | 160-180 steps/min (stride ≈0.7 s) | 200-240 steps/min |
| Stance % of stride | ≈60 % (double support 2×10 %) | ≈35-40 % | ≈20-25 % |
| Flight | none | ≈2×0.1 s | ≈2×0.12 s |
| Knee in swing | ≈60° flexion | ≈90-110° | ≈120-130° |
| Trunk lean | ≈0-5° | ≈5-10° | 10-15°, more at accel |
| Arms | counter-phase to legs, small elbow 20-30° | elbows ≈90° | ≈90°, big swing |
| CoM vertical | ≈4-5 cm, high at mid-stance | ≈6-10 cm, low at mid-stance | ≈5 cm |

([Perry & Burnfield, Gait Analysis](https://www.slackbooks.com/gait-analysis-normal-and-pathological-function-second-edition/); [Novacheck 1998](https://doi.org/10.1016/S0966-6362(97)00038-6))

Model: `mode: 'cycle'`, 4 keys per stride (contact L, mid-stance L, contact R, mid-stance R) or 8 for running with flight (adding toe-off and mid-flight). `travel` = stride length (walk ≈1.4 m = 140 px, run ≈2-2.5 m). Walking: lift highest at mid-stance (≈+4 px); running: lowest at mid-stance, highest mid-flight (`lift` per §3.2 with T ≈0.1 s → ≈1 px, so CoM bob dominates: use ≈6-8 px). `flow` 0.1-0.15 for swing-leg shin and forearms.

### 5.2 Quadrupedal crawls

Humans crawl in a **lateral-sequence walk** by default: L foot, L hand, R foot, R hand; limb phases ≈0 / 0.25 / 0.5 / 0.75, i.e. diagonality ≈0.25; hands stand slightly longer than knees/feet ([Righetti et al. 2015](https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2015.00017/full); [Patrick et al. 2009](https://doi.org/10.1152/jn.00022.2009)). Coached crawls (bear, crab, leopard) are usually **contralateral (diagonal) trot-like**: opposite hand and foot move together, phase 0 / 0.5 (est., coaching convention).

| Crawl | Pattern | Duty factor | Cycle | Notes |
|---|---|---|---|---|
| Baby / natural crawl | lateral sequence | ≈0.7-0.75 | 1-1.5 s | 3 limbs down most of the time |
| Bear crawl (coached) | diagonal pairs | ≈0.6-0.7 | 1-1.4 s | knees 2-5 cm off the floor, hips at shoulder height, back flat |
| Crab walk | diagonal pairs | ≈0.6-0.7 | 1.2-1.6 s | hips sag ≈5-10 cm when stepping; slower |
| Ape / frog hops | front pair then rear pair | ≈0.5 | 0.8-1.2 s | short flight of hips over hands |
| Lizard / leopard crawl | diagonal, deep elbows | ≈0.7 | 1.5-2 s | large lateral trunk flexion, hip to elbow |

Model: `cycle`, 4 keys (each diagonal pair's step and its stance), `travel` ≈ step length (bear ≈40-60 px). Lift stepping limbs only 5-10 px. Hip height bobs ≈2-4 px twice per cycle. `flow` 0 on planted limbs; the stepping limb leads with knee/elbow, distal follows.

## 6. Parkour (precision, vaults, climb-up, rolls, wall run)

| Skill | Key numbers |
|---|---|
| Precision jump | two-foot takeoff like a broad jump (§3): arms back 0.3-0.4 s, flight 0.4-0.6 s; land on balls of feet, knees bend 40-60°, hips back, arms forward for balance, stop ≈0.3 s with a small forward wobble (est.) |
| Safety / step vault | approach run; hand on obstacle ≈0.2-0.3 s; feet pass beside hand; total over obstacle ≈0.5-0.7 s (est.) |
| Kong / cat vault | dive with hands reaching first, hand contact ≈0.15-0.25 s, push back, knees tuck through, flight after ≈0.3 s (est.) |
| Lazy / speed vault | one hand, legs sweep sideways, ≈0.5 s over the obstacle (est.) |
| Climb-up | from hang: kick/walk feet ≈0.3 s, explosive pull 0.3-0.4 s (like muscle-up transition), press to straight arms 0.5 s, step up 0.5-0.7 s (est.) |
| Parkour roll | diagonal across back, shoulder to opposite hip, ≈0.6-0.8 s, exits running (est.) |
| Wall run / tic-tac | foot contact on wall ≈0.15-0.2 s, adds 30-60 cm height (est.) |

Rules: hands reach the obstacle before the feet leave the ground in kong/dive vaults; head and eyes lead; after every landing a visible absorb (§1.3).

## 7. Breaking and floor (toprock, footwork, freezes, power moves)

| Move | Timing |
|---|---|
| Toprock | on music, ≈100-120 BPM: 1 step per beat (≈0.5-0.6 s), arms cross on the "and" |
| 6-step | ≈6 beats ≈3-3.5 s per revolution; body low, hands support alternately |
| Windmill, flare | ≈0.6-1 s per revolution (est.); constant angular speed after entry |
| Headspin | 2-4 rev/s for skilled (est.) |
| Freezes | entry ≈0.3-0.5 s with a hit (sharp stop, 1 small overshoot), held 1-2 beats |

Model: power moves `cycle` with constant rotation (`ease: 'lin'` on the turn/torso), `flow` 0.15-0.25 on legs; freezes: entry `ease: 'out'` then 2-key hold, settle overshoot 2-3°.

## 8. Hinge and squat (legs, hinge, pistol, Nordic)

- **Squat**: trunk lean and knee travel trade off; descent hips and knees flex together (hip:knee angle ratio ≈1:1 in the top half), trunk lean ≈30-45° at parallel, knees forward past toes ≈5-10 cm ([Schoenfeld 2010](https://doi.org/10.1519/JSC.0b013e3181e5afe2)). Ascent: knees and hips extend together; a "good morning" (hips first) is a fault.
- **Hip hinge / RDL**: hips move back first, knee bends only 15-20° early then stays fixed; spine neutral; ≈90 % of motion at hips. Rise: hips forward, glutes lock out last.
- **Pistol**: lean 40-60° forward at bottom; free leg straight forward; arms forward counterbalance; 2 s down 1 s up.
- **Nordic curl**: eccentric 3-5 s, near-constant speed until the break point at ≈30-45° from horizontal, then a fall caught by hands.
- **Step-up / lunge**: 1 s down 0.8 s up; front shin vertical-ish, rear knee to ≈2-5 cm off floor.

Model: path keys at top, mid, bottom so hips lead in a hinge (mid key: hips back, knees nearly at final), knees lead slightly in a squat.

## 9. Mobility, flexibility, backbends

| Type | Rhythm | Model |
|---|---|---|
| Static stretch | 20-60 s holds; each exhale deepens ≈1-3° | 2-key hold, half-period 4-5 s, `ease 'io'`, `hold` 0.5 |
| Dynamic stretch (leg swings) | ≈1 Hz pendular (half-period ≈0.5 s); amplitude grows over first 3-5 swings | bounce, ease `io`, `flow` 0.15-0.2 |
| CARs / controlled circles | slow, constant speed ≈5-10 s per circle | `cycle`, 6-8 keys, `ease 'lin'` |
| Cat-cow | 1 breath per cycle ≈4-6 s; spine segments sequence: pelvis tilts first, then lumbar, thoracic, head last | torso key leads chest by ≈0.1 of cycle, head last |
| Bridge (from floor) | push 1-1.5 s, hold, lower 1.5-2 s, head clears floor before hips rise fully (est.) | hips key then shoulder/head key |
| Pancake, splits | slide in 3-5 s, hold breathing | as static stretch |

Spinal waves (cat-cow, body waves, bridge rolls): sequence segment by segment ≈0.1-0.15 s apart, pelvis → waist → chest → head (or reverse). In the model: torso, chest, head keys staggered, or `flow` 0.1 if hands/feet are free.

## 10. Swings and hangs (pull, grip, front/back lever, bar)

- **Pendulum**: hanging body swing period `T ≈ 2π√(I/(m·g·d))`; for a ≈2 m arm-to-feet body, ≈**2-2.4 s per full swing** (est.), slower than a 1 m pendulum's 2 s. Arc 30-60° for a casual swing.
- Speed is highest at the bottom, zero at the ends: sinusoidal. Model: 2 keys (front, back) bouncing, `ease 'io'`, `hold` 0, dur matching ≈1.1 s each way; `flow` 0.15-0.25 so legs trail the trunk at the ends (legs whip through after the hips reverse).
- **Kip swing / beat swing**: hollow at front, arch at back; shoulders lead (push the bar away at the back), feet trail by ≈0.1-0.15 s (est.).
- **Dead hang**: `scap` + (elevated); active hang `scap` −5 with ≈2 cm body rise. Hang wobble ≈0.5 Hz, ±1° (est.).

## 11. Summary table for the model

| Family | Keys | dur ratios | hold | ease | flow | lift/shift |
|---|---|---|---|---|---|---|
| Strength rep | 2-3 | down 1.6 : up 1 | 0.1-0.3 ends | io | 0 | — |
| Explosive rep | 3-4 | load 1 : drive 0.4-0.6 : air (§3.2) | 0 | snap on drive | 0-0.1 | parabola |
| Jump | 5-6 | stand 1, dip 0.5, flight T, absorb 0.8 | 0.2 stand | out takeoff, in apex | 0.15 | parabola (§3.2) |
| Salto / handspring | 5-7 | set 0.4, flight 0.7, land 0.3 | 0.2 | out/in in flight | 0.2 | parabola + linear rotation |
| Gait | 4-8 cycle | equal per phase; stance ≈60 % walk, ≈40 % run | 0 | spline | 0.1 | travel = stride |
| Crawl | 4 cycle | equal | 0 | spline | 0 | travel = step, 5-10 px limb lift |
| Static hold | 2 | ≈1.5 s (balance) or 4-5 s (breath) | 0.2-0.5 | io | 0 | — |
| Swing | 2 | ≈1.1 s each way | 0 | io | 0.2 | — |
| Power move / CARs | 6-8 cycle | equal | 0 | lin | 0.15-0.25 | — |

## 12. Checklist against "linear" motion

1. No body segment moves at constant speed between two stops: use ease or a hold.
2. Something always leads: name the joint that moves first in each transition, and make its key change earlier.
3. Every landing has an absorb key; every jump has a dip key; every fast stop has a 2-5° overshoot.
4. Holds breathe or sway at the real frequency (§1.4), not every 0.9 s.
5. Flight uses the parabola; airborne rotation is steady.
6. Eccentrics are slower than concentrics, except stretch-shortening reps.
