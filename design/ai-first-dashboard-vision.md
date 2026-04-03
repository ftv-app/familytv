# FamilyTV: The Case for Wholesale Dashboard Redesign
**Type:** Strategic Design Brief
**From:** Atlas (CEO)
**Date:** 2026-03-31
**Status:** Vision — inform Sprint 007 planning

---

## The Core Question

Is the current dashboard a good foundation that needs accessibility patches? Or is it the wrong paradigm entirely?

After research, the answer is: **it's the wrong paradigm for what FamilyTV is becoming.**

The current dashboard is an **admin panel** — it shows stats, has quick action links, displays a family selector. It's designed around the concept of "user manages family." But FamilyTV's emotional core is **"being together despite distance."** The dashboard should feel like a **living family wall** — not a control panel.

---

## What the Research Says

### AI-First UX (Medium/Design Bootcamp, 2025)
AI-first design means the interface adapts to the user, not the other way around:
- **Proactive assistance** — surface content before users ask
- **Context-aware personalization** — time of day, who's in the family, what matters right now
- **Outcome-driven over feature-driven** — stop showing features, start showing outcomes

### Ambient Personalization (UXMate, 2025)
The best interfaces of 2025 feel like "context-aware companions":
- They adapt to time, place, and emotional state
- They surface what's relevant RIGHT NOW without navigation
- **Reference:** Spotify Daylist — it "gets" you. The app feels alive.

### Emotional UX (Cristian Doniu, 2025)
The frontier of UX is no longer speed or minimalism — it's **emotional resonance**:
- Interfaces that feel like companions, not tools
- Digital Twin interfaces — the app as an extension of the family unit
- "The app knows who's missing, what's coming up, who hasn't been seen in a while"

### Family-Specific Research (ACM CHI)
Current efficiency-oriented household tech fails because it ignores **relational dynamics** — family apps work when they strengthen relationships, not just coordinate logistics.

---

## What This Means for FamilyTV

### The Dashboard Should Feel Like:

**NOT THIS (current):**
- "3 posts this week" — stats for the admin
- "Invite a member" — administrative task
- Quick action grid — feature checklist
- "Good evening, {name}" — time-based greeting

**THIS:**
- **"Sarah shared 4 photos from yesterday"** — who did what for whom
- **"Tom hasn't posted in 3 weeks"** — gentle reminder of a quiet family member
- **"Emma's birthday is Saturday"** — emotional calendar context
- **"Your family watched 2 hours of Family TV together last week"** — togetherness metric, not content metric

### The Paradigm Shift

| Old Paradigm (Admin Panel) | New Paradigm (Family Companion) |
|---------------------------|----------------------------------|
| User-centric | **Family**-centric |
| Stats and metrics | **Stories and moments** |
| Quick actions | **Proactive surfacing** |
| Feature navigation | **Outcome-first** |
| Signed-in state | **Living presence** |

### Specific Wholesale Changes Needed

#### 1. Replace "Stats" with "Activity Stories"
Current: "3 posts this week" as numbers on cards.
New: A chronological story feed showing WHO posted WHAT and for WHOM, with gentle reminders about quiet members.

#### 2. Proactive Content Surfacing
The dashboard should surface:
- Recent photos from family members who haven't been active recently
- Upcoming birthdays/events that need attention
- "You haven't shared in X days" (warm, not naggy)
- Family TV watch history — who's watching what

#### 3. Ambient Design — The App Feels "On"
- Dark mode that shifts warmer in evening hours (like candlelight — research from UXMate)
- The landing page already has film grain and Cinema Black — carry that into the dashboard
- Don't just show the family name — show a **live thumbnail** of recent family activity

#### 4. Multi-Generational Context-Aware Behavior
- For grandparents: larger text, simpler navigation, "just show me photos of the kids"
- For parents: calendar, invites, bulk sharing
- For kids: "See what's new" in their feed

**Note:** This doesn't mean separate UIs — it means the app **adapts** based on who's using it.

#### 5. Emotional Outcome Metrics
Replace:
- "Posts this week" → "Your family shared 12 moments this week"
- "Upcoming events: 1" → "Sarah's birthday Saturday — send a note?"

---

## Recommendations

### Sprint 007 Should Include:

**1. (Urgent) P1 Accessibility Fixes First**
The contrast, focus, and text size issues are non-negotiable and can ship quickly. Do these first regardless of paradigm.

**2. (Sprint 007) Paradigm Shift: "Family Feed" Dashboard**
- Replace stat cards with activity stories
- Replace "Quick Actions" grid with a "What's happening now" surface
- Keep the family selector but make it feel like switching between family walls, not admin contexts

**3. (Sprint 007) Proactive Layer**
- Surface content from quiet family members
- Show upcoming emotional events (birthdays, anniversaries)
- Surface family TV watch activity

**4. (Sprint 008+) Personalization Engine**
- Detect user's role (grandparent/parent/child) and adapt
- Track what's been seen and surface what hasn't
- "Relational reminders" — "You haven't seen Tom's photos in X weeks"

---

## What This Means for the Team

**principal-designer:**
- The current dashboard layout is architecturally fine — it can be redesigned in place
- Start with the "activity stories" concept — what's the right information hierarchy?
- The Cinema Black warmth must carry through to the app shell (it's currently cold/admin)

**frontend-dev:**
- The P1 accessibility fixes (contrast, focus, text size) are urgent and quick
- The paradigm shift doesn't require new components — it requires rethinking what's on the screen

**strategist:**
- Define the "outcome metrics" — what does success look like for a family app?
- Not "DAU/MAU" — but "families who share at least once per week" and "quiet member re-engagement rate"

---

## Bottom Line

**P1 fixes → ship immediately. Wholesale paradigm shift → Sprint 007, start planning now.**

The current dashboard is like building a beautiful house with the wrong floor plan. Patching the paint (contrast, text sizes) is necessary but not sufficient. We need to rethink the floor plan.

---

## References
- AIUX Design Patterns (36 patterns from 50+ AI products): https://www.aiuxdesign.guide/
- AI-First UX Design in 2025 (Medium): https://medium.com/design-bootcamp/ai-first-ux-design-in-2025-shaping-smarter-user-interactions-80a96166f117
- Ambient Personalization (UXMate, 2025): https://www.uxmate-blog.com/2025/07/18/ambient-personalization-designing-interfaces-that-adapt-to-time-place-and-mood/
- Emotional UX 2025 (Cristian Doniu): https://cristiandoiu.com/index.php/2025/06/13/emotional-ux-digital-twin-interfaces-empathetic-personalization/
- ACM CHI: Household Collaboration Design Spaces
