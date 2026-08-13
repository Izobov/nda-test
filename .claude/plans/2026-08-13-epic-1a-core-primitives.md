# Epic 1a — Core UI Primitives (Button, Input, Badge, Avatar, Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five production-grade, accessible, typed Svelte 5 primitives (`Button`, `Input`,
`Badge`, `Avatar`, plus an `Icon` support primitive) and a skeleton-loader bucket
(`LoaderLine`, `ButtonLoader`, `BadgeLoader`), backed by real Tailwind v4 design tokens.

**Scope note:** This is a first slice of Epic 1 from the global roadmap
(`.claude/plans/2026-08-12-global-roadmap.md`), covering exactly the primitives the user
specified today. The rest of Epic 1's roster (`Card`, `Select`, `Container`, `Heading`, `Toast`)
and the theme-toggle UI that fills the `<header>` mount point in `src/routes/+layout.svelte` are
**out of scope here** — deliberate cut, not an oversight — and get their own plan later. Dark
mode in this plan is wired at the token level only (via `prefers-color-scheme`); no toggle
control exists yet, so there is nothing to switch it manually — that lands with the deferred
theme-toggle work.

**Architecture:** Design tokens live in a Tailwind v4 `@theme` block in `src/routes/layout.css`
(no `tailwind.config.js`). Every primitive takes explicit typed props (`variant`, `size`, ...) —
no `cn()`/classname-merge utility; class strings are composed with plain template literals over
`Record<Variant, string>` / `Record<Size, string>` lookup maps. All icons render through a new
`Icon` primitive wrapping raw path data from `@mdi/js` — no emoji, anywhere, in code or UI.

**Tech Stack:** Svelte 5 (runes), TypeScript, Tailwind v4, `@mdi/js` (tree-shakeable per-icon
path constants), Vitest (`client` project, jsdom), `@testing-library/svelte` v5 +
`@testing-library/jest-dom` + `@testing-library/user-event`.

## Global Constraints

(copied from `CLAUDE.md` / the global roadmap / today's user spec — every task's requirements
implicitly include these)

- Svelte 5 runes only (`$props`, `$state`, `$derived`, `$bindable`) — no `svelte/store`.
- Tailwind v4, CSS-first: tokens in the `@theme { ... }` block of `src/routes/layout.css`. Never
  create `tailwind.config.js`.
- Component variant API = explicit typed props (`variant`, `size`, `full`, `disabled`, ...), never
  a `cn()`-style runtime classname-merge helper. Compose classes with template literals over
  `Record<Variant, string>` maps.
- No `any` / `@ts-ignore` / implicit `unknown` in own code.
- No emojis anywhere in code. All icons render via the `Icon` primitive using `@mdi/js` path
  constants (`import { mdiAccount } from '@mdi/js'`), never inline emoji or a different icon
  library.
- Strict TDD: failing test before implementation, every task below (all are real
  logic/components — none of this plan's tasks are config-only except Task 1, which is scaffolding
  and is exempt per `CLAUDE.md`).
- Atomic commits with a real subject + body, one reviewable unit per commit.
- `Button`'s size union is `'xs' | 'sm' | 'md' | 'lg'` — same spelling as `Icon`/`Avatar`/
  `AvatarLoader`. (The user's first draft of this spec said `'s'`; on review they asked for `'sm'`
  instead, for consistency across every primitive's size prop — so all four primitives now share
  one `Size` shape.)
