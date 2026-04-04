# FamilyTV — POST-V1 User Stories (Gaps)

_Last updated: 2026-04-04_
_Context: Source audit vs PRD reveals significant gaps between stories written and app state. This document fills those gaps._

---

## G1. Posting & Content Creation

### G1.1 — Full Photo Upload Flow
**Who:** 41-year-old mother uploading 40 photos from a school play
**Story:**
"As a user, I want to select multiple photos from my camera roll, arrange them in an album, add captions, and post them in one session — without the app crashing or requiring me to upload each one individually."

**What's built:** Post creation form exists, albums CRUD exists
**What's missing:** Actual photo upload to Vercel Blob, multi-photo post, drag-to-arrange, upload progress, retry on failure, photo compression

**Acceptance criteria:**
- [ ] Select up to 20 photos in one session
- [ ] Drag to reorder before posting
- [ ] Add caption per photo or one caption for all
- [ ] Photos upload to Vercel Blob with progress bar per photo
- [ ] If a single photo fails, retry that photo without re-uploading successful ones
- [ ] Optimistic UI — post appears in feed immediately, photo slots fill in as each uploads
- [ ] Photos are compressed client-side before upload (target: <2MB per photo, preserve EXIF date)
- [ ] Photos are stored with family_id and uploader_id metadata for ACL enforcement

**Labels:** P0, posting, photos, upload, Vercel Blob

---

### G1.2 — Video Upload Flow
**Who:** Dad who recorded a 3-minute video of his son's piano recital
**Story:**
"As a user, I want to upload a video from my phone, see a preview before posting, and have it automatically convert to a web-optimized format — so my parents can watch it on any device without downloading an app."

**Acceptance criteria:**
- [ ] Upload videos up to 10 minutes (Phase 1)
- [ ] Show video preview before posting
- [ ] Progress bar with percentage and estimated time remaining
- [ ] Client-side compression to H.264 MP4 before upload
- [ ] Store in Vercel Blob with family_id + uploader_id metadata
- [ ] Generate video thumbnail (first frame + CLIP embedding)
- [ ] "Upload failed — draft saved" with retry on connection loss
- [ ] Optimistic UI — video card appears in feed immediately with "Processing..." state until ready

**Labels:** P0, posting, video, upload, Vercel Blob

---

### G1.3 — Emoji Reactions on Posts
**Who:** Teenager who refuses to comment but will tap a heart
**Story:**
"As a user, I want to react to any post with a single tap so my grandparents know I saw their post without writing anything."

**Acceptance criteria:**
- [ ] Tap reaction button on any post card to open emoji picker
- [ ] 6 emojis: 🎬 😂 ❤️ 🔥 😮 💯 (same set as watch party)
- [ ] Row of reaction counts above comment input: "❤️ 3 🔥 1"
- [ ] Tap own reaction to remove it; tap different emoji to change
- [ ] Reactions update in real time (Socket.IO pub/sub)
- [ ] Post author gets notification: "[Name] reacted ❤️ to your post"
- [ ] Reaction data stored: post_id, user_id, emoji, created_at

**Labels:** P1, reactions, engagement, real-time

---

### G1.4 — Post Composer with Text + Media
**Who:** Mom writing a birthday message with a photo
**Story:**
"As a user, I want to write a caption and attach a photo in one composer, so I can tell the story behind the photo instead of just posting an image."

**Acceptance criteria:**
- [ ] Single composer: text input + media attachment button
- [ ] Toggle between: "Write a caption" (text-first) and "Add a memory" (media-first)
- [ ] Character limit: 500 characters for caption
- [ ] "@mention" family members in caption (autocomplete from family roster)
- [ ] Mentioned members get notified
- [ ] Location tag (optional, one-tap from current location or manual entry)
- [ ] Date tag (defaults to today, can backdate)

**Labels:** P1, composer, posting, mentions

---

## G2. Calendar & Events

### G2.1 — Create a Family Event
**Who:** Dad planning a summer barbecue
**Story:**
"As a family admin, I want to create an event with a date, time, location, and optional description, so my family can RSVP and add it to their own calendars."

