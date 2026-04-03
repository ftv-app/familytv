# Tech Lead Review — 2026-03-31

## Design Brief Assessment: ✅ APPROVED WITH NOTES

**Section: Multi-Generational Accessibility Standards (new ~140 lines)**

The new accessibility section is well-structured, actionable, and grounded in real multi-generational user research. Key strengths:
- Correctly identifies `#8E8E96` on `#0D0D0F` as a 2.4:1 failure (WCAG AA requires 4.5:1 normal / 3:1 large)
- Correctly identifies `#5A5A62` on `#0D0D0F` as ~1.8:1
- Prescribes `#A8A8B0` as the safe alternative for Muted Silver (~5.2:1)
- 48×48px tap target standard (conservative, correct for seniors)
- Icon+text always rule with research backing (Senior Meetme reference)
- Photosensitivity toggle for CRT scan lines
- `prefers-reduced-motion` for LIVE dot pulse
- Time-based greeting prohibition (warmth principle #6)

**⚠️ One implementation risk:**
- Section 1 says `#8E8E96` "fails AA" and must be replaced. The brief is correct, but the current `globals.css` or CSS variables may still use `#8E8E96` as `--muted-foreground` in some contexts. Need to verify the actual CSS variable values against the brief. The brief's own color table (Section 2) still lists `#8E8E96` as "Muted Silver" but Section 10 (Accessibility) correctly calls it out as a failure. **This is a self-consistency issue in the brief** — the color table in Section 2 needs updating to replace `#8E8E96` with `#A8A8B0` to match what Section 10 actually requires.

**Action required:** Principal designer should update the color table in Section 2 to use `#A8A8B0` as Muted Silver, removing the failing `#8E8E96` reference entirely.

---

## Invite Page Risk Assessment: 🔴 HIGH

### What happened
- `src/app/invite/[code]/page.tsx` was **deleted** from the workspace
- `src/app/invite/[token]/page.tsx` now exists (was already present)
- The deletion is uncommitted (git shows `D src/app/invite/[code]/page.tsx`)

### Critical Bug Found: Invite Acceptance is Broken

**The `[token]/page.tsx` PATCH request is missing the required `token` field.**

In `src/app/api/invite/route.ts`, the PATCH handler requires:
```typescript
const { inviteId, token } = body;
if (!inviteId || typeof inviteId !== "string") { /* 400 */ }
if (!token || typeof token !== "string") { /* 400: "Token required" */ }
```

But `[token]/page.tsx` sends:
```typescript
body: JSON.stringify({ inviteId }),  // ← NO token!
```

This means **every invite acceptance attempt returns `400 "Token required"`**. Users cannot join families via invite links.

**Additionally:** The invite creation API (`POST /api/invite`) returns `inviteLink: /invite/${invite.id}` using the invite's database `id` — not a `code` or `token`. The invite's secret `token` (32-byte hex) is generated server-side and only its hash is stored. The token is **never sent to the client**.

So even if the page tried to pass `token`, there's no token to pass — it would need to be added to the API response, which creates a security consideration (secret in URL/history).

**Recommended fix options:**
1. **Option A (simpler):** Remove the `token` requirement from PATCH — since `inviteId` is already UUID-like and invite links are single-use, the existing `inviteId` alone should suffice. The token hash was meant to prevent enumeration, but the UUID is already non-sequential.
2. **Option B (more secure):** Add `token` to the API response AND update the invite link URL format to `/invite/${inviteId}/${token}`. The `[token]` param page becomes `[inviteId]/[token]`. Higher effort but more secure.

**Option A is recommended for Phase 1 ship speed.**

### Secondary Issue: `invite.code` Is Undefined in the New Flow

In `src/app/family/[familyId]/settings/invites/page.tsx`:
```typescript
// API response:
const newInvite: Invite = {
  code: data.code,   // ← data.code is undefined; API returns inviteId not code
  ...
};

// Copy link uses invite.code (undefined):
onClick={() => invite.code && copyInviteLink(invite.code)}
```

The API (`POST /api/invite`) returns `inviteId` (not `code`). So `invite.code` is always `undefined` in the UI. The copy button and display will work with `invite.id` instead, but the `invite.code` conditional branch is dead code.

### Invite Link Format: ✅ `/invite/[token]` (correct)
- Generated link format: `${origin}/invite/${invite.id}` — matches the `[token]` dynamic route
- The `[token]` page correctly fetches via `GET /api/invite?inviteId=${inviteId}`
- No routing breakage — just the PATCH acceptance bug

---

## Build Status: ✅ PASSING

```
cd /home/openclaw/.openclaw/workspace/familytv && npm run build
→ Exit code: 0
```

All routes compiled successfully. No TypeScript errors. No regressions from the `[code]` → `[token]` route change visible in the build output.

---

## Branch Coverage Gaps (87.04% — 3 points below 90% threshold)

### `/src/app/api/comments/route.ts`

**Missing test cases:**

| Branch | Current coverage | Gap |
|--------|-----------------|-----|
| POST: `content?.trim()` whitespace-only content rejection | Not tested | `content: "   "` case for POST |
| POST: post not found (404) | Not tested | Mock `mockPostsFindFirst.mockResolvedValue(null)` |
| POST: membership not found (403) | Not tested | Mock `mockMembershipsFindFirst.mockResolvedValue(null)` after valid post |
| DELETE: comment not found (404) | Not tested | `mockCommentsFindFirst.mockResolvedValue(null)` |
| DELETE: membership not found (403) | Not tested | `mockMembershipsFindFirst.mockResolvedValue(null)` |

**Suggested test additions for `src/test/api/comments.test.ts`:**
```typescript
it("returns 404 when post not found for POST", async () => {
  mockAuth.mockResolvedValue({ userId: "user_123" } as any);
  mockPostsFindFirst.mockResolvedValue(null);
  const req = new NextRequest("http://localhost/api/comments", {
    method: "POST",
    body: JSON.stringify({ postId: "nonexistent", content: "test" }),
  });
  const res = await POST(req);
  expect(res.status).toBe(404);
});

it("returns 404 when deleting nonexistent comment", async () => {
  mockAuth.mockResolvedValue({ userId: "user_123" } as any);
  mockCommentsFindFirst.mockResolvedValue(null);
  const req = new NextRequest("http://localhost/api/comments?id=nonexistent", { method: "DELETE" });
  const res = await DELETE(req);
  expect(res.status).toBe(404);
});
```

---

### `/src/app/api/reactions/route.ts`

**Missing test cases:**

| Branch | Current coverage | Gap |
|--------|-----------------|-----|
| GET: post not found (404) | Not tested | `mockPostsFindFirst.mockResolvedValue(null)` |
| GET: membership not found (403) | Not tested | `mockMembershipsFindFirst.mockResolvedValue(null)` after valid post |
| POST: post not found (404) | Not tested | Same pattern |
| POST: membership not found (403) | Not tested | Same pattern |
| DELETE: post not found (404) | Not tested | Same pattern |
| DELETE: membership not found (403) | Not tested | Same pattern |

**Suggested test additions for `src/test/api/reactions.test.ts`:**
```typescript
it("returns 404 when post not found for GET", async () => {
  mockAuth.mockResolvedValue({ userId: "user_123" } as any);
  const mockPostsQuery = vi.mocked(db.query.posts);
  mockPostsQuery.findFirst.mockResolvedValue(null);
  const req = new NextRequest("http://localhost/api/reactions?postId=nonexistent");
  const res = await GET(req);
  expect(res.status).toBe(404);
});
```

---

### `/src/app/api/invite/route.ts`

**Missing test cases:**

| Branch | Current coverage | Gap |
|--------|-----------------|-----|
| PATCH: token mismatch (400 "Invalid token") | Not tested | Hash a different token than the stored one |
| PATCH: invite already accepted/revoked (400) | Not tested | Set status to "accepted" |
| PATCH: invite expired (400) | Not tested | Set expiresAt in the past |
| PATCH: already a member (400) | Not tested | `mockMembershipsFindFirst.mockResolvedValue(existingMembership)` |
| POST: creates invite successfully | Partially — token response format not verified | Verify `inviteLink` format, `expiresAt` presence |

**Critical:** The PATCH handler's token mismatch branch is **entirely untested** and represents a real security-relevant code path.

**Suggested test additions for `src/test/api/invite.test.ts`:**
```typescript
it("returns 400 when token doesn't match on PATCH", async () => {
  const invite = createMockInvite({ id: "invite_123", tokenHash: "correct_hash" });
  mockAuth.mockResolvedValue({ userId: "user_123" } as any);
  mockInvitesFindFirst.mockResolvedValue({ ...invite, family: createMockFamily() } as any);
  const req = new NextRequest("http://localhost/api/invite", {
    method: "PATCH",
    body: JSON.stringify({ inviteId: "invite_123", token: "wrong_token" }),
  });
  const res = await PATCH(req);
  expect(res.status).toBe(400);
  const json = await res.json();
  expect(json.error).toBe("Invalid token");
});
```

---

## Recommendations

1. **[HIGH] Fix invite acceptance PATCH bug immediately.** The `token` field is missing from the request body. This is a ship-blocking regression. See Option A/Option B above.

2. **[HIGH] Principal designer: fix brief self-consistency.** Remove `#8E8E96` from the Section 2 color table. Replace all instances with `#A8A8B0` (or whatever the safe value is called). The brief currently calls out `#8E8E96` as a failure in Section 10 while using it as a named token in Section 2.

3. **[MEDIUM] Fix `invite.code` → `invite.id` in settings/invites/page.tsx.** The `copyInviteLink` function and display code should use `invite.id` not `invite.code`. `invite.code` is always `undefined` in the new API response format.

4. **[MEDIUM] Add missing branch coverage tests** for all three API routes — specifically the 404/403 post-not-found and membership-not-found branches. These represent real error paths users hit.

5. **[LOW] The deleted `[code]` route** is uncommitted deletion. Either commit the deletion (if intentional) or restore it (if it was deleted by accident). Currently the workspace is in a dirty state regarding this file.

6. **[INFO] 5 unassigned GitHub issues** (CTM-220/221/222/223/224) cover accessibility and design work. Recommend assigning to principal-designer for the brief consistency fixes and frontend-dev for the `[token]` PATCH bug fix.
