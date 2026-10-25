# Architecture

TypeScript (strict), Vite, Vitest, ESLint, Playwright. No UI framework: screens render HTML strings. Versions: `app/package.json`.

## Layers

Imports point down this list only. ESLint enforces it.

| Layer | Owns | May import |
|---|---|---|
| `ui/` | Screens, routing, storage, tree SVG and pan/zoom | `content/`, `core/` |
| `content/` | Branches, skills, check-in questions | `core/` |
| `core/` | Types, progress, unlock rules, daily plan, tree layout | nothing |

`core/` is pure: no DOM, `Math.random`, `Date.now`, or module-level mutable state. Callers pass in the day number.

## Rules

1. **Keep complexity in the smallest box.** One component owns the hard part and exposes something simple.
2. **Code is unsurprising.** A name tells you what the code does.
3. **Don't duplicate information.** When two places must agree, derive one from the other. Node positions derive from `tier` and `lane`; a skill's mastery test is its last challenge.
