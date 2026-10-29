// Regenerate every wired mocap move from clips.json: npm run -s mocap:all [-- id...]
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type Entry = { clip: string; from: number; to: number; flags?: string }
const here = dirname(fileURLToPath(import.meta.url))
const all: Record<string, Entry> = JSON.parse(readFileSync(resolve(here, 'clips.json'), 'utf8'))
const only = process.argv.slice(2)
for (const [id, e] of Object.entries(all)) {
  if (only.length && !only.includes(id)) continue
  const args = ['build', e.clip, String(e.from), String(e.to), id, ...(e.flags?.split(' ').filter(Boolean) ?? [])]
  console.log(id, args.join(' '))
  execFileSync(process.execPath, [resolve(here, '../../node_modules/tsx/dist/cli.mjs'), resolve(here, 'cli.ts'), ...args], { stdio: 'inherit' })
}
