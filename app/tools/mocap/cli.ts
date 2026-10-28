// Offline: CMU mocap clip → solid Move. See docs/figure.md (Mocap).
//   npm run mocap -- sheet <clip> [from] [to] [step] [--yaw d] [--tilt d]      contact sheet + stats, to find frame ranges
//   npm run mocap -- build <clip> <from> <to> <id> [--mode cycle|bounce] [--pin hip|foot] [--yaw d] [--view d] [--tilt d] [--mirror] [--tol d] [--tail s]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { at, loopMs, type Move } from '../../src/core/figure'
import { MOVES } from '../../src/content/moves'
import { COLS } from '../../src/content/mocap/clip'
import { still } from '../../src/ui/figure'
import { parse, type Bvh } from './bvh'
import { retarget, skeleton, type Opts, type Skel } from './fit'
import { build, reduce } from './reduce'
import { png, stick } from './render'

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

/** Retarget frames from..to, reduce to keys, write src/content/mocap/<id>.ts and a filmstrip. */
async function make(clip: string) {
  const b = await load(clip)
  const [from, to, id] = [+pos[2], +pos[3], pos[4]]
  const o: Opts = { ref: from, yaw: num('yaw', 0), mirror: flags.mirror === 'true', pin: (flags.pin ?? 'hip') as Opts['pin'] }
  const { skel, low, chest } = skeleton(b, o)
  const frames: number[] = []
  for (let f = from; f <= to; f += 4) frames.push(f)
  const S = retarget(skel, low, chest, frames, b.dt, o)
  const mode = (flags.mode ?? 'cycle') as Move['mode']
  const base: Parameters<typeof build>[0] = { mode, x: o.pin === 'hip' ? undefined : o.pin, view: flags.view ? +flags.view : undefined, tilt: flags.tilt ? +flags.tilt : undefined }
  const tail = num('tail', 4 * b.dt)
  const r = reduce(base, S, num('tol', 6), tail)
  const m = build(base, r.keys, r.dur, r.hold)
  const [s, t] = clip.split('_')
  const opts = Object.entries(base).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${JSON.stringify(v).replace(/"/g, "'")}`).join(', ')
  const src = `// From the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu): subject ${+s}, trial ${+t}, frames ${from}-${to} at 120 fps.
// Generated: npm run mocap -- build ${argv.join(' ').replace(/^build /, '')}
import { clip } from './clip'

// torso nearUpper nearFore farUpper farFore nearThigh nearShin farThigh farShin chest head scap | lift shift turn roll twist
// armOut farArmOut foreOut farForeOut legOut farLegOut shinOut farShinOut | dur hold
export const ${camel(id)} = clip({ ${opts} }, [
${r.keys.map((k, i) => `  [${[...k, r.dur[i], r.hold[i]].join(', ')}],`).join('\n')}
])
`
  writeFileSync(resolve(APP, 'src/content/mocap', `${id}.ts`), src)
  // Filmstrip: raw skeleton, per-frame fit, keyed move, at the same instants.
  const N = num('cols', 12)
  const pick = Array.from({ length: N }, (_, i) => S[Math.round((i * (S.length - 1)) / (N - 1))])
  const raw = pick.map((p) => stick(skel[p.frame], base, [skel[p.frame].hip[0], 0, skel[p.frame].hip[2]], String(p.frame)))
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
  await png(`<h3>${id}: CMU ${clip} ${from}–${to}. Rows: raw mocap, per-frame fit, ${r.keys.length} keys (max err ${r.err.toFixed(1)})${old ? ', current hand-made loop' : ''}</h3>`
    + row(raw.map((q) => `<svg viewBox="-110 -215 220 245">${q.svg}<line x1="-110" x2="110" y1="0" y2="0" stroke="#444"/></svg>`)) + row(pick.map(fit)) + row(pick.map(keyed)) + hand, out)
  console.log(JSON.stringify({ out, keys: r.keys.length, err: +r.err.toFixed(1), seconds: +(S[S.length - 1].t).toFixed(2) }))
}

const cmd = pos[0]
if (cmd === 'sheet') await sheet(pos[1])
else if (cmd === 'build') await make(pos[1])
else console.log('usage: npm run mocap -- sheet <clip> [from] [to] [step] | build <clip> <from> <to> <id> [flags]')
