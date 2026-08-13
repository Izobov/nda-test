# Take-Home (SvelteKit) — Global Roadmap

> **For agentic workers:** This is a RAW top-level roadmap, not a bite-sized execution plan.
> Each epic below gets its own detailed plan (superpowers:writing-plans format, bite-sized
> steps + tests + code) written right before that epic starts. Use
> superpowers:subagent-driven-development to execute individual epics, and
> superpowers:dispatching-parallel-agents when a wave below has 2+ parallel tracks.

**Goal:** Ship a production-shaped SvelteKit take-home (public marketing surface + authenticated
dashboard) that scores at the top of the rubric in `task/take-home-senior-frontend-sveltekit.html`,
deployed on Vercel, with green CI, by **2026-08-19** (7 days from receipt on 2026-08-12).

**Architecture:** SvelteKit (Svelte 5 runes) + TypeScript + Tailwind, deployed on Vercel with a
mixed Edge/Node runtime split. No external database — mock JSON treated as a server-side "API"
inside `load`/actions; auth is a stateless signed-cookie session (no session table). Zod is the
single source of truth for all shapes, derived once and reused client+server.

**Rendering/runtime split (decided):**

- `/`, `/blog`, `/blog/[slug]`, `/en/*`, `/de/*` marketing pages → **prerendered (SSG)**, via
  `export const prerender = true` + explicit `entries()` in `+page.server.ts` returning every
  `{slug}` (× `{lang}` if locale is a route param) from `posts.json` — deterministic, no reliance
  on link-crawling. Best possible LCP (no function runs at request time). Content changes require
  editing `posts.json` + redeploy, which is the only content-update path this project has anyway
  (no CMS) — documented as a conscious tradeoff in `CLAUDE.md`/README, with ISR (Vercel's
  `adapter-vercel` `config.isr`) named as the explicit upgrade path if data ever moved to a live
  CMS. Not chosen here on purpose — noted as a talking point, not implemented.
- **Edge** runtime → `handle` hook / guard verifying the signed session cookie (Web Crypto, no
  Node APIs, runs on every request to `/dashboard/**`), and `/search` (small in-memory dataset,
  stateless, latency-sensitive).
- **Node** runtime → `/dashboard/items` + its form actions (mutations, inline edit). Not forced by
  a real Node-only API today, but it's the honest place non-edge-compatible deps (real DB client,
  bcrypt, etc.) would land in a non-take-home version — documented as the reasoning in `CLAUDE.md`.
  (Also: ISR-style caching, if ever used, only works on Node functions on Vercel — another reason
  Node stays reserved for the "backend-shaped" route.)

**Process:** Strict TDD for every epic — test written and failing before implementation code, per
`superpowers:test-driven-development`. Each epic's detailed bite-sized plan must sequence
test-then-code steps, not code-then-test.

**Tech Stack:** SvelteKit, Svelte 5, TypeScript, Tailwind, Zod, Vitest, Playwright + @axe-core/playwright,
Vercel adapter (Edge + Node runtimes), Lighthouse CI, size-limit, Husky (pre-commit: lint-staged;
pre-push: lint + prettier check + fast unit tests), web-vitals.

## Global Constraints

