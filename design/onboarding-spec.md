# FamilyTV Onboarding — Design Spec

## Overview

**Goal:** Get families from "what is this?" to "our private family space" in under 30 seconds total. Every screen earns the next click. Zero enterprise vibes.

**Principle:** If a 70-year-old who texts photos to family group chats can't finish in one sitting, the flow is broken.

---

## Global Design Tokens

| Token | Value | Use |
|---|---|---|
| Primary (Terracotta) | `#C4704A` | CTAs, active dots, key accents |
| Secondary (Forest) | `#2D5A4A` | Secondary buttons, links, success states |
| Background (Cream) | `#FDF8F3` | Page background, card fill |
| Text Primary | `#2C2C2C` | Headlines, body |
| Text Secondary | `#6B6B6B` | Hints, helper copy |
| White | `#FFFFFF` | Input backgrounds, card surfaces |
| Border | `#E8E0D8` | Subtle dividers, input borders |

**Typography:**
- Headlines: **Fraunces** (serif, warm, trustworthy) — Google Fonts
- Body / UI: **Plus Jakarta Sans** — Google Fonts
- Base size: 16px mobile, 18px desktop
- Line height: 1.5 body, 1.2 headlines

**Spacing:** 8px base unit. Primary spacing: 16, 24, 32, 48, 64px.

**Shadows:** Warm, soft. `0 2px 8px rgba(44, 44, 44, 0.08)` for cards. No harsh drop shadows.

**Border radius:** 12px for cards, 8px for inputs/buttons. Rounded enough to feel friendly, not bubbly.

---

## Progress Indicator

Three filled/open dots centered at top of every step. No labels, no numbers, no connecting lines.

- **Inactive dot:** 8px circle, border `#E8E0D8`, fill transparent
- **Active dot:** 10px circle, fill `#C4704A` (Terracotta)
- **Completed dot:** 8px circle, fill `#2D5A4A` (Forest)

Container: `margin-bottom: 48px`, dots spaced 12px apart.

---

## Step 1 — Sign In / Create Account

**URL:** `/onboarding/sign-in`

### Layout (Mobile-First)

```
[Progress Dots — 3 dots]
[Spacer 48px]

[         FamilyTV logo (small, warm)         ]
[           Welcome to FamilyTV                ]  ← Fraunces 32px, centered
[     Sign in to start your family space       ]  ← Plus Jakarta Sans 16px, #6B6B6B, centered

[Spacer 32px]

[ Email                              ]  ← Input field, 100% width, 52px tall
[Spacer 16px]
[ Password (shown only after email)  ]  ← Input field, 100% width, 52px tall (slides in)

[Spacer 24px]

[          Continue →                ]  ← Terracotta button, 100% width, 52px tall

[Spacer 16px]

[   New here? Create an account      ]  ← Forest link, centered, 16px
```

### Fields & Behavior

