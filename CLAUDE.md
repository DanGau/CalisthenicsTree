# CalisthenicsTree

A phone-first web app: a Path of Exile style skill tree of bodyweight strength, movement and mobility skills, each with challenges that build to mastery. Design notes: [docs/training-design.md](docs/training-design.md). Animated figure: [docs/figure.md](docs/figure.md).

Architecture rules: [docs/architecture/CLAUDE.md](docs/architecture/CLAUDE.md). Read before designing or writing code.

## Rules

1. **Agent first.** The agent does all the work: code, content, tests, setup, debugging. The human supplies judgment and taste only.
2. **Brevity.** Code, comments, docs, commits, and replies follow the [brevity skill](.claude/skills/brevity/SKILL.md).
3. **Enforce mechanically.** If a linter, type, test, or hook can enforce a rule, it does. Content is validated by `src/content/tree.test.ts` (links, cycles, node overlap).
4. **No memorial to the old way.** When behavior changes, the old behavior is absent. History lives in git.
5. **Progressive disclosure.** This file stays under 50 lines. Detail goes in `docs/`, linked from here.
6. **Commit and push after every change**, straight onto `main`.

## Commands

Run in `app/`.

- `npm run check` — lint, typecheck, tests (content validation included). The pre-commit hook runs only tests that import a staged file; CI runs everything before deploying.
- `MSYS_NO_PATHCONV=1 npm run -s eye -- <#hash> <name> [selectors to click...]` — screenshot the app at phone size into `app/screenshots/`. The env var stops Git Bash rewriting `#/…`.
- `npm run dev` — serve for a human (`--host`, so a phone on the same Wi-Fi can open it). Each push to `main` deploys to https://dangau.github.io/CalisthenicsTree/.
