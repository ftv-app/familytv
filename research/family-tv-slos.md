# FamilyTV SLOs, Monitoring Plan & Runbooks

> *Last updated: 2026-03-30 | Owner: SRE*

---

## 1. Service Level Objectives

### 1.1 Availability

**Target: 99.5% uptime per month**

| Period | Max downtime |
|--------|-------------|
| Per day | ~7 min |
| Per week | ~50 min |
| Per month | ~3.6 hours |

**Rationale:** Families use FamilyTV for shared viewing moments — holidays, reunions, weekly catch-ups. Brief interruptions are forgivable; extended outages are not. 99.5% balances reliability with cost of over-engineering for "five nines." Consumer SaaS products (Netflix, Spotify) target 99.9%, but those are global CDN-backed. FamilyTV Phase 1 is edge-deployed; 99.5% is achievable without dedicated redundancy.

**Measurement:** External pinger (Playwright smoke test or Vercel Deployment Checks) hits `/` and `/app` every 5 minutes. 5xx or timeout = downtime event.

**What this covers:** Landing page loads, app loads, WebSocket connection establishment, Clerk auth session validity.
**What this does NOT cover:** Individual family sync sessions (tracked separately via sync-specific SLOs).

---

### 1.2 Latency — Page Load

**Target: p95 page load < 2,000ms**

| Page | p95 Target | Notes |
|------|-----------|-------|
| Landing page (`/`) | 1,500ms | Public, no auth — must be fast for first impressions |
| Dashboard (`/app`) | 2,000ms | Authenticated; data fetch from Neon |
| TV Player (`/app/tv`) | 2,000ms | Player + sync connection init |
| Invite acceptance (`/invite/[token]`) | 1,500ms | Public but must be reliable for new joiners |

**Measurement:** Vercel Speed Insights (Real User Monitoring). Browser SDK captures Core Web Vitals + custom timing marks. Exported to dashboard.

**Alert threshold:** p95 > 2.5s → page latency alert. p95 > 4s → SEV2.

---

### 1.3 Sync Latency — Family TV Playback

**Target: End-to-end sync event < 500ms (p95)**

This is the most critical technical SLO. Per the [sync-latency-research.md](./sync-latency-research.md):

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|-----------|--------------|
| Sync event (broadcaster → all viewers) | <300ms | <500ms | >1,000ms |
| Buffer window | 200–400ms | 400–600ms | >1,000ms |
| Drift before resync offered | — | >10s behind | — |

**What we measure:** WebSocket round-trip time for playback events (play/pause/seek/skip). Server-side timestamp comparison — server receives event at T1, last viewer processes at T2. `syncLatency = T2 - T1`.

**Where data comes from:** Custom instrumentation in the sync server. Every sync event is logged with server-side `eventTime` and client-side `receiptTime` (reported back via acknowledgment message). Stored in Vercel Blob as JSON line logs → scraped into a monitoring dashboard.

**Alert threshold:**
- p95 sync latency > 600ms → warning (watch)
- p95 sync latency > 800ms → SEV3 alert (on-call engineer investigates)
- p95 sync latency > 1,000ms → SEV2 (major desync in production)

**Who gets paged:** On-call engineer (SEV3+). CEO notified on SEV2.

---

### 1.4 API Error Rate

**Target: < 0.1% of API requests return 5xx**

| Error type | SLO | Alert threshold |
|-----------|-----|-----------------|
| 5xx errors | < 0.1% | > 0.25% → warning, > 0.5% → SEV2 |
| 4xx errors | < 2% | > 5% → investigate (potential abuse or broken client) |
| Clerk auth failures | < 0.5% | > 1% → SEV2 (auth is a blocker) |

**Measurement:** Vercel function logs → Sentry. Sentry captures all 5xx from edge functions. Custom dashboard aggregates error rate by route.

**Key API routes monitored:**
- `POST /api/family/create`
- `POST /api/invite/send`
- `GET /api/videos`
- `POST /api/upload`
- `GET /api/family/[id]`
- WebSocket `/api/sync` (sync server)

---

### 1.5 Upload Success Rate

**Target: 99.5% of video uploads complete without retry**

Video uploads go through Vercel Blob. Large file uploads are chunked.

| Phase | Failure mode | SLO covers it? |
|-------|-------------|----------------|
| Chunk upload to Blob | Network drop, Blob 5xx | YES |
| Multipart completion | Incomplete assembly | YES |
| Thumbnail generation | Async job failure | Partial (retry up to 3x) |
| Metadata DB write | Neon connection failure | YES |

