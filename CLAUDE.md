# Gorilla Build

Fitness app monorepo. Bun + Turborepo + Next.js + Expo + Turso.

## Structure

```
apps/web        Next.js 16 — web app, /admin, API routes
apps/mobile     Expo / React Native
packages/shared Zod schemas, shared types (raw TS, no build step)
packages/api-client Typed fetch wrappers (raw TS, no build step)
```

## Commands

```bash
bun dev:web       # start web app
bun dev:mobile    # start mobile app
bun checks        # lint + typecheck + build — run before committing
bun db:generate   # generate migrations after schema changes
bun db:migrate    # run migrations
bun db:studio     # Drizzle Studio
```

## Key conventions

- Use `bun` only — `npm`/`yarn` are blocked
- API routes live in `apps/web/app/api/`
- DB schema in `apps/web/db/schema.ts`, client in `apps/web/db/index.ts`
- Shared types go in `packages/shared`, API client methods in `packages/api-client`
- Both packages are consumed as raw TypeScript — no build step needed
- `apps/web` transpiles them via `transpilePackages` in `next.config.ts`
- Env vars live in `apps/web/.env` — pull with `cd apps/web && vercel env pull .env`

## Checks before pushing

```bash
bun checks
```