(copied from spec — every epic's tasks implicitly include these)

- LCP < 2.0s, CLS < 0.1, INP < 200ms on Lighthouse mobile (Moto G Power) for `/`, `/blog/[slug]`, `/dashboard/items`.
- Lighthouse Performance/Accessibility/SEO/Best Practices ≥ 95, enforced in CI (Lighthouse CI fails build below threshold).
- JS budget via size-limit: ≤ 80KB gzip initial route JS on public surface, ≤ 150KB on dashboard.
- At least one route on edge runtime, at least one on Node — justified.
- `users.json` shape and `posts.json` `id`/`slug` fields are immutable; mock data may only be extended, never replaced.
- No `any` / `@ts-ignore` / implicit `unknown` in own code.
- Real commit history — atomic, descriptive commits. No squash-to-one submissions.
- Strict TDD: every epic writes the failing test first, then the implementation, per
  `superpowers:test-driven-development`.
- CI must actually run tests from Wave 0 onward (not deferred): lint → typecheck → unit (Vitest) →
  build, minimum, as the required status check gating `main`. Playwright/Lighthouse/bundle-size
  jobs are added to the same workflow incrementally as the features they check land (E9/E10) — but
  the pipeline itself, and the branch-protection check it feeds, exist from day 1.
- Husky has two hooks: **pre-commit** = lint-staged (format + lint staged files only, fast).
  **pre-push** = full lint + prettier `--check` + `vitest run` (fast unit tests only — no
  Playwright/Lighthouse locally, those stay CI-only since they're too slow for a local gate).
- Deadline: 2026-08-19. Submission = GitHub repo URL + live URL + time spent + talking points, then a 45-min defense call.

---

## Epic map (dependency graph)

```
Wave 0  [solo, sequential]
  E0  Bootstrap: repo, CI skeleton, branch protection, CLAUDE.md, .claude/, SvelteKit scaffold, Vercel link

Wave 1  [parallel — 4 tracks, disjoint files]
  E1  Design tokens + base primitives (Button/Card/Badge/Input/Select/Container/Heading/Toast)
  E1b Accessible composite shell (Dialog/Combobox/Menu — generic, not yet wired to a feature)
  E2  Data layer: Zod schemas from mocks/schemas.json + in-memory "API" module (posts/items/users/tags) + i18n loader
  E3  Observability scaffolding: web-vitals beacon endpoint, client error boundary, RUM sampling

Wave 2  [parallel — 2 tracks]
  E4  Auth & session: signed-cookie session lib, /login (+shared Zod), handle hook guard for /dashboard
       depends on: E1 (form primitives), E2 (users schema)
  E5  Public marketing pages: /, /blog, /blog/[slug], /404
       depends on: E1 (primitives), E2 (posts schema)

Wave 3  [parallel — 2 tracks]
  E6  Search + i18n routing: /search with URL-state, /en /de segments, hreflang/canonical
       depends on: E5 (blog structure), E2 (tags/i18n data)
  E7  Dashboard items table: server pagination/sort/filter, inline edit + optimistic UI + rollback,
      streamed SSR, empty/loading/error/partial-failure states, wires E1b as the status-edit composite
       depends on: E4 (auth guard), E1b (composite), E2 (items schema)

Wave 4  [parallel — 2 tracks]
  E8  SEO extras: JSON-LD (Article+breadcrumbs, Organization), sitemap.xml/robots.txt, OG image generation
       depends on: E6 (final route shapes to attach metadata to)
  E9  Test suite: Vitest unit (composite + URL-state codec), Playwright E2E (anon flow, auth flow w/
      rollback assertion), axe assertions on dashboard, 1 visual regression snapshot
       depends on: E6, E7 (features under test must exist)

Wave 5  [sequential, mostly config]
  E10 Perf/CI enforcement hardening: wire Lighthouse CI + size-limit thresholds as blocking gates,
      finalize edge/Node `export const config` per route, confirm CI pipeline order
       depends on: E5, E6, E7, E8 (real routes to measure)

Wave 6  [solo, sequential, last]
  E11 Polish pass + README (run instructions, demo creds, time spent) + deployed-URL smoke test +
      defense-call prep notes
       depends on: everything
```

### Parallelization notes for subagents

- **Wave 1** is the best subagent-parallel opportunity: 4 independent tracks touching disjoint
  files (`src/routes/layout.css` (`@theme` block)/`src/lib/components/*`, `src/lib/schemas/*`+`src/lib/server/data/*`,
  `src/lib/observability/*`). Dispatch 4 subagents via `superpowers:dispatching-parallel-agents`.
  Only shared risk: root `+layout.svelte` (theme toggle, ModalHost, error boundary mount point) —
  reserve that file for E0 to stub out so E1/E1b/E3 only _add_ to it, not restructure it.
- **Wave 2**: E4 and E5 touch different route trees (`/login`+`/dashboard` vs `/`+`/blog`) — safe
  to parallelize once Wave 1 lands.
- **Wave 3**: E6 (search/i18n) and E7 (dashboard table) are also disjoint route trees — parallelize.
  E7 is the heaviest single epic (streamed SSR + optimistic UI + composite integration); consider
  splitting it into its own sub-plan with 2-3 sequential sub-tasks rather than one giant task.
- **Wave 4**: E8 (SEO) and E9 (tests) touch different files (`src/routes/**/+page.server.ts` meta
  exports vs `tests/**`) — parallelize.
- Waves 0, 5, 6 are intentionally sequential/solo: 0 is foundation everything else reads from, 5 is
  cross-cutting config that needs the real routes to already exist, 6 is final integration polish.

---

## Epic 0 — Bootstrap (Wave 0, solo, blocks everything)

**Produces:** empty-but-wired SvelteKit repo other epics can branch from.

Rough scope (detailed plan written separately before starting):

- Repo already initialized locally, `origin` already set to `github.com/Izobov/nda-test.git`
  (public — deliverable requirement), no commits yet. Remaining: scaffold, first commit, push,
  confirm the GitHub-side repo is actually created/public (an empty `origin` URL doesn't
  guarantee the repo exists yet — verify or create via `gh repo create` before pushing).
- Branch protection on `main`: require PR + required status check (CI) green, no direct pushes,
  no force-push. _(Will confirm exact policy with you before applying — this touches shared/remote
  state.)_
- GitHub Actions workflow with **real jobs from the start**: lint → typecheck → unit tests
  (Vitest) → build, wired as the required status check branch protection points at. Playwright,
  Lighthouse CI, and size-limit jobs are appended to this same workflow incrementally as their
  epics land (E9/E10) — not deferred as an afterthought, just sequenced by what exists to test.
- `npx sv create` (Svelte 5, TypeScript, Vitest, Playwright, ESLint, Prettier presets) + Tailwind.
- `CLAUDE.md`: bake in the grading rubric (weights from the spec), the "required" checklist,
  ground rules (no squash commits, defend every ambiguous call), and the architecture decisions
  already made in this conversation (no DB/Supabase, stateless cookie session, Vercel Edge+Node
  split, Dialog/Combobox as the composite) so no future session re-derives or re-litigates them.
- `.claude/` project scaffolding: `settings.json` permissions tuned for this repo, superpowers
  plugin enabled at project level, this `plans/` directory.
- Husky: pre-commit (lint-staged) + pre-push (lint + prettier check + `vitest run`).
- Vercel project link + `adapter-vercel` install, deploy a placeholder page immediately — catches
  deploy/config issues on day 1 instead of day 6.

---

## Epic coverage check (spec requirement → epic)

| Spec requirement                                                   | Epic                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Rendering boundaries per route, edge+Node split                    | E5 (SSG), E4/E6 (edge: guard + search), E7 (Node), finalized in E10 |
| Performance budgets enforced in CI                                 | E10 (config), measured against E5/E6/E7                             |
| Data layer & API contract (Zod, validation at boundary)            | E2                                                                  |
| i18n (en/de, hreflang, Intl)                                       | E6                                                                  |
| Tailwind design tokens                                             | E1                                                                  |
| Component architecture (primitives + composite)                    | E1, E1b                                                             |
| Accessibility (keyboard, axe-core)                                 | E7 (dashboard keyboard parity), E9 (axe assertions)                 |
| SEO (meta, JSON-LD, sitemap, OG images)                            | E8                                                                  |
| Testing (Vitest, Playwright, axe, visual regression)               | E9                                                                  |
| Tooling/CI/observability (lint/typecheck/CI, RUM, error reporting) | E0 (skeleton), E3, E10                                              |
| Deliverables (repo, live URL, README, green CI)                    | E0, E11                                                             |
| Ground rules / evaluation criteria                                 | E0 (baked into CLAUDE.md)                                           |

No gaps found against the "required" sections of the spec. "Nice to have" items (View Transitions,
image pipeline, service worker, PPR/islands, feature flags) are intentionally not scheduled — cut
list to revisit only if a wave finishes early.

---

## Progress

- **Epic 0 (Bootstrap): COMPLETE.** Executed via `superpowers:subagent-driven-development`, plan
  at `.claude/plans/2026-08-12-epic-0-bootstrap.md`. Repo scaffolded, CI green, Husky hooks, branch
  protection live on `main` (PR + green `CI` required, 0 approvals, `enforce_admins`, no
  force-push/deletions), `CLAUDE.md` + `.claude/settings.json` in place, Vercel deployed
  (`nda-take-home` project). A final whole-branch review (Opus) found real gaps beyond the
  per-task reviews — fixed in a follow-up PR: root layout now has real landmarks/skip
  link/favicon and conflict-safe mount points for Wave 1, a vitest `client` project (jsdom) so
  component tests actually get collected (was silently impossible before), Node 22→24 alignment
  across CI/Vercel/`package.json`, project rename, `.gitignore`/CI hardening, and `CLAUDE.md`
  corrections. All merged to `main`.
- **Known open item:** the production Vercel URL only flips from the old `test-one-wine-74`
  alias to an `nda-take-home-*` one after a fresh production deploy — recheck the live URL
  before using it anywhere.

## Next step

Wave 1 is next: write the detailed bite-sized plans for **E1** (design tokens + primitives),
**E1b** (composite Dialog/Combobox shell), **E2** (data layer: Zod schemas + in-memory API), and
**E3** (observability scaffolding) — the four disjoint-file tracks called out as the best
subagent-parallel opportunity. Each still gets its own plan written just before it starts, per
`superpowers:writing-plans`, then dispatch via `superpowers:dispatching-parallel-agents`. Before
starting: root `src/routes/+layout.svelte` now has real landmarks (`<header>`, `<main
id="main-content">`, skip link, favicon) and three separated mount-point comments — E1/E1b/E3
must only add to it, and E3 specifically replaces the `<main>` block with `<svelte:boundary>`
wrapping `{@render children()}` rather than inserting at a bare comment (documented inline in the
file). Also note: any `.svelte.test.ts` component test files must NOT be `+`-prefixed
(`+layout.svelte.test.ts` breaks `svelte-kit sync`, same reservation that bit the Epic 0 e2e
test) — name them without the `+`, e.g. `Button.svelte.test.ts`.
