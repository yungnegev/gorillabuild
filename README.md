# Gorilla Build

Fitness app. Monorepo.

## Stack

| | |
|---|---|
| Runtime | Bun |
| Monorepo | Turborepo |
| Web | Next.js 16, Tailwind CSS 4 |
| Mobile | Expo / React Native |
| Database | Turso (SQLite) + Drizzle ORM |
| Hosting | Vercel |

## Structure

```
apps/
  web/        Next.js app — web, admin, API routes
  mobile/     Expo app
packages/
  shared/     Zod schemas and shared types
  api-client/ Typed fetch wrappers for the API
```

## Getting started

```bash
bun install
bun dev:web
bun dev:mobile
bun dev         # both
```

> Use `bun`. Running `npm install` or `yarn install` will fail.

## Database

```bash
bun db:generate   # generate migrations from schema changes
bun db:migrate    # run migrations locally
bun db:studio     # browse data in Drizzle Studio
```

Schema lives in `apps/web/db/schema.ts`. Migrations run automatically on Vercel deploy.

## Checks

```bash
bun checks   # lint + typecheck + build
```

## Env vars

Copy from Vercel:

```bash
cd apps/web && vercel env pull .env
```
