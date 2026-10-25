import { ancestry, fraction, grant, isMastered, plan, status, streak, toggle, unmaster, type Progress } from '../core/progress'
import type { Kind, Skill, Status } from '../core/types'
import { QUESTIONS } from '../content/questions'
import { BRANCH_BY_ID, BRANCHES, BY_ID, SKILLS } from '../content/tree'
import { el, esc } from './html'
import { load, parseSaved, save, today } from './store'
import { mountTree, treeSvg } from './tree'

let p = load()
const commit = (next: Progress) => {
  p = next
  save(p)
}

const kindOf = (branch: string) => BRANCH_BY_ID.get(branch)!.kind
const KIND_NAME: Record<Kind, string> = { strength: 'Strength', movement: 'Movement', mobility: 'Mobility' }
const STATUS_NAME: Record<Status, string> = { locked: 'Locked', open: 'Ready', active: 'In progress', mastered: 'Mastered' }
const UNLOCKS = new Map<string, Skill[]>()
for (const s of SKILLS) for (const r of s.requires) UNLOCKS.set(r, [...(UNLOCKS.get(r) ?? []), s])

const video = (s: Skill) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.name} calisthenics tutorial`)}`

export function start(root: HTMLElement) {
  const route = () => {
    const [, page, id] = location.hash.split('/')
    if (page === 'today') today_(root)
    else if (page === 'check') check(root)
    else if (page === 'stats') stats(root)
    else tree(root, page === 'skill' && BY_ID.has(id) ? id : undefined, page === 'branch' ? id : undefined)
  }
  addEventListener('hashchange', route)
  route()
}

const nav = (active: string) => `<nav class="nav">
  ${[['', 'Tree', '✦'], ['today', 'Today', '◎'], ['check', 'Check-in', '?'], ['stats', 'Progress', '▤']]
    .map(([h, label, icon]) => `<a href="#/${h}" class="${active === h ? 'on' : ''}"><span>${icon}</span>${label}</a>`).join('')}
</nav>`

function tree(root: HTMLElement, selected?: string, branch?: string) {
  const screen = el(`<div class="tree-screen">
    ${treeSvg(p, selected)}
    <header class="hud"><h1>Calisthenics Tree</h1><span class="streak" title="Days in a row">${streak(p, today())} day streak</span></header>
    <div class="zoom"><button data-z="in" aria-label="Zoom in">+</button><button data-z="out" aria-label="Zoom out">−</button><button data-z="home" aria-label="Recentre">⌂</button></div>
    ${selected ? sheet(BY_ID.get(selected)!) : ''}
    ${nav('')}
  </div>`)
  root.replaceChildren(screen)
  const t = mountTree(screen.querySelector('svg')!, (id) => (location.hash = `#/skill/${id}`))
  if (selected) t.focus(selected)
  if (branch && BRANCH_BY_ID.has(branch)) t.branch(branch)
  screen.querySelectorAll<HTMLButtonElement>('[data-z]').forEach((b) =>
    b.addEventListener('click', () => (b.dataset.z === 'in' ? t.zoom(1.3) : b.dataset.z === 'out' ? t.zoom(1 / 1.3) : t.home())))
  if (selected) wireSheet(screen, BY_ID.get(selected)!, () => tree(root, selected))
}

const chips = (skills: Skill[]) => skills.map((s) => `<a class="chip ${status(p, s, BY_ID)}" href="#/skill/${s.id}">${esc(s.name)}</a>`).join('')

