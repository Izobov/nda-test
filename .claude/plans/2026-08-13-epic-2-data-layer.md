# Epic 2 — Data Layer (Zod Schemas + Server-Side Mock API + i18n Loader) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the single data layer every future page/route depends on: Zod schemas matching
`task/mocks/schemas.json` exactly, and a server-only module treating each `task/mocks/*.json`
file as if it were a real, paginated/filterable/sortable API — exactly what `task/mocks/README.md`
asks for.

**Architecture:** Mock JSON files are imported directly via ES module `import` (Vite's built-in
JSON loader, `resolveJsonModule: true` already set in `tsconfig.json`) from inside
`src/lib/server/data/*.ts` — never copied into `static/` (that was explicitly ruled out during
Epic 0 over a security concern: `users.json`, password field and all, would otherwise be served
as a public static asset). Importing JSON via ES modules bundles the data directly into the
compiled output at build time, so there's no runtime filesystem dependency to worry about on
Vercel's serverless functions (unlike `fs.readFileSync`, which would need the file to exist
alongside the deployed function). Every accessor function parses its file through a Zod schema
once, at module load, and throws immediately if the shape doesn't match — fail fast on bad mock
data, not on first render.

Placing these modules under `src/lib/server/` is deliberate: SvelteKit statically forbids
importing anything under `$lib/server/*` from code reachable by the client bundle (a build-time
error, not a lint warning) — this is what gives us "never call it directly from client code" for
free, enforced by the framework, not by convention. Zod **schemas** themselves live in the
sibling `src/lib/schemas/*` (public `$lib`, not `$lib/server`) because `CLAUDE.md` requires a
**shared client+server validation schema** — a later epic's login form or dashboard inline-edit
UI will need to import the same schemas client-side for pre-submit validation. A schema
declaration contains no actual data, so nothing sensitive leaks by making it importable from the
client; only the accessor _functions_ that read the real mock files are server-gated.

**Tech Stack:** Zod v4, TypeScript, Vitest (`server` project — none of this epic's files are
`.svelte`, so everything lands in the existing `server` Vitest project from Epic 1a, not
`client`).

## Global Constraints

(copied from `CLAUDE.md` / `task/mocks/README.md` / the global roadmap — every task's
requirements implicitly include these)

- Zod schemas (not OpenAPI) are the single source of truth, derived from `task/mocks/schemas.json`
  exactly — every field, every enum value.
- Validate `posts.json`/`items.json`/`users.json`/`tags.json` at the boundary (module load time),
  not lazily per-request.
- Shared client+server validation schema: schemas live in `src/lib/schemas/*`, never under
  `$lib/server/`.
- `items.json` must be treated as a paginated, filterable, sortable API — those operations
  implemented server-side even though the source is a flat file (`task/mocks/README.md`,
  verbatim).