**Measurement:** Upload API (`POST /api/upload`) tracks success/failure per upload session. Success = HTTP 200 returned. Failure = 5xx or client-side abort after 3 retries.

**Alert threshold:**
- Upload success rate < 99.0% → warning
- Upload success rate < 98.0% → SEV3
- Upload success rate < 95.0% → SEV2

**Who gets paged:** On-call (SEV3+). CEO on SEV2.

---

## 2. Four Golden Signals — Monitoring Plan

### Signal 1: LATENCY

**What we measure:**
- Page load time (p50, p95, p99) per route — from Vercel Speed Insights
- WebSocket sync event latency (p50, p95, p99) — from custom sync server logs
- Time to first byte (TTFB) for API routes — from Vercel function logs
- Clerk authentication round-trip time — from custom instrumentation

**Where data comes from:**
- **Vercel Speed Insights** → Core Web Vitals dashboard (built-in)
- **Custom sync server logs** → JSON lines in Vercel Blob → scraped to Grafana or Datadog (or exported as CSV for manual review)
- **Sentry** → TTFB for API routes with custom `performance.mark()` instrumentation

**Alert thresholds:**

| Signal | Warning | SEV3 | SEV2 |
|--------|---------|------|------|
| Page load p95 | >2.0s | >3.0s | >4.0s |
| Sync latency p95 | >500ms | >600ms | >800ms |
| API route p95 | >1.0s | >2.0s | >3.0s |
| Clerk auth p95 | >2.0s | >3.0s | >5.0s |

**Who gets paged:** On-call engineer for SEV3+. CEO for SEV2.

---

### Signal 2: TRAFFIC

**What we measure:**
- Requests per second (RPS) per route — from Vercel function logs
- Concurrent WebSocket connections per family channel — from sync server
- Active families per time window — from Neon query (count of distinct family_ids with active sessions)
- Upload volume (uploads/hour) — from upload API logs

**Where data comes from:**
- **Vercel Analytics** → built-in traffic dashboard (requests, unique visitors)
- **Sync server** → live connection count emitted as a metric (increment on connect, decrement on disconnect) to Vercel Blob → polled by Grafana webhook
- **Neon** → `SELECT count(distinct family_id) FROM sessions WHERE last_seen > now() - interval '5 minutes'`

**Alert thresholds:**

| Signal | Warning | SEV3 |
|--------|---------|------|
| RPS drop >50% vs. same hour yesterday | Investigate | — |
| RPS spike >5x baseline | Potential abuse or DoS | SEV3 |
| Concurrent WS connections per family >50 | Investigate (likely abuse) | SEV3 |
| Active families drops to 0 (during peak hours) | SEV2 | — |

**Who gets paged:** On-call for SEV3+. CEO for SEV2.

---

### Signal 3: ERRORS

**What we measure:**
- HTTP 5xx rate per route — from Sentry + Vercel logs
- HTTP 4xx rate per route — from Vercel logs (for abuse detection)
- Clerk authentication failure rate — from custom instrumentation
- Neon DB connection failures — from Sentry
- Vercel Blob upload failures — from upload API logs
- Sync server crashes/disconnects — from sync server process manager
- Unhandled JS exceptions — from Sentry (browser SDK)

**Where data comes from:**
- **Sentry** → error tracking, source maps loaded, alerts configured
- **Vercel Logs** → function execution logs, 5xx/4xx rates
- **Custom upload logger** → writes to Vercel Blob `/logs/uploads/`

**Alert thresholds:**

| Error type | Warning | SEV3 | SEV2 |
|-----------|---------|------|------|
| 5xx rate | >0.1% | >0.25% | >0.5% |
| Clerk auth failures | >0.5% | >1.0% | >2.0% |
| DB connection failures | Any | >1/min | >5/min |
| Upload failures | >1% | >2% | >5% |
| Unhandled exceptions | Any | >5/min | >10/min |

**Who gets paged:** On-call for SEV3+. CEO + Founder for SEV1 (platform down, all users affected).

**SEV1 definition:** Platform completely down (landing page returns 5xx, or auth completely broken, or data loss risk). CEO + Founder notified immediately. All hands.

---

### Signal 4: SATURATION

**What we measure:**
- Vercel function execution time (avg, p95) — from Vercel Analytics
- Vercel function memory usage — from Vercel dashboard
- Neon connection pool usage — from Neon console or `pg_pool_stats` query
- Blob storage usage (total bytes stored per family) — from Vercel Blob API
- WebSocket connection limit per sync server instance — from sync server

