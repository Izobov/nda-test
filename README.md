# NDA Take-Home — SvelteKit

Senior frontend take-home submission (`task/take-home-senior-frontend-sveltekit.html`).

**Live:** https://test-one-wine-74.vercel.app
**Repo:** https://github.com/Izobov/nda-test

## AI disclosure

This codebase was generated with AI assistance (Claude Code), under my direct control. Every
architectural decision — rendering strategy per route, auth model, data-layer design, component
API shape, the token/design-system approach — was made by me and recorded in `CLAUDE.md` before
implementation started. Every plan and every PR was reviewed and approved by me before merging;
nothing lands on `main` without going through a pull request. I'm the one who can defend every
call on the 45-minute follow-up.

## What's built so far

- **Repo & CI/CD** — SvelteKit 2 / Svelte 5 / TypeScript, Tailwind v4 (CSS-first, no
  `tailwind.config.js`), ESLint + Prettier + `svelte-check`, Husky (pre-commit: lint-staged;
  pre-push: full lint + unit tests), GitHub Actions (lint → typecheck → unit → build, required
  status check), branch protection on `main` (PR required, no direct pushes, no force-push),
  deployed on Vercel.
- **9 reusable UI primitives** — `Button`, `Input`, `Badge`, `Avatar`, `Icon` (wraps `@mdi/js` —
  no emoji anywhere in the UI), plus a skeleton-loader bucket (`LoaderLine`, `ButtonLoader`,
  `BadgeLoader`, `AvatarLoader`) that pixel-matches its real counterpart to avoid layout shift.
  Explicit typed variant props (`variant`, `size`, …) — no runtime classname-merge helper.
  Tailwind `@theme` design tokens with a real light/dark split.
- **Data layer** — Zod schemas (`src/lib/schemas/*`) mirroring `task/mocks/schemas.json` exactly,
  shared client+server. Server-only accessor modules (`src/lib/server/data/*`, a boundary
  SvelteKit enforces at build time — importing them from client code fails the build) treating
  the flat mock JSON files as a real API: `items` supports pagination, status/channel filtering,
  and sorting on any field, per the mock data's own README; `users` looks up by email and
  produces a password-stripped public shape; `tags` and an `i18n` dictionary loader (with
  `{placeholder}` interpolation) round it out.

**Not built yet:** the `posts` data module, auth/session, and every actual page/route (`/`,
`/blog`, `/dashboard`, `/login`, search). The architecture and rendering-boundary decisions for
all of them are already written down in `CLAUDE.md` and the epic plans under `.claude/plans/` —
implementation is next.

## Tests

**88 / 88 passing** across 20 test files (`npm run test:unit -- --run`). Strict TDD throughout —
every test was written and confirmed failing before its implementation. No skipped or pending
tests.

| Area                                   | Tests  |
| -------------------------------------- | ------ |
| UI primitives (`src/lib/components`)   | 39     |
| Zod schemas (`src/lib/schemas`)        | 18     |
| Server data modules (`src/lib/server`) | 22     |
| **Total**                              | **79** |

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

## Run tests

```bash
npm run test:unit -- --run   # unit tests (Vitest)
npm run lint                 # Prettier + ESLint
npm run check                # svelte-check (TypeScript)
npm run build                # production build
```

## Demo credentials

Not wired up yet (no login page/auth epic built). Once live, all three accounts will use password
`demo1234`:

- `admin@demo.test` — full access
- `editor@demo.test` — can edit dashboard rows
- `viewer@demo.test` — read-only, for testing authorization boundaries

## Architecture

Full rationale for every decision (rendering strategy per route, edge/Node split, auth design,
component API conventions, i18n approach) lives in [`CLAUDE.md`](./CLAUDE.md). Epic-by-epic
implementation plans, each with its own commit history, are under
[`.claude/plans/`](./.claude/plans/), starting with the
[global roadmap](./.claude/plans/2026-08-12-global-roadmap.md).
