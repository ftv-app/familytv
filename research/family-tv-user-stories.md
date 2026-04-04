# FamilyTV User Stories

_Last updated: 2026-04-04_
_Status: Living document — add stories as product evolves_

---

## 1. Onboarding

### 1.1 — First-time user creates account
**Who:** 42-year-old mother of two, moderately tech-savvy
**Story:**
"As a new user, I want to create a FamilyTV account in under 2 minutes so I can start sharing with my family without friction."
**Acceptance criteria:**
- [ ] Sign up with email OR Google/Apple SSO in one click
- [ ] No credit card, no phone number required
- [ ] Guided 3-step flow: Create account → Name my family → Invite one person
- [ ] If I close the tab mid-flow and return within 24h, my progress is saved
- [ ] I land on my family feed immediately after completing onboarding
**Labels:** P0, onboarding, conversion

---

### 1.2 — User invites a skeptical family member
**Who:** 45-year-old father who "doesn't want another app"
**Story:**
"As a user, I want to invite my dad via email or SMS with a link that works instantly and explains what FamilyTV is, so he actually downloads it instead of ignoring the invite."
**Acceptance criteria:**
- [ ] Invite link works on mobile web — no app download required to accept
- [ ] Email/SMS invite arrives within 30 seconds with a warm, non-corporate subject line
- [ ] Invite page explains the value proposition in one sentence before asking for anything
- [ ] Dad can join in under 60 seconds with Google SSO or email
- [ ] After joining, dad sees the family feed with existing content — not an empty state
**Labels:** P0, onboarding, invite, retention

---

### 1.3 — User joins a family without creating a new account
**Who:** 68-year-old grandmother, already has a FamilyTV account
**Story:**
"As an existing FamilyTV user, I want to accept a second family invite and switch between families without logging out, so I can be part of both my kids' families."
**Acceptance criteria:**
- [ ] Accepting a new invite adds the family to my existing account
- [ ] I can switch between families from any page via a family switcher in the header
- [ ] My posts, reactions, and history are separate per family
- [ ] I can leave a family at any time without losing access to my own account
**Labels:** P1, onboarding, multi-family

---

### 1.4 — User abandons onboarding and returns later
**Who:** Busy parent, interrupted mid-signup
**Story:**
"As a user who got interrupted while signing up, I want to return where I left off, so I don't have to start over."
**Acceptance criteria:**
- [ ] Returning to /sign-up within 7 days restores my email (if entered) and family name (if set)
- [ ] Progress is stored server-side (not localStorage) so it works across devices
- [ ] Invites I sent are preserved and can be resent if the invitee hasn't accepted
**Labels:** P2, onboarding, edge-case

---

## 2. Family Feed & Content Sharing

### 2.1 — User posts a photo from last week's soccer game
**Who:** 40-year-old dad who takes 500 photos at every kid's event
**Story:**
"As a user, I want to post a photo to our family feed in under 10 seconds so I can share a moment before I forgets to."
**Acceptance criteria:**
- [ ] "Add to family" button is visible on every page (bottom of feed on mobile)
- [ ] Tap → select photo from camera roll → write caption → post. Max 3 taps after selecting photo.
- [ ] Photos upload in background — I can keep scrolling while they go up
- [ ] Post appears in the feed immediately (optimistic UI)
- [ ] If upload fails, I see a clear error with a retry button — not a blank post
**Labels:** P0, posting, mobile, core-feature

---

### 2.2 — User posts a video of a child's piano recital
**Who:** Proud grandparent
**Story:**
"As a user, I want to post a video of my granddaughter's recital so the whole family can watch it in one place, instead of scattered across 12 individual texts."
**Acceptance criteria:**
- [ ] Video posts display with a thumbnail and play button
- [ ] Videos autoplay without sound when visible in the feed (mobile)
- [ ] Long videos (>3 min) show a duration badge
- [ ] Videos stream in the highest quality my connection supports
- [ ] Download option for offline viewing (mobile — future phase)
**Labels:** P0, video, core-feature

---

### 2.3 — User browses the family photo album months later
**Who:** Adult daughter looking for photos from last Christmas
**Story:**
"As a user, I want to browse and search our family photos by date, person, or place, so I can find the photo of Grandma at the beach without scrolling through 3 years of feed."
**Acceptance criteria:**
- [ ] Albums view shows photos grouped by event/date
- [ ] Search by person name, date range, or keyword in caption
- [ ] "On this day" feature surfaces photos from same date in previous years
- [ ] Tap any photo to see it full-screen with the original caption
- [ ] All family members can add photos to any album
**Labels:** P0, albums, search, core-feature

