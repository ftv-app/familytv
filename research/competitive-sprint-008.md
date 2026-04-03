# Competitive Analysis — Sprint 008
**Date:** 2026-03-31  
**Researcher:** Research Agent  
**Purpose:** Family companion app landscape for FamilyTV strategic planning

---

## Competitor Overview

| Competitor | Core Focus | Pricing | Strengths | Weaknesses |
|---|---|---|---|---|
| **FamilyWall** | Family organization + private social | €4.99/mo premium | Colour-coded calendars, private family feed, grocery lists, budget tracking | European-focused, dated UX, no video-first approach |
| **Cozi** | Shared family calendar | Free + $9.99/yr Gold | #1 family calendar, shopping lists, recipes, journals, very simple | No true social feed, web-centric, limited media features |
| **TimeTree** | Shared calendar + messaging | Free | 70M users, event chat rooms, cross-platform, very fast to set up | Calendar-only with messaging, not a social feed, no media album |
| **Cluster** | Private photo/video sharing | Free + $4.99/mo Keeper | Beautiful album UI, private by default, works for any group | No calendar, no proactive features, archival app not a companion |
| **Google Photos** | Photo storage + sharing | Free (with Google One family) | AI search, auto-movie creation, instant upload, massive scale | Public/extended sharing defaults, not family-private-first, no calendar |
| **Homie AI** | Chat-first household assistant | Unknown | Splits bills, tasks, events, lists, docs — "one shared brain" | Text/chat only, no media, not emotionally engaging |
| **Ohai.ai** | AI family assistant | Unknown | Calendar updates, task coordination, grocery lists, daily summaries | Chat interface only, no visual content, consumer AI not family-focused |

---

## Feature Comparison Table

| Feature | FamilyTV | FamilyWall | Cozi | TimeTree | Cluster | Google Photos |
|---|---|---|---|---|---|---|
| **Private family groups** | ✅ | ✅ | ✅ | ✅ (calendar only) | ✅ | ❌ (manual) |
| **Video/image sharing** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Chronological feed** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ (AI-curated) |
| **Shared calendar** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Proactive AI ("what's new")** | Planned | ❌ | ❌ | ❌ | ❌ | Partial (Memories) |
| **Birthday/event reminders** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **No ads / privacy-first** | ✅ | ✅ | ❌ (ads in free) | ❌ (ads) | ✅ | ❌ (data mining) |
| **Cross-device web + mobile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Invite-only family access** | ✅ | ✅ | ✅ | Shared calendar open | ✅ | Shared album open |
| **AI surface "what's happening"** | 🔜 Roadmap | ❌ | ❌ | ❌ | ❌ | Partial |
| **Accessibility (WCAG 2.1 AA)** | 🔜 | Unknown | Unknown | Unknown | Unknown | ✅ |

---

## Top 3 FamilyTV Differentiators (Keep)

### 1. Chronological Family Feed (No Algorithm)
Competitors either have no feed (TimeTree, Cozi), a manually-curated one (Cluster), or an AI-curated one (Google Photos). FamilyTV's chronological feed — "no algorithm, no noise" — is a genuine differentiator. Families trust it because they control what they see and when. **Keep this as a core message.**

### 2. Video-First Family Memories
FamilyWall has media but it's secondary to lists/calendar. Cluster is photo-first. TimeTree is calendar-only. FamilyTV is **video-first** — which matches how families actually capture and relive moments (birthday parties, reunions, kids' milestones). This is our primary content moat.

### 3. Privacy-First, Ad-Free Family Space
Cozi has ads in free tier. Google Photos mines data. TimeTree has ads. Only FamilyWall (paid) and Cluster offer a clean privacy story. FamilyTV can own the position: "Your family's moments, only for your family — no ads, no algorithms, no strangers."

---

## Top 3 Gaps to Consider (Add to Roadmap)

### Gap 1: Proactive AI Summaries ("What's happening for our family this week?")
Neither FamilyWall, Cozi, TimeTree, nor Cluster has any proactive intelligence. Google Photos has "Memories" but it's backward-looking (what happened) not forward-looking (what's coming). Homie AI and Ohai.ai are chat-first text assistants with no visual component.

**Action:** Add to roadmap as a post-MVP feature: a weekly family digest that surfaces: new photos/videos from the week, upcoming birthdays and events, photos from the same week in prior years ("Remember when?").

### Gap 2: Smart Notification Intelligence
All competitors have basic push notifications ("New photo in Family Album"). None do smart notification grouping, snooze, or contextual delivery. Families are overwhelmed by notifications — the app that learns to notify at the right time (e.g., Saturday morning family digest vs. 10 individual push alerts) wins loyalty.

**Action:** Add to roadmap: intelligent notification batching, delivery time preferences per family member, "remind me later" with context.

### Gap 3: Shared "Family Moments" Auto-Collection
Cluster and Google Photos require manual album creation. No competitor automatically collects "family moments" from events (e.g., a birthday party) into a shareable moment bundle. This is a natural AI opportunity — detect faces, group by event/date, surface "this looks like a birthday party, want to share it as a family moment?"

**Action:** Add to roadmap: event-based auto-collection of media into "Family Moments" bundles, with one-tap sharing.

---

## Accessibility Features to Match

All competitors lack documented accessibility commitments. This is an opportunity to lead.

| Feature | Standard (WCAG 2.1 AA) | Implementation |
|---|---|---|
| **Screen reader support** | All interactive elements labelled, logical focus order | `aria-label` on all buttons/inputs, semantic HTML (`<nav>`, `<main>`, `<article>`) |
| **Keyboard navigation** | Full keyboard operability, visible focus indicators | `tabIndex`, `:focus-visible` styling, skip links |
| **Colour contrast** | 4.5:1 for normal text, 3:1 for large text | Terracotta #c4785a on cream #faf8f5 — verify contrast ratios |
| **Text resizing** | Text scales to 200% without loss of content | Responsive layouts, no `px`-fixed text, `rem`-based sizing |
| **Alt text for images** | All images have descriptive alt text | Upload flow: prompt for caption/alt text; AI-generate alt text suggestions |
| **Video captions** | Auto-generated + manual edit for all videos | Vercel AI / Whisper for auto-captioning |
| **Reduced motion** | Honour `prefers-reduced-motion` | Disable autoplay, collapse animations |
| **High contrast mode** | Support Windows high contrast / forced colours | CSS `@media (forced-colors: active)` |
| **Live regions** | Dynamic content changes announced | `aria-live="polite"` on feed updates, notifications |

**Priority:** Implement alt text for uploads first (AI-assisted), then full WCAG 2.1 AA audit before public launch.

---

## AI-First Competitor Landscape

No true "proactive family companion" exists yet. The closest analogues:

- **Homie AI** (chat-first household brain) — bills, tasks, events, lists, docs. No media. Not emotionally engaging.
- **Ohai.ai** — calendar updates, task coordination, grocery lists. Chat-only. No visual family memories.
- **Samsung Ballie** (hardware) — displays events, weather, smart home. Not a family social app.
- **EBO X Robot** — GPT-powered family robot with facial recognition. Hardware + high price point.
- **Apple Intelligence (Siri)** — becoming a contextual home companion but siloed to Apple ecosystem.

**Conclusion:** The "proactive AI family companion" white space is genuinely open. FamilyTV can own it by building AI that surfaces family moments proactively — not just search, not just Memories, but a genuine "family intelligence" layer.

---

## Commit

```bash
cd /home/openclaw/.openclaw/workspace/familytv && git add research/competitive-sprint-008.md && git commit -m "research: competitive analysis sprint 008"
```
