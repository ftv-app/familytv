# FamilyTV — Project Summary

## Tech Stack

| Layer | Tool | Status |
|-------|------|--------|
| Framework | Next.js 16 (App Router) | ✅ |
| UI | shadcn/ui + Tailwind CSS + TypeScript | ✅ |
| Auth | Clerk (`@clerk/nextjs`) | ✅ |
| Database | Neon Postgres + Drizzle ORM | ✅ |
| Storage | Vercel Blob (`@vercel/blob`) | ✅ |
| Hosting | Vercel | ✅ |

## Project Structure

```
familytv/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (app)/                # Protected routes (require auth)
│   │   │   └── dashboard/        # Dashboard page
│   │   ├── api/                  # API route handlers
│   │   ├── sign-in/              # Clerk sign-in page
│   │   ├── sign-up/              # Clerk sign-up page
│   │   ├── globals.css           # Global styles + Tailwind
│   │   ├── brand.css             # Brand overrides
│   │   ├── layout.tsx            # Root layout (ClerkProvider)
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   └── ui/                   # shadcn/ui components
│   ├── db/
│   │   ├── index.ts              # Drizzle client (Neon)
│   │   └── schema.ts             # Database schema
│   ├── lib/
│   │   └── utils.ts              # shadcn utils
│   └── middleware.ts             # Clerk auth middleware
├── drizzle.config.ts             # Drizzle ORM config
├── next.config.ts                # Next.js config (Clerk + image domains)
├── package.json
├── components.json               # shadcn/ui config
└── tsconfig.json
```

## Database Schema (Drizzle ORM)

- **`families`** — family groups
- **`family_memberships`** — links users to families with roles (owner/member)
- **`invites`** — pending invitations to join a family

## Environment Variables Needed

Sean needs to provide the following (get from the respective dashboards):

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Neon Postgres dashboard (auto-set via Vercel integration) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Set to `/sign-up` |
| `NEXT_PUBLIC_AFTER_SIGN_IN_URL` | Set to `/dashboard` |
| `NEXT_PUBLIC_AFTER_SIGN_UP_URL` | Set to `/dashboard` |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob → API Tokens |

**For local development**, copy `.env.example` to `.env.local` and fill in Clerk keys. Neon DATABASE_URL is usually already set if using Vercel CLI or the integration.

## How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/ftv-app/familytv.git
cd familytv

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Clerk keys

# 4. Push the database schema to Neon
npm run db:push

# 5. Start the dev server
npm run dev

# 6. Open http://localhost:3000
```

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:push      # Push schema to Neon (dev)
npm run db:studio    # Open Drizzle Studio (if available)
npm run lint         # Lint with ESLint
npm run test         # Run tests (Vitest)
```

## Vercel Deployment Notes

- Connect the GitHub repo to Vercel
- Vercel will auto-detect Neon Postgres via the integration
- Add Clerk environment variables in Vercel project settings
- Add `BLOB_READ_WRITE_TOKEN` in Vercel project settings

## Notes

- Auth is handled by Clerk — all protected routes go through `src/middleware.ts`
- The dashboard is at `/dashboard` and requires sign-in
- Media uploads will use Vercel Blob (storage route handler to be built)
- Logging uses `console.log` for now (no external logging service)
- No API keys are hardcoded — everything uses environment variables
