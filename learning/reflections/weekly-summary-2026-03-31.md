# Weekly Strategy + Toil Review — Tue Mar 31, 2026

## WHAT WAS AUTOMATED
**Pre-commit hook for critical file protection** — Implemented `.git/hooks/pre-commit` that blocks commits attempting to delete critical files: middleware.ts, layout.tsx, page.tsx, next.config.ts, proxy.ts. Also fixed corrupted `core.hooksPath` that was preventing hooks from running.
- Time saved: ~6 min per incident (prevented vs 6 min fix on March 30)
- 2 other automations documented in `automation/todo.md`: auto-sync unpushed commits + auto-fix common test failures

## STRATEGY UPDATE (from competitive scan)

### Top 3 Competitive Findings
1. **"Own the Together"** — FamilyTV synchronized video playback is completely uncontested. No competitor (Google Photos, TimeTree, FamilyWall, Cozi, Cluster) has anything like it. Window is open now.
2. **TimeTree vacuum** — TimeTree pivoted to personal time management (Jan 2026), retreating from family scheduling. Families underserved. Phase 2 TV Guide fills this gap.
3. **Google Photos friction** — QR shared albums (May 2025) is "good enough" for casual sharing. FamilyTV must deliver the emotional experience Google structurally cannot replicate.

### Roadmap Changes
- Phase 2 (TV Guide) prioritized before Phase 3 — urgency from TimeTree retreat
- Multi-channel deferred slightly — window still open, no need to rush
- Phase 4 (PiP/casting) pushed to June — competitive urgency low

### Top Strategic Recommendation
**"Ship the TV Guide before anyone notices the gap."** Sprint 010-011 should prioritize TV Guide + Up Next queue — giving synchronized playback *appointment value*. That's what turns "watching the same video" into "watching our family channel."

## WHAT WAS LEARNED (tech-lead + SRE multi-agent reflection)

### From tech-lead
- Drizzle groupBy workaround (findMany + JS reduce) works but needs a shared aggregation utility before it becomes a pattern
- Pre-deploy smoke tests on critical files would have caught middleware.ts deletion faster
- 3 unpushed commits = unacceptable drift risk — daily push is now a team rule
- QA subagent model validated again: 49 tests fixed in 6 minutes beats marathon review sessions

### From SRE
- 4 mock-related test failures need same-day triage — calling them "mock issues" is an excuse, not a diagnosis
- SLOs defined (99.9% availability, p95 < 2s, <0.1% error rate) but no burn alerts active — targets are wishes without alerting
- Batched 3-feature deploy = blast radius risk — recommend canary gates or phased rollouts next deploy cycle
- Zero SEV1/SEV2 this week is great but also lucky — infrastructure to detect issues needs validating

## NEW LEARNED PRINCIPLES (added to MEMORY.md this session)
4. Pre-commit hooks prevent critical file deletion — middleware.ts incident March 30
5. SLOs without alerting are wishes — must activate burn alerts before trusting SLOs
6. Push daily — 3 unpushed commits is unacceptable drift risk with multi-agent codebase
7. Synchronized playback is uncontested moat — ship TV Guide to give it structure before competitors notice

## CURRENT STATE
- Sprint 009: active, 5 issues in various states
- Tests: 184/188 passing (97.9%) — 4 failing due to mock setup, not regressions
- Prod: TV player + Cinema Black + invite validation deployed ✅
- 3 local commits unpushed (a11y/mobile + research + design specs)
- Competitive analysis: `research/competitive-analysis-2026-03-31.md`
- Automation implemented: `automation/IMPLEMENTED-2026-03-31.md`