function sheet(s: Skill) {
  const b = BRANCH_BY_ID.get(s.branch)!
  const st = status(p, s, BY_ID)
  const done = new Set(p.done[s.id] ?? [])
  const missing = s.requires.map((r) => BY_ID.get(r)!).filter((r) => !isMastered(p, r))
  return `<section class="sheet ${b.kind}">
    <a class="close" href="#/" aria-label="Close">×</a>
    <p class="eyebrow">${esc(b.name)} · tier ${s.tier} · ${KIND_NAME[b.kind]}</p>
    <h2>${esc(s.name)}</h2>
    <div class="meter"><span class="pill ${st}">${STATUS_NAME[st]}</span><div class="bar"><i style="width:${fraction(p, s) * 100}%"></i></div><b>${done.size}/${s.challenges.length}</b></div>
    ${missing.length ? `<p class="warn">Builds on ${missing.map((m) => esc(m.name)).join(', ')}. You can still start it.</p>` : ''}
    <p class="what">${esc(s.what)}</p>
    <h3>Cues</h3>
    <ul class="cues">${s.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    <h3>Challenges</h3>
    <ol class="challenges">${s.challenges.map((c, i) => `<li><button class="challenge ${done.has(i) ? 'done' : ''}" data-i="${i}">
      <span class="box">${done.has(i) ? '✓' : i + 1}</span><span>${esc(c)}${i === s.challenges.length - 1 ? '<em>Mastery test</em>' : ''}</span></button></li>`).join('')}</ol>
    <a class="video" href="${video(s)}" target="_blank" rel="noopener">▶ Watch tutorials</a>
    ${chain(s)}
    ${s.requires.length ? `<h3>Builds on</h3><div class="chips">${chips(s.requires.map((r) => BY_ID.get(r)!))}</div>` : ''}
    ${UNLOCKS.has(s.id) ? `<h3>Leads to</h3><div class="chips">${chips(UNLOCKS.get(s.id)!)}</div>` : ''}
    <button class="secondary" data-act="${st === 'mastered' ? 'reset' : 'master'}">${st === 'mastered' ? 'Reset this skill' : 'I already have this: mark mastered'}</button>
  </section>`
}

/** Every unmastered skill on the way to `s`, nearest the centre first, across all branches. */
function chain(s: Skill) {
  const todo = ancestry(s.id, BY_ID).filter((id) => id !== s.id && !s.requires.includes(id)).map((id) => BY_ID.get(id)!)
    .filter((x) => !isMastered(p, x)).sort((a, b) => a.tier - b.tier)
  if (!todo.length) return ''
  const branches = [...new Set(todo.map((x) => x.branch))]
  return `<h3>Full path · ${todo.length} to go</h3>${branches.map((b) => `<p class="path-branch">${esc(BRANCH_BY_ID.get(b)!.name)}</p>
    <div class="chips">${chips(todo.filter((x) => x.branch === b))}</div>`).join('')}`
}

function wireSheet(scope: HTMLElement, s: Skill, rerender: () => void) {
  scope.querySelectorAll<HTMLButtonElement>('.challenge').forEach((b) =>
    b.addEventListener('click', () => (commit(toggle(p, s, Number(b.dataset.i), today())), rerender())))
  scope.querySelector<HTMLButtonElement>('[data-act]')?.addEventListener('click', (e) => {
    const act = (e.currentTarget as HTMLElement).dataset.act
    commit(act === 'master' ? grant(p, [s.id], BY_ID) : unmaster(p, s.id))
    rerender()
  })
}

function today_(root: HTMLElement) {
  const picks = plan(SKILLS, p, BY_ID, kindOf)
  const screen = el(`<div class="page">
    <header class="page-head"><h1>Today</h1><p>${streak(p, today())} day streak · ${p.focus.length ? `focus: ${[...new Set(p.focus)].map((f) => esc(BRANCH_BY_ID.get(f)!.name)).join(', ')}` : '<a href="#/check">set a focus in Check-in</a>'}</p></header>
    <p class="hint">One skill per branch, nearest the next unlock. Tick a challenge when you hit it.</p>
    <ul class="plan">${picks.map((s) => {
      const b = BRANCH_BY_ID.get(s.branch)!
      const next = s.challenges.findIndex((_, i) => !(p.done[s.id] ?? []).includes(i))
      return `<li class="card ${b.kind}">
        <a href="#/skill/${s.id}"><p class="eyebrow">${esc(b.name)}</p><h2>${esc(s.name)}</h2>
        <p class="next">Next: ${esc(s.challenges[next])}</p><p class="cue">${esc(s.cues[0])}</p></a>
        <button class="tick" data-id="${s.id}" data-i="${next}" aria-label="Done">✓</button>
      </li>`
    }).join('')}</ul>
    ${picks.length ? '' : '<p class="hint">Everything open is mastered. Go do a check-in, or look for locked skills on the tree.</p>'}
    ${nav('today')}
  </div>`)
  root.replaceChildren(screen)
  screen.querySelectorAll<HTMLButtonElement>('.tick').forEach((b) =>
    b.addEventListener('click', () => (commit(toggle(p, BY_ID.get(b.dataset.id!)!, Number(b.dataset.i), today())), today_(root))))
}