- New `.svelte.test.ts` files must never be `+`-prefixed (breaks `svelte-kit sync` — see the
  global roadmap's "Next step" note).
- Test file naming/colocation: `Component.svelte` next to `Component.svelte.test.ts`, both under
  `src/lib/components/ui/` (or `src/lib/components/ui/skeleton/` for the loader bucket).

---

### Task 1: Setup — dependencies, design tokens, test infra, lint hardening

**Files:**

- Modify: `package.json`
- Modify: `src/routes/layout.css`
- Modify: `vite.config.ts`
- Create: `src/vitest-setup-client.ts`
- Modify: `eslint.config.js`

**Interfaces:**

- Produces: the `@theme` color tokens every later task's class-lookup maps read from —
  `bg-primary` / `text-primary-fg`, `bg-danger` / `text-danger-fg`, `bg-success` /
  `text-success-fg`, `bg-warning` / `text-warning-fg`, `bg-neutral` / `text-neutral-fg`,
  `bg-bg`, `text-fg`, `text-muted-fg`, `border-border`, `bg-surface`, `text-danger-text`.
  Also produces the `@testing-library/svelte` render/cleanup setup every later task's tests use.

This is a config/scaffolding task (dependency install, token definitions, test wiring) — no
business logic to TDD, exempt per `CLAUDE.md`.

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install -D @mdi/js @testing-library/svelte @testing-library/jest-dom @testing-library/user-event
```

`@mdi/js` ships one named export per icon as a plain path-data string (e.g. `mdiAccount`), so
importing only the icons actually used keeps the bundle tiny — nothing else in the package is
pulled in.

- [ ] **Step 2: Add design tokens to `src/routes/layout.css`**

Replace the file's contents with:

```css
@import 'tailwindcss';

@theme {
	--color-bg: #ffffff;
	--color-fg: #0f172a;
	--color-muted-fg: #475569;
	--color-border: #e2e8f0;
	--color-surface: #f8fafc;

	--color-primary: #4338ca;
	--color-primary-fg: #ffffff;

	--color-danger: #b91c1c;
	--color-danger-fg: #ffffff;
	--color-danger-text: #b91c1c;

	--color-success: #15803d;
	--color-success-fg: #ffffff;

	--color-warning: #92400e;
	--color-warning-fg: #ffffff;

	--color-neutral: #f1f5f9;
	--color-neutral-fg: #334155;
}

@media (prefers-color-scheme: dark) {
	:root {
		--color-bg: #020617;
		--color-fg: #f1f5f9;
		--color-muted-fg: #94a3b8;
		--color-border: #1e293b;
		--color-surface: #0f172a;

		--color-danger-text: #fca5a5;

		--color-neutral: #1e293b;
		--color-neutral-fg: #cbd5e1;
	}
}
```

Design rationale (so a reviewer doesn't need to re-derive it): `--color-primary` /
`--color-danger` / `--color-success` / `--color-warning` are solid fill+text pairs used together
on their own background (`Button` primary, `Badge` variants) — each pair is self-contained and
meets AA contrast against **itself**, so it does not need to change between themes. Only tokens
that sit directly on the page background — `bg`, `fg`, `muted-fg`, `border`, `surface`,
`neutral`/`neutral-fg`, and `danger-text` (used for `Input`'s error message, which renders on the
page background, not inside a filled danger badge) — get dark-mode overrides. This is a deliberate
minimal token set for this task's five primitives, not the full design system — extended in the
later Epic 1 plan when `Card`/`Select`/`Toast` need more surface variety.

- [ ] **Step 3: Wire up the Vitest client test setup**

Create `src/vitest-setup-client.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

afterEach(() => {
	cleanup();
});
```

Modify `vite.config.ts` — add `setupFiles` to the `client` project only:

```ts
{
	extends: './vite.config.ts',
	test: {
		name: 'client',
		environment: 'jsdom',
		include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
		setupFiles: ['./src/vitest-setup-client.ts']
	}
}
```

(Leave the `server` project untouched.)

- [ ] **Step 4: Harden ESLint for real component code**

In `eslint.config.js`, replace the trailing placeholder block:

```js
{
	// Override or add rule settings here, such as:
	// 'svelte/button-has-type': 'error'
	rules: {
	}
}
```

with:

```js
{
	rules: {
		'@typescript-eslint/no-explicit-any': 'error',
		'svelte/button-has-type': 'error'
	}
}
```

`svelte/button-has-type` is satisfied by `Button.svelte` always rendering a literal
`type="button"` (Task 3) — flagging any future `<button>` added elsewhere in the app that forgets
an explicit type.

- [ ] **Step 5: Verify the toolchain still passes with no test files yet**

Run: `npm run lint && npm run check && npm run test:unit -- --run`

Expected: all pass. The `client` Vitest project reports 0 files collected — this is expected and
is exactly the `passWithNoTests: true` bootstrap case `CLAUDE.md` documents; it stops being inert
for the `client` project the moment Task 2 adds `Icon.svelte.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/routes/layout.css vite.config.ts src/vitest-setup-client.ts eslint.config.js
git commit -m "$(cat <<'EOF'
chore(ui): design tokens, component test infra, mdi icons

Add @theme color tokens (primary/danger/success/warning/neutral,
theme-aware bg/fg/border/surface) to layout.css as the base every
upcoming primitive's variant classes read from. Wire @testing-library/svelte
+ jest-dom into the existing jsdom `client` Vitest project so
*.svelte.test.ts files actually render and assert against real DOM output.
Install @mdi/js for the project-wide "icons via mdi only" rule. Harden
ESLint with @typescript-eslint/no-explicit-any and svelte/button-has-type
ahead of the first real component code landing.
EOF
)"
```

---

### Task 2: `Icon` primitive

**Files:**

- Create: `src/lib/components/ui/Icon.svelte`
- Test: `src/lib/components/ui/Icon.svelte.test.ts`

**Interfaces:**

- Consumes: nothing (leaf primitive).
- Produces: `Icon` component with props `{ path: string; size?: 'xs' | 'sm' | 'md' | 'lg';
title?: string; class?: string }`. `path` is an `@mdi/js` path-data string. `Avatar` (Task 6)
  imports and renders this component with `mdiAccount`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ui/Icon.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Icon from './Icon.svelte';

const SAMPLE_PATH = 'M12 2L2 7l10 5 10-5-10-5z';

describe('Icon', () => {
	it('renders the given path data and is decorative (aria-hidden) by default', () => {
		const { container } = render(Icon, { props: { path: SAMPLE_PATH } });
		const svg = container.querySelector('svg');
		const path = container.querySelector('path');

		expect(svg).toHaveAttribute('aria-hidden', 'true');
		expect(svg).not.toHaveAttribute('role');
		expect(path).toHaveAttribute('d', SAMPLE_PATH);
	});

	it('becomes a labeled image when a title is provided', () => {
		const { container } = render(Icon, { props: { path: SAMPLE_PATH, title: 'Close' } });
		const svg = container.querySelector('svg');

		expect(svg).toHaveAttribute('role', 'img');
		expect(svg).toHaveAttribute('aria-label', 'Close');
		expect(svg).not.toHaveAttribute('aria-hidden');
	});

	it('applies the size class and merges a custom class', () => {
		const { container } = render(Icon, {
			props: { path: SAMPLE_PATH, size: 'lg', class: 'text-primary' }
		});
		const svg = container.querySelector('svg');

		expect(svg?.getAttribute('class')).toContain('size-6');
		expect(svg?.getAttribute('class')).toContain('text-primary');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run Icon.svelte.test.ts`