**Acceptance criteria:**
- [ ] "Add Event" button on calendar page
- [ ] Form fields: title (required), date, start/end time, location (text + optional map pin), description
- [ ] "All-day" toggle for birthdays and holidays
- [ ] RSVP options: Going / Might come / Can't make it (not shown to others until confirmed)
- [ ] "Add to Google Calendar" / "Add to Apple Calendar" / "Add to Outlook" — generates .ics file
- [ ] Event appears in "What's Happening Now" for 24h before the event
- [ ] Reminder sent 7 days before and 1 day before to all "Going" RSVPs
- [ ] Recurring events: daily, weekly, monthly, yearly
- [ ] Edit/delete event (admin only or event creator)

**Labels:** P1, calendar, events, RSVP

---

### G2.2 — Birthday Tracking with Auto-Reminders
**Who:** Daughter who keeps forgetting her mom's birthday
**Story:**
"As a user, I want birthdays to automatically appear on the family calendar so my siblings and I get reminders and stop forgetting them."

**Acceptance criteria:**
- [ ] Birthday field on member profile (collected on sign-up, editable)
- [ ] Birthdays display as annual recurring events on the calendar with age shown: "Maya turns 8 🎂"
- [ ] Birthday card surfaces in "What's Happening Now" 7 days before and on the day
- [ ] All family members get a reminder 7 days before and on the birthday
- [ ] "Coordinating a surprise?" prompt appears 7 days before — offers to notify family members

**Labels:** P1, calendar, birthdays, reminders

---

### G2.3 — Weekly Digest Email
**Who:** Grandma who checks email but forgets to open the app
**Story:**
"As a user who doesn't open the app every day, I want a weekly email digest so I never miss a week of my grandkids' lives."

**Acceptance criteria:**
- [ ] Opt-in weekly digest (default: on)
- [ ] Sent every Sunday at 9am user's local timezone
- [ ] Contents: 5 most-liked photos, upcoming birthdays, upcoming events, new members
- [ ] One-click "View all" links to the app
- [ ] Unsubscribe link in every email (one-click)
- [ ] Daily digest option (alternative to weekly)

**Labels:** P2, notifications, email, engagement

---

### G2.4 — Calendar Month View
**Who:** Mom planning the month ahead
**Story:**
"As a user, I want to see my family's entire month at a glance so I can see when everyone is free for the weekly call."

**Acceptance criteria:**
- [ ] Month view (default): dots indicate days with events, photos, or birthdays
- [ ] Tap a day to expand: shows events, photos posted that day, birthdays
- [ ] Color-coded: 🟠 events, 📷 photos, 🎂 birthdays
- [ ] Swipe left/right to navigate months
- [ ] "Today" button to jump to current date
- [ ] Toggle: show all content vs. show events only

**Labels:** P2, calendar, month-view

---

## G3. Search & Discovery

### G3.1 — Search Posts by Keyword
**Who:** Dad looking for photos from last summer's beach trip
**Story:**
"As a user, I want to search our family photos by keyword so I can find 'beach 2024' without scrolling through 3 years of feed."

**Acceptance criteria:**
- [ ] Search bar at top of feed (or accessible via "/" keyboard shortcut)
- [ ] Searches: caption text, album name, tagged person names
- [ ] Results ranked by recency and relevance (keyword frequency)
- [ ] Filter by: date range, media type (photos only / videos only), who posted
- [ ] "No results" state with suggestion to invite more family members
- [ ] Search is family-scoped — results never include other families

**Labels:** P1, search, feed

---

### G3.2 — "On This Day" — Memories from Previous Years
**Who:** Adult daughter missing her late grandmother
**Story:**
"As a user, I want to see photos from the same date in previous years on the day I open the app, so I feel connected to my family's history."

**Acceptance criteria:**
- [ ] "On This Day" card appears at top of feed when there are memories available
- [ ] Shows up to 5 photos from the same date in previous years
- [ ] Years shown subtly: "3 years ago · Maya's first day of school"
- [ ] Tap to expand full-screen
- [ ] "Share" option to send to family chat (if chat exists) or via email
- [ ] Empty state: no card shown if no memories exist for today

**Labels:** P1, surfacing, memories, engagement

---

### G3.3 — Browse Albums by Cover Photo
**Who:** Grandma browsing albums from oldest to newest
**Story:**
"As a user, I want to browse albums by their cover photo so I can find the Hawaii trip album without remembering its exact name."