---

### 2.4 — User reacts to a photo with a emoji
**Who:** Teenager who refuses to leave comments
**Story:**
"As a user, I want to react to a post with a single tap so I can show my grandma I saw her post without writing anything."
**Acceptance criteria:**
- [ ] Tap the reaction button to open the emoji picker (6 emojis max per app)
- [ ] Existing reactions from other family members show as a row above the comment input
- [ ] I can change my reaction by tapping a different emoji
- [ ] Reactions are visible without loading — they appear instantly
- [ ] The post author sees a notification with the reaction emoji, not just "X reacted"
**Labels:** P1, reactions, engagement

---

### 2.5 — User gets tagged in a photo automatically
**Who:** Parent managing 300+ photos from a vacation
**Story:**
"As a user, I want to be automatically tagged in photos my family posts so I don't have to manually tag 50 people across 200 photos."
**Acceptance criteria:**
- [ ] AI-powered face detection suggests tags when posting photos
- [ ] Suggested tags show as a confirmation step before posting
- [ ] I can approve all suggestions in one tap
- [ ] Tag suggestions are family-specific — only tag people in this family
- [ ] I can remove my own tags at any time
**Labels:** P2, tagging, AI, future-phase

---

### 2.6 — User sees an empty state and knows what to do
**Who:** New user on their first visit
**Story:**
"As a new user on an empty family feed, I want to immediately understand what to do and how to invite my family, so I don't think the app is broken."
**Acceptance criteria:**
- [ ] Empty feed shows: illustration + "Your family feed is waiting" + big "Add your first memory" CTA
- [ ] Secondary CTA: "Invite [family name] to join" — prominent but smaller
- [ ] Example posts shown with "Sample posts — invite your family to see real ones" label
- [ ] No dead-end states anywhere in the app — every empty state has a clear action
**Labels:** P1, empty-state, onboarding, UX

---

### 2.7 — User posts on behalf of their child
**Who:** Mom posting photos of her toddler
**Story:**
"As a parent, I want to post photos of my toddler to our family feed without needing to tag myself every time, since I can't exactly ask a 3-year-old to react."
**Acceptance criteria:**
- [ ] Option to post "as the family" instead of as an individual
- [ ] Family posts show the family name/avatar instead of the parent's
- [ ] Posts from family account are clearly marked (subtle "Family account" label)
- [ ] Parent can toggle between personal and family account in the composer
**Labels:** P2, posting, family-roles, future-phase

---

## 3. Calendar & Events

### 3.1 — User adds a birthday to the family calendar
**Who:** Adult daughter who keeps forgetting her mom's birthday
**Story:**
"As a user, I want to add family birthdays to our shared calendar so my siblings and I stop forgetting them and can coordinate surprises."
**Acceptance criteria:**
- [ ] Birthday can be added from a member's profile in one tap (pre-filled with DOB from sign-up)
- [ ] Birthday events show the member's age ("Maya turns 7") in the event title
- [ ] Reminders sent 7 days and 1 day before to all family members
- [ ] Calendar shows all family members' birthdays in a dedicated "Birthdays" section
- [ ] Events display in the family feed and in the "What's Happening Now" surfacing widget
**Labels:** P1, calendar, birthdays

---

### 3.2 — User creates a family event (game night)
**Who:** Father planning a weekly tradition
**Story:**
"As the family organizer, I want to create a recurring event for our Saturday game night so everyone can add it to their own calendars."
**Acceptance criteria:**
- [ ] Create event: title, date/time, location, optional description
- [ ] RSVP options: Going / Might come / Can't make it
- [ ] "Add to my calendar" button exports to Google/Apple/Outlook calendar
- [ ] Event shows in "What's Happening Now" for the 24 hours before
- [ ] Recurring events (weekly, monthly) can be created in one step
**Labels:** P1, calendar, events

---

### 3.3 — User checks what's happening this week with the family
**Who:** Remote family member feeling disconnected
**Story:**
"As a user, I want to see a weekly summary of my family's activity — new photos, upcoming birthdays, upcoming events — in one view, so I feel connected even when I'm not scrolling the feed daily."
**Acceptance criteria:**
- [ ] "This Week" view shows: new photos count, upcoming events, birthdays, recent reactions to my posts
- [ ] Rendered as a card on the family feed or accessible via a bottom tab
- [ ] "This Week" is the default landing view on mobile after first login
- [ ] Updates in real time — no page refresh needed
**Labels:** P1, surfacing, weekly-summary, engagement

---

## 4. Watch Parties & Synchronized Playback