- The `password` field in `users.json` is plaintext for demo convenience only; nothing in this
  epic performs a login comparison (that's Epic 4/auth) — this epic only exposes
  `findUserByEmail` (returns the full record, password included, for the auth epic to compare
  against) and `toPublicUser` (strips `password`, for anything that might reach the client).
- `users.json` shape and `posts.json` `id`/`slug` fields are immutable; nothing in this epic
  modifies `task/mocks/*.json`.
- No `any` / `@ts-ignore` / implicit `unknown` in own code.
- Strict TDD: failing test before implementation, every task below (all are real business logic —
  none of this plan's tasks are config-only).
- Atomic commits with a real subject + body, one reviewable unit per commit.
- House style (from `prettier.config.js`): tabs, single quotes, no trailing commas.
- Locale set is exactly `'en' | 'de'` everywhere a locale is accepted — never a bare `string`.

---

### Task 1: Zod schemas for every entity

**Files:**

- Create: `src/lib/schemas/locale.ts`
- Create: `src/lib/schemas/post.ts`
- Create: `src/lib/schemas/item.ts`
- Create: `src/lib/schemas/user.ts`
- Create: `src/lib/schemas/tag.ts`
- Create: `src/lib/schemas/dictionary.ts`
- Create: `src/lib/schemas/index.ts`
- Test: `src/lib/schemas/post.test.ts`
- Test: `src/lib/schemas/item.test.ts`
- Test: `src/lib/schemas/user.test.ts`
- Test: `src/lib/schemas/tag.test.ts`
- Test: `src/lib/schemas/dictionary.test.ts`

**Interfaces:**

- Consumes: nothing (foundation for every later task in this epic and every future epic that
  touches posts/items/users/tags/i18n).
- Produces: `LocaleSchema`/`Locale`, `PostSchema`/`Post`/`PostTranslation`/`PostAuthor`,
  `ItemSchema`/`Item`/`ItemStatus`/`ItemChannel`/`ItemOwner`, `UserSchema`/`User`,
  `PublicUserSchema`/`PublicUser`, `TagSchema`/`Tag`, `DictionarySchema`/`Dictionary` — all
  re-exported from `src/lib/schemas/index.ts`, importable as `import { PostSchema, type Post }
from '$lib/schemas'`.

Design note carried into every task below: Zod object schemas strip unknown keys by default
(they are not `.strict()`). This is deliberate — `task/mocks/README.md` explicitly allows adding
fields to the mocks later ("Add fields if your design needs them"), and a `.strict()` schema
would throw the whole app into a crash loop the moment a field appears that this epic's schemas
don't yet know about. Silently ignoring genuinely new fields until a later task teaches the
schema about them is the safer failure mode for this project's data source.

- [ ] **Step 1: Install Zod**

Run: `npm install zod`

- [ ] **Step 2: Write the failing schema tests**

```ts
// src/lib/schemas/post.test.ts
import { describe, it, expect } from 'vitest';
import { PostSchema } from './post';

const validPost = {
	id: 'post_000',
	slug: 'sub-second-lcp-on-a-content-site',
	translations: {
		en: { title: 'Title', excerpt: 'Excerpt', body: 'Body' },
		de: { title: 'Titel', excerpt: 'Auszug', body: 'Text' }
	},
	tags: ['performance', 'engineering'],
	author: { id: 'u_omar', name: 'Omar Haddad', avatarColor: '#a855f7' },
	publishedAt: '2026-05-31T00:00:00Z',
	readingTimeMinutes: 3,
	coverColor: '#1e293b'
};

describe('PostSchema', () => {
	it('parses a valid post', () => {
		expect(() => PostSchema.parse(validPost)).not.toThrow();
	});

	it('rejects a post missing the de translation', () => {
		const { de: _de, ...translations } = validPost.translations;
		expect(() => PostSchema.parse({ ...validPost, translations })).toThrow();
	});

	it('rejects a non-ISO publishedAt', () => {
		expect(() => PostSchema.parse({ ...validPost, publishedAt: '31/05/2026' })).toThrow();
	});

	it('rejects a non-positive readingTimeMinutes', () => {
		expect(() => PostSchema.parse({ ...validPost, readingTimeMinutes: 0 })).toThrow();
	});
});
```

```ts
// src/lib/schemas/item.test.ts
import { describe, it, expect } from 'vitest';
import { ItemSchema } from './item';

const validItem = {
	id: 'cmp_0001',
	name: 'Upgrade — GA release #001',
	status: 'completed',
	channel: 'social',
	owner: { id: 'u_priya', name: 'Priya Iyer' },
	budget: 2500,
	spent: 2332.02,
	impressions: 325282,
	clicks: 17467,
	ctr: 0.0537,
	startDate: '2026-04-03',
	endDate: '2026-05-16',
	updatedAt: '2026-04-09T22:00:00Z',
	tags: []
};

describe('ItemSchema', () => {
	it('parses a valid item', () => {
		expect(() => ItemSchema.parse(validItem)).not.toThrow();
	});

	it('rejects an unknown status', () => {
		expect(() => ItemSchema.parse({ ...validItem, status: 'unknown' })).toThrow();
	});

	it('rejects an unknown channel', () => {
		expect(() => ItemSchema.parse({ ...validItem, channel: 'carrier-pigeon' })).toThrow();
	});

	it('rejects a ctr outside 0-1', () => {
		expect(() => ItemSchema.parse({ ...validItem, ctr: 1.5 })).toThrow();
	});

	it('rejects a non-YYYY-MM-DD startDate', () => {
		expect(() => ItemSchema.parse({ ...validItem, startDate: '04/03/2026' })).toThrow();
	});

	it('rejects a negative budget', () => {
		expect(() => ItemSchema.parse({ ...validItem, budget: -1 })).toThrow();
	});
});
```

```ts
// src/lib/schemas/user.test.ts
import { describe, it, expect } from 'vitest';
import { UserSchema, PublicUserSchema } from './user';

const validUser = {
	id: 'demo_admin',
	email: 'admin@demo.test',
	password: 'demo1234',
	name: 'Demo Admin',
	role: 'admin'
};

describe('UserSchema', () => {
	it('parses a valid user', () => {
		expect(() => UserSchema.parse(validUser)).not.toThrow();
	});

	it('rejects an invalid email', () => {
		expect(() => UserSchema.parse({ ...validUser, email: 'not-an-email' })).toThrow();
	});

	it('rejects an unknown role', () => {
		expect(() => UserSchema.parse({ ...validUser, role: 'superadmin' })).toThrow();
	});
});

describe('PublicUserSchema', () => {
	it('strips the password field from a full user object', () => {
		const parsed = PublicUserSchema.parse(validUser);
		expect(parsed).not.toHaveProperty('password');
		expect(parsed.email).toBe('admin@demo.test');
	});
});
```

```ts
// src/lib/schemas/tag.test.ts
import { describe, it, expect } from 'vitest';
import { TagSchema } from './tag';

const validTag = { slug: 'engineering', label: { en: 'Engineering', de: 'Entwicklung' } };

describe('TagSchema', () => {
	it('parses a valid tag', () => {
		expect(() => TagSchema.parse(validTag)).not.toThrow();
	});

	it('rejects a tag missing the de label', () => {
		const { de: _de, ...label } = validTag.label;
		expect(() => TagSchema.parse({ ...validTag, label })).toThrow();
	});
});
```

```ts
// src/lib/schemas/dictionary.test.ts
import { describe, it, expect } from 'vitest';
import { DictionarySchema } from './dictionary';

describe('DictionarySchema', () => {
	it('parses a flat string-to-string record', () => {
		expect(() => DictionarySchema.parse({ 'nav.home': 'Home' })).not.toThrow();
	});

	it('rejects a non-string value', () => {
		expect(() => DictionarySchema.parse({ 'nav.home': 42 })).toThrow();
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/lib/schemas`
Expected: FAIL — none of the schema modules exist yet.

- [ ] **Step 4: Implement the schemas**

```ts
// src/lib/schemas/locale.ts
import { z } from 'zod';

export const LocaleSchema = z.enum(['en', 'de']);
export type Locale = z.infer<typeof LocaleSchema>;
```

```ts
// src/lib/schemas/post.ts
import { z } from 'zod';
import { LocaleSchema } from './locale';

export const PostTranslationSchema = z.object({
	title: z.string(),
	excerpt: z.string(),
	body: z.string()
});
export type PostTranslation = z.infer<typeof PostTranslationSchema>;

export const PostAuthorSchema = z.object({
	id: z.string(),
	name: z.string(),
	avatarColor: z.string()
});
export type PostAuthor = z.infer<typeof PostAuthorSchema>;

export const PostSchema = z.object({
	id: z.string(),
	slug: z.string(),
	translations: z.record(LocaleSchema, PostTranslationSchema),
	tags: z.array(z.string()),
	author: PostAuthorSchema,
	publishedAt: z.iso.datetime(),
	readingTimeMinutes: z.number().int().positive(),
	coverColor: z.string()
});
export type Post = z.infer<typeof PostSchema>;
```

```ts
// src/lib/schemas/item.ts
import { z } from 'zod';

export const ItemStatusSchema = z.enum([
	'draft',
	'scheduled',
	'active',
	'paused',
	'completed',
	'archived'
]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const ItemChannelSchema = z.enum(['email', 'sms', 'web', 'social', 'push']);
export type ItemChannel = z.infer<typeof ItemChannelSchema>;

export const ItemOwnerSchema = z.object({
	id: z.string(),
	name: z.string()
});
export type ItemOwner = z.infer<typeof ItemOwnerSchema>;

export const ItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: ItemStatusSchema,
	channel: ItemChannelSchema,
	owner: ItemOwnerSchema,
	budget: z.number().nonnegative(),
	spent: z.number().nonnegative(),
	impressions: z.number().int().nonnegative(),
	clicks: z.number().int().nonnegative(),
	ctr: z.number().min(0).max(1),
	startDate: z.iso.date(),
	endDate: z.iso.date(),
	updatedAt: z.iso.datetime(),
	tags: z.array(z.string())
});
export type Item = z.infer<typeof ItemSchema>;
```

```ts
// src/lib/schemas/user.ts
import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'editor', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
	id: z.string(),
	email: z.email(),
	password: z.string(),
	name: z.string(),
	role: UserRoleSchema
});
export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.omit({ password: true });
export type PublicUser = z.infer<typeof PublicUserSchema>;
```

```ts
// src/lib/schemas/tag.ts
import { z } from 'zod';
import { LocaleSchema } from './locale';

export const TagSchema = z.object({
	slug: z.string(),
	label: z.record(LocaleSchema, z.string())
});
export type Tag = z.infer<typeof TagSchema>;
```

```ts
// src/lib/schemas/dictionary.ts
import { z } from 'zod';

export const DictionarySchema = z.record(z.string(), z.string());
export type Dictionary = z.infer<typeof DictionarySchema>;
```

```ts
// src/lib/schemas/index.ts
export * from './locale';
export * from './post';
export * from './item';
export * from './user';
export * from './tag';
export * from './dictionary';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- --run src/lib/schemas`
Expected: PASS (18 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/schemas
git commit -m "$(cat <<'EOF'
feat(data): add Zod schemas for Post, Item, User, Tag, Dictionary

Single source of truth mirroring task/mocks/schemas.json exactly -
enum values, field types, and nested shapes all copied verbatim.
PublicUserSchema (User minus password) exists now so the auth epic
has a ready-made client-safe user shape rather than inventing one
under time pressure later. Schemas stay non-strict (unknown keys
silently stripped) since task/mocks/README.md explicitly allows the
mocks to grow new fields - a .strict() schema would crash the whole
app the moment that happens.
EOF
)"
```

---

### Task 2: `users` server data module

**Files:**

- Create: `src/lib/server/data/users.ts`
- Test: `src/lib/server/data/users.test.ts`

**Interfaces:**

- Consumes: `UserSchema`, `User`, `PublicUser` from `$lib/schemas` (Task 1); `task/mocks/users.json`.
- Produces: `findUserByEmail(email: string): User | undefined`, `toPublicUser(user: User):
PublicUser`. Later auth epic imports both — `findUserByEmail` to look up the record during
  login (password included, for the epic's own comparison logic), `toPublicUser` to build the
  session payload that's safe to send to the client.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/server/data/users.test.ts
import { describe, it, expect } from 'vitest';
import { findUserByEmail, toPublicUser } from './users';

describe('findUserByEmail', () => {
	it('finds the admin user by exact email', () => {
		const user = findUserByEmail('admin@demo.test');
		expect(user?.role).toBe('admin');
	});

	it('is case-insensitive', () => {
		const user = findUserByEmail('ADMIN@DEMO.TEST');
		expect(user?.id).toBe('demo_admin');
	});

	it('returns undefined for an unknown email', () => {
		expect(findUserByEmail('nobody@demo.test')).toBeUndefined();
	});
});

describe('toPublicUser', () => {
	it('strips the password field from a real user record', () => {
		const user = findUserByEmail('admin@demo.test');
		if (!user) throw new Error('expected admin@demo.test to exist in the mock data');

		const publicUser = toPublicUser(user);
		expect(publicUser).not.toHaveProperty('password');
		expect(publicUser.email).toBe('admin@demo.test');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/server/data/users.test.ts`
Expected: FAIL — `users.ts` does not exist yet.

- [ ] **Step 3: Implement `users.ts`**

```ts
// src/lib/server/data/users.ts
import { z } from 'zod';
import usersData from '../../../../task/mocks/users.json';
import { UserSchema, type User, type PublicUser } from '$lib/schemas';

const users: User[] = z.array(UserSchema).parse(usersData);

export function findUserByEmail(email: string): User | undefined {
	const needle = email.toLowerCase();
	return users.find((user) => user.email.toLowerCase() === needle);
}

export function toPublicUser(user: User): PublicUser {
	const { password: _password, ...publicUser } = user;
	return publicUser;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/server/data/users.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/data/users.ts src/lib/server/data/users.test.ts
git commit -m "$(cat <<'EOF'
feat(data): add users server data module

Parses task/mocks/users.json through UserSchema once at module load.
findUserByEmail returns the full record (password included) for the
auth epic's own comparison logic; toPublicUser strips it for anything
that reaches the client. Case-insensitive email lookup, since login
forms shouldn't force exact-case matching.
EOF
)"
```

---

### Task 3: `tags` server data module

**Files:**

- Create: `src/lib/server/data/tags.ts`
- Test: `src/lib/server/data/tags.test.ts`

**Interfaces:**

- Consumes: `TagSchema`, `Tag`, `Locale` from `$lib/schemas` (Task 1); `task/mocks/tags.json`.
- Produces: `listTags(locale: Locale): { slug: string; label: string }[]`. Later E6 (search/i18n
  routing) and E5 (blog) consume this for tag filter chips / post metadata.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/server/data/tags.test.ts
import { describe, it, expect } from 'vitest';
import { listTags } from './tags';

describe('listTags', () => {
	it('returns all 8 tags localized to en', () => {
		const result = listTags('en');
		expect(result).toHaveLength(8);
		expect(result.find((tag) => tag.slug === 'engineering')?.label).toBe('Engineering');
	});

	it('localizes labels to de', () => {
		const result = listTags('de');
		expect(result.find((tag) => tag.slug === 'engineering')?.label).toBe('Entwicklung');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/server/data/tags.test.ts`
Expected: FAIL — `tags.ts` does not exist yet.

- [ ] **Step 3: Implement `tags.ts`**

```ts
// src/lib/server/data/tags.ts
import { z } from 'zod';
import tagsData from '../../../../task/mocks/tags.json';
import { TagSchema, type Tag, type Locale } from '$lib/schemas';

const tags: Tag[] = z.array(TagSchema).parse(tagsData);

export interface LocalizedTag {
	slug: string;
	label: string;
}

export function listTags(locale: Locale): LocalizedTag[] {
	return tags.map((tag) => ({ slug: tag.slug, label: tag.label[locale] }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/server/data/tags.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/data/tags.ts src/lib/server/data/tags.test.ts
git commit -m "$(cat <<'EOF'
feat(data): add tags server data module

Parses task/mocks/tags.json through TagSchema once at module load.
listTags(locale) resolves each tag's label to the requested locale -
LocaleSchema's exhaustive-key validation (Task 1) already guarantees
both en and de exist on every tag, so no fallback logic is needed here.
EOF
)"
```

---

### Task 4: `posts` server data module

**Files:**

- Create: `src/lib/server/data/posts.ts`
- Test: `src/lib/server/data/posts.test.ts`

**Interfaces:**

- Consumes: `PostSchema`, `Post`, `Locale` from `$lib/schemas` (Task 1); `task/mocks/posts.json`.
- Produces: `PostSummary` (`{ id, slug, title, excerpt, tags, author, publishedAt,
readingTimeMinutes, coverColor }`), `PostDetail extends PostSummary` (adds `body`),
  `listPosts(locale: Locale): PostSummary[]` (newest-first), `getPostBySlug(slug: string, locale:
Locale): PostDetail | undefined`, `listPostSlugs(): string[]`. Later E5 (public marketing pages)
  uses `listPosts`/`getPostBySlug` for `/blog` and `/blog/[slug]`, and `listPostSlugs` to build
  the `entries()` array SvelteKit's prerenderer needs for the `× {lang}` SSG matrix described in
  the global roadmap.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/server/data/posts.test.ts
import { describe, it, expect } from 'vitest';
import { listPosts, getPostBySlug, listPostSlugs } from './posts';

describe('listPosts', () => {
	it('returns all 20 posts sorted newest-first', () => {
		const result = listPosts('en');
		expect(result).toHaveLength(20);
		for (let i = 1; i < result.length; i++) {
			expect(result[i - 1].publishedAt >= result[i].publishedAt).toBe(true);
		}
	});

	it('resolves titles in the requested locale', () => {
		const en = listPosts('en');
		const de = listPosts('de');
		expect(en[0].title).not.toBe(de[0].title);
	});

	it('omits body from summaries', () => {
		expect(listPosts('en')[0]).not.toHaveProperty('body');
	});
});

describe('getPostBySlug', () => {
	it('returns the full post detail including body, in the requested locale', () => {
		const post = getPostBySlug('sub-second-lcp-on-a-content-site', 'en');
		expect(post?.title).toBe('Sub-second LCP on a content site');
		expect(post?.body).toContain('quietly rebuilding');
	});

	it('returns undefined for an unknown slug', () => {
		expect(getPostBySlug('does-not-exist', 'en')).toBeUndefined();
	});
});

describe('listPostSlugs', () => {
	it('returns all 20 slugs, including known ones', () => {
		const slugs = listPostSlugs();
		expect(slugs).toHaveLength(20);
		expect(slugs).toContain('sub-second-lcp-on-a-content-site');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/server/data/posts.test.ts`
Expected: FAIL — `posts.ts` does not exist yet.

- [ ] **Step 3: Implement `posts.ts`**

```ts
// src/lib/server/data/posts.ts
import { z } from 'zod';
import postsData from '../../../../task/mocks/posts.json';
import { PostSchema, type Post, type Locale } from '$lib/schemas';

const posts: Post[] = z.array(PostSchema).parse(postsData);

export interface PostSummary {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	tags: string[];
	author: Post['author'];
	publishedAt: string;
	readingTimeMinutes: number;
	coverColor: string;
}

export interface PostDetail extends PostSummary {
	body: string;
}

function resolveTranslation(post: Post, locale: Locale) {
	return post.translations[locale] ?? post.translations.en;
}

function toSummary(post: Post, locale: Locale): PostSummary {
	const translation = resolveTranslation(post, locale);
	return {
		id: post.id,
		slug: post.slug,
		title: translation.title,
		excerpt: translation.excerpt,
		tags: post.tags,
		author: post.author,
		publishedAt: post.publishedAt,
		readingTimeMinutes: post.readingTimeMinutes,
		coverColor: post.coverColor
	};
}

export function listPosts(locale: Locale): PostSummary[] {
	return [...posts]
		.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
		.map((post) => toSummary(post, locale));
}

export function getPostBySlug(slug: string, locale: Locale): PostDetail | undefined {
	const post = posts.find((candidate) => candidate.slug === slug);
	if (!post) return undefined;

	const translation = resolveTranslation(post, locale);
	return { ...toSummary(post, locale), body: translation.body };
}

export function listPostSlugs(): string[] {
	return posts.map((post) => post.slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/server/data/posts.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/data/posts.ts src/lib/server/data/posts.test.ts
git commit -m "$(cat <<'EOF'
feat(data): add posts server data module

Parses task/mocks/posts.json through PostSchema once at module load.
listPosts/getPostBySlug flatten translations[locale] into top-level
title/excerpt/body, falling back to en if a locale is ever missing
(defensive - LocaleSchema's exhaustive-key check means this can't
actually happen against real data today, but a schema-conformant mock
edit later could reintroduce the gap). listPostSlugs exists purely to
back the SSG entries() array a later epic's /blog/[slug] route needs.
EOF
)"
```

---

### Task 5: `items` server data module (pagination, filtering, sorting)

**Files:**

- Create: `src/lib/server/data/items.ts`
- Test: `src/lib/server/data/items.test.ts`

**Interfaces:**

- Consumes: `ItemSchema`, `Item`, `ItemStatus`, `ItemChannel` from `$lib/schemas` (Task 1);
  `task/mocks/items.json`.
- Produces: `ListItemsQuery` (`{ page?, pageSize?, status?, channel?, search?, sortBy?,
sortDirection? }`), `ListItemsResult` (`{ items: Item[], total: number, page: number, pageSize:
number }`), `listItems(query?: ListItemsQuery): ListItemsResult`. Later E7 (dashboard items
  table) is the direct consumer — this function's contract IS the dashboard table's server-side
  pagination/sort/filter API, built now against the real 220-row dataset so E7 wires UI against
  a already-proven contract instead of discovering its shape mid-epic.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/server/data/items.test.ts
import { describe, it, expect } from 'vitest';
import { listItems } from './items';

describe('listItems', () => {
	it('defaults to page 1, pageSize 20, sorted by updatedAt desc, total 220', () => {
		const result = listItems();
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(20);
		expect(result.items).toHaveLength(20);
		expect(result.total).toBe(220);
		for (let i = 1; i < result.items.length; i++) {
			expect(result.items[i - 1].updatedAt >= result.items[i].updatedAt).toBe(true);
		}
	});

	it('paginates correctly on page 2', () => {
		const page1 = listItems({ page: 1, pageSize: 10 });
		const page2 = listItems({ page: 2, pageSize: 10 });
		expect(page2.items).toHaveLength(10);
		expect(page1.items[0].id).not.toBe(page2.items[0].id);
	});

	it('returns an empty items array past the last page, but keeps the real total', () => {
		const result = listItems({ page: 999, pageSize: 20 });
		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(220);
	});

	it('filters by status', () => {
		const result = listItems({ status: 'active', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.items.every((item) => item.status === 'active')).toBe(true);
	});

	it('filters by channel', () => {
		const result = listItems({ channel: 'email', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.items.every((item) => item.channel === 'email')).toBe(true);
	});

	it('filters by case-insensitive name search', () => {
		const result = listItems({ search: 'upgrade', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.items.every((item) => item.name.toLowerCase().includes('upgrade'))).toBe(true);
	});

	it('combines status and channel filters', () => {
		const result = listItems({ status: 'completed', channel: 'social', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(
			result.items.every((item) => item.status === 'completed' && item.channel === 'social')
		).toBe(true);
	});

	it('sorts numerically by budget ascending', () => {
		const result = listItems({ sortBy: 'budget', sortDirection: 'asc', pageSize: 220 });
		for (let i = 1; i < result.items.length; i++) {
			expect(result.items[i - 1].budget).toBeLessThanOrEqual(result.items[i].budget);
		}
	});

	it('sorts alphabetically by name descending', () => {
		const result = listItems({ sortBy: 'name', sortDirection: 'desc', pageSize: 220 });
		for (let i = 1; i < result.items.length; i++) {
			expect(result.items[i - 1].name.localeCompare(result.items[i].name)).toBeGreaterThanOrEqual(
				0
			);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/server/data/items.test.ts`
Expected: FAIL — `items.ts` does not exist yet.

- [ ] **Step 3: Implement `items.ts`**

```ts
// src/lib/server/data/items.ts
import { z } from 'zod';
import itemsData from '../../../../task/mocks/items.json';
import { ItemSchema, type Item, type ItemStatus, type ItemChannel } from '$lib/schemas';

const items: Item[] = z.array(ItemSchema).parse(itemsData);

type SortableItemKey =
	| 'name'
	| 'status'
	| 'channel'
	| 'budget'
	| 'spent'
	| 'impressions'
	| 'clicks'
	| 'ctr'
	| 'startDate'
	| 'endDate'
	| 'updatedAt';

export interface ListItemsQuery {
	page?: number;
	pageSize?: number;
	status?: ItemStatus;
	channel?: ItemChannel;
	search?: string;
	sortBy?: SortableItemKey;
	sortDirection?: 'asc' | 'desc';
}

export interface ListItemsResult {
	items: Item[];
	total: number;
	page: number;
	pageSize: number;
}

export function listItems(query: ListItemsQuery = {}): ListItemsResult {
	const {
		page = 1,
		pageSize = 20,
		status,
		channel,
		search,
		sortBy = 'updatedAt',
		sortDirection = 'desc'
	} = query;

	let filtered = items;

	if (status) {
		filtered = filtered.filter((item) => item.status === status);
	}
	if (channel) {
		filtered = filtered.filter((item) => item.channel === channel);
	}
	if (search) {
		const needle = search.toLowerCase();
		filtered = filtered.filter((item) => item.name.toLowerCase().includes(needle));
	}

	const sorted = [...filtered].sort((a, b) => {
		const left = a[sortBy];
		const right = b[sortBy];
		const comparison =
			typeof left === 'number' && typeof right === 'number'
				? left - right
				: String(left).localeCompare(String(right));
		return sortDirection === 'asc' ? comparison : -comparison;
	});

	const total = sorted.length;
	const start = (page - 1) * pageSize;
	const pageItems = sorted.slice(start, start + pageSize);

	return { items: pageItems, total, page, pageSize };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/server/data/items.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/data/items.ts src/lib/server/data/items.test.ts
git commit -m "$(cat <<'EOF'
feat(data): add items server data module with pagination/filter/sort

Parses task/mocks/items.json through ItemSchema once at module load.
listItems() implements exactly the operations task/mocks/README.md
asks for against the flat file: page/pageSize pagination, status and
channel filters, case-insensitive name search, and sort by any
scalar field in either direction. Numeric fields sort numerically;
everything else (including the zero-padded ISO date/datetime strings)
sorts correctly via plain string comparison. total always reflects
the post-filter, pre-pagination count, so a caller can page past the
end and still know how many results existed.
EOF
)"
```

---

### Task 6: i18n dictionary loader

**Files:**

- Create: `src/lib/server/data/i18n.ts`
- Test: `src/lib/server/data/i18n.test.ts`

**Interfaces:**

- Consumes: `DictionarySchema`, `Dictionary`, `Locale` from `$lib/schemas` (Task 1);
  `task/mocks/i18n.en.json`, `task/mocks/i18n.de.json`.
- Produces: `getDictionary(locale: Locale): Dictionary`, `translate(dictionary: Dictionary, key:
string, params?: Record<string, string | number>): string`. Every future page/route that
  renders UI strings goes through this pair rather than hardcoding English text.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/server/data/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { getDictionary, translate } from './i18n';

describe('getDictionary', () => {
	it('returns the en dictionary with expected keys', () => {
		const dict = getDictionary('en');
		expect(dict['nav.home']).toBe('Home');
	});

	it('returns a de dictionary that differs from en', () => {
		const en = getDictionary('en');
		const de = getDictionary('de');
		expect(de['nav.home']).toBeDefined();
		expect(de['nav.home']).not.toBe(en['nav.home']);
	});
});

describe('translate', () => {
	it('returns the template unchanged when there are no params', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'blog.title')).toBe('Writing');
	});

	it('interpolates a single placeholder', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'blog.readingTime', { minutes: 3 })).toBe('3 min read');
	});

	it('interpolates multiple placeholders', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'search.results', { count: 5, query: 'svelte' })).toBe(
			'5 results for "svelte"'
		);
	});

	it('falls back to the key itself when the key is missing', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'does.not.exist')).toBe('does.not.exist');
	});

	it('leaves an unmatched placeholder literal when no param is supplied for it', () => {
		const dict = getDictionary('en');
		expect(translate(dict, 'blog.readingTime', {})).toBe('{minutes} min read');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/lib/server/data/i18n.test.ts`
Expected: FAIL — `i18n.ts` does not exist yet.

- [ ] **Step 3: Implement `i18n.ts`**

```ts
// src/lib/server/data/i18n.ts
import enData from '../../../../task/mocks/i18n.en.json';
import deData from '../../../../task/mocks/i18n.de.json';
import { DictionarySchema, type Dictionary, type Locale } from '$lib/schemas';

const dictionaries: Record<Locale, Dictionary> = {
	en: DictionarySchema.parse(enData),
	de: DictionarySchema.parse(deData)
};

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}

export function translate(
	dictionary: Dictionary,
	key: string,
	params?: Record<string, string | number>
): string {
	const template = dictionary[key];
	if (template === undefined) {
		return key;
	}
	if (!params) return template;

	return template.replace(/\{(\w+)\}/g, (match, paramName: string) => {
		const value = params[paramName];
		return value !== undefined ? String(value) : match;
	});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/lib/server/data/i18n.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/data/i18n.ts src/lib/server/data/i18n.test.ts
git commit -m "$(cat <<'EOF'
feat(data): add i18n dictionary loader with placeholder interpolation

Parses both task/mocks/i18n.{en,de}.json through DictionarySchema
once at module load. translate() does simple {placeholder} -> value
substitution per the mock README's stated convention; a missing key
falls back to rendering the key itself (visible-but-non-fatal) rather
than throwing, and an unmatched placeholder is left literal rather
than silently dropped, so a caller can spot a wiring mistake in the
rendered output instead of it disappearing.
EOF
)"
```

---

### Task 7: Barrel exports and final verification

**Files:**

- Create: `src/lib/server/data/index.ts`

**Interfaces:**

- Consumes: all modules from Tasks 2–6.
- Produces: `$lib/server/data` re-exports so consumers can `import { listItems, findUserByEmail,
listPosts, getPostBySlug, listPostSlugs, listTags, getDictionary, translate } from
'$lib/server/data'`.

No new logic — nothing to TDD here; this is a re-export wiring + whole-suite verification step.

- [ ] **Step 1: Create `src/lib/server/data/index.ts`**

```ts
export * from './users';
export * from './tags';
export * from './posts';
export * from './items';
export * from './i18n';
```

- [ ] **Step 2: Run the full toolchain**

Run: `npm run lint && npm run check && npm run test:unit -- --run && npm run build`

Expected: all green — lint (ESLint + Prettier), `svelte-check` (no `any`/implicit `unknown`
across the 12 new files), the full Vitest suite (46 new tests across Tasks 1–6, on top of Epic
1a's existing 39 — 85 total), and a clean production build. Confirm specifically that none of
`src/lib/server/data/*` is reachable from client-bundled code — if any existing or new file
outside `src/lib/server/` tries to import from it, `svelte-kit sync`/`vite build` fails with
SvelteKit's illegal-import error; a clean build here **is** the proof this epic's server-only
boundary actually holds, not just an assertion in a doc comment.

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/data/index.ts
git commit -m "$(cat <<'EOF'
chore(data): barrel-export the server data modules from \$lib/server/data

users/tags/posts/items/i18n are now importable as one
`import { X } from '\$lib/server/data'` rather than reaching into
individual module paths. A clean build after this change is the real
proof that nothing outside src/lib/server/ ended up depending on
these modules - SvelteKit's illegal-import check would have failed
the build otherwise.
EOF
)"
```

---

## Task coverage check (E2's roadmap scope → task)

| Requirement                                                      | Task |
| ---------------------------------------------------------------- | ---- |
| Zod schemas matching `schemas.json` exactly (Post/Item/User/Tag) | 1    |
| `PublicUser` shape for later auth epic                           | 1    |
| Users lookup (`findUserByEmail`, `toPublicUser`)                 | 2    |
| Tags, locale-resolved                                            | 3    |
| Posts: list, get-by-slug, slugs-for-SSG-`entries()`              | 4    |
| Items: pagination + filter + sort, per `task/mocks/README.md`    | 5    |
| i18n dictionary loader + `{placeholder}` interpolation           | 6    |
| Barrel export + server-only boundary verification                | 7    |