Expected: FAIL — `Icon.svelte` does not exist yet.

- [ ] **Step 3: Implement `Icon.svelte`**

```svelte
<script lang="ts">
	type Size = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		path: string;
		size?: Size;
		title?: string;
		class?: string;
	}

	let { path, size = 'md', title, class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		xs: 'size-3.5',
		sm: 'size-4',
		md: 'size-5',
		lg: 'size-6'
	};
</script>

<svg
	viewBox="0 0 24 24"
	class="shrink-0 fill-current {sizeClasses[size]} {className}"
	role={title ? 'img' : undefined}
	aria-label={title}
	aria-hidden={title ? undefined : 'true'}
>
	<path d={path} />
</svg>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run Icon.svelte.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/Icon.svelte src/lib/components/ui/Icon.svelte.test.ts
git commit -m "$(cat <<'EOF'
feat(ui): add Icon primitive for mdi path rendering

Thin, accessible wrapper around raw @mdi/js path data: decorative
(aria-hidden) by default, becomes a labeled role=img when a title is
passed. This is the single rendering path every icon in the app must
go through per the "no emojis, icons via mdi only" rule.
EOF
)"
```

---

### Task 3: `Button` primitive

**Files:**

- Create: `src/lib/components/ui/Button.svelte`
- Test: `src/lib/components/ui/Button.svelte.test.ts`

**Interfaces:**

- Consumes: nothing new (native `HTMLButtonAttributes` from `svelte/elements`).
- Produces: `Button` component, props `{ variant?: 'primary' | 'outline'; size?: 'xs' | 'sm' |
'md' | 'lg'; full?: boolean; disabled?: boolean; class?: string; children: Snippet } &
HTMLButtonAttributes`. Defaults: `variant="primary"`, `size="md"`, always renders a literal
  `type="button"` unless the caller passes their own `type` (e.g. `type="submit"` inside a form).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ui/Button.svelte.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

function label(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));
}

describe('Button', () => {
	it('defaults to type=button, variant=primary, size=md and renders its children', () => {
		render(Button, { props: { children: label('Save') } });
		const button = screen.getByRole('button', { name: 'Save' });

		expect(button).toHaveAttribute('type', 'button');
		expect(button.className).toContain('bg-primary');
		expect(button.className).toContain('h-10');
	});

	it('applies the outline variant and requested size', () => {
		render(Button, { props: { children: label('Cancel'), variant: 'outline', size: 'xs' } });
		const button = screen.getByRole('button', { name: 'Cancel' });

		expect(button.className).toContain('border-border');
		expect(button.className).toContain('h-7');
	});

	it('applies full width when full is true', () => {
		render(Button, { props: { children: label('Submit'), full: true } });
		expect(screen.getByRole('button', { name: 'Submit' }).className).toContain('w-full');
	});

	it('is disabled and unclickable when disabled is true', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Button, { props: { children: label('Delete'), disabled: true, onclick } });
		const button = screen.getByRole('button', { name: 'Delete' });

		expect(button).toBeDisabled();
		await user.click(button);
		expect(onclick).not.toHaveBeenCalled();
	});

	it('forwards native button attributes and fires onclick', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Button, {
			props: { children: label('Go'), onclick, 'aria-label': 'Go to next step' }
		});
		const button = screen.getByRole('button', { name: 'Go to next step' });

		await user.click(button);
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('lets a caller override type, e.g. for a submit button', () => {
		render(Button, { props: { children: label('Submit'), type: 'submit' } });
		expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run Button.svelte.test.ts`
Expected: FAIL — `Button.svelte` does not exist yet.

- [ ] **Step 3: Implement `Button.svelte`**

```svelte
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'outline';
	type Size = 'xs' | 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		full?: boolean;
		disabled?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		full = false,
		disabled = false,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-primary text-primary-fg hover:opacity-90',
		outline: 'border border-border bg-transparent text-fg hover:bg-surface'
	};

	const sizeClasses: Record<Size, string> = {
		xs: 'h-7 px-2.5 text-xs gap-1',
		sm: 'h-8 px-3 text-sm gap-1.5',
		md: 'h-10 px-4 text-sm gap-2',
		lg: 'h-12 px-6 text-base gap-2'
	};
</script>

<button
	type="button"
	{disabled}
	class="inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 {variantClasses[
		variant
	]} {sizeClasses[size]} {full ? 'w-full' : ''} {className}"
	{...rest}
