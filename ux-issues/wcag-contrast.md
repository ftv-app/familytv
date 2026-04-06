**Severity:** P3 — Accessibility (WCAG AA failure)

**Description:**
Multiple screens use dark grey text (#A8A8B0 or similar) on near-black backgrounds, failing WCAG 2.1 AA contrast requirements (4.5:1 for normal text). Affected screens:

1. **Sign-in/Sign-up secondary text:** "Your family is waiting for you" — grey on black
2. **Landing page:** "No ads, no algorithms..." — very dark grey on near-black
3. **Welcome back screen:** subtext below "Welcome back" — low contrast
4. **TV player:** "Chosen by: Grandma June" — dark gold on black, hard to read

**WCAG violation:**
WCAG 2.1 AA requires:
- Normal text (< 18pt regular / < 14pt bold): minimum 4.5:1 contrast ratio
- Large text (>= 18pt regular / >= 14pt bold): minimum 3:1 contrast ratio

The grey (#A8A8B0 = approx 4.5:1 on #0D0D0F = borderline) on black often fails especially on low-quality or bright displays.

**Fix:**
1. Increase contrast for ALL body/secondary text — use #C8C8CC or #E0E0E4 instead of #A8A8B0
2. For the TV page gold text, increase luminance or switch to a brighter gold
3. Add a WCAG contrast check to the CI pipeline (e.g. use axe-core or pa11y)
4. Test with the built-in OS accessibility tools (macOS Accessibility Inspector, Windows Narrator)

**Labels:** accessibility, P3