**Acceptance criteria:**
- [ ] Albums grid view: cover photo fills the card, album name below
- [ ] Sort by: newest first (default), oldest first, most photos, alphabetical
- [ ] Tap album → full photo grid with dates
- [ ] Tap photo → full-screen viewer with caption and reactions
- [ ] "Add photos" button on album detail page (for any family member)
- [ ] Album cover auto-set to most recent photo, or manually selectable

**Labels:** P1, albums, browsing

---

## G4. Watch Party — Guest Access & Advanced Features

### G4.1 — Guest Watch Party Join (No Account Required)
**Who:** Grandpa who doesn't want yet another account
**Story:**
"As a viewer, I want to join my grandkids' watch party by clicking a link, entering my name, and watching — without creating an account, downloading an app, or logging in."

**Acceptance criteria:**
- [ ] Join link: `/watch/[partyId]?guest=true`
- [ ] Guest flow: enter name → watch. No email, no password, no app install
- [ ] Guest sees a limited UI: video player, reactions, chat
- [ ] Guest cannot: post to feed, see family calendar, see other family content
- [ ] Guest session expires when the watch party ends (host ends or all leave)
- [ ] Host sees guest list with their chosen display names
- [ ] If guest tries to access any other /app route, redirect to /watch with "Access denied"

**Labels:** P0, watch-party, guest-access, onboarding

---

### G4.2 — Watch Party Chat
**Who:** Family group chatting during the Super Bowl
**Story:**
"As a viewer during a watch party, I want to chat in real time while watching so we can react to the game together even when we're in different states."

**Acceptance criteria:**
- [ ] Chat panel slides in from the right on desktop, bottom sheet on mobile
- [ ] Messages: [Name] [timestamp] [message]
- [ ] Messages persist for the duration of the watch party only — not saved to feed
- [ ] Max 200 characters per message
- [ ] Rate limit: 1 message per 3 seconds per viewer
- [ ] Host can mute chat (viewer messages hidden, "Chat muted by host" shown)
- [ ] Host can disable chat for all guests

**Labels:** P1, watch-party, chat, real-time

---

### G4.3 — Watch Party VOD (Recorded Sessions)
**Who:** Dad who missed the game and wants to watch with family the next day
**Story:**
"As a viewer, after a live watch party ends, I want to replay the same video with the same sync and reactions, as if we were still watching together."

**Acceptance criteria:**
- [ ] "Watch Replay" button appears after host ends the party
- [ ] Replay maintains synchronized playback (re-downloads from point where party ended)
- [ ] Reactions are shown in yellow ("replay" mode) to distinguish from live
- [ ] Chat is hidden in replay (not replayed)
- [ ] Replay available for 30 days after live party
- [ ] "Starting at [timestamp]" — scrub to any point, still synced with others in replay mode

**Labels:** P2, watch-party, VOD, replay

---

### G4.4 — Screen Share During Watch Party
**Who:** Dad sharing his screen to show a home video
**Story:**
"As a host, I want to share my screen instead of a URL link, so family members can watch home videos I'm playing from my hard drive."

**Acceptance criteria:**
- [ ] Host sees "Share Screen" button in watch party controls
- [ ] Screen share captures the selected window or entire screen (user selects)
- [ ] All viewers see the shared screen in real time (WebRTC peer-to-peer)
- [ ] Audio is included
- [ ] "Screen sharing by [Host name]" indicator shown to all viewers
- [ ] Host can stop screen share at any time; returns to URL mode
- [ ] Screen share quality adapts to lowest viewer's bandwidth

**Labels:** P2, watch-party, screen-share, WebRTC

---

## G5. Presence & Notifications

### G5.1 — Real-Time Notifications
**Who:** Mom who wants to know immediately when her kids post
**Story:**
"As a user, I want to receive a push notification the moment a family member posts, reacts to my post, or sends an invite, so I never miss a moment."

**Acceptance criteria:**
- [ ] Push notification types: new post, reaction to your post, mentioned in a caption, event reminder, birthday reminder, invite received
- [ ] Notification preference per type: immediate / daily digest / off
- [ ] Tap notification → deep links to the specific post or event
- [ ] In-app notification bell: list of all recent notifications, unread count badge
- [ ] "Mark all as read" button
- [ ] Notification center shows last 50 notifications

**Labels:** P1, notifications, push, real-time

---

### G5.2 — "Active Now" Presence Panel
**Who:** Mom wondering if anyone is around for a video call
**Story:**
"As a user, I want to see which family members are currently online so I know if I should call or just leave a message."