>
	{@render children()}
</button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run Button.svelte.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/Button.svelte src/lib/components/ui/Button.svelte.test.ts
git commit -m "$(cat <<'EOF'
feat(ui): add Button primitive

variant (primary|outline) and size (xs|sm|md|lg) as explicit typed
props, not a classname-merge helper. Always renders type=button unless
the caller opts into a different type (e.g. type=submit inside a
form), matching the new svelte/button-has-type lint rule.
EOF
)"
```

---

### Task 4: `Input` primitive

**Files:**

- Create: `src/lib/components/ui/Input.svelte`
- Test: `src/lib/components/ui/Input.svelte.test.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `Input` component, props `{ value?: string (bindable); label: string; errorText?:
string; required?: boolean; class?: string } & HTMLInputAttributes`. Auto-generates an id via
  `$props.id()` when the caller doesn't pass one, and links `label`/`input`/error message via
  `for`/`id`/`aria-describedby`/`aria-invalid`. `required` is promoted to an explicit typed prop
  (rather than left to flow through `...rest`) because the label renders a visual `*` marker off
  it, not just the native `required` attribute.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ui/Input.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Input from './Input.svelte';

describe('Input', () => {
	it('associates the label with the input via a generated id', () => {
		render(Input, { props: { label: 'Email', value: '' } });
		const input = screen.getByLabelText('Email');
		expect(input).toBeInTheDocument();
	});

	it('propagates typed input back through the bindable value', async () => {
		const user = userEvent.setup();
		// A plain closure variable, not $state: this assertion is a one-time
		// snapshot read after `await user.type(...)` has already settled, not
		// a reactive consumer (template/$derived/$effect) — so there's
		// nothing for $state's reactivity to buy here, and Svelte's compiler
		// correctly flags a bare $state read in that position as suspicious
		// ("state_referenced_locally"). $bindable() only needs a real
		// get/set accessor pair on the props object; it doesn't care whether
		// the backing cell is reactive.
		let currentValue = '';
		render(Input, {
			props: {
				label: 'Name',
				get value() {
					return currentValue;
				},
				set value(v) {
					currentValue = v;
				}
			}
		});
		await user.type(screen.getByLabelText('Name'), 'Ada');
		expect(currentValue).toBe('Ada');
	});

	it('has no error state and no aria-invalid when errorText is absent', () => {
		render(Input, { props: { label: 'Email', value: '' } });
		expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('renders errorText in red as an alert, linked via aria-describedby, and sets aria-invalid', () => {
		render(Input, { props: { label: 'Email', value: '', errorText: 'Email is required' } });
		const input = screen.getByLabelText('Email');
		const message = screen.getByRole('alert');

		expect(message).toHaveTextContent('Email is required');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input.getAttribute('aria-describedby')).toBe(message.id);
		expect(message.className).toContain('text-danger-text');
	});

	it('forwards native input attributes such as placeholder and type', () => {
		render(Input, {
			props: { label: 'Email', value: '', placeholder: 'you@example.com', type: 'email' }
		});
		const input = screen.getByLabelText('Email');
		expect(input).toHaveAttribute('placeholder', 'you@example.com');
		expect(input).toHaveAttribute('type', 'email');
	});

	it('marks the input required and shows a visual asterisk on the label when required is true', () => {
		render(Input, { props: { label: 'Email', value: '', required: true } });
		// exact: false — the label's own text is now "Email *", so an exact
		// match against "Email" alone would no longer find it.
		const input = screen.getByLabelText('Email', { exact: false });

		expect(input).toBeRequired();
		expect(screen.getByText('*')).toBeInTheDocument();
	});

	it('has no asterisk and is not required by default', () => {
		render(Input, { props: { label: 'Email', value: '' } });
		expect(screen.getByLabelText('Email')).not.toBeRequired();
		expect(screen.queryByText('*')).not.toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run Input.svelte.test.ts`
Expected: FAIL — `Input.svelte` does not exist yet.

- [ ] **Step 3: Implement `Input.svelte`**

```svelte
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'required'> {
		value?: string;
		label: string;
		errorText?: string;
		required?: boolean;
		class?: string;
	}

	let {
		value = $bindable(''),
		label,
		errorText,
		required = false,
		id,
		class: className = '',
		...rest
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `input-${uid}`);
	const errorId = $derived(`${inputId}-error`);
</script>

<div class="flex flex-col gap-1.5">
	<label for={inputId} class="text-sm font-medium text-fg">
		{label}
		{#if required}
			<span aria-hidden="true" class="text-danger-text">*</span>
		{/if}
	</label>
	<input
		id={inputId}
		bind:value
		{required}
		class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted-fg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50 {className}"
		aria-invalid={errorText ? 'true' : undefined}
		aria-describedby={errorText ? errorId : undefined}
		{...rest}
	/>
	{#if errorText}
		<p id={errorId} role="alert" class="text-sm text-danger-text">{errorText}</p>
	{/if}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run Input.svelte.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/Input.svelte src/lib/components/ui/Input.svelte.test.ts
git commit -m "$(cat <<'EOF'
feat(ui): add Input primitive

bind:value + label + optional errorText + required, with the
label/input/error message wired together via a $props.id()-generated
id so the a11y association holds even when the caller doesn't pass an
explicit id. errorText renders as a role=alert message in the
danger-text token color under the field. required is a typed prop
(not left to ...rest) because the label also renders a visual asterisk
off it.
EOF
)"
```

---

### Task 5: `Badge` primitive

**Files:**

- Create: `src/lib/components/ui/Badge.svelte`
- Test: `src/lib/components/ui/Badge.svelte.test.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `Badge` component, props `{ variant?: 'primary' | 'success' | 'warning' | 'danger' |
'neutral'; class?: string; children: Snippet }`. Default `variant="neutral"`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ui/Badge.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

function label(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));
}

describe('Badge', () => {
	// getByText('...') resolves to the raw snippet's own <span>text</span>;
	// its parentElement is Badge's styled root <span> one level up. Do not
	// use .closest('span') here — the snippet's span matches itself first.
	it('defaults to the neutral variant', () => {
		render(Badge, { props: { children: label('Draft') } });
		expect(screen.getByText('Draft').parentElement?.className).toContain('bg-neutral');
	});

	it.each([
		['primary', 'bg-primary'],
		['success', 'bg-success'],
		['warning', 'bg-warning'],
		['danger', 'bg-danger']
	] as const)('applies the %s variant classes', (variant, expectedClass) => {
		render(Badge, { props: { children: label(variant), variant } });
		expect(screen.getByText(variant).parentElement?.className).toContain(expectedClass);
	});

	it('merges a custom class', () => {
		render(Badge, { props: { children: label('Custom'), class: 'ml-2' } });
		expect(screen.getByText('Custom').parentElement?.className).toContain('ml-2');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run Badge.svelte.test.ts`
Expected: FAIL — `Badge.svelte` does not exist yet.

- [ ] **Step 3: Implement `Badge.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

	interface Props {
		variant?: Variant;
		class?: string;
		children: Snippet;
	}

	let { variant = 'neutral', class: className = '', children }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-primary text-primary-fg',
		success: 'bg-success text-success-fg',
		warning: 'bg-warning text-warning-fg',
		danger: 'bg-danger text-danger-fg',
		neutral: 'bg-neutral text-neutral-fg'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {variantClasses[
		variant
	]} {className}"
>
	{@render children()}
</span>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run Badge.svelte.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/Badge.svelte src/lib/components/ui/Badge.svelte.test.ts
git commit -m "$(cat <<'EOF'
feat(ui): add Badge primitive with 5 variants

primary/success/warning/danger/neutral, each a self-contained
solid fill+text token pair (see layout.css token rationale) so
contrast holds in both themes without per-variant dark overrides.
EOF
)"
```

---

### Task 6: `Avatar` primitive

**Files:**

- Create: `src/lib/components/ui/Avatar.svelte`
- Test: `src/lib/components/ui/Avatar.svelte.test.ts`

**Interfaces:**

- Consumes: `Icon` from `./Icon.svelte` (Task 2), `mdiAccount` from `@mdi/js`.
- Produces: `Avatar` component, props `{ url?: string; name?: string; size?: 'xs' | 'sm' | 'md' |
'lg'; class?: string }`. Priority: valid image (`url` present and not errored) → initials from
  `name` → `mdiAccount` icon fallback.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ui/Avatar.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

describe('Avatar', () => {
	it('renders the image when a url is given', () => {
		render(Avatar, { props: { url: 'https://example.com/ada.png', name: 'Ada Lovelace' } });
		const img = screen.getByRole('img', { name: 'Ada Lovelace' });
		expect(img).toHaveAttribute('src', 'https://example.com/ada.png');
	});

	it('falls back to initials when no url is given', () => {
		render(Avatar, { props: { name: 'Ada Lovelace' } });
		expect(screen.getByText('AL')).toBeInTheDocument();
	});

	it('uses the first two characters of a single-word name', () => {
		render(Avatar, { props: { name: 'Ada' } });
		expect(screen.getByText('AD')).toBeInTheDocument();
	});

	it('falls back to the user icon when neither url nor name is given', () => {
		render(Avatar, {});
		expect(screen.getByRole('img', { name: 'User avatar' })).toBeInTheDocument();
	});

	it('falls back to initials if the image fails to load', async () => {
		render(Avatar, { props: { url: 'https://example.com/broken.png', name: 'Ada Lovelace' } });
		const img = screen.getByRole('img', { name: 'Ada Lovelace' });

		await fireEvent.error(img);

		expect(screen.getByText('AL')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('recovers and shows a new image after a later url replaces one that failed', async () => {
		// Regression test: Svelte reuses component instances, so a plain
		// `imageFailed = true` boolean would permanently lock this instance
		// onto the initials fallback even after a valid new `url` prop
		// arrives (e.g. a dashboard row re-rendering for a different user).
		const { rerender } = render(Avatar, {
			props: { url: 'https://example.com/broken.png', name: 'Ada Lovelace' }
		});
		await fireEvent.error(screen.getByRole('img', { name: 'Ada Lovelace' }));
		expect(screen.getByText('AL')).toBeInTheDocument();

		await rerender({ url: 'https://example.com/grace.png', name: 'Grace Hopper' });

		const img = screen.getByRole('img', { name: 'Grace Hopper' });
		expect(img).toHaveAttribute('src', 'https://example.com/grace.png');
		expect(screen.queryByText('GH')).not.toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run Avatar.svelte.test.ts`
Expected: FAIL — `Avatar.svelte` does not exist yet.

- [ ] **Step 3: Implement `Avatar.svelte`**

```svelte
<script lang="ts">
	import { mdiAccount } from '@mdi/js';
	import Icon from './Icon.svelte';

	type Size = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		url?: string;
		name?: string;
		size?: Size;
		class?: string;
	}

	let { url, name, size = 'md', class: className = '' }: Props = $props();

	// Track *which* url failed, not a plain boolean: Svelte reuses component
	// instances, so a stale `imageFailed = true` would permanently lock this
	// instance onto the fallback even after a later, valid `url` prop arrives
	// (e.g. a dashboard row re-rendering with a different user). Comparing
	// against the current `url` self-heals the moment the prop changes.
	let failedUrl = $state<string | undefined>(undefined);

	const sizeClasses: Record<Size, string> = {
		xs: 'size-6 text-[10px]',
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-14 text-base'
	};

	const iconSizeBySize: Record<Size, 'xs' | 'sm' | 'md'> = {
		xs: 'xs',
		sm: 'xs',
		md: 'sm',
		lg: 'md'
	};

	function initials(value: string): string {
		const parts = value.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '';
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}

	const showImage = $derived(Boolean(url) && failedUrl !== url);
	const computedInitials = $derived(name ? initials(name) : '');
</script>

<span
	class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral font-medium text-neutral-fg {sizeClasses[
		size
	]} {className}"
>
	{#if showImage}
		<img
			src={url}
			alt={name ?? ''}
			class="size-full object-cover"
			onerror={() => (failedUrl = url)}
		/>
	{:else if computedInitials}
		{computedInitials}
	{:else}
		<Icon path={mdiAccount} size={iconSizeBySize[size]} title="User avatar" />
	{/if}
</span>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run Avatar.svelte.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/Avatar.svelte src/lib/components/ui/Avatar.svelte.test.ts
git commit -m "$(cat <<'EOF'
feat(ui): add Avatar primitive with image/initials/icon fallback

Priority order: url (if it loads) -> initials derived from name ->
mdiAccount icon. Listens for the native img error event to demote a
broken url to the initials fallback rather than showing a broken-image
glyph.
EOF
)"
```

---

### Task 7: Skeleton loader bucket (`LoaderLine`, `ButtonLoader`, `BadgeLoader`, `AvatarLoader`)

**Files:**

- Create: `src/lib/components/ui/skeleton/LoaderLine.svelte`
- Create: `src/lib/components/ui/skeleton/ButtonLoader.svelte`
- Create: `src/lib/components/ui/skeleton/BadgeLoader.svelte`
- Create: `src/lib/components/ui/skeleton/AvatarLoader.svelte`
- Test: `src/lib/components/ui/skeleton/LoaderLine.svelte.test.ts`
- Test: `src/lib/components/ui/skeleton/ButtonLoader.svelte.test.ts`
- Test: `src/lib/components/ui/skeleton/BadgeLoader.svelte.test.ts`
- Test: `src/lib/components/ui/skeleton/AvatarLoader.svelte.test.ts`

**Interfaces:**

- Consumes: nothing new (mirrors `Button`'s size scale from Task 3 for `ButtonLoader`, and
  `Avatar`'s size scale/circle footprint from Task 6 for `AvatarLoader`, so each loading
  placeholder matches its real component's footprint exactly — no layout shift when the real
  content swaps in).
- Produces: `LoaderLine` `{ width?: string; height?: string; full?: boolean; class?: string }`;
  `ButtonLoader` `{ size?: 'xs' | 'sm' | 'md' | 'lg'; full?: boolean; class?: string }`;
  `BadgeLoader` `{ class?: string }`; `AvatarLoader` `{ size?: 'xs' | 'sm' | 'md' | 'lg'; class?:
string }` — its size classes are pixel-identical to `Avatar`'s own (`size-6`/`size-8`/
  `size-10`/`size-14`). All four are `aria-hidden="true"` — they are visual placeholders only; a
  consuming page that needs a screen-reader-announced loading state adds one `role="status"`
  region around the group of loaders, which is a composition concern for whichever page uses
  them, not each atom.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/components/ui/skeleton/LoaderLine.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import LoaderLine from './LoaderLine.svelte';

describe('LoaderLine', () => {
	it('is decorative and pulses by default at full width via the w-full class', () => {
		const { container } = render(LoaderLine, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('animate-pulse');
		expect(el?.className).toContain('w-full');
		expect(el).not.toHaveStyle({ width: expect.anything() });
	});

	it('applies an explicit width via inline style and height', () => {
		const { container } = render(LoaderLine, { props: { width: '8rem', height: '0.75rem' } });
		const el = container.firstElementChild;
		expect(el?.className).not.toContain('w-full');
		expect(el).toHaveStyle({ width: '8rem', height: '0.75rem' });
	});

	it('full overrides an explicit width back to the w-full class', () => {
		const { container } = render(LoaderLine, { props: { width: '8rem', full: true } });
		const el = container.firstElementChild;
		expect(el?.className).toContain('w-full');
		expect(el).not.toHaveStyle({ width: expect.anything() });
	});
});
```

```ts
// src/lib/components/ui/skeleton/ButtonLoader.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ButtonLoader from './ButtonLoader.svelte';

describe('ButtonLoader', () => {
	it('is decorative and matches the md Button height by default', () => {
		const { container } = render(ButtonLoader, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('h-10');
	});

	it('matches the requested size', () => {
		const { container } = render(ButtonLoader, { props: { size: 'lg' } });
		expect(container.firstElementChild?.className).toContain('h-12');
	});

	it('applies full width when full is true', () => {
		const { container } = render(ButtonLoader, { props: { full: true } });
		expect(container.firstElementChild?.className).toContain('w-full');
	});
});
```

```ts
// src/lib/components/ui/skeleton/BadgeLoader.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BadgeLoader from './BadgeLoader.svelte';

describe('BadgeLoader', () => {
	it('is decorative and pill-shaped', () => {
		const { container } = render(BadgeLoader, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('rounded-full');
	});

	it('merges a custom class', () => {
		const { container } = render(BadgeLoader, { props: { class: 'ml-2' } });
		expect(container.firstElementChild?.className).toContain('ml-2');
	});
});
```

```ts
// src/lib/components/ui/skeleton/AvatarLoader.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import AvatarLoader from './AvatarLoader.svelte';

describe('AvatarLoader', () => {
	it('is decorative, circular, and matches the md Avatar size by default', () => {
		const { container } = render(AvatarLoader, {});
		const el = container.firstElementChild;
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el?.className).toContain('rounded-full');
		expect(el?.className).toContain('size-10');
	});

	it('matches the requested size', () => {
		const { container } = render(AvatarLoader, { props: { size: 'lg' } });
		expect(container.firstElementChild?.className).toContain('size-14');
	});

	it('merges a custom class', () => {
		const { container } = render(AvatarLoader, { props: { class: 'ml-2' } });
		expect(container.firstElementChild?.className).toContain('ml-2');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run skeleton`
Expected: FAIL — none of the four components exist yet.

- [ ] **Step 3: Implement the three components**

```svelte
<!-- src/lib/components/ui/skeleton/LoaderLine.svelte -->
<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		full?: boolean;
		class?: string;
	}

	let { width, height = '1rem', full = false, class: className = '' }: Props = $props();

	// full and "no width given" both mean 100% — express that with the same
	// static w-full utility Button uses for its own `full` prop, rather than
	// an inline style, so the two primitives agree on how "full width" is
	// spelled. A caller-supplied width still needs an inline style: Tailwind's
	// class scanner only picks up class names that appear literally in
	// source, so a runtime-interpolated value like `w-[{width}]` can never
	// generate CSS at build time.
	const useFullWidthClass = $derived(full || width === undefined);
	const customWidth = $derived(useFullWidthClass ? undefined : width);
</script>

<span
	class="inline-block animate-pulse rounded-md bg-neutral {useFullWidthClass
		? 'w-full'
		: ''} {className}"
	style="height: {height};{customWidth ? ` width: ${customWidth};` : ''}"
	aria-hidden="true"
></span>
```

```svelte
<!-- src/lib/components/ui/skeleton/ButtonLoader.svelte -->
<script lang="ts">
	import type { Size } from '../types';

	interface Props {
		size?: Size;
		full?: boolean;
		class?: string;
	}

	let { size = 'md', full = false, class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		xs: 'h-7 w-16',
		sm: 'h-8 w-20',
		md: 'h-10 w-24',
		lg: 'h-12 w-28'
	};
</script>

<span
	class="inline-block animate-pulse rounded-md bg-neutral {full
		? 'w-full'
		: 'shrink-0'} {sizeClasses[size]} {className}"
	aria-hidden="true"
></span>
```

```svelte
<!-- src/lib/components/ui/skeleton/BadgeLoader.svelte -->
<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<span
	class="inline-block h-5 w-14 shrink-0 animate-pulse rounded-full bg-neutral {className}"
	aria-hidden="true"
></span>
```

```svelte
<!-- src/lib/components/ui/skeleton/AvatarLoader.svelte -->
<script lang="ts">
	import type { Size } from '../types';

	interface Props {
		size?: Size;
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		xs: 'size-6',
		sm: 'size-8',
		md: 'size-10',
		lg: 'size-14'
	};
</script>

<span
	class="inline-block shrink-0 animate-pulse rounded-full bg-neutral {sizeClasses[
		size
	]} {className}"
	aria-hidden="true"
></span>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run skeleton`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ui/skeleton
git commit -m "$(cat <<'EOF'
feat(ui): add skeleton loader bucket

LoaderLine (generic width/height/full-configurable line), plus three
shape-matched loaders — ButtonLoader, BadgeLoader, AvatarLoader — that
mirror Button's, Badge's, and Avatar's real footprint pixel-for-pixel,
so a loading state doesn't jump layout when the real content swaps in.
All four are aria-hidden; screen-reader loading announcements are a
composition concern for the consuming page (one role=status region
around a group of loaders), not each atom.
EOF
)"
```

---

### Task 8: Barrel exports and final verification

**Files:**

- Modify: `src/lib/index.ts`

**Interfaces:**

- Consumes: all components from Tasks 2–7.
- Produces: `$lib` re-exports so consumers can `import { Button, Input, Badge, Avatar, Icon,
LoaderLine, ButtonLoader, BadgeLoader, AvatarLoader } from '$lib'`.

No new logic — nothing to TDD here; this is a re-export wiring + whole-suite verification step.

- [ ] **Step 1: Update `src/lib/index.ts`**

```ts
export { default as Icon } from './components/ui/Icon.svelte';
export { default as Button } from './components/ui/Button.svelte';
export { default as Input } from './components/ui/Input.svelte';
export { default as Badge } from './components/ui/Badge.svelte';
export { default as Avatar } from './components/ui/Avatar.svelte';
export { default as LoaderLine } from './components/ui/skeleton/LoaderLine.svelte';
export { default as ButtonLoader } from './components/ui/skeleton/ButtonLoader.svelte';
export { default as BadgeLoader } from './components/ui/skeleton/BadgeLoader.svelte';
export { default as AvatarLoader } from './components/ui/skeleton/AvatarLoader.svelte';
```

- [ ] **Step 2: Run the full toolchain**

Run: `npm run lint && npm run check && npm run test:unit -- --run && npm run build`

Expected: all green — lint (ESLint + Prettier, including the two new rules from Task 1),
`svelte-check` (no `any`/implicit `unknown` across the 9 new component files), the full Vitest
`client` + `server` suite (38 tests across Tasks 2–7), and a clean production build.

- [ ] **Step 3: Commit**

```bash
git add src/lib/index.ts
git commit -m "$(cat <<'EOF'
chore(ui): barrel-export the new primitives from \$lib

Icon, Button, Input, Badge, Avatar, and the skeleton loader bucket
(LoaderLine, ButtonLoader, BadgeLoader, AvatarLoader) are now
importable as `import { X } from '$lib'` rather than reaching into
component file paths directly.
EOF
)"
```

---

## Task coverage check (today's request → task)

| Requirement                                                                                             | Task                                                           |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Design tokens (`@theme`), test infra, mdi install, lint hardening                                       | 1                                                              |
| Icon primitive (mdi path rendering, backs Avatar + future icon usage)                                   | 2                                                              |
| `Button` — `variant`, `size` (`xs/sm/md/lg`), `full`, `disabled`, rest                                  | 3                                                              |
| `Input` — `bind:value`, `label`, `errorText` (red, below input), `required`                             | 4                                                              |
| `Badge` — variants                                                                                      | 5                                                              |
| `Avatar` — `url`/`name`/icon fallback chain                                                             | 6                                                              |
| Skeleton bucket — `LoaderLine` (`width`/`height`/`full`), `ButtonLoader`, `BadgeLoader`, `AvatarLoader` | 7                                                              |
| No emojis, icons via mdi only                                                                           | 2, 6 (enforced by construction — nothing else renders an icon) |