**Where data comes from:**
- **Vercel Analytics** → execution time, memory
- **Neon console** → connection pool (visible in dashboard, no API)
- **Vercel Blob API** → `HEAD /v1/blob/familytv` for total usage
- **Sync server process** → Prometheus-compatible `/metrics` endpoint

**Alert thresholds:**

| Resource | Warning | SEV3 | SEV2 |
|---------|---------|------|------|
| Function execution p95 | >5,000ms | >8,000ms | >10,000ms (timeout) |
| Function memory | >512MB | >700MB | >900MB (near limit) |
| Neon connections | >70% pool | >85% pool | >95% pool (exhaustion risk) |
| Blob storage | >80% of plan limit | >90% | >95% |
| WS connections/server | >500 | >700 | >900 (hard limit) |

**Who gets paged:** On-call for SEV3+. CEO for SEV2.

---

## 3. Runbooks

---

### Runbook 1: Family TV Sync Session Crashes / Desyncs

**Problem:** Family members are experiencing desynchronized playback, sync events taking >1 second, or WebSocket connections dropping during active Family TV sessions.

**Severity:** SEV2 (major feature broken for active users) or SEV3 (degraded).

---

#### DETECTION

**Automated alert triggers:**
- `sync_latency_p95 > 800ms` → SEV2 auto-alert (PagerDuty → on-call + CEO)
- `sync_latency_p95 > 600ms` → SEV3 warning (Slack #alerts → on-call)

**Manual detection:**
- Users report in Slack/Telegram: "Family TV is out of sync"
- CEO forwards user complaint → on-call investigates

**First check:** Open Vercel Logs → filter to `/api/sync` route → look for WebSocket disconnect events (`ws_disconnect`, `ws_error`).

---

#### TRIAGE

1. **Identify scope:** How many families are affected?
   ```bash
   # Query sync server logs in Vercel Blob for recent disconnect events
   # Look for: ws_disconnect, sync_timeout, drift_exceeded
   grep -c "drift_exceeded" /logs/sync/$(date +%Y%m%d).jsonl
   ```

2. **Check sync server health:**
   - Is the sync server process running? Check Vercel function status for `/api/sync`
   - Any recent deploys that changed sync logic? Check Vercel Deployments
   - Memory/CPU saturation? Check Vercel Analytics → function metrics

3. **Check geographic latency:**
   - Are affected users in a specific region?
   - If using Vercel Edge, check if a specific edge PoP is having issues
   - Run: check the sync server logs for RTT per client region

4. **Classify:**
   - **Single family affected** → likely a client-side issue (bad network, old app version). Close as SEV3, notify CEO, help family refresh their session.
   - **Multiple families in same region** → likely edge infrastructure issue. Escalate to SEV2.
   - **All families affected** → likely sync server bug or crash. Escalate to SEV2, CEO notified.

---

#### MITIGATION

**For SEV2 (multiple families):**

1. **If sync server is crashing:** Rollback to previous deployment
   ```bash
   vercel rollback --token=$VERCEL_TOKEN
   ```
   Monitor for 5 minutes. If rolling back fixes it, the last deploy is the culprit.

2. **If sync server is running but slow:** Scale up (if possible via Vercel) or restart the sync server function
   ```bash
   # Force a new instance by touching the deployment
   vercel deploy --prod --token=$VERCEL_TOKEN  # redeploy current
   ```

3. **If it's a WebSocket connection limit issue:** Check if any single family has >50 concurrent WS connections (abuse or reconnect loop). Block offending IPs at the Vercel edge config level.

4. **Notify affected families:** Post in-app notification: "Family TV is experiencing sync issues — our team is investigating. Refreshing the page may help."

5. **For affected families who cannot refresh:** Guide them to close and reopen the app.

---

#### RESOLUTION

1. **Root cause identified?** Write a brief postmortem (within 24h for SEV2).

2. **If deploy-related:** Add a regression test to the CI pipeline that runs a sync round-trip latency check against a staging environment.

3. **If infrastructure-related:** Add auto-scaling configuration or move to a higher-capacity plan.

4. **If code bug:** Fix in `src/lib/sync-server.ts` (or equivalent), write a unit test that reproduces the bug scenario, deploy to preview, verify, then deploy to prod.

5. **Close the loop:** Notify CEO + affected families that the issue is resolved.

---

### Runbook 2: Invite Flow Broken (Users Can't Join)

**Problem:** New family members cannot accept invitations. Invite links return errors, or invitations silently fail to send.

**Severity:** SEV2 if NO new users can join. SEV3 if intermittent.

---

#### DETECTION

**Automated alert triggers:**
- `POST /api/invite/send` error rate > 1% → SEV3 warning
- `GET /api/invite/[token]` returning 4xx/5xx rate > 1% → SEV3 warning
- Any SEV1-level auth failure spike may also manifest here

**Manual detection:**
- CEO forwards user complaint: "I can't join my family's FamilyTV"
- Support channel reports multiple invite failures

**First check:**
```bash
# Check Vercel Logs for /api/invite errors
grep "invite" vercel-logs.json | grep -E "(5xx|error|invalid|expired)"
```

---

#### TRIAGE

1. **Identify where the invite flow breaks:**
   - Can the inviter send the invite? (`POST /api/invite/send` — check logs)
   - Does the invite token generate correctly? (Check Neon `invites` table: `SELECT * FROM invites WHERE created_at > now() - interval '1 hour'`)
   - Does the invite acceptance page load? (`GET /api/invite/[token]`)
   - Does the invite acceptance create the family membership? (`POST /api/invite/accept`)

2. **Check common failure modes:**

   **a) Clerk user creation fails** — new user cannot be provisioned:
   - Check Sentry for Clerk webhook errors
   - Check Clerk dashboard for API rate limits or errors

   **b) Invite token expired or malformed** — tokens expire after 7 days by default
   - Check Neon: `SELECT token, expires_at, accepted FROM invites ORDER BY created_at DESC LIMIT 20;`
   - If tokens are expired before 7 days → code bug in token generation
   - If tokens are used already → user may be trying to accept twice

   **c) Family membership write fails** — user authenticated but can't be added:
   - Check Neon `family_members` table for constraint violations
   - Check if user is already a member (unique constraint on `user_id + family_id`)

   **d) Email/notification delivery fails** — invite email doesn't arrive:
   - Check Resend (or email provider) for bounce rates
   - User's spam folder first!