**Acceptance criteria:**
- [ ] "Active Now" panel at top of family feed
- [ ] Shows avatars of members active in the last 5 minutes
- [ ] Green dot: active now; yellow dot: 5-30 min ago; grey dot: 30+ min ago
- [ ] Tap member → shows last 3 actions: "posted a photo · 2h ago"
- [ ] "Go invisible" toggle — appears offline to others but can still use the app
- [ ] "Appear offline" is separate from actually being offline

**Labels:** P1, presence, real-time, engagement

---

### G5.3 — Email Notifications (Digest Mode)
**Who:** Uncle who checks email but not the app
**Story:**
"As a less-active family member, I want to receive a daily email summary so I stay connected to my family without having to remember to open the app."

**Acceptance criteria:**
- [ ] Daily email at 7pm user's local timezone (configurable)
- [ ] Contents: new posts since last digest (max 10, "and 5 more..."), upcoming birthdays, upcoming events, reactions to your posts
- [ ] Visual: photo thumbnails in email, one-tap "View in app" button
- [ ] Frequency options: real-time push, daily, weekly, off
- [ ] Unsubscribe in one click (footer link)

**Labels:** P2, notifications, email, retention

---

## G6. Family Management & Settings

### G6.1 — Family Settings (Admin Panel)
**Who:** Mom who created the family account
**Story:**
"As the family admin, I want to manage who is in our family, change our family name, and control invite settings — all in one place."

**Acceptance criteria:**
- [ ] Settings → Family Management page (admin only)
- [ ] Members list: name, role (admin/member), joined date, last active
- [ ] Actions per member: Change role, Remove from family, Resend invite
- [ ] Family name editable (shown in feed header, invite emails)
- [ ] Family avatar/cover photo
- [ ] Invite settings: who can invite (admins only / all members), invite expiry (7/30/90 days / never)
- [ ] "Leave this family" option for non-admin members
- [ ] "Delete this family" (admin only, requires typing family name to confirm)

**Labels:** P1, admin, settings, family-management

---

### G6.2 — User Account Settings
**Who:** Dad who changed his email address
**Story:**
"As a user, I want to manage my own account — change my name, email, notification preferences, and password — without asking an admin."

**Acceptance criteria:**
- [ ] Settings → My Account page
- [ ] Edit: display name, email (triggers Clerk verification email)
- [ ] Change password (Clerk)
- [ ] Notification preferences (per type, per channel: push / email / off)
- [ ] Connected accounts: Google, Apple (add/remove)
- [ ] "Download my data" — all posts, reactions, and account info as JSON
- [ ] "Delete my account" — removes account, converts posts to "Family member", cannot be undone

**Labels:** P1, settings, account, data-portability

---

### G6.3 — Post Moderation by Admin
**Who:** Mom dealing with an extended family member posting inappropriate content
**Story:**
"As an admin, I want to hide a post from the feed so the whole family doesn't have to see it, without deleting the family member's account."

**Acceptance criteria:**
- [ ] On any post card: admin sees "Hide post" option (three-dot menu)
- [ ] Hidden post: removed from feed for all family members except the author
- [ ] Author sees: "This post has been hidden by a family admin"
- [ ] Admin can unhide at any time
- [ ] "Report post" for non-admin members → notifies admins
- [ ] No content policy document visible in settings (linked externally)

**Labels:** P1, moderation, admin, content-policy

---

## G7. Offline & Performance

### G7.1 — Offline Draft for Posts
**Who:** User on an airplane drafting a post
**Story:**
"As a user without internet, I want to write a post and queue it, so when I land my post goes up automatically."

**Acceptance criteria:**
- [ ] Composer works offline — draft saved to localStorage with timestamp
- [ ] "Will post when you're back online" banner shown
- [ ] Queued post shows in feed as "Pending" with clock icon until live
- [ ] Posts sync within 2 minutes of reconnecting
- [ ] If offline > 48 hours, prompt to review before posting
- [ ] Clear all drafts option in settings

**Labels:** P2, offline, composer

---

### G7.2 — Photo Offline Cache (Progressive Web App)
**Who:** Grandmother in a areas with intermittent signal
**Story:**
"As a user in an area with poor connectivity, I want to browse the family photo album and not hit a blank screen when the connection drops."

