# Sprint 010 — Empty State CTAs Design Spec
**Issue:** https://github.com/ftv-app/familytv/issues/40
**Status:** Draft for review
**Author:** Principal Designer

---

## Brand Tokens for Empty States

| Token | Value | Usage |
|---|---|---|
| `cream-bg` | `#faf8f5` | Page background |
| `terracotta` | `#c4785a` | Primary accent, button fill |
| `terracotta-light` | `#d4937a` | Hover |
| `warm-dark` | `#2D2D2D` | Headlines |
| `warm-muted` | `#A8A8B0` | Body copy |
| `forest-green` | `#2D5A3D` | Focus rings |
| `card-bg` | `#ffffff` | Empty state card background |
| `border` | `rgba(196, 120, 90, 0.12)` | Card border |

**Typography:** Fraunces (headlines), Plus Jakarta Sans (body)
**Border radius:** 12px (cards), 8px (buttons)

---

## Empty State #1 — Activity Feed

> **When:** The family has no posts yet

| Field | Value |
|---|---|
| **Visual icon/illustration** | Warm polaroid frame icon, or camera with soft terracotta fill. Simple line illustration, no flat-design data graphics. |
| **Headline** | "Your family's story starts here" |
| **Body copy** | "When someone shares a moment, it will appear here." |
| **Primary CTA** | "Share the first moment" |
| **Secondary link** | "Invite family members →" (warm-muted, terracotta text) |

### Visual Treatment
- Centered card with `border: 1px solid rgba(196, 120, 90, 0.12)`, 12px radius
- Subtle cream-to-white gradient card background
- Large icon (64px) in terracotta/cream tones above headline
- Generous vertical padding: 64px–80px
- Warm, inviting — like the inside cover of a family photo album

---

## Empty State #2 — Events

> **When:** No upcoming calendar events for this family

| Field | Value |
|---|---|
| **Visual icon/illustration** | Calendar icon with a small spark or star in terracotta. Could show a blank calendar page with a warm illustration. |
| **Headline** | "Nothing on the calendar yet" |
| **Body copy** | "Add a birthday, gathering, or trip to keep everyone in the loop." |
| **Primary CTA** | "Add the first event" |
| **Secondary link** | None (single clear action) |

### Visual Treatment
- Centered card, same card style as Feed empty state
- Icon: calendar + small star/spark, 56–64px
- Warm border treatment consistent with feed empty state
- Encouraging tone — this is about anticipation, not absence

---

## Empty State #3 — Comments

> **When:** A post has no comments yet

| Field | Value |
|---|---|
| **Visual icon/illustration** | Speech bubble with a small ellipsis (...) or a friendly wave, rendered in warm terracotta line art. |
| **Headline** | "Be the first to comment" |
| **Body copy** | "Share a thought, a memory, or just say hello." |
| **Primary CTA** | "Add a comment" |
| **Secondary link** | None |

### Visual Treatment
- Lighter treatment than feed/events — this is a sub-component, not a page
- Compact card: 40px vertical padding, icon 32–40px
- Icon: speech bubble, terracotta outline
- No "0 comments" or "No comments yet" — use the warm headline instead
- Border: same warm terracotta-tinted border

---

## Shared Design Principles

### Do
- Use Fraunces for headlines — serif warmth over cold sans-serif
- Keep copy human and specific ("birthday, gathering, or trip" not "events")
- Center the visual, headline, and CTA as a unified moment
- Use terracotta (#c4785a) for all primary CTAs and icons

### Don't
- ❌ "No items found" / "Nothing here" / "No data"
- ❌ Enterprise dashboard icons (bar charts, pie charts, tables)
- ❌ Dark charcoal backgrounds for empty state cards
- ❌ Dense, low-contrast layouts

---

## QA Copy Reference (for E2E tests)

| Surface | Headline | Body | CTA |
|---|---|---|---|
| Feed | "Your family's story starts here" | "When someone shares a moment, it will appear here." | "Share the first moment" |
| Events | "Nothing on the calendar yet" | "Add a birthday, gathering, or trip to keep everyone in the loop." | "Add the first event" |
| Comments | "Be the first to comment" | "Share a thought, a memory, or just say hello." | "Add a comment" |

---

## Out of Scope (post-Sprint 010)

- Empty states for: media gallery, family member list, notifications
- Animated illustrations (static icons/line art for Sprint 010)