function check(root: HTMLElement) {
  const screen = el(`<div class="page">
    <header class="page-head"><h1>Check-in</h1><p>Answer what you can. Answers unlock the tree where you already are and steer Today.</p></header>
    ${QUESTIONS.map((q) => `<section class="question"><h2>${esc(q.ask)}</h2><div class="options">
      ${q.options.map((o) => `<button class="opt ${(p.answers[q.id] ?? []).includes(o.label) ? 'on' : ''}" data-q="${q.id}" data-o="${esc(o.label)}">${esc(o.label)}</button>`).join('')}
    </div>${q.multi ? '<p class="hint">Pick any.</p>' : ''}</section>`).join('')}
    ${nav('check')}
  </div>`)
  root.replaceChildren(screen)
  screen.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => b.addEventListener('click', () => {
    const q = QUESTIONS.find((x) => x.id === b.dataset.q)!
    const label = b.dataset.o!
    const cur = p.answers[q.id] ?? []
    const picked = q.multi ? (cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label]) : [label]
    const answers = { ...p.answers, [q.id]: picked }
    const chosen = QUESTIONS.flatMap((x) => x.options.filter((o) => (answers[x.id] ?? []).includes(o.label)))
    const grants = q.options.find((o) => o.label === label && picked.includes(label))?.grants ?? []
    commit(grant({ ...p, answers, focus: [...new Set(chosen.flatMap((o) => o.focus ?? []))] }, grants, BY_ID))
    const y = scrollY
    check(root)
    scrollTo(0, y)
  }))
}

function stats(root: HTMLElement) {
  const count = (skills: Skill[]) => skills.filter((s) => isMastered(p, s)).length
  const kinds = (['strength', 'movement', 'mobility'] as Kind[]).map((k) => {
    const sk = SKILLS.filter((s) => kindOf(s.branch) === k)
    return `<div class="attr ${k}"><b>${count(sk)}</b><span>${KIND_NAME[k]}</span><small>of ${sk.length}</small></div>`
  })
  const screen = el(`<div class="page">
    <header class="page-head"><h1>Progress</h1><p>${count(SKILLS)} of ${SKILLS.length} skills mastered · ${p.days.length} days trained</p></header>
    <div class="attrs">${kinds.join('')}</div>
    <ul class="branches">${BRANCHES.map((b) => {
      const sk = SKILLS.filter((s) => s.branch === b.id)
      const n = count(sk)
      const ch = sk.reduce((a, s) => a + (p.done[s.id]?.length ?? 0), 0)
      const all = sk.reduce((a, s) => a + s.challenges.length, 0)
      return `<li><a href="#/branch/${b.id}" class="${b.kind}"><span class="name">${esc(b.name)}</span><span class="count">${n}/${sk.length}</span>
        <div class="bar"><i style="width:${(ch / all) * 100}%"></i></div><small>${esc(b.blurb)}</small></a></li>`
    }).join('')}</ul>
    <section class="backup"><h2>Backup</h2>
      <p class="hint">Progress lives on this phone. Copy it somewhere safe, or paste a backup to restore.</p>
      <textarea id="backup" rows="3" spellcheck="false">${esc(JSON.stringify(p))}</textarea>
      <div class="row"><button class="secondary" data-act="copy">Copy</button><button class="secondary" data-act="restore">Restore pasted</button></div>
      <p class="hint" id="backup-msg"></p>
    </section>
    ${nav('stats')}
  </div>`)
  root.replaceChildren(screen)
  const box = screen.querySelector<HTMLTextAreaElement>('#backup')!
  const msg = screen.querySelector<HTMLElement>('#backup-msg')!
  screen.querySelector('[data-act="copy"]')!.addEventListener('click', () =>
    navigator.clipboard.writeText(box.value).then(() => (msg.textContent = 'Copied.'), () => (box.select(), (msg.textContent = 'Selected. Copy it manually.'))))
  screen.querySelector('[data-act="restore"]')!.addEventListener('click', () => {
    try {
      commit(parseSaved(box.value))
      stats(root)
    } catch (e) {
      msg.textContent = `${(e as Error).message}. Paste the whole backup text.`
    }
  })
}