3. **Classify:**
   - **Single user affected** → likely user-side issue (wrong email, spam). SEV4.
   - **All new invitees in one family** → family-level config issue. SEV3.
   - **All new invitees platform-wide** → invite flow broken for everyone. SEV2.

---

#### MITIGATION

**For SEV2 (platform-wide invite failure):**

1. **Rollback if recent deploy touched invite logic:**
   ```bash
   vercel rollback --token=$VERCEL_TOKEN
   ```

2. **If Clerk is the issue:**
   - Check Clerk status page: https://status.clerk.dev
   - If Clerk outage: notify CEO + users (in-app banner), wait for Clerk to restore
   - Document in postmortem: invite flow is Clerk-dependent; add to provider status monitoring

3. **If Neon DB is the issue:**
   - Check Neon connection pool (max 10 connections on starter plan)
   - If pool exhausted: scale the Neon plan or reduce connection reuse
   - Restart the Vercel function to clear stale connections

4. **Temporary workaround:** Family admin can manually add members via a direct DB write (backend-dev only, with CEO approval):
   ```sql
   INSERT INTO family_members (family_id, user_id, role, joined_at)
   VALUES ($1, $2, 'member', NOW());
   ```

---

#### RESOLUTION

1. **Fix the broken step** in the invite flow (typically in `src/app/api/invite/`).

2. **Add regression tests:**
   - Unit test: invite token generates correctly and validates
   - Integration test: full invite flow with mock Clerk + Neon
   - E2E test: invite flow with Playwright (use a test family + test email)

3. **Add monitoring:** Alert on `invite_flow_error_rate > 1%` (SEV3).

4. **Notify CEO** when resolved.

---

### Runbook 3: Media Upload Fails for All Users

**Problem:** All video uploads fail. Users see upload progress bar reset repeatedly or get immediate error. This is a critical revenue/retention event — uploads are the core value action.

**Severity:** SEV2 if all uploads fail. SEV3 if partial.

---

#### DETECTION

**Automated alert triggers:**
- Upload success rate < 98% → SEV3 warning
- Upload success rate < 95% → SEV2 alert
- `POST /api/upload` returning 5xx rate > 0.5% → SEV2

**Manual detection:**
- CEO forwards user complaints: "Can't upload videos"
- Playwright smoke test fails on upload step

**First check:**
```bash
# Check Vercel function logs for upload errors
grep "upload" vercel-logs.json | grep -E "(5xx|error|timeout|413|429)"
```

---

