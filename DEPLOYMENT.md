# Cosmic Wishing Well · Deployment Guide

This document is for deployment and operations. It covers local development, first-time deployment to Cloudflare, and subsequent releases.

## Architecture

- **Single Cloudflare Worker** serves everything: `Vite` build output is hosted as `Static Assets`, `/api/*` is handled by `src/worker.ts`.
- **Data**: Cloudflare D1 (`wish-realizer-db`), migrations live in `migrations/`.
- **Model**: Google Gemini (`gemini-flash-lite-latest`). The API key is entered by the user in the browser and never persisted on the server.
- **Admin**: Protected by Worker Secret `ADMIN_PASSWORD`. Sessions are `HttpOnly` cookies signed with `HMAC-SHA256`.

## Prerequisites

- Node.js >= 18
- Cloudflare account (free tier is enough)
- Google Gemini API key (for end users or for local testing)

## Local Development

```bash
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set ADMIN_PASSWORD for local use only
npm run db:migrate:local
npm run dev
```

`npm run dev` starts both the frontend and the Worker via `@cloudflare/vite-plugin`. Open the `http://localhost:5173` URL printed in the terminal. API and pages are same-origin, no proxy needed.

Common scripts:

| Command | Description |
|---|---|
| `npm run dev` | Local development (Vite + Cloudflare Workers) |
| `npm run build` | Production build (outputs `dist/client` and `dist/wish_realizer`) |
| `npm run check` | Type checking with `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate:local` | Apply D1 migrations locally |
| `npm run db:migrate:remote` | Apply D1 migrations remotely |
| `npm run deploy` | Deploy the existing production build to Cloudflare |
| `npm run release` | Build, apply pending remote D1 migrations, and deploy to Cloudflare |

## First Deployment to Cloudflare

```bash
npx wrangler login
npx wrangler secret put ADMIN_PASSWORD
npm run release
```

Notes:

1. The first `wrangler deploy` creates and binds the D1 database automatically based on `wrangler.jsonc`.
2. `ADMIN_PASSWORD` must be set via `wrangler secret put`. Never put it in `wrangler.jsonc` or commit `.dev.vars`.
3. After migrations, open the `*.workers.dev` URL from the deploy output — that is your live site.
4. To use a custom domain, bind it to the Worker in the Cloudflare Dashboard.

## Continuous Deployment with GitHub Actions

Every push to `main` runs:

```text
npm ci -> npm run check -> npm run lint -> npm run release
```

Required GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with Workers and D1 access for the same account

The `production` job is serialized and has a 15-minute timeout. Set `ADMIN_PASSWORD` separately with `wrangler secret put`.

## Subsequent Releases

Push to `main` for CI deployment, or release manually from an authenticated environment:

```bash
git push origin main
npm run release
```

Apply operations independently only when needed:

```bash
npx wrangler secret put ADMIN_PASSWORD
npm run db:migrate:remote
```

## Environment Variables & Secrets

| Name | Location | Required | Description |
|---|---|---|---|
| `ADMIN_PASSWORD` | `wrangler secret` / `.dev.vars` (local only) | Yes | Admin password. Must be a Secret in production |
| `DB` | `wrangler.jsonc` `d1_databases` | Yes | Pre-configured as `wish-realizer-db`. Do not change `database_id` manually |
| `ASSETS` | Auto-bound by Cloudflare | Yes | Static assets binding. `run_worker_first: ["/api/*"]` ensures API routes take precedence |
| Gemini API Key | Browser `localStorage` (`gemini_api_key`) | User-side | Entered via the "Google API" dialog in the UI. Never stored in D1 |

> `GEMINI_API_KEY` in `src/types.ts` is reserved. Current model calls prefer the user-supplied `customApiKey`.

## Rollback & Troubleshooting

- **Rollback**: Use Dashboard -> Workers -> `wish-realizer` -> Deployments. Source rollback (`npm run build && npm run deploy`) must remain schema-compatible and does not reverse D1 migrations.
- **Logs**: `wrangler.jsonc` has `observability.enabled`. View live logs in Dashboard -> Workers -> Logs. Local logs are in `.wrangler/`.
- **Common issues**:
  - `ASSETS binding unavailable`: Worker was started without `vite`. Use `npm run dev`.
  - `adminPasswordMissing (503)`: `ADMIN_PASSWORD` not set. Run `secret put` again.
  - `noApiKey`: User has not configured a Gemini key in the frontend. Ask them to click "Google API" in the header.

## Project Map

- `src/worker.ts`: Worker entry and static asset fallback
- `src/routes.ts`: API routing and auth dispatch
- `src/wishes.ts` / `src/admin-wishes.ts`: Wish CRUD, blessings, completion state
- `src/model.ts` / `src/prompt.ts`: Gemini client and prompts
- `src/client/`: React frontend (`index.html` + `admin/index.html` as dual entries)
- `migrations/`: D1 migrations (executed in order, never edit a shipped migration)
- `vite.config.ts` / `wrangler.jsonc` / `tsconfig.json` / `eslint.config.js`: Build and lint config

For contribution guidelines see [AGENTS.md](./AGENTS.md). For a human-facing overview see [README.md](./README.md).
