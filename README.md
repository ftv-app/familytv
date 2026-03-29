# FamilyTV

> The private place for families to share photos, videos, and calendars.

A privacy-first family social platform. No ads, no algorithms, no strangers — just the people you love, seeing what you share.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Clerk |
| Storage | Vercel Blob |
| Hosting | Vercel |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ftv-app/familytv.git
cd familytv
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — Neon Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    app/                  # Protected app routes (require auth)
    api/                  # API routes
    sign-in/              # Clerk sign-in
    sign-up/              # Clerk sign-up
  components/ui/          # shadcn/ui components
  db/                     # Drizzle schema + db client
  lib/                    # Utilities
src/middleware.ts         # Clerk auth middleware
```

## sprints

Work is organized into 2-week sprints. See [`SPRINT-001.md`](https://github.com/ftv-app/familytv/blob/main/SPRINT-001.md) for the current sprint plan.

- **Sprint 001**: Foundation + Auth MVP (in progress)
- **Sprint 002**: Media sharing (photos/videos)
- **Sprint 003**: Calendar + Events

## Privacy Principles

- All content is family-only by default
- No data sold or used for advertising
- No third-party tracking
- Full family data export at any time
