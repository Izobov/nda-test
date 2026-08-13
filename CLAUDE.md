# CLAUDE.md

This file is project memory for any Claude Code session working in this repo. Read it before
touching code. Full epic-by-epic roadmap: `.claude/plans/2026-08-12-global-roadmap.md`.

## What this is

A take-home assignment (`task/take-home-senior-frontend-sveltekit.html`) that determines a job
offer. Deadline **2026-08-19**. Treat every requirement below as load-bearing — this is graded
against the rubric verbatim, not against "reasonable effort."

## Non-negotiable architecture decisions (do not re-litigate)

- **No database, no Supabase.** `task/mocks/*.json` is the entire data layer, read server-side in
  `load`/actions as if it were a real API (per `task/mocks/README.md`). Never call it directly from
  client code.
- **Auth = stateless signed cookie**, not a session table. Verify `users.json` password
  server-side, sign `{userId, role, exp}` with Web Crypto (HMAC), set httpOnly/secure/sameSite
  cookie. No client-side password checks. Short TTL + logout-clears-cookie mitigates the
  no-instant-revocation tradeoff — document this tradeoff, don't hide it.
- **Rendering/runtime split:**
  - `/`, `/blog`, `/blog/[slug]`, `/en/*`, `/de/*` → **prerendered (SSG)** via `export const
prerender = true` + explicit `entries()` returning every `{slug}` (× `{lang}`) from
    `posts.json`. Content changes = edit JSON + redeploy (no CMS exists, so this _is_ the
    content-update path). ISR is the natural upgrade path if data ever moved to a live CMS; not
    implemented here because this project's data source doesn't need it — a deliberate,
    defensible scope cut, not an oversight.
  - **Edge** runtime → the `handle` hook / guard verifying the signed cookie for
    `/dashboard/**`, and `/search`.
  - **Node** runtime → `/dashboard/items` + its form actions.
- **Composite widget = Dialog/Combobox**, not the dashboard Table (Table is already a separate,
  differently-weighted rubric line). Converge it with the dashboard's inline status-edit UI where
  possible.
- **Tailwind v4, CSS-first.** Design tokens live in an `@theme { ... }` block in CSS
  (`src/routes/layout.css`), **not** `tailwind.config.js` — v4 doesn't use one by default. Don't
  create a `tailwind.config.js` "because that's how Tailwind normally works."
- **State management:** Svelte 5 runes only. Don't mix in `svelte/store` unless a specific need
  can't be expressed with runes — and justify it in the commit message if so.
- **Component variant API:** explicit typed props (e.g. `variant`, `size`), not classname-merge
  helpers. `<Button variant="primary" size="xs">` — readable and greppable — not a `cn()`-style
  utility resolving conflicting classes at runtime.
- **Root layout mount points are add-only.** `src/routes/+layout.svelte` reserves mount points for
  the theme toggle (Epic 1), ModalHost (Epic 1b), and the error boundary (Epic 3). This is the one
  shared-file risk across Wave 1's four parallel epics, so each epic **adds to** its own mount
  point and does not restructure the file. One documented exception: `<svelte:boundary>` must wrap
  content, so Epic 3 necessarily replaces the `<main>` block rather than inserting at a comment —
  that specific edit is expected, and the comment in the file says so.
- **`test.passWithNoTests: true` in `vite.config.ts` is a deliberate bootstrap setting** for the
  window where zero test files exist. It does **not** mean tests are optional: the moment Epic 1
  adds real test files it becomes inert for those projects. It must never be used to mask a vitest
  project whose `include` pattern silently matches nothing — if a project reports success while
  collecting zero files you did not expect to be empty, fix the pattern, don't lean on this flag.

## Process rules

- **Strict TDD.** Failing test before implementation, every time, for actual logic/components.
  Config/scaffolding tasks are exempt (nothing to TDD in a GitHub Actions YAML file).
- **Atomic commits.** Each commit is one reviewable unit with a real message. No
  squash-to-one-commit submission — commit history is graded.
- **Ambiguity → make a call, document it, move on.** Do not stop to ask the hiring team. Be ready
  to defend the call on the 45-minute follow-up.
- Pre-commit (Husky) = lint-staged, fast. Pre-push = full lint + unit tests.
- **CI, target pipeline order:** lint → typecheck → unit → build → Playwright → Lighthouse CI →
  bundle-size, blocking on any regression. **Currently only the first four stages exist** in
  `.github/workflows/ci.yml`; Playwright, Lighthouse CI, and bundle-size land in Epics 9/10 per
  the roadmap. Treat the full list as the destination, not a description of the present state.
