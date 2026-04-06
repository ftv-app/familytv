**Severity:** P1 — Conversion blocker

**Description:**
The sign-up page (`/sign-up`) renders the outer shell ("Join your family on FamilyTV") but the Clerk `<SignUp>` component fails to render in many cases, leaving users with no way to sign up. The screenshot shows only the header/branding with no email input, password field, or sign-up button.

**Reproduction:**
1. Navigate to /sign-up in a browser
2. Observe: "Join your family on FamilyTV" heading displays
3. Expected: Clerk SignUp form renders below the heading
4. Actual: Form never appears — dead end

**Root cause hypothesis:**
The `mounted` state guards against hydration mismatches, but if Clerk's SignUp component fails to load (network issue, Clerk misconfiguration, or Clerk is still initializing), the page shows an empty shell with no fallback or error message.

**Fix:**
1. Add a loading skeleton that looks like a sign-up form (not a spinner) while Clerk loads
2. Add an error boundary/fallback if Clerk fails to initialize — offer a mailto link or redirect to support
3. Ensure Clerk SignUp component has proper error handling
4. Add `data-testid` attributes to the outer shell elements for E2E testing

**Screenshot:** see workspace: sign-up.png

**Labels:** bug, P1, accessibility
