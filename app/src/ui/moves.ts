import { BRANCHES, SKILLS } from '../content/tree'
import { MOVES } from '../content/moves'
import { animate, live, still } from './figure'
import { el, esc } from './html'

/** At most 8 keys, evenly spread: sampled moves have hundreds. */
const some = <T>(xs: T[]) => (xs.length <= 8 ? xs.map((x, i) => [x, i] as const) : Array.from({ length: 8 }, (_, j) => Math.round((j * (xs.length - 1)) / 7)).map((i) => [xs[i], i] as const))

/** Review page: every skill's key poses side by side, plus the live loop. Not linked from the app. */
export function moves(root: HTMLElement, branch?: string) {
  const skills = SKILLS.filter((s) => !branch || s.branch === branch)
  const screen = el(`<div class="moves-review">
    <p>${BRANCHES.map((b) => `<a href="#/moves/${b.id}">${b.id}</a>`).join(' · ')}</p>
    ${skills.map((s) => {
      const m = MOVES[s.id]
      return `<section><h2>${esc(s.name)} <small>${s.id}</small></h2>
        <div class="strip">${m ? `${live(s.id, m)}${some(m.keys).map(([k, i]) => still(m, k, m.beats?.[i])).join('')}` : '<p>missing</p>'}</div></section>`
    }).join('')}
    <p><small>Some motion derived from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), created with funding from NSF EIA-0196217.</small></p>
    <p><small>Bulgarian split squat pose-estimated from "Bulgarian Split Squat" by ExperienceLifeMag (youtube.com/watch?v=wXasPD_vKqQ), CC BY 3.0.</small></p>
  </div>`)
  root.replaceChildren(screen)
  animate(screen, MOVES)
}