### 4.1 — Dad starts a watch party for the Super Bowl
**Who:** 52-year-old father, technically challenged
**Story:**
"As the host, I want to start a watch party with one button and have everyone's player synchronized to the second, so my kids don't miss the winning touchdown."
**Acceptance criteria:**
- [ ] "Start Watch Party" button on any video page — max 1 tap for host
- [ ] Link to join is shareable via copy/paste or SMS
- [ ] All viewers' players sync within 1 second of each other
- [ ] Host has play/pause/seek control by default
- [ ] If host transfers control, all viewers' players follow automatically
- [ ] Viewer count visible to host — knows when everyone has joined
**Labels:** P0, watch-party, sync-playback, core-feature

---

### 4.2 — Family member joins a watch party on their phone
**Who:** 68-year-old grandmother watching on her iPad
**Story:**
"As a viewer, I want to join a watch party from a link my son texted me, without creating an account or downloading anything, so I can watch my grandkids' recital in real time."
**Acceptance criteria:**
- [ ] Join link opens in mobile browser — no app install required
- [ ] If not signed in, I can enter my name and join as a guest (limited to this watch party)
- [ ] Guest can watch, react, and chat — cannot post to the feed
- [ ] Sync quality adapts to connection speed — lower bandwidth viewers see the same timestamp
- [ ] "Reconnecting..." message if sync is lost, with auto-recovery
**Labels:** P0, watch-party, mobile, guest-access

---

### 4.3 — Family reacts together in real time during a movie
**Who:** Teenage grandson watching from his bedroom
**Story:**
"As a viewer, I want to send a fire emoji or a live reaction during a tense movie moment and see my grandma do the same, so we feel like we're in the same room."
**Acceptance criteria:**
- [ ] Emoji reactions appear on screen for all viewers for 3 seconds, then fade
- [ ] Reactions are attributed: "Dad reacted 🔥"
- [ ] Emoji picker accessible via tap (not a long press)
- [ ] 6 emojis only: 🎬 😂 ❤️ 🔥 😮 💯 (configurable by host)
- [ ] Reactions are rate-limited to prevent spam (max 1 per 2 seconds per viewer)
**Labels:** P1, watch-party, reactions, real-time

---

### 4.4 — Viewer seeks ahead during a watch party
**Who:** Adult daughter who paused to make popcorn
**Story:**
"As a viewer who paused, I want to rejoin the watch party at the current timestamp with one tap, so I don't have to frantically scrub to find where everyone is."
**Acceptance criteria:**
- [ ] "Rejoin at [current timestamp]" banner appears when viewer falls behind
- [ ] Tap to rejoin — player seeks to current position automatically
- [ ] Seeking ahead independently is allowed but shows a warning: "You're ahead of the group"
- [ ] If more than 30 seconds ahead, host is notified
**Labels:** P1, watch-party, seeking, UX

---

## 5. Presence & Activity Surfacing

### 5.1 — User sees what their kids were doing last night
**Who:** Father who travels for work
**Story:**
"As a remote parent, I want to open FamilyTV and immediately see what my family shared today — photos, reactions, who's online — without having to scroll through a reverse-chronological feed."
**Acceptance criteria:**
- [ ] "What's Happening Now" widget shows the most recent 5 family activities
- [ ] Ordered by recency and social weight (reactions, comments = boosted)
- [ ] Shows who viewed what ("Maya saw this 2h ago")
- [ ] Widget is collapsible — user can dismiss it
- [ ] "See all" navigates to full activity feed
**Labels:** P1, surfacing, presence, core-feature

---

### 5.2 — User sees family members who are online now
**Who:** Grandma wondering if anyone is around
**Story:**
"As a user, I want to see which family members are currently online so I know if I should call someone or just leave a message."
**Acceptance criteria:**
- [ ] Online members shown as a row of avatars at the top of the feed
- [ ] Avatar has a green dot when member is actively using the app
- [ ] Idle for >5 min: grey dot, "last seen X min ago"
- [ ] Offline for >1 hr: no dot, name shown on request
- [ ] Privacy: users can go invisible and still use the app (no public announcement)
**Labels:** P1, presence, real-time, privacy

---

### 5.3 — User gets notified when their sister posts a new photo
**Who:** Sister who has notifications enabled
**Story:**
"As a user, I want to receive a push notification when someone in my family posts a new photo so I don't miss a moment, but I want to control how often I'm interrupted."
**Acceptance criteria:**
- [ ] Notification preferences per family: all posts, only tagged posts, daily digest, or off
- [ ] "X posted a new photo" notification with thumbnail preview
- [ ] Tap notification → jumps directly to the post in the feed
- [ ] Quiet hours setting — no notifications between [user-set hours]
- [ ] Email digest as an alternative to push (daily or weekly)
**Labels:** P1, notifications, engagement

