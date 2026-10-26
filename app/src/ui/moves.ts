import { BRANCHES, SKILLS } from '../content/tree'
import { MOVES } from '../content/moves'
import { animate, live, still } from './figure'
import { el, esc } from './html'

/** Review page: every skill's key poses side by side, plus the live loop. Not linked from the app. */
export function moves(root: HTMLElement, branch?: string) {
  const skills = SKILLS.filter((s) => !branch || s.branch === branch)
  const screen = el(`<div class="moves-review">
    <p>${BRANCHES.map((b) => `<a href="#/moves/${b.id}">${b.id}</a>`).join(' · ')}</p>
    ${skills.map((s) => {
      const m = MOVES[s.id]
      return `<section><h2>${esc(s.name)} <small>${s.id}</small></h2>
        <div class="strip">${m ? `${live(s.id, m)}${m.keys.map((k, i) => still(m, k, m.beats?.[i]?.lift)).join('')}` : '<p>missing</p>'}</div></section>`
    }).join('')}
  </div>`)
  root.replaceChildren(screen)
  animate(screen, MOVES)
}