- **Email field:** Always visible first. Placeholder: `Your email address`. Keyboard: email. Autocomplete: email.
- **Password field:** Appears (slides down, 200ms ease-out) immediately after user finishes typing email OR after 500ms idle on email. Placeholder: `Choose a password` (create) or `Your password` (sign in). Toggle visibility icon (eye). Minimum 8 chars.
- **Clerk handles sign-in vs create account detection** automatically based on email existence.
- **Continue button:** Full-width, 52px tall, Terracotta `#C4704A`, white text, 8px radius. Disabled until email valid AND password ≥ 8 chars.
- **"New here? Create an account" link:** Forest `#2D5A4A`, underlined on hover. Clicking it tells Clerk to force sign-up mode ( Clerk's `signInMode` prop or toggle).

### Error States

- Invalid email format: red border `#C44A4A`, helper text below field in 14px: `Please enter a valid email address`
- Wrong password (sign-in): shake animation (3px, 3 cycles, 300ms), field highlighted, message: `That's not the right password. Try again?`
- Email not found (sign-in): Clerk prompts "No account found — create one?" inline, no full-page redirect

### Desktop (768px+)

Content maxes at 420px wide, centered. Generous whitespace above and below. Page background stays Cream `#FDF8F3`.

---

## Step 2 — Name Your Family

**URL:** `/onboarding/family-name`

### Layout (Mobile-First)

```
[Progress Dots — dot 1 filled Forest, dot 2 active Terracotta, dot 3 open]
[Spacer 48px]

[        You're in! 🎉                       ]  ← Fraunces 28px, centered, warm
[      What should we call                   ]  ← Fraunces 32px, centered
[        your family?                        ]  ← Fraunces 32px, centered

[Spacer 32px]

[ The Smiths, The Garcia Family, ... ]  ← Optional pill suggestions, horizontal scroll
[                                     ]     Row of 3 max visible, "see more" if >3
[Spacer 16px]

[                                    ]  ← Text input, 100%, 60px tall, large text (20px)
[                                    ]  ← Placeholder: "e.g. The Smith Family"
[Spacer 24px]

[          Continue →               ]  ← Terracotta button, 52px tall, full-width
```

### Name Suggestions

Pulled from Clerk user metadata if available (firstName, lastName). Show 3 pills max:

- "The [LastName] Family" (if lastName exists)
- "The [FirstName]s" (if firstName exists, pluralized)
- "Our Family" (always shown as fallback)

Pills: white background, `#E8E0D8` border, 8px radius, 12px/16px padding. Tap pill → fills input.

### Fields & Behavior

- **Text input:** 60px tall (extra tall for friendliness), 20px font. Max 50 characters. Placeholder: `e.g. The Smith Family`. No validation beyond required + max length.
- **Continue button:** Disabled until ≥ 1 character typed.
- **Back arrow:** Top-left, 44×44px touch target, ← icon, Forest color. Returns to Step 1.

### Error States

- Empty submit attempt: button stays disabled (prevents the error).

### Desktop (768px+)

Centered card, max-width 480px. Input stays 60px tall. More vertical breathing room.

---

## Step 3 — Invite Someone Special

**URL:** `/onboarding/invite`

### Layout (Mobile-First)

```
[Progress Dots — dot 1+2 filled Forest, dot 3 active Terracotta]
[Spacer 48px]

[        Almost there!                     ]  ← Fraunces 28px, centered
[    Invite someone special                 ]  ← Fraunces 32px, centered
[   to see your family photos               ]  ← Fraunces 32px, centered

[Spacer 24px]

[  Your family can't wait to               ]  ← Plus Jakarta Sans 16px, #6B6B6B, centered
[  see your photos and videos.             ]

[Spacer 32px]

[      📋  Copy invite link                 ]  ← PRIMARY: Forest button, 52px, full-width, large icon
[                                         ]     Icon: clipboard/link symbol
[Spacer 12px]

[      Or send an email instead             ]  ← 14px, #6B6B6B, centered, "Or" divider above

[Spacer 12px]

[  Email address (optional)                  ]  ← Input, 52px, full-width
[Spacer 12px]
[  Send invite  ✉️                           ]  ← Secondary: white bg, Forest border/text, 48px

[Spacer 24px]

[         Skip for now →                   ]  ← Terracotta text link, 16px
```

### Primary Action — Copy Invite Link

- **Button:** Forest `#2D5A4A` background, white text, full-width, 52px tall, 8px radius.
- **Icon:** Clipboard or link icon, left of text, 20px.
- **Behavior:** On tap, immediately copies a pre-generated invite URL (generated server-side, stored in family record, never expires until accepted). URL format: `familytv.app/join/[token]`.
- **Feedback:** Button text changes to `Copied! ✓` for 2 seconds, then reverts. Button background shifts to a slightly lighter Forest `#3D6A5A` during those 2 seconds.
- **If copy fails** (rare, e.g. clipboard API blocked): show inline message below button: `Could not copy automatically — try selecting the link below`, and display the raw URL in a selectable text field below.

### Secondary Action — Email Invite

- **Label:** "Or send an email instead" in 14px `#6B6B6B`, centered, with thin `— or —` dividers above and below.
- **Email input:** Standard 52px input, placeholder: `Their email address`.
- **Send button:** White background, Forest `#2D5A4A` border (2px), Forest text, 48px tall. Shows ✉️ icon.
- **Validation:** Email must be valid format if filled. Optional — can send empty (skips).
- **Success:** After send, brief inline confirmation: `Invite sent to grandma@example.com ✓` in Forest green, replaces the email field for 3 seconds.

### Skip

- **"Skip for now →"** link below, Terracotta `#C4704A`, 16px, bottom of screen. Tap → proceed to dashboard immediately.

### Back Arrow

Top-left, 44×44px touch target. Returns to Step 2.

### Desktop (768px+)

Invite section centered, max-width 420px. Primary copy button remains full-width at that container width.

---

## Post-Step 3 — Redirect

**Destination:** `/dashboard` (app dashboard)

### Welcome Banner / Toast

On first load after completing onboarding, show a subtle top banner (NOT a blocking modal):

```
[ Forest left border accent | 16px | "You're all set! Post your first memory →" | ✕ dismiss ]
```

- Banner: white background, warm shadow, Forest `#2D5A4A` left border (4px), full width, 56px tall
- Text: Plus Jakarta Sans 15px, `#2C2C2C`
- "Post your first memory →" is a Terracotta link
- "✕" dismiss button: 44×44px touch target, top-right
- Auto-dismiss after 8 seconds (no re-show on refresh — use `localStorage` flag `onboardingCompleteDismissed`)
- On dismiss: slide up and fade out, 200ms

---

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| 320–479px | Full-width inputs/buttons. 16px horizontal padding. Font 16px base. |
| 480–767px | Same as above but with slightly more breathing room. |
| 768px+ | Centered content column (420–480px). Background stays Cream. Side whitespace. |
| 1024px+ | Same centered column. More vertical rhythm. Header can show logo + nav. |

**Touch targets:** All interactive elements minimum 44×44px. Buttons are 52px tall (exceeds minimum). Back arrows and dismiss buttons are 44×44px.

**Input heights:** 52px standard, 60px on family name step (friendlier, more prominent).

---

## Accessibility

- All inputs have visible `<label>` (can be visually hidden via `sr-only` but must exist in DOM)
- Focus states: 2px Terracotta outline, 2px offset — visible on all interactive elements
- Color contrast: Terracotta on white = 4.8:1 ✓ AA, Forest on white = 7.2:1 ✓ AAA
- Keyboard navigable: Tab order = email → password → Continue → (back) → etc.
- No auto-advancing steps (no auto-submit) — user controls pace
- Screen reader announcements: Each step change should announce "Step X of 3" via `aria-live="polite"` region

---

## Animation & Motion

| Animation | Duration | Easing | Trigger |
|---|---|---|---|
| Password field slide-in | 200ms | ease-out | After email typed |
| Progress dot fill | 300ms | ease-in-out | Step completed |
| Button press (scale) | 100ms | ease | On touch |
| Toast slide-in from top | 250ms | ease-out | On dashboard load |
| Toast slide-out up | 200ms | ease-in | On dismiss or auto-dismiss |
| Error shake | 300ms | ease-in-out | On validation error |
| "Copied!" state change | 150ms | ease | On copy success |

All animations respect `prefers-reduced-motion`: if set, skip slide-ins and shakes, use instant state changes.

---

## Out of Scope (For Later)

- Family avatar/photo upload during onboarding
- Multi-person bulk invite in step 3
- Family settings (timezone, privacy preferences) — these come post-onboarding in settings
- Social login beyond Clerk defaults (Google, Apple)
- Step indicator labels — excluded per spec requirement
