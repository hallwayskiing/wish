# AGENTS.md

> Cosmic Wishing Well — React 19 + Cloudflare Workers + D1 + Gemini.

## Commands — run these first

```bash
npm install          # install
npm run check        # tsc --noEmit — must pass
npm run lint         # eslint . — must pass
npm run build        # vite build — must pass
npm run dev          # local dev (Vite + Workers, http://localhost:5173)
npm run db:migrate:local   # apply D1 migrations locally
```

**Done means:** `check + lint + build` green, no edits to shipped `migrations/*.sql`, no `database_id` changes, and no secrets committed.

## Project Map

```
index.html / admin/index.html          # Vite dual entries
src/worker.ts / src/routes.ts          # Worker entry, route dispatch (auth boundary)
src/wishes.ts / src/admin-wishes.ts    # Wish CRUD, blessings, completion
src/model.ts / src/prompt.ts           # Gemini (gemini-flash-lite-latest) + prompts
src/categories.ts / src/site-config.ts / src/types.ts / src/server-messages.ts / src/wish-data.ts
src/client/  { App.tsx, api.ts, poster.ts, translations.ts, components/, admin/, context/, hooks/, styles/ }
migrations/  wrangler.jsonc  vite.config.ts  tsconfig.json
```

## Single Sources of Truth

- Categories: `src/categories.ts` — `CATEGORY_IDS`, `CATEGORY_NAMES`, `getCategory*`, `normalizeCategory`
- Site copy: `src/site-config.ts` + `src/client/translations.ts` — add every user-facing string in both `zh`/`en` there, never hardcode in components
- Types: `src/types.ts` → `src/client/types.ts` is re-export only
- Server errors: `src/server-messages.ts` — all `json({ error })` must use `serverMessage(lang, key)`

## Routing & Data

- `src/worker.ts` only does `ASSETS` fallback + `/api/*` passthrough. Register new APIs in `src/routes.ts` and make auth explicit in `handleAdminRequest` / `handleApiRequest`.
- `migrations/*.sql` are append-only. Never edit shipped files. Read/write only via `WISH_FIELDS` / `parseWishRow` / `serializePlan` in `src/wish-data.ts`.
- `listWishes` (`src/wishes.ts:80`) is the server source of truth for `category / search / status / page / limit`. Do not do full fetch + client-side pagination.

## Security

- Never write `ADMIN_PASSWORD` or Gemini keys to code/logs/output. `ADMIN_PASSWORD` only via `wrangler secret` / `.dev.vars` (gitignored).
- Admin routes must use `isAdminAuthenticated` (`src/admin-auth.ts`, HMAC-SHA256, `HttpOnly; Secure; SameSite=Strict`), fail with `serverMessage('zh','adminLoginRequired')` 401.
- Validate: `title.slice(0,300)`, category allowlist, `MAX_PLAN_LENGTH=100_000`, blessings `0..999999999`.
- SQL only via `bindStatement` — no concatenation. Escape wildcards for `LIKE`.

## Frontend

- `WishWall` must handle `AbortController` cancellation.
- Poster `src/client/poster.ts` — handle `wrapPosterText` for cross-language wrapping and `document.fonts.ready`.
- Dialogs use `useDialogA11y` (`aria-modal`, `data-dialog-close`, `Escape`).

## Workflow

- Prohibited: edit `node_modules/ dist/ .wrangler/`, commit `.dev.vars` / `.DS_Store` / secrets, or run `wrangler deploy` / `db:migrate:remote` without explicit user confirmation.
