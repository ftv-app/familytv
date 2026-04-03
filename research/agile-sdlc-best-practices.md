# Agile SDLC Best Practices — Research Notes
*Owner: CEO/Atlas | Date: 2026-04-01 | Sources: Fullscale.io, GetNerdify, articles.mergify.com, McKinsey 2023 Developer Productivity Report*

---

## Why Agile (The ROI Case)

- **87% of organizations** now use agile (16th State of Agile Report, 2023), up from 71% in 2020
- High-performing agile teams deliver **4.5x faster** than traditional teams (McKinsey 2023)
- Agile reduces rework cost from 15% → 6% of total project cost
- Cost savings of ~$411K and 4.8 months faster on a 12-month waterfall project

**Core principle:** Small, frequent, iterative deliveries beat big, infrequent ones. Every sprint = deployable software.

---

## The 6 Phases of Agile SDLC

### Phase 1: Concept / Initiation
- Define project objectives, success criteria, and measurable business value
- Create a one-page project charter with ROI projections and KPIs
- Identify all stakeholders
- **Time: 5-10% of total project time**
- **Key insight:** Teams that rush this phase face 30% more rework later

### Phase 2: Inception / Planning
- Build comprehensive product backlog (user stories with acceptance criteria)
- Estimate story points using planning poker or t-shirt sizing
- Define sprint structure and capacity
- **Sprint duration guide:**
  - 1 week: maintenance, hotfixes (3-5 developers)
  - 2 weeks: feature development (5-9 developers) ← **FamilyTV standard**
  - 3 weeks: complex integrations (7-11 developers)
- **Capacity rule:** Senior = 1.0 factor, Junior = 0.6 factor

### Phase 3: Iteration / Development
- **Daily standups:** 15 minutes, same time every day
  - What did I do yesterday?
  - What will I do today?
  - Any blockers?
- **Continuous Integration:** Push code daily, not weekly
  - Daily commits reduce integration problems by 75% vs batched commits
- **Pull request reviews within 4 hours** (Fullscale best practice)
- **Definition of Done (must ALL be true):**
  - Code written and reviewed
  - All tests pass (unit + integration)
  - Code merged to main/master
  - Deployed to production or staging
  - Product owner accepts the work

### Phase 4: Testing / QA
- **Shift-left:** Test continuously, not at the end
- **Automation target:** 100% unit tests, 80% integration tests
- **Coverage mandate:** ≥80% code coverage (FamilyTV: ≥97%)
- Testing types and time allocation:
  - Unit Tests: 100% automated, 5% sprint capacity
  - Integration Tests: 80% automated, 8% sprint capacity
  - E2E Tests: 20% manual/automated, 7% sprint capacity

### Phase 5: Release / Deployment
- **CI/CD pipeline:** Every commit to main → automated build → test → deploy
- **Feature flags:** Deploy in "disabled" state, enable selectively
- **Rollback plan:** Must have one-click rollback before any deploy
- **Deployment frequency:** High-performers deploy multiple times per day
- **Monitoring:** Post-deploy metrics, error rates, user feedback

### Phase 6: Maintenance / Retirement
- **80/20 rule:** 80% new features, 20% maintenance + debt payoff
- **Retire ruthlessly:** Dead features cost more to maintain than to remove
- **Technical debt allocation:** Every sprint must pay down some debt

---

## Technical Debt: Prevention and Paydown

### The Boy Scout Rule (Robert C. Martin)
> "Leave the code cleaner than you found it."

Every PR should either:
1. Fix a small bit of debt it encounters, OR
2. Not increase the debt

**Never merge code that introduces new debt.**

### What Counts as Technical Debt
- Deprecated API usage (still works but will break later)
- Duplicate code (copy-paste engineering)
- Missing tests for new code
- Hardcoded values that should be environment variables
- TODO comments left in code
- Unused imports or variables
- Inconsistent naming conventions
- Missing error handling
- Subtle performance regressions
- Anti-patterns (e.g., `any` in TypeScript, `eval`, synchronous XHR)

### Tech Debt Review in Every PR (The Rule)
**Before any PR is approved, tech-lead verifies:**
1. No deprecated APIs or packages used
2. No `TODO` comments introduced
3. No `any` types introduced (TypeScript strict mode)
4. No hardcoded secrets or credentials
5. All new code has tests
6. No commented-out code merged
7. No unused imports
8. CI pipeline passed (tests + linting)
9. Coverage not decreased
10. New dependencies are justified and minimal

### Paydown Strategy
- **Every sprint:** 20% capacity for debt paydown (enforced, not optional)
- **Definition of debt items:** Added to Linear with `tech-debt` label
- **Emergency debt:** If debt causes a production incident, it's P1 next sprint

---

## CI/CD Pipeline (The Non-Negotiable)

### What a Proper Pipeline Does (in order)
1. **Build** — compiles without errors
2. **Test** — unit tests pass
3. **Coverage check** — ≥97% threshold
4. **Lint** — ESLint/Pretteir pass
5. **Security scan** — npm audit, secrets scan
6. **Deploy to staging** — automatic on merge to main
7. **Smoke test** — automated sanity check on staging
8. **Deploy to production** — manual approval gate
9. **Post-deploy verification** — monitoring check

### FamilyTV Pipeline (Current)
See `.github/workflows/deploy-gate.yml` — 6 parallel gates:
- code-quality (lint, typecheck)
- coverage (97% threshold)
- security (npm audit)
- design-review (data-testid check)
- smoke-test (browser test)
- tests (unit + E2E)

All must pass before production deploy.

---

## Sprint Ceremonies (FamilyTV Practice)

### Daily Standup (9 AM UTC)
- 15 minutes max
- What done, what doing, blockers
- Posted to Telegram by automated standup script

### Sprint Planning (Every 6 Hours — AI Velocity)
- 6-hour sprints (not 2 weeks — we're at AI velocity)
- Select highest-priority items from backlog
- Assign to agents
- Define "done" for each

### Sprint Review (End of Sprint)
- Demo what shipped
- Review what didn't
- Adjust next sprint

### Retrospective (Daily evening)
- What went well / what didn't
- One actionable improvement
- Log to `memory/YYYY-MM-DD.md`

---

## Sprint Duration at FamilyTV

Given AI agents + human founder:
- **6 hours per sprint** (not 2 weeks)
- **Continuous delivery** — multiple deploys per day
- **Retrospective:** Daily evening (humans need rest; agents run 24/7)
- **Planning:** Every 6 hours (aligns with human morning/afternoon/evening)

This is unconventional but appropriate for AI-augmented teams. Traditional Scrum was designed for human-only teams with 2-week planning horizons. At AI velocity, 6-hour sprints capture the same planning value without the overhead.

---

## Definition of Done (FamilyTV Standard)

A feature is **done** when ALL of these are true:
- [ ] Code written and reviewed by tech-lead
- [ ] Unit tests: ≥97% coverage, all passing
- [ ] E2E tests written for new UI (data-testid attributes present)
- [ ] Security review passed (OWASP checklist)
- [ ] No deprecated APIs or packages
- [ ] No technical debt introduced (debt audit passed)
- [ ] Merged to master
- [ ] Deployed to production
- [ ] Post-deploy smoke test passed
- [ ] Product owner (founder) accepts

**If it's not deployed, it's not done.**
