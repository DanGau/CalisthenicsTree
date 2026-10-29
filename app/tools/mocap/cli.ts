// Offline: CMU mocap clip → solid Move. See docs/figure.md (Mocap).
//   npm run mocap -- sheet <clip> [from] [to] [step] [--yaw d] [--tilt d]      contact sheet + stats, to find frame ranges
//   npm run mocap -- video <landmarks.json> <from> <to> <id> [--ground low|foot|hand] [--jump f] [--vis v] [--cutoff hz] [--beta b] [--step n] --title t --author a --license l --url u, plus build's flags
//   npm run mocap -- gltf <file.glb> [anim] [from] [to] [id] [--fps n] --title t --author a --license l --url u, plus build's flags; no anim lists them, no id gives a contact sheet
//   npm run mocap -- build <clip> <from> <to> <id> [--mode cycle|bounce] [--pin hip|foot] [--yaw d] [--view d] [--tilt d] [--mirror] [--tol d] [--tail s] [--seam s|off] [--match n] [--plant auto|joints]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { at, loopMs, type Move } from '../../src/core/figure'
import { MOVES } from '../../src/content/moves'
import { COLS } from '../../src/content/mocap/clip'
import { still } from '../../src/ui/figure'
import { parse, type Bvh } from './bvh'
import { retarget, skeleton, world, type Opts, type Skel } from './fit'
import { build, reduce } from './reduce'
import { loadLandmarks, videoSkeleton, type VideoOpts } from './video'
import { png, stick } from './render'
import { contacts, poseGap, seam, slip } from './plant'
import { load as loadGlb, names, sample } from './gltf'

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CACHE = resolve(APP, '.mocap-cache')
const SHOTS = resolve(APP, 'screenshots')
mkdirSync(SHOTS, { recursive: true })

const argv = process.argv.slice(2)
const flags: Record<string, string> = {}
const pos: string[] = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? 'true' : argv[++i]
  else pos.push(argv[i])
}
const num = (k: string, d: number) => (flags[k] === undefined ? d : +flags[k])

/** The clip's BVH (`85_08`), downloaded once from the cgspeed conversion mirror. */
async function load(clip: string): Promise<Bvh> {
  const [s, t] = clip.split('_')
  const file = resolve(CACHE, `${clip}.bvh`)
  if (!existsSync(file)) {
    mkdirSync(CACHE, { recursive: true })
    const url = `https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/${s.padStart(3, '0')}/${+s}_${t}.bvh`
    const r = await fetch(url)
    if (!r.ok) throw new Error(`${url}: ${r.status}`)
    writeFileSync(file, await r.text())
  }
  return parse(readFileSync(file, 'utf8'))
}

const deg = (a: number[], b: number[]) => (Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(...a) * Math.hypot(...b))))) * 180) / Math.PI
const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i])

/** Contact sheet of the raw skeleton every `step` frames, plus per-frame numbers that flag power moves. */
async function sheet(clip: string) {
  const b = await load(clip)
  const { skel } = skeleton(b, { yaw: num('yaw', 0) })
  const [from, to, step] = [+(pos[2] ?? 0), Math.min(b.frames.length - 1, +(pos[3] ?? Infinity)), +(pos[4] ?? 30)]
  const cam = { view: 0, tilt: num('tilt', 25) }
  const cells: string[] = []
  const rows: string[] = ['frame  yaw/s  spread  hipH  handH  footH']
  let prevYaw: number | undefined
  for (let f = from; f <= to; f += step) {
    const s = skel[f]
    const { svg } = stick(s, cam, [s.hip[0], 0, s.hip[2]])
    cells.push(`<div class="cell"><b>${f}</b><svg viewBox="-110 -215 220 245">${svg}<line x1="-110" x2="110" y1="0" y2="0" stroke="#444"/></svg></div>`)
    // Pelvis heading rate (a flare or windmill spins it continuously), straddle, and what is near the floor.
    const l = sub(s.nH, s.fH)
    const yaw = (Math.atan2(l[2], l[0]) * 180) / Math.PI
    const rate = prevYaw === undefined ? 0 : ((((yaw - prevYaw + 540) % 360) - 180) * 120) / step
    prevYaw = yaw
    const h = (k: keyof Skel) => (-s[k][1]).toFixed(0).padStart(5)
    rows.push(`${String(f).padStart(5)}  ${rate.toFixed(0).padStart(5)}  ${deg(sub(s.nK, s.nH), sub(s.fK, s.fH)).toFixed(0).padStart(6)}  ${h('hip')}  ${String(Math.min(-s.nW[1], -s.fW[1]).toFixed(0)).padStart(5)}  ${String(Math.min(-s.nA[1], -s.fA[1]).toFixed(0)).padStart(5)}`)
  }
  const out = resolve(SHOTS, `mocap-${clip}-sheet.png`)
  await png(`<h3>CMU ${clip}, frames ${from}–${to} every ${step} (${b.frames.length} frames, 120 fps)</h3><div class="grid" style="grid-template-columns:repeat(10,1fr)">${cells.join('')}</div>`, out)
  writeFileSync(resolve(SHOTS, `mocap-${clip}-sheet.txt`), rows.join('\n'))
  console.log(out)
  console.log(rows.join('\n'))
}

