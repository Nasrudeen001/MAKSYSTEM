<!-- Copilot instructions for MAKISYSTEM / MAJLISANSARULLAHLKENYA -->
# Quick Orientation for AI Coding Agents

This concise guide contains the immediate, repo-specific knowledge an AI coding agent needs to be productive.

**High-level architecture**
- Next.js 14 (app-router) TypeScript app. UI lives in `app/` and `components/`. Server logic lives in `app/api/*` route handlers and shared helpers in `lib/`.
- App router pages/components in `app/` are Server Components by default. Add `"use client"` at the top for client components that use hooks, events or DOM APIs.

**Supabase helpers (single source of truth)**
- `lib/supabase/client.ts` — browser client (`createBrowserClient`) used inside client components.
- `lib/supabase/server.ts` — server helper that uses `createServerClient` and `next/headers` cookies (used inside `app/` server components and `app/api/*`).
- `lib/supabase/admin.ts` — admin/service-key client for privileged operations.
Example usages to follow the pattern in repo:
- Client component: `const sb = createClient()` from `lib/supabase/client.ts`.
- Server route: call `createClient()` exported from `lib/supabase/server.ts` inside `app/api/*` route handlers.

**Important security note**
- This repo currently contains hard-coded Supabase keys in `lib/supabase/*.ts`. Never commit new secrets. When rotating keys, update all three helpers together and prefer `process.env`.

**API & server routes**
- All server routes live in `app/api/*` as Next.js Route Handlers. Follow existing pattern: use `NextResponse` and the server `createClient()` (from `lib/supabase/server.ts`) for DB access.

**UI patterns & primitives**
- Reusable primitives live under `components/ui/` (Radix + Tailwind wrappers). Keep new small controls here.
- Utility helpers: `lib/utils.ts` contains `cn()` and other helpers — prefer these over ad-hoc class concatenation.

**Cross-component communication**
- Lightweight app events use `localStorage` + `window` custom events (see `app/settings/page.tsx`). Examples of event names in the repo: `eventSettingsUpdated`, `attendanceUpdated`. Mirror naming and payload shapes when adding events.

**Bundling & heavy libs**
- Heavy browser libs (e.g., `exceljs`) are lazy-loaded at call sites to avoid adding to client bundle. See `lib/excel.ts` which uses `require('exceljs')` inside the export function — follow this pattern for large libs.

**Database migrations & scripts**
- SQL migrations live in `scripts/` and are ordered (01-..). They are intended to be run with `psql` — inspect `scripts/README.md` before executing.

**Developer workflows & commands**
- Typical local commands (see `package.json`):
  - `pnpm dev` — start Next dev server
  - `pnpm build` / `pnpm start` — production build and start
  - `pnpm lint` — run linters
- The repo includes `netlify.toml`; check deployment settings if modifying build outputs.

**Practical editing guidance for agents**
- When changing auth/session flow: update `lib/supabase/server.ts`, `app/login/page.tsx`, and any `app/api/*` route that manipulates sessions — these pieces are tightly coupled.
- To add a new server API: create `app/api/<name>/route.ts` and use `createClient()` from `lib/supabase/server.ts` rather than instantiating Supabase directly.
- To add a new client-heavy feature that uses a large library, import it inside the function that runs client-side (follow `lib/excel.ts`).

**Where to look first (quick file map)**
- App root & layout: `app/layout.tsx`, `app/page.tsx`
- Auth examples: `app/login/page.tsx`
- Server route example: `app/api/report-data/route.ts`
- Supabase helpers: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- Heavy lib pattern: `lib/excel.ts`
- UI primitives: `components/ui/` and top-level components in `components/`

If you'd like, I can:
- Rotate hard-coded Supabase keys into environment variables and update the three helpers accordingly.
- Add a short snippet demonstrating how to convert a server component into a client component.
- Produce a checklist to ensure `exceljs` (or other heavy libs) never land in the client bundle.

