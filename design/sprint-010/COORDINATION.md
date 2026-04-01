# QA Engineer Coordination Notes
**Sprint 010 — Copy for E2E Tests**

## Confirmed Copy (source of truth)

### Activity Feed Empty State
- Headline: `Your family's story starts here`
- Body: `When someone shares a moment, it will appear here`
- CTA button: `Share the first moment`
- Secondary: `Invite family members →`

### Events Empty State
- Headline: `Nothing on the calendar yet`
- Body: `Add a birthday, gathering, or trip to keep everyone in the loop.`
- CTA button: `Add the first event`

### Comments Empty State
- Headline: `Be the first to comment`
- Body: `Share a thought, a memory, or just say hello.`
- CTA button: `Add a comment`

### Feed Loaded State
- Message: `You're all caught up! 🎉`
- Load more: `Load more`

## Flags for QA
1. PostCard uses dark `#1A1A1E` charcoal — **must be updated** to white/cream cards per `activity-feed-spec.md`
2. WarmEmptyState is already warm-correct — existing component can be reused as-is
3. The feed's "you're all caught up" copy in `family-feed-client.tsx` already matches the spec

## E2E Test Selector Hints
- Empty feed: look for heading `Your family's story starts here`
- Empty events: look for heading `Nothing on the calendar yet`
- Empty comments: look for heading `Be the first to comment`
