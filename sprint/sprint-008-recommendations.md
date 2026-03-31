# Sprint 008 Recommendations — Top 5 Priorities

**Date:** 2026-03-31  
**Strategist:** Research subagent  
**Context:** Sprint 007 shipped P1 contrast/focus/text-sizing fixes, invite flow UI (CTM-205), invite token bug (CTM-220). 15 P1 accessibility tickets remain. Sprint goal is "AI-First Dashboard Foundation." Branch coverage 95.72%, 167 tests.

---

## How These Were Chosen

The sprint-007 plan scoped 6 tickets (25–33h). In 6 hours, the team shipped the P1 contrast/focus/text fixes + invite UI + invite bug fix — excellent velocity. But the audit-gap report shows **15 remaining P1 tickets** and the **AI-First Dashboard paradigm shift (Activity Stories + What's Happening Now)** is the heart of the sprint goal and hasn't shipped yet.

The competitive moat analysis confirms: FamilyTV's advantage is the **TV design system and paradigm**, not calendar/organizer features. The dashboard paradigm shift is not polish — it IS the product identity. Every sprint that ships without it is a sprint spent building a better admin panel instead of a family companion.

---

## Priority 1: Complete P1 Accessibility — Remaining Pages

**What:** Finish the remaining P1 accessibility work from Sprint 007. The gap report identifies:
- Auth pages (sign-in, sign-up) — still using warm terracotta, not WCAG-compliant with Cinema Black
- Onboarding pages (welcome, create-family, invite) — still warm terracotta, first screens new users see
- Settings, profile, notifications pages — not yet Cinema Black
- `#8E8E96` muted silver contrast remaining in several components

**Why:** 
- Contrast, focus, and text sizing shipped — the remaining auth/onboarding pages are P1 because **new users experience these before anything else**
- A family app for grandparents with vision impairment will hit the sign-in page first and potentially abandon if it fails WCAG
- The design brief explicitly calls these out as P1 gaps; the audit confirms they're still open

**Who should build it:** frontend-dev + principal-designer  
**RICE:** Reach(H) / Impact(H) / Confidence(H) / Effort(L) → **High**

---

## Priority 2: Ship Activity Stories Feed — Paradigm Shift (Highest-Impact Feature)

**What:** Replace the Stats cards dashboard view with an Activity Stories chronological feed. Instead of "3 posts this week" as numbers on cards, surface "Sarah shared 4 photos from yesterday," "Tom hasn't posted in 3 weeks," and "Emma's birthday is Saturday." This is the core of the AI-First Dashboard vision.

**Why:**
- The current dashboard is an admin panel. The AI-First vision says this should feel like a **living family wall**, not a control center
- The competitive moat is the TV design paradigm — the Activity Stories feed is the **proof point** of that paradigm
- All 4 competitors (FamilyWall, Cozi, TimeTree, Cluster) show stats or calendars. None show a chronological family story feed. This is the genuine differentiator.
- The invite flow UI just shipped — new families will land on the dashboard; this must feel warm immediately, not like an empty analytics screen

**Who should build it:** frontend-dev + principal-designer (design spec already exists in ai-first-dashboard-vision.md)  
**RICE:** Reach(H) / Impact(H) / Confidence(M) / Effort(M) → **High**

---

## Priority 3: Ship "What's Happening Now" — Proactive Surfacing Layer

**What:** Replace the Quick Actions grid with a "What's Happening Now" proactive surface. This surfaces:
- Recent content from quiet family members (the "Tom hasn't posted in 3 weeks" prompt)
- Upcoming birthdays/events with emotional framing ("Emma's birthday Saturday — send a note?")
- Family TV watch activity ("The Hendersons watched 2 hours together last week")
- "You haven't shared in X days" warm prompt

**Why:**
- AI-first UX means surfacing content before users ask, not waiting for them to navigate
- This is the proactive layer described in the CEO's vision document and directly addresses the "quiet member re-engagement" outcome metric
- The paradigm shift (#2) without this layer would feel incomplete — Activity Stories shows what happened, this shows what matters right now
- Cozi and FamilyWall don't have proactive surfacing; this is a genuine competitive gap we can close

**Who should build it:** frontend-dev (backend-dev for data shaping) + principal-designer  
**RICE:** Reach(M) / Impact(H) / Confidence(M) / Effort(M) → **High**

---

## Priority 4: Remaining P2 Mobile — Hamburger Nav, Tap Targets, Loading States

**What:** Fix the 5 remaining P2 mobile tickets from Sprint 007:
- Mobile hamburger navigation hard to find (#8E8E96 contrast, no text label, blends into dark header)
- Tap targets still at 44px instead of 48px minimum spec (hamburger button, StatCard icons)
- No loading states on Quick Actions (elderly users double-tap and cause duplicate actions)
- Empty state CTA too weak ("Create your family" under a Link, not a primary button)
- Family context unclear for multi-family users

**Why:**
- Multi-generational mobile use is core to FamilyTV's audience (grandparents on phones, parents on desktop)
- Hamburger menu discoverability is ~30% lower among users 55+ per UX research — this is directly blocking the target demographic from using the app
- Without loading states, elderly users create duplicate actions — this is a broken UX for the exact users we claim to serve
- The invite flow just shipped — new families are coming in; mobile onboarding must work flawlessly

**Who should build it:** frontend-dev  
**RICE:** Reach(H) / Impact(H) / Confidence(H) / Effort(L) → **High**

---

## Priority 5: TV-Native Core — Now Playing Bar + Presence Avatars

**What:** Build the foundational TV-native components that make FamilyTV feel like a TV station, not a social feed:
- **Now Playing bar** — persistent bottom bar showing what's currently playing, with presence avatar strip ("Watching with: Grandma June, Tom")
- **LIVE badge component** — animated velvet red dot with "LIVE" label for actively-watched content
- **Presence avatars** — WebSocket-driven online indicators showing which family members are currently watching
- **Video Player screen** — hero video view with broadcast gold family attribution ("Chosen by: Grandma June")

**Why:**
- The sync quality gap is FamilyTV's hardest competitive moat — 8–14 months for a determined competitor to replicate
- The TV design system (presence indicators, Now Playing bar, broadcast attribution) is what makes sync feel like **watching together**, not just **watching simultaneously**
- Without these components, we have a video sync feature. With them, we have a **TV station**. That's the category-defining difference.
- The competitive analysis explicitly calls out "TV channel metaphor" as the cohesive design philosophy competitors cannot easily copy
- The moat analysis shows these are **patent-worthy** UX patterns worth shipping to establish priority

**Who should build it:** frontend-dev + backend-dev (WebSocket/presence) + principal-designer  
**RICE:** Reach(M) / Impact(H) / Confidence(M) / Effort(H) → **Medium-High**

---

## What Was Considered But Not Prioritized

| Option | Why Not #1-5 |
|--------|-------------|
| Emotional Calendar (warm birthdays/events) | Falls under #3 "What's Happening Now" — will be covered there first |
| TV Guide screen | More complex than Now Playing bar; requires schedule data we don't yet have |
| Slideshow builder | P2 feature, requires upload infrastructure first |
| Image lightbox keyboard nav | P2 polish, accessibility but not blocking |
| Landing page carousel + social proof | P3, surface-level polish while deeper product gaps remain |

---

## RICE Summary Table

| # | Priority | Reach | Impact | Confidence | Effort | RICE |
|---|---------|-------|--------|-----------|--------|------|
| 1 | Complete P1 Accessibility (auth/onboarding) | H | H | H | L | **High** |
| 2 | Activity Stories Feed (paradigm shift) | H | H | M | M | **High** |
| 3 | "What's Happening Now" (proactive surfacing) | M | H | M | M | **High** |
| 4 | P2 Mobile fixes (hamburger, tap targets, loading) | H | H | H | L | **High** |
| 5 | TV-Native Core (Now Playing bar + Presence) | M | H | M | H | **Med-High** |

---

*Strategist subagent — Sprint 008 Planning — 2026-03-31*
