# FamilyTV Architecture

## Overview

FamilyTV is a private family social media platform built on Next.js 16 (App Router), deployed on Vercel.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS + TypeScript |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Neon Postgres + Drizzle ORM |
| Storage | Vercel Blob (`@vercel/blob`) |
| Hosting | Vercel |
| Observability | **Sentry** (primary) |

---

## Observability Stack

### Primary: Sentry

**Decision (2026-03-30):** Sentry is the primary observability platform for FamilyTV.

Sentry covers the full observability surface needed for a Next.js web app:

| Capability | Sentry Feature |
|-----------|---------------|
| Error tracking | Issues, stack traces, grouped events |
| Crash reporting | Session replays, on-error sampling |
| Performance monitoring | Distributed traces, p95/p99 latency |
| Release health | Crash-free sessions, adoption matrix |
| Frontend profiling | Browser profiling integration |
| Replay on error | Session replays with masked PII |

**Sentry Integration Status:** ✅ Configured (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- DSN via `SENTRY_DSN` env var
- `tracesSampleRate: 0.1` (10% of transactions traced)
- Replays: 10% sessions, 100% on error
- PII masking enabled (maskAllText, blockAllMedia)

### Future Enhancement: Axiom (Log Aggregation)

Sentry does not replace centralized log aggregation. When FamilyTV scales, the following gaps will need Axiom (or similar):

| Gap | Description |
|-----|-------------|
| Structured log aggregation | All `console.log/info/warn/error` from server functions |
| Custom events | Non-error events (uploads, invites sent, calendar events created) |
| Audit logging | Family data access logs for privacy compliance |
| Arbitrary query | ad-hoc queries across logs beyond Sentry's issue-focused UI |
| Long-term retention | Logs beyond Sentry's 90-day window |

**Axiom is not a replacement for Sentry** — it complements it for petabyte-scale log analytics. The two are complementary:
- **Sentry** → errors, performance, crashes, release health
- **Axiom** → raw logs, custom events, audit trails, long-term retention

---

## SRE & Monitoring

### Four Golden Signals

| Signal | How Monitored |
|--------|--------------|
| **Latency** | Sentry Performance (p95/p99 per route) + Vercel Speed Insights |
| **Traffic** | Vercel Analytics dashboard |
| **Errors** | Sentry Issues (5xx, 4xx patterns, Clerk auth failures) |
| **Saturation** | Vercel function execution time + Neon connection pool |

### Service Level Objectives

| Metric | SLO |
|--------|-----|
| Uptime | 99.9% (43.8 min downtime/month max) |
| Page load (p95) | < 2 seconds |
| API Error Rate | < 0.1% of requests return 5xx |
| Media Upload Success | 99.5% complete without retry |
| Auth Reliability | 99.99% sign-in attempts succeed |

### Runbooks (Reference Sentry For)

| Scenario | Sentry Resource |
|---------|----------------|
| Error spike | Sentry Issues → filter by `error.level:error` + time range |
| Slow page loads | Sentry Performance → slow route transactions |
| Crash on user session | Sentry Replays → find affected user session |
| Release regression | Sentry Release Health → crash-free session rate |
| Auth failures | Sentry Issues → filter `Clerk` or `middleware` |
| DB connection failures | Sentry Issues → filter `neon` or `postgres` |
| Blob upload failures | Sentry Issues → filter `blob` or `vercel` |

### Incident Severity

| Severity | Definition | Response |
|----------|------------|----------|
| SEV1 | Platform down, all users affected | Immediate: CEO + Founder notified |
| SEV2 | Major feature broken (uploads, auth) | CEO notified, assigned engineer fixes |
| SEV3 | Degraded performance, minor feature | Logged in Linear, current sprint |
| SEV4 | Cosmetic or low-impact | Backlog |

---

## Data Architecture

### Family-Scoped Access Control

- All data queries are scoped to `family_id` derived from Clerk session
- Row-level security enforced at the ORM/query layer
- Unauthenticated requests rejected by Clerk middleware on all protected routes

### Database (Neon Postgres + Drizzle ORM)

- `families` — family groups
- `family_memberships` — user ↔ family with roles (owner/member)
- `invites` — pending invitations

### Storage (Vercel Blob)

- Media uploads (videos, images) stored in family-scoped buckets
- `BLOB_READ_WRITE_TOKEN` scoped to storage API

---

## Privacy-Specific Considerations

- **PII in logs:** Sentry is configured to mask all text and block media in replays. No PII should appear in Vercel function logs.
- **Data isolation:** Periodic verification that family A cannot access family B data (test in CI).
- **Auth boundary:** All protected routes enforce Clerk session; unauthenticated requests return 401/redirect.
- **Backup verification:** Neon point-in-time recovery tested monthly.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-30 | Sentry as primary observability platform | Covers error tracking, performance, release health in one integration; well-suited for Next.js on Vercel |