Please review and tell me any unclear areas to expand or concrete tasks to implement next.
<!-- Copilot instructions for MAJLISANSARULLAHLKENYA project -->
# Quick Orientation for AI Coding Agents
<!-- Copilot instructions for MAJLISANSARULLAHLKENYA project -->
# Quick Orientation for AI Coding Agents

This file gives the minimal, actionable context to start making safe, focused changes in this repo.

- **High-level architecture**: Next.js 14 (app-router) TypeScript app. UI lives in `app/` and `components/`. Server logic lives in `app/api/*` route handlers and in `lib/` helpers. Database is Supabase.

- **App entry / layout**: `app/layout.tsx` wraps the app (Suspense + Toaster). `app/page.tsx` redirects to `/login` by default — treat `app/` files as server components unless they contain `"use client"`.

- **Supabase helpers** (single source for credentials):
  - `lib/supabase/client.ts` — browser/browser-client usage (`createBrowserClient`).
  - `lib/supabase/server.ts` — server-side route/component usage (`createServerClient`, uses `next/headers` cookies handling).
  - `lib/supabase/admin.ts` — service-key admin client for privileged ops.
  Pattern: client components import from `@/lib/supabase/client`; server handlers and server components import `@/lib/supabase/server`. Replace hard-coded keys with env vars if rotating credentials.

- **API routes**: All route handlers live under `app/api/*` using Next.js Route Handlers (example: `app/api/report-data/route.ts`). Use `NextResponse` and the server `createClient()` helper for DB access.

- **UI & component patterns**:
  - Small primitives live in `components/ui/` (Radix/Tailwind wrappers). Reuse these primitives.
  - Utility `cn()` for class merging is in `lib/utils.ts`.
  - Server components by default; explicitly add `"use client"` for state/hooks/event handlers.

- **Cross-component communication**:
  - Lightweight state uses `localStorage` + `window` events (examples: `eventSettingsUpdated`, `attendanceUpdated` in `app/settings/page.tsx`). Follow existing event naming and payload patterns.

- **Heavy libraries / bundling**: `exceljs` and other heavy libs are lazy-required at call sites to avoid client bundles. See `lib/excel.ts` and `lib/utils.ts` for examples — follow the pattern: require/import inside the function that runs in the browser or in a client component.

- **Migrations & DB scripts**: SQL scripts under `scripts/` (ordered 01-..). Intended to run with `psql`; inspect `scripts/README.md` before running.

- **Developer commands** (npm/pnpm scripts):
  - `pnpm dev` / `npm run dev` — start dev server
  - `pnpm build` / `npm run build` — production build
  - `pnpm start` / `npm run start` — production start
  - `pnpm lint` / `npm run lint` — linting

- **Conventions & gotchas**:
  - Keep `components/ui/` small and reusable.
  - Avoid moving heavy libs to top-level imports in shared client components.
  - Prefer calling server APIs under `app/api/*` for aggregated logic; use browser Supabase client for simple queries in client-only components.
  - Be conservative when changing auth/session code — cookies and `createServerClient` handling are sensitive (see `lib/supabase/server.ts`).

- **Sensitive data**: This repo currently contains hard-coded Supabase keys in `lib/supabase/*.ts`. Do not commit new secrets; prefer `process.env` and update all three helpers when rotating keys.

- **Quick places to inspect for examples**:
  - `app/layout.tsx` — global layout
  - `app/login/page.tsx` — browser Supabase auth usage
  - `app/api/report-data/route.ts` — server route handler pattern
  - `lib/excel.ts`, `lib/utils.ts` — lazy-load/excel export examples
  - `app/settings/page.tsx` — localStorage/window-event patterns and an example of client-heavy logic
  - `scripts/` — DB migration ordering

If you'd like I can (a) remove/rotate hard-coded keys into env variables, (b) add short code snippets for common tasks (e.g., how to switch a component to server/client), or (c) generate a checklist to remove exceljs from initial bundles. Tell me which and I'll update this file.

If any part of this guide is unclear or you want more detailed examples (e.g., a checklist to remove hard-coded keys, or sample patch to convert a page to a client component), tell me which area to expand and I'll iterate.