---

## 6. Privacy & Safety

### 6.1 — Family content is genuinely private
**Who:** Privacy-conscious parent
**Story:**
"As a user, I want to know that our family photos are never accessible to the public, search engines, or anyone outside our family, so I feel safe posting my kids."
**Acceptance criteria:**
- [ ] All content is private by default — no public profiles, no public URLs
- [ ] Invite links expire after 7 days and can be manually revoked
- [ ] Screenshots of posts are not detectable (acceptable for this product)
- [ ] No algorithmic recommendation — content only reaches the invited family
- [ ] FamilyTV's own team cannot access family content (technical and policy enforcement)
**Labels:** P0, privacy, security, trust

---

### 6.2 — Family member who misbehaves can be removed
**Who:** Parent dealing with a toxic extended family member
**Story:**
"As a family admin, I want to remove a member from the family so our feed stays safe, without having to delete the whole family or contact the member directly."
**Acceptance criteria:**
- [ ] Admin can remove any member from family settings
- [ ] Removed member loses access immediately — their content remains but they can't see new posts
- [ ] Removed member sees: "You've been removed from [Family Name]"
- [ ] Removed member can request to rejoin — admin approves or denies
- [ ] 2 admins required to remove the last admin (prevent lockout)
**Labels:** P1, moderation, admin-controls

---

### 6.3 — User's location is never tracked
**Who:** Privacy-advocate parent
**Story:**
"As a user, I want FamilyTV to work fully without sharing my location, so I can post photos from vacation without the app knowing where I am."
**Acceptance criteria:**
- [ ] Location is optional — if provided, it's attached to the post and visible only to the family
- [ ] Location can be removed from a post after posting
- [ ] No geolocation APIs called unless user explicitly adds a location to a post
- [ ] "Location disabled" indicator in settings is always visible
**Labels:** P1, privacy, location

---

## 7. Accessibility & Tech-Limited Users

### 7.1 — Grandmother can use the app without any training
**Who:** 72-year-old grandmother with limited smartphone experience
**Story:**
"As a user with low technical literacy, I want the FamilyTV app to work exactly like iMessage — I open it, I see photos, I tap to react. Nothing more."
**Acceptance criteria:**
- [ ] Font size minimum 16px throughout the app
- [ ] All interactive elements are minimum 44x44px tap targets
- [ ] No gestures more complex than tap — no long-press, no swipe-to-dismiss
- [ ] Feed auto-refreshes without user action
- [ ] "Help" button on every page opens a simple text guide
- [ ] Tested with VoiceOver on iOS — all elements accessible
**Labels:** P1, accessibility, elderly-users

---

### 7.2 — App works on a slow 3G connection
**Who:** Family in rural area with limited broadband
**Story:**
"As a user on a slow connection, I want to browse the family feed and see photos even on 3G, so my family in the countryside isn't excluded."
**Acceptance criteria:**
- [ ] Feed loads initial content in under 5 seconds on 3G
- [ ] Photos show in low resolution first, then upgrade to high resolution
- [ ] Videos show a poster frame first — streaming only starts on explicit play tap
- [ ] "You're offline" state is clearly shown when connection is lost — not a blank screen
- [ ] Actions (reactions, comments) queue and sync when connection returns
**Labels:** P1, performance, offline, emerging-markets

---

### 7.3 — User with visual impairment can navigate the app
**Who:** 65-year-old with macular degeneration
**Story:**
"As a visually impaired user, I want the app to work with my phone's built-in screen reader so I can see photos my family posts without asking someone to describe them."
**Acceptance criteria:**
- [ ] All images have meaningful alt text (auto-generated from AI captioning if no caption provided)
- [ ] Video content has audio descriptions where available
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Focus order is logical — not jumping around the screen
- [ ] Screen reader announces: new post count, online members, event reminders
**Labels:** P1, accessibility, WCAG, screen-reader

---

## 8. Admin & Settings

### 8.1 — Family admin manages member roles
**Who:** Mother who created the family account
**Story:**
"As the family admin, I want to set another family member as an admin so my husband can also manage invites and remove members when needed."
**Acceptance criteria:**
- [ ] Admin can promote any member to admin role
- [ ] Admins can: remove members, change family name, manage invite settings
- [ ] Regular members can: post, react, comment, manage their own account
- [ ] Role badge is visible next to each member's name
- [ ] Admin actions are logged (visible to other admins only)
**Labels:** P1, admin, roles

