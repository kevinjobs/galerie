## Build

After completing any non-trivial modification, ask the user whether to run `bun run build`.

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start dev server on port **9999** |
| `bun run build` | Production build |
| `bun run start` | Start production server on port 9999 |
| `bun run vitest run` | Run full Vitest test suite (use this, not `bun test`) |
| `bun run vitest run test/<file>.test.ts` | Run a single test file |
| `bun run vitest run --grep "AuthTool"` | Run tests matching a describe pattern |
| `bunx prisma migrate dev` | Apply dev DB migrations |
| `bunx prisma generate` | Regenerate Prisma Client |
| `bunx tsx scripts/createSuperuser.ts` | Create superuser from `.env` vars |
| `bun run lint` | ESLint (Next.js core-web-vitals + ts) |

Lint only covers `.next/` etc; no pre-commit hooks or formatter configured.

## Structure

- **Framework**: Next.js 16 (App Router) + React 19, Bun runtime
- **Styling**: Tailwind CSS v4 + HeroUI v3 (beta), forced dark mode via `data-theme="dark"` on `<html>`
- **State**: Jotai (`jotai/utils` `atomWithStorage`) for client state; React Query for server state
- **DB**: Prisma 7 + PostgreSQL; `prisma/lib/db.ts` is the single `PrismaClient` export
- **Auth**: JWT stored in `localStorage` under key `"token"`; all API calls include `Authorization: Bearer <token>` header set manually (no next/auth or middleware)
- **Upload**: Two backends (local server or Tencent COS), configured in `settingAtom`. Source strings stored as `"tencent:<url>"` or `"local:<path>"` — parse via `genSrc()` in `app/api/index.ts`
- **Responsive**: `react-device-detect` (`isMobile`, `BrowserView`, `MobileView`) — not CSS media queries

## Routing

All pages under `app/`. Key entrypoints:

- `/` — landing page with random selected photo cover
- `/hinter` — admin dashboard (auth required via page-level checks)
- `/hinter/photo` — photo list with search/filter, upload button uses `router.push("/hinter/photo/new")`
- `/hinter/photo/[uid]` — photo edit/create page; `uid === "new"` triggers create mode (no API call)
- `/hinter/user` — user management
- `/hinter/setting` — theme/lang/storage settings
- `/map` — photo map view

**Intercepting route (parallel route `@modal`):**

- `app/@modal/(.)hinter/photo/[uid]/page.tsx` intercepts `/hinter/photo/*` client navigations; renders `EditPanel` in a modal; submits call `router.back()` to close
- `app/@modal/default.tsx` returns `null` (no modal for unmatched routes)
- `app/layout.tsx` renders `{children}{modal}`

## Conventions

- All API routes use `_fetch` helper that sets `Content-Type: application/json` and injects the token
- API route params: `uid` in query string (e.g. `/api/photo?uid=xxx`), not path
- DB service layer in `prisma/lib/` — `photoService.ts`, `userService.ts`, `auth.ts`
- Permissions checked server-side via `AuthTool.checkPermission(authHeader, permission)` in each API route
- `EditPanel` receives `photo?: Photo | null` — when `null`, renders in create mode; when populated, in edit mode
- No generated code beyond Prisma Client; no codegen step needed

## Testing

- Vitest with jsdom, `@/` path alias matches Next.js tsconfig
- Test files live in `test/`, not co-located with source
- Mock external services (DB, API calls) in tests — no real network or DB