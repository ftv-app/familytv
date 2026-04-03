# FamilyTV Tech Stack & Architecture

## Stack
- Framework: Next.js 16.2.1 + Turbopack
- UI: shadcn/ui v4 + Tailwind CSS v4
- Database: Neon Postgres (raw SQL) via Drizzle ORM
- Auth: Clerk v7 (userId from auth())
- Storage: Vercel Blob (familytv-store, iad1)
- Hosting: Vercel
- Testing: Vitest (unit) + Playwright (E2E)
- Monitoring: Sentry
- CI: GitHub Actions (lint, typecheck, build, test on PR; deploy on merge)

## Architecture Patterns
- DB proxy: db/index.ts using Drizzle with Neon driver
- Family-scoped queries (all access filtered by family_id)
- API routes: src/app/api/<resource>/route.ts
- Tests: src/test/api/<resource>.test.ts
- Auth: Clerk auth() helper in server components/actions
- Private blob proxy: /api/media route with server-side Bearer auth

## Design System (Cinema Black)
Cinema Black #0D0D0F · Velvet Red #C41E3A · Broadcast Gold #D4AF37 · Forest #2D5A4A · Cream #FDF8F3 · Theater Charcoal #1A1A1E
Oswald + Source Sans 3 + JetBrains Mono · Film grain (3-5%)

## Git
Repo: ftv-app/familytv (NOT SeanConway102/FamilyTV)
Branch: master (not main)

## Credentials
1Password: "FamilyTV Ops"
Linear: lin_api_V1K... | Sentry: sntryu_04d... | Vercel/GitHub/Notion: env vars
