# Brand V2 — Branch Work Plan

**Branch:** `brand-v2`  
**Base:** `main` (April 6 2026, commit 6d8b481)  
**Merge target:** `main` — next week  
**Goal:** Ship a complete, polished product with consistent Cinema Black design

---

## What "Brand V2" Means

A formalized, production-quality design system. Not a redesign — the Cinema Black aesthetic is right. The problem is inconsistent implementation: hardcoded colors, missing dark mode, inconsistent spacing, placeholder routes, broken flows.

**Brand V2 = take what we have, make it complete and correct.**

---

## P0 — Must Fix Before Merge

### 1. Formalize `brand-v2.css`
- Extract all design tokens from `brand.css` and `globals.css`
- Define Cinema Black dark palette formally (backgrounds, surfaces, borders, text)
- Define warm cream light palette formally
- Document: this is the single source of truth for all design tokens
- All pages use `var()` tokens — no hardcoded colors anywhere

### 2. Fix remaining hardcoded colors
- Audit ALL components for hardcoded `#faf8f5`, `#1e1a17`, `#0D0D0F`, etc.
- Replace with CSS variable references
- No component should ever set a color directly

### 3. Fix AppShell nav (commit already on brand-v2)
- Family-aware nav — ✅ already committed (878dcea)

### 4. Fix broken routes that are linked
- `/app/family/${familyId}` page exists ✅
- `/app/family/${familyId}/events` → calendar page (does this exist?)
- `/app/settings` exists ✅
- Verify all linked routes exist

### 5. Fix invite flow
- POST returns `?token=` in inviteLink ✅ already committed
- GET returns token ✅
- Invite page sends token with PATCH ✅
- Verify the full flow end-to-end

### 6. Auth pages dark mode
- brand.css dark mode ✅ already committed (f065683)
- Verify on production after deploy

---

## P1 — Polish Before Merge

### 7. Consistent typography scale
- Heading: Oswald (broadcast/TV feel)
- Body: Source Sans 3
- Mono: JetBrains Mono
- Verify all text uses correct font variables

### 8. Consistent spacing system
- Document spacing tokens (4px base unit)
- All padding/margin uses design system spacing
- No ad-hoc pixel values

### 9. Film grain overlay consistency
- AppShell has film grain ✅
- Apply to auth pages?
- Apply to landing page?

### 10. Focus ring consistency
- Forest green #2D5A3D focus ring on ALL interactive elements
- Audit: any element that doesn't have it

### 11. Consistent button styles
- Primary: terracotta
- Secondary: sage green
- Destructive: velvet red
- Ghost/links: warm gold in dark mode

---

## P2 — Nice to Have

### 12. Loading states
- Every async action has loading state
- Skeleton screens match component shape

### 13. Error states
- Form errors show inline
- API errors show toast
- 404 page matches brand

### 14. Responsive breakpoints
- Verify mobile-first at every breakpoint
- No horizontal scroll

---

## Definition of Done for Merge

- [ ] Zero hardcoded colors in components (all via CSS variables)
- [ ] `brand-v2.css` is the single design token source
- [ ] All routes that are linked from nav actually exist
- [ ] Invite flow works end-to-end (create → email → accept)
- [ ] Dark mode consistent across: landing, auth, app, settings, TV
- [ ] All interactive elements have Forest Green focus rings
- [ ] Film grain overlay on all dark-mode surfaces
- [ ] No console errors in production
- [ ] Build passes ✅
- [ ] Tests pass (973+) ✅