const camel = (id: string) => id.replace(/_(\w)/g, (_, c: string) => c.toUpperCase())

type Source = { skel: Skel[]; low: number[]; chest: number; dt: number; frames: number[]; o: Opts; label: (i: number) => string; credit: string; title: string }

/** Retarget frames from..to of a CMU clip. */
async function make(clip: string) {
  const b = await load(clip)
  const [from, to] = [+pos[2], +pos[3]]
  const o: Opts = { ref: from, yaw: num('yaw', 0), mirror: flags.mirror === 'true', pin: (flags.pin ?? 'hip') as Opts['pin'] }
  const { skel, low, chest } = skeleton(b, o)
  const frames: number[] = []
  for (let f = from; f <= to; f += 4) frames.push(f)
  const [s, t] = clip.split('_')
  await emit(pos[4], { skel, low, chest, dt: b.dt, frames, o, label: String, title: `CMU ${clip} ${from}–${to}`,
    credit: `// From the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu): subject ${+s}, trial ${+t}, frames ${from}-${to} at 120 fps.` })
}

/** Video landmarks JSON (tools/video/landmarks.py) frames from..to. Credit flags: --title --author --license --url. */
async function video(json: string) {
  const L = loadLandmarks(json)
  const [from, to] = [+pos[2], +pos[3]]
  const o: VideoOpts = { yaw: num('yaw', 0), mirror: flags.mirror === 'true', pin: (flags.pin ?? 'hip') as Opts['pin'], ground: (flags.ground ?? 'low') as VideoOpts['ground'],
    jump: num('jump', 0.15), minVis: num('vis', 0.5), cutoff: num('cutoff', 2), beta: num('beta', 0.3) }
  const v = videoSkeleton(L, from, to, o)
  const step = num('step', Math.max(1, Math.round(1 / 30 / v.dt)))
  const frames: number[] = []
  for (let i = 0; i < v.skel.length; i += step) frames.push(i)
  const f0 = L.frames.find((x) => x.f >= from)!.f
  const every = L.frames.length > 1 ? L.frames[1].f - L.frames[0].f : 1
  const lic = flags.license ?? '?'
  if (!flags.title || !flags.author || !flags.url || !flags.license) console.warn('credit missing: pass --title --author --license --url')
  await emit(pos[4], { ...v, frames, o: { ...o, ref: 0 }, label: (i) => String(f0 + i * every), title: `video ${L.video} ${from}–${to}`,
    credit: `// Pose-estimated (MediaPipe Pose Landmarker) from video "${flags.title ?? L.video}" by ${flags.author ?? '?'}, ${lic}, ${flags.url ?? '?'}, frames ${from}-${to} at ${+L.fps.toFixed(2)} fps.${/SA/.test(lic) ? `\n// These keys are an adaptation: ${lic}.` : ''}` })
}

const dist = (a: number[], b: number[]) => Math.hypot(...sub(a, b))
const mid3 = (a: number[], b: number[]) => a.map((v, i) => (v + b[i]) / 2)
const medianOf = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1]

/** A skinned glTF/GLB animation (game asset) sampled at --fps, frames from..to. Credit flags as for video. */
async function gltf(file: string) {
  const g = loadGlb(file)
  if (!pos[2]) return console.log(names(g).join('\n'))
  const { P, dt, name } = sample(g, pos[2], num('fps', 30))
  const [from, to] = [+(pos[3] ?? 0), Math.min(P.length - 1, +(pos[4] ?? Infinity))]
  const side = flags.mirror === 'true' ? 'Right' : 'Left'
  const leg = medianOf(P.map((p) => dist(p[`${side}UpLeg`], p[`${side}Leg`]) + dist(p[`${side}Leg`], p[`${side}Foot`])))
  const chest = medianOf(P.map((p) => dist(p.Spine, mid3(p.LeftArm, p.RightArm))))
  const o: Opts = { ref: from, yaw: num('yaw', 0), mirror: flags.mirror === 'true', pin: (flags.pin ?? 'hip') as Opts['pin'] }
  const w = world(P, leg, chest, o)
  const { skel, low } = w
  if (!pos[5]) {
    const cells = []
    for (let f = from; f <= to; f += num('step', 3)) {
      const { svg } = stick(skel[f], { view: num('view', 0), tilt: num('tilt', 15) }, [skel[f].hip[0], 0, skel[f].hip[2]])
      cells.push(`<div class="cell"><b>${f}</b><svg viewBox="-110 -215 220 245">${svg}<line x1="-110" x2="110" y1="0" y2="0" stroke="#444"/></svg></div>`)
    }
    const out = resolve(SHOTS, `mocap-gltf-${name}-sheet.png`)
    await png(`<h3>${name}, frames ${from}–${to} (${P.length} at ${num('fps', 30)} fps)</h3><div class="grid" style="grid-template-columns:repeat(10,1fr)">${cells.join('')}</div>`, out)
    return console.log(out)
  }
  const frames: number[] = []
  for (let f = from; f <= to; f++) frames.push(f)
  if (!flags.title || !flags.author || !flags.url || !flags.license) console.warn('credit missing: pass --title --author --license --url')
  await emit(pos[5], { skel, low, chest: w.chest, dt, frames, o, label: String, title: `${flags.title ?? file} "${name}" ${from}–${to}`,
    credit: `// From game animation "${name}" in "${flags.title ?? file}" by ${flags.author ?? '?'}, ${flags.license ?? '?'}, ${flags.url ?? '?'}, frames ${from}-${to} sampled at ${num('fps', 30)} fps.` })
}

/** Reduce a source to keys, write src/content/mocap/<id>.ts and a filmstrip. */
async function emit(id: string, src: Source) {
  const { skel, low, chest, dt, frames, o } = src
  let S = retarget(skel, low, chest, frames, dt, o)
  const mode = (flags.mode ?? 'cycle') as Move['mode']
  // Cycles: cut where the pose best matches the start (--match n samples back from the end), then ease into the start (--seam s | off).
  const cycle = mode === 'cycle' && flags.seam !== 'off'
  if (cycle && flags.match) {
    const back = S.slice(-1 - num('match', 0)).map((x) => poseGap(x.v, S[0].v))
    S = S.slice(0, Math.max(2, S.length - back.length + back.indexOf(Math.min(...back))))
  }
  const base: Parameters<typeof build>[0] = { mode, x: o.pin === 'hip' ? undefined : o.pin, view: flags.view ? +flags.view : undefined, tilt: flags.tilt ? +flags.tilt : undefined }
  const tail = num('tail', 4 * dt)
  // Contacts (cycles): --plant auto, or joints foot,farFoot,hand,farHand; --plant-height and --plant-speed tune detection.
  const total = S[S.length - 1].t + (cycle ? S[1].t : tail)
  const want = flags.plant && flags.plant !== 'auto' ? flags.plant.split(',') : undefined
  const plants = flags.plant && mode === 'cycle'
    ? contacts(skel, frames.slice(0, S.length), dt, total, { height: num('plant-height', 7), speed: num('plant-speed', 45) }).filter((p) => !want || want.includes(p.joint))
    : []
  // Down means on the floor: no lift while planted (data floors drift).
  for (const s of S) if (plants.some((p) => (p.from > p.to ? s.t >= p.from || s.t <= p.to : s.t >= p.from && s.t <= p.to))) s.v[12] = 0
  if (cycle) S = seam(S, num('seam', 0.15))
  const r = reduce(base, S, num('tol', 6), tail)
  if (cycle) {
    // The appended start is the wrap, not a key.
    base.travel = Math.round(r.keys[r.keys.length - 1][13] - r.keys[0][13]) || undefined
    for (const a of [r.keys, r.dur, r.hold]) a.pop()
  }
  const m: Move = { ...build(base, r.keys, r.dur, r.hold), ...(plants.length ? { plants } : {}) }
  if (plants.length) console.log(JSON.stringify({ plants, slip: +slip(m).toFixed(2) }))
  const opts = Object.entries(base).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${JSON.stringify(v).replace(/"/g, "'")}`).join(', ')
  const src_ = `${src.credit}
// Generated: npm run mocap -- ${argv.join(' ')}
import { clip } from './clip'

// torso nearUpper nearFore farUpper farFore nearThigh nearShin farThigh farShin chest head scap | lift shift turn roll twist
// armOut farArmOut foreOut farForeOut legOut farLegOut shinOut farShinOut | dur hold
export const ${camel(id)} = clip({ ${opts} }, [
${r.keys.map((k, i) => `  [${[...k, r.dur[i], r.hold[i]].join(', ')}],`).join('\n')}
]${plants.length ? `, [\n${plants.map((p) => `  { joint: '${p.joint}', from: ${p.from}, to: ${p.to} },`).join('\n')}\n]` : ''})
`
  writeFileSync(resolve(APP, 'src/content/mocap', `${id}.ts`), src_)
  // Filmstrip: raw skeleton, per-frame fit, keyed move, at the same instants.
  const N = num('cols', 12)
  const pick = Array.from({ length: N }, (_, i) => S[Math.round((i * (S.length - 1)) / (N - 1))])
  const raw = pick.map((p) => stick(skel[p.frame], base, [skel[p.frame].hip[0], 0, skel[p.frame].hip[2]], src.label(p.frame)))
  const row = (cells: string[]) => `<div class="grid" style="grid-template-columns:repeat(${N},1fr)">${cells.map((c) => `<div class="cell">${c}</div>`).join('')}</div>`
  const fit = (p: (typeof S)[number]) => still({ ...base, solid: true, keys: [p.v.slice(0, 12) as Move['keys'][0]] }, p.v.slice(0, 12) as Move['keys'][0], ({ ...Object.fromEntries(COLS.map((c, j) => [c, p.v[12 + j]])), shift: 0 }))
  const keyed = (p: (typeof S)[number]) => {
    const st = at(m, p.t * 1000)
    return still(m, st.pose, st)
  }
  const old = MOVES[id]
  const hand = old ? row(pick.map((_, i) => {
    const st = at(old, (i * loopMs(old)) / N)
    return still(old, st.pose, st)
  })) : ''
  const out = resolve(SHOTS, `mocap-${id}.png`)
  await png(`<h3>${id}: ${src.title}. Rows: raw mocap, per-frame fit, ${r.keys.length} keys (max err ${r.err.toFixed(1)})${old ? ', current hand-made loop' : ''}</h3>`
    + row(raw.map((q) => `<svg viewBox="-110 -215 220 245">${q.svg}<line x1="-110" x2="110" y1="0" y2="0" stroke="#444"/></svg>`)) + row(pick.map(fit)) + row(pick.map(keyed)) + hand, out)
  console.log(JSON.stringify({ out, keys: r.keys.length, err: +r.err.toFixed(1), seconds: +(S[S.length - 1].t).toFixed(2) }))
}

const cmd = pos[0]
if (cmd === 'sheet') await sheet(pos[1])
else if (cmd === 'build') await make(pos[1])
else if (cmd === 'video') await video(pos[1])
else if (cmd === 'gltf') await gltf(pos[1])
else console.log('usage: npm run mocap -- sheet <clip> [from] [to] [step] | build <clip> <from> <to> <id> [flags]')