- `main` is protected: PR + green `CI` status check required, no direct pushes, no force-push, no
  branch deletion. Specifically: **0 required approvals** (solo project — don't wait for a review
  that will never come), `enforce_admins: true` (nobody bypasses the rules, including the repo
  owner), and `strict: true` (the branch must be up to date with `main` before it can merge).
  Applied once Epic 0's first CI run goes green, and confirmed working before Epic 0's own
  app-shell change (root layout, placeholder home page) — that change is the first real PR.
- **Never merge a pull request automatically.** An agent's job ends at: push the branch, open the
  PR, confirm CI is green, report the URL. The user merges every PR themselves, without exception.

## Grading rubric (verbatim weights, reproduced here for reference)

| Area                                | Weight |
| ----------------------------------- | ------ |
| Architecture & rendering boundaries | 20%    |
| Performance (measured + enforced)   | 15%    |
| Data layer & interactivity          | 15%    |
| Code quality & TypeScript           | 10%    |
| Design system & Tailwind            | 10%    |
| A11y, SEO, i18n                     | 10%    |
| Testing, CI, observability          | 10%    |
| Communication & judgment            | 10%    |

"What we value most: taste, judgment, and finished edges. A small surface area that is genuinely
production-grade beats a sprawling demo that's 80% there everywhere." — spec, verbatim.

## Required checklist (spec section 02, condensed — see the HTML for full wording)

- Deliberate SSG/SSR/streamed/edge choice **per route**, defended on the call.
- ≥1 route on edge, ≥1 on Node, with a real justification (cold start / data locality / deps).
- Streamed `load` promises where they improve TTFB without hurting LCP.
- LCP < 2.0s, CLS < 0.1, INP < 200ms (Lighthouse mobile, Moto G Power) on `/`, `/blog/[slug]`,
  `/dashboard/items` — **enforced in CI**, not just measured.
- Lighthouse Perf/A11y/SEO/Best-Practices ≥ 95, CI-blocking.
- JS budget via `size-limit`: ≤80KB gzip public surface, ≤150KB dashboard — enforced.
- Zod schemas (not OpenAPI) as single source of truth, derived from `task/mocks/schemas.json`.
  Validate `posts.json`/`items.json`/`users.json` at the boundary. Shared client+server
  validation schema. Loaders vs actions clearly distinguished; mutations invalidate only the
  relevant loader. Network/validation/401/403 errors each render and recover differently.
- i18n: `en`/`de`, URL locale segment, correct `hreflang`/canonical/locale-aware sitemap, `Intl`
  for at least one date and one number (not string templates).
- 8–10 reusable primitives + 1 from-scratch accessible composite (focus trap, ARIA, keyboard,
  dismissal — not a UI-library wrapper). No `any`/`@ts-ignore`/implicit `unknown`.
- Full semantic HTML, landmarks, heading order, skip link, visible focus. Dashboard table fully
  keyboard-operable (sort/filter/paginate/edit). WCAG AA contrast both themes. `@axe-core/playwright`
  in CI, fails on serious/critical.
- Per-route/per-locale title/description/canonical/OG/Twitter card. JSON-LD (Article+breadcrumbs
  on posts, Organization on home), validates clean. Locale-aware `sitemap.xml`/`robots.txt` at
  build time. Dynamic OG images for blog posts.
- ≥5 meaningful Vitest unit tests (composite + one business-logic unit, e.g. URL-state codec,
  no snapshot noise). ≥2 Playwright E2E flows (anonymous: search→click→post; authenticated:
  login→dashboard→edit row optimistic update→assert rollback). Axe assertions on dashboard.
  1 visual regression snapshot.
- ESLint + Prettier + `svelte-check` + `tsc --noEmit` all passing. Husky pre-commit blocks bad
  commits. CI: lint→typecheck→unit→build→Playwright→Lighthouse CI→bundle-size, fails PR on
  regression. Real `web-vitals` RUM to a beacon endpoint (console.log is fine, wiring must be
  real) with sampling. Client error boundary + error reporting to the same beacon.

## Deliverables (submission)

Public GitHub repo URL + live deployed URL (dashboard reachable behind demo login) + `README.md`
(run locally, run tests, demo credentials) + green CI on `main` at submission time, sent as a
reply with approximate time spent and talking points, ahead of a 45-minute defense call.

## Demo credentials (from `task/mocks/README.md`, password `demo1234` for all)

`admin@demo.test` (full access), `editor@demo.test` (can edit dashboard rows), `viewer@demo.test`
(read-only — use to test authorization boundaries).

## What may / may not change in `task/mocks/`

May extend (add fields, note it in README; translate more strings; regenerate more rows). May
**not** change: `users.json` shape, `posts.json` `id`/`slug` fields.