#### TRIAGE

1. **Identify the failure point:**

   **a) Client → Vercel (upload API)** — request never arrives:
   - Check Vercel edge function logs for `POST /api/upload`
   - Is the API route crashing? Check Sentry

   **b) Vercel → Vercel Blob** — API can't reach storage:
   - Check Vercel Blob status: https://status.vercel.com
   - Check Blob quota: `vercel blob ls` (CLI) or API `HEAD /v1/blob/familytv`
   - Are we hitting storage limits?

   **c) Upload size limit exceeded** — uploads > 50MB (Vercel Blob limit for single request):
   - This would manifest as 413 errors
   - Check: is this a single large upload or all uploads?

   **d) Neon DB write fails** — video metadata can't be saved:
   - Check Sentry for Neon connection errors
   - Check Neon console for connection pool exhaustion

   **e) Thumbnail/transcoding job fails** — async job system (future) is down:
   - Check if thumbnail service is running
   - For Phase 1, thumbnails are generated client-side (no server dependency)

2. **Check external dependencies:**
   - Vercel Blob status: https://status.vercel.com
   - Vercel Functions: https://status.vercel.com
   - Neon status: https://status.neon.tech

3. **Classify:**
   - **Vercel Blob outage** → SEV1 (CEO + Founder immediately). Entire product is down for uploads. Consider directing users to file a support ticket with Vercel.
   - **Storage quota hit** → SEV2. Need to either upgrade plan or implement cleanup (delete old/duplicate videos).
   - **Neon DB issue** → SEV2. Uploads succeed to Blob but metadata write fails → orphaned files.

---

#### MITIGATION

**For SEV2 (upload broken, not a full platform outage):**

1. **If Vercel Blob is returning 5xx:**
   - Check Vercel status page
   - If it's a Vercel-side incident: notify CEO, post in-app banner "Upload temporarily unavailable — we're working on it"
   - No internal action can fix a Vercel Blob outage — wait and verify

2. **If Blob quota is hit:**
   - Emergency: identify and soft-delete orphaned uploads (videos with no family_id, test uploads >30 days old)
   - Run: `SELECT id, created_at, size FROM videos ORDER BY created_at ASC LIMIT 50;`
   - Implement a cleanup script for orphaned uploads (automate for future)
   - Notify CEO — plan upgrade or family storage limits needed

3. **If Neon DB write fails:**
   - Check connection pool: `SHOW STATS;` in Neon SQL editor
   - If pool exhausted: reduce connection reuse in `src/lib/db.ts`, restart function instances
   - If pool fine but writes fail: check for constraint violations or deadlocks

4. **If Vercel function is crashing on upload:**
   - Rollback: `vercel rollback --token=$VERCEL_TOKEN`
   - This is the most common self-inflicted upload failure — a bad deploy

5. **User workaround:** Tell CEO to relay: "If you have a small video, try from a web browser rather than mobile app." (Web uploads may use a different code path.)

---

#### RESOLUTION

1. **Root cause identified?** Document. If Vercel Blob was down — note it as an external dependency incident.

2. **If quota was the issue:**
   - Implement storage quotas per family in the database
   - Add storage usage to the family dashboard (family admin sees it)
   - Set up an alert when total Blob usage > 80% of plan limit

3. **Add upload monitoring:**
   - Alert when `upload_success_rate < 99%` (SEV3 warning)
   - Track orphaned uploads (Blob files with no matching DB record) and alert on spike

4. **Add regression tests for upload:**
   - Unit test: file size validation
   - Integration test: upload flow with mocked Blob
   - E2E test: full upload with Playwright (test file in `e2e/fixtures/`)

5. **Postmortem** (within 24h for SEV2). Include: timeline, root cause, impact (how many uploads failed), action items.

---

## Appendix: Error Budget Policy

**Monthly error budget** = time the system can be unavailable or degraded without breaching SLOs.

| SLO | Monthly budget |
|-----|---------------|
| Availability 99.5% | 3.6 hours downtime |
| API error rate 0.1% | 43 minutes of errored requests |
| Upload success 99.5% | 3.6 hours of failed uploads |

**When error budget is >50% burned in a month:**
- CEO notified. Feature freeze considered.
- All-hands reliability focus.

**When error budget is >80% burned:**
- Feature freeze. All resources go to reliability.
- No new deploys except security patches.

**This policy is non-negotiable.** Families depend on us. We protect reliability before shipping new features.

---

*Document version: 1.0 | Last updated: 2026-03-30 | Owner: SRE*