**Acceptance criteria:**
- [ ] Service worker caches last 50 viewed photos and last 20 posts
- [ ] Cached photos load instantly
- [ ] "You're offline — showing cached photos" banner when disconnected
- [ ] Non-cached content shows skeleton loaders, not blank screens
- [ ] Reactions and comments queued when offline, sync when reconnected
- [ ] "Clear cache" option in settings (keeps draft posts)

**Labels:** P2, offline, PWA, performance

---

## G8. Accessibility — Full WCAG AA Audit

### G8.1 — Complete WCAG AA Compliance
**Who:** Screen reader user, low-vision user, motor-impaired user
**Story:**
"As a user with a disability, I want FamilyTV to work with my assistive technology so I can participate in my family's shared life without barriers."

**Current state:** One CSS contrast fix filed (GH #58) — single fix, not a full audit

**Acceptance criteria:**
- [ ] Full accessibility audit against WCAG 2.1 AA by a human reviewer
- [ ] All images have meaningful alt text (auto-generated from CLIP caption if no caption provided)
- [ ] Video player: keyboard-operable, captions supported (future: upload SRT)
- [ ] All form inputs have visible labels associated via `htmlFor`
- [ ] Focus order is logical — no focus jumps
- [ ] Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (verified with pa11y or axe-core in CI)
- [ ] Touch targets: minimum 44x44px for all interactive elements
- [ ] Skip-to-content link on every page
- [ ] Error messages announced by screen readers ("Photo upload failed" as aria-live alert)
- [ ] axe-core runs in CI — any WCAG AA violation fails the build

**Labels:** P1, accessibility, WCAG, CI

---

## G9. Video — Advanced Features

### G9.1 — Video Chapter Markers (Auto-Generated)
**Who:** Mom wanting to share a specific clip from a 2-hour recital
**Story:**
"As a user posting a long video, I want the app to automatically detect chapter points so family members can jump to the part they care about."

**Acceptance criteria:**
- [ ] When video is uploaded and processed, CLIP embeddings generate chapter suggestions
- [ ] Chapters shown as clickable timestamps in the video player: "0:00 Intro, 3:45 Piano solo, 12:30 Standing ovation"
- [ ] Tap chapter → seeks to that timestamp for all viewers
- [ ] Chapters are editable by the video poster
- [ ] If video < 3 minutes, no chapters shown

**Labels:** P2, video, chapters, AI

---

### G9.2 — AirPlay / Chromecast to TV
**Who:** Dad who wants to watch family videos on the big screen
**Story:**
"As a user, I want to cast a family video directly to my TV so my whole living room can watch instead of huddling around a phone."

**Acceptance criteria:**
- [ ] "Cast" button on video player (uses browser's native Cast API)
- [ ] Works with Chromecast, AirPlay, Miracast where supported
- [ ] Video plays on TV while feed stays navigable on phone (phone becomes remote control)
- [ ] During watch party: cast syncs playback to TV for all viewers in the room

**Labels:** P2, video, casting, smart-TV

---

## G10. Data & Portability

### G10.1 — Full Family Data Export
**Who:** Dad wanting to keep a backup of all family memories
**Story:**
"As a user, I want to download all photos, videos, and events from my family as a ZIP file, so we own our memories independently of FamilyTV."

**Acceptance criteria:**
- [ ] "Download Family Archive" button in family settings (admin only)
- [ ] Export includes: all photos (original quality), all videos (original quality), captions (JSON), events (JSON), family member list (JSON)
- [ ] Organized as: /2024/06-Beach-Trip/photo1.jpg, /2024/06-Beach-Trip/photo2.jpg
- [ ] Download link valid for 24 hours, sent via email
- [ ] For families with >10GB of content: export split into multiple ZIPs with manifest

**Labels:** P2, data-portability, trust, GDPR

---

### G10.2 — Account Deletion (GDPR)
**Who:** Adult child leaving a toxic family situation
**Story:**
"As a user who wants to leave and take all my data with me, I want to permanently delete my account and all my content in one click."

**Acceptance criteria:**
- [ ] "Delete Account" in settings → "Type your password to confirm" flow
- [ ] Deletion consequences explained clearly: posts become "[Family Member]", reactions are removed, family membership is terminated
- [ ] 14-day grace period: "Account scheduled for deletion" email sent, reversible by logging in
- [ ] After 14 days: account deleted, posts converted, data purged from all systems
- [ ] Export option available before deletion (G10.1)

**Labels:** P1, privacy, GDPR, account-deletion