---

### 8.2 — User exports their family's data
**Who:** Father wanting to keep a backup
**Story:**
"As a user, I want to download all my family's photos and videos from FamilyTV so we own our memories even if the service ever shuts down."
**Acceptance criteria:**
- [ ] "Download my family" button in settings — exports all content for the family I'm in
- [ ] Export formats: photos (original quality), videos (original quality), captions (JSON)
- [ ] Download is a ZIP file organized by year/album
- [ ] Export link is valid for 24 hours
- [ ] Download works for all families I'm a member of, one at a time
**Labels:** P2, data-portability, trust

---

### 8.3 — User deletes their account and all associated data
**Who:** Adult child leaving a family after a falling out
**Story:**
"As a user who wants to leave, I want to delete my account and all my data from FamilyTV so I'm completely gone."
**Acceptance criteria:**
- [ ] Account deletion is accessible from settings → privacy → delete account
- [ ] Deletion requires password re-entry to confirm
- [ ] Deleting my account: removes my account, my posts, my reactions — content I commented on remains
- [ ] My family membership is removed, my name is replaced with "[Removed Member]"
- [ ] Deletion is permanent — no recovery possible
**Labels:** P1, privacy, GDPR, account-deletion

---

## 9. Error States & Edge Cases

### 9.1 — User tries to post but is offline
**Who:** User on an airplane
**Story:**
"As a user without internet, I want to write a post and queue it, so when I land my post goes up automatically without me having to remember to share it."
**Acceptance criteria:**
- [ ] Post composer works offline — draft is saved locally
- [ ] "Will post when you're back online" message shown
- [ ] Queued post indicator visible in feed ("Your post is waiting to go live")
- [ ] Post goes live automatically within 2 minutes of reconnecting
- [ ] If offline >24h, user is prompted to review before posting
**Labels:** P2, offline, composer

---

### 9.2 — Invite link is shared with non-family members
**Who:** Curious stranger who received an invite by mistake
**Story:**
"As someone who received an invite link by mistake, I should not be able to access any family content, join the family, or see any photos without being explicitly approved by an admin."
**Acceptance criteria:**
- [ ] Invite link contains a unique, unguessable token — not incrementing IDs
- [ ] After 3 failed join attempts from the same link, the link is automatically revoked
- [ ] Non-member visiting the invite URL sees only a "This invite has expired or been revoked" message
- [ ] No information leakage about whether the family exists
**Labels:** P0, security, invite, DoS-prevention

---

### 9.3 — Video upload fails mid-way
**Who:** User on an unstable connection uploading a 2-minute video
**Story:**
"As a user uploading a video when my connection drops, I want the upload to resume automatically so I don't lose my post or have to start over."
**Acceptance criteria:**
- [ ] Videos use resumable upload — if interrupted, resume from last chunk
- [ ] Upload progress shown as a percentage bar
- [ ] "Connection lost — retrying..." message with auto-retry (3 attempts)
- [ ] After 3 failures, user sees "Upload failed — your draft is saved" with a manual retry button
- [ ] Draft is retained for 24 hours
**Labels:** P1, video, upload, resilience

---

### 9.4 — Two family members try to delete the family at the same time
**Who:** Co-admins in a divorce situation
**Story:**
"As an admin, I should not be able to accidentally delete the family while another admin is active — deleting a family should require confirmation and prevent simultaneous deletions."
**Acceptance criteria:**
- [ ] Deleting a family requires typing the family name to confirm
- [ ] If two admins attempt deletion simultaneously, the first one succeeds and the second sees "Family was already deleted"
- [ ] Deletion is reversible within 30 days — family can be restored by any remaining admin
- [ ] Deletion notification sent to all members via email
**Labels:** P2, safety, edge-case

---

## 10. Future Phases (Nice to Have)

### 10.1 — Print calendar
**Who:** Grandma who doesn't use smartphones
**Story:**
"As a user who prefers paper, I want to download and print our family calendar as a PDF so I can stick it on my fridge."
**Labels:** future, calendar, print

### 10.2 — Smart TV app
**Who:** Family watching videos on the big screen
**Story:**
"As a user, I want to watch FamilyTV on my smart TV so the whole family can see photos and videos without crowding around a phone."
**Labels:** future, smart-tv, platform

### 10.3 — Legacy memorial account
**Who:** Family who lost a loved one
**Story:**
"As a family, when we lose a loved one, we want the ability to turn their account into a memorial — preserving their photos and messages — so their memory lives on in our family feed."
**Labels:** future, empathy, memorial
