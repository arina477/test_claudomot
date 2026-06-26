# Settings — Privacy — StudyHall

**Route:** `/settings/privacy`  
**Related features:** 16 (basic privacy controls), 1 (auth), 24 (compliance: privacy-rights UI, data export/delete — H2, may promote to H1 if school partner requires)  
**Related flows:** F1 (sign up & create profile)

---

## Purpose

The privacy settings page empowers students to control their own data and presence in StudyHall — a core differentiator vs. Discord (which collects behavioral data for ads) and vs. Teams (which centralizes privacy in IT's hands). This page surfaces **student-side privacy controls** (not legal policy), giving students granular choice over:

1. **Profile visibility:** Who can discover & view your profile across public/shared contexts
2. **Direct messaging:** Who can initiate DMs with you (H2 feature; placeholder in MVP)
3. **Account data:** What data StudyHall holds about you + ability to download it (feature 24 adjacent; MVP may be simplified)
4. **Data deletion:** Request permanent account deletion + data wiping

The page is a statement: "Your data is yours. We don't track you for ads or sell your data. See what we have and delete it anytime." This is particularly powerful for students concerned about privacy in academic settings and anxious about Discord's ad infrastructure.

---

## Audience

**Primary persona:** P1 (Student Member), authenticated  
**Auth state:** Required — logged-in session  
**Entry point:** Settings menu in app header / left sidebar ("Settings" gear icon → "Privacy")  
**Use case:** 
- On first signup (F1): Reviewing default privacy settings (often just scanning + skipping, unless student is privacy-conscious)
- Post-join: Periodically checking / adjusting who can message them or see their profile
- Compliance scenario: School/parent asks student to verify data privacy; student downloads a data export as proof

---

## Entry Points

1. **Settings menu (primary):** User clicks gear icon → dropdown menu → "Privacy" → routes to `/settings/privacy`
2. **Deep link:** Direct navigation to `/settings/privacy` if session is valid
3. **Data download / deletion request flows:** User may land here from a notification ("Your data export is ready") or after attempting an unsupported action ("Direct messages require privacy settings adjustment")
4. **Invite link / signup nudge (H2+):** Post-signup, a banner may surface: "Complete your privacy settings to control who can contact you" (once DMs are live in H2)

---

## Content Sections (Page Anatomy)

### Header / Navigation
- **Breadcrumb or back button:** "← Back" or "Settings › Privacy"
- **Page title:** "Privacy Settings" (H1)
- **Tagline (small, below title):** "Your data is yours. Choose what you share and who can contact you."

### Hero section (optional; high-level positioning)
- **Statement:** "StudyHall doesn't track you for ads or sell your data. We give you full control."
- **Link (subtle):** "Read our privacy policy" (routes to `/privacy` — legal policy page, separate from this product settings page)

---

## Settings Panels (organized by permission type)

### Panel 1: Profile Visibility

**Headline:** "Who can see your profile?"  
**Description:** "Your profile card (avatar, display name, accent color) is shown in server member lists. Control who can find you across StudyHall."

**Radio group (mutually exclusive):**

1. **"Private" (most restrictive)**
   - Only members of servers you've joined can see your profile card in that server's member list.
   - You cannot be discovered in any cross-server searches or public directories (feature 23, H2; disabled for now).
   - **Best for:** Students who want minimal exposure.
   - **Default:** Off (may change per school policy in H2)

2. **"Servers only" (default in MVP)**
   - Members of your servers can see your profile card in those servers' member lists.
   - You cannot be discovered in public directories or cross-server searches (not implemented in MVP).
   - **Best for:** Most students (typical use case).
   - **Default:** On

3. **"Discoverable" (least restrictive; future feature)**
   - Members of public study communities or school-wide searches may discover your profile.
   - Placeholder for H2; disabled in MVP.
   - Grayed out with label "Coming in a future update."

**Current selection indicator:** Radio button + text description (no toggle switch; radio forces intentionality).

**Hint text (small, gray):** "Even in 'Servers only' mode, server organizers can see all member information to manage roles and permissions."

---

### Panel 2: Direct Messages (Placeholder; H2 feature)

**Headline:** "Who can message you?" (grayed out / disabled in MVP)  
**Description:** "Direct messages launch in a future update. When available, choose who can start conversations with you."

**Placeholder radio group (disabled / grayed):**
- "Anyone in my servers can message me" (placeholder default)
- "Only friends can message me" (placeholder option)
- "Message requests only" (placeholder option; forces approval workflow)

**Explanation text:** "Direct messaging is coming to StudyHall. Once available, you'll control who can contact you one-on-one. For now, team collaboration happens in study servers."

**Note:** This section is non-interactive in MVP. On H2 DM launch (feature 21), this panel becomes active.

---

### Panel 3: Account Data & Privacy Rights

**Headline:** "Your data"  
**Description:** "StudyHall stores your profile info, messages, and activity. Download it, review it, or request deletion."

**Subsection 3a: Data download (account export)**

**Control:** "Download your data" button (primary, blue)

**On click (feature 24 adjacent; MVP may be simplified):**
- Show modal: "Download your StudyHall data"
- **Content:**
  - Explanation: "We'll create a file with all your account information: profile, messages, servers, assignments, and activity logs. Download will take 1–5 minutes."
  - Checkbox (optional consent): "Include my messages" (pre-checked). If unchecked, export contains profile + metadata only (no message content).
  - Checkbox (optional): "Include file attachments" (pre-checked). If unchecked, export includes only file names/metadata, not actual files.
  - Button: "Download data" → initiates export job
- **Async export:** 
  - Modal closes; toast appears: "Data export started. We'll email you a download link when it's ready (usually within 5 minutes)."
  - Background job processes: aggregates user's messages, metadata, files (if selected); compresses into a `.zip` file; stores in object storage (time-limited, e.g., 7 days). Sends email with download link.
  - (Optional MVP feature) Show export status in "Recent exports" section: "Data export from [date], ready to download" (link + "Delete this export" button, useful for privacy).
- **Privacy note:** "Exports are stored securely and deleted after 7 days. You can download your data once per month."

**Subsection 3b: Data types held (informational)**

**Collapsible section:** "What data do we store about you?"

**On expand, shows list:**
- Profile information: username, display name, avatar, accent color, email, password hash (bcrypt, not plaintext)
- Account metadata: signup date, last login, active servers (list of server IDs you're a member of)
- Message activity: Message count, channels participated in, last message date (not message content by default; included in export if opted in)
- Voice room activity: Sessions joined, minutes in rooms, dates (no recordings stored; feature 13 design decision)
- Assignment interactions: Assignments marked as done, submission history (if H2 feature 18 is active)
- File uploads: Metadata (filename, size, date uploaded). Files stored in object storage (separate from profile data).
- Logs: Login events, security events (password reset, 2FA enable/disable), settings changes

**Disclaimer:** "StudyHall does not retain call recordings, does not track your location, and does not sell your data to advertisers. We don't partner with data brokers. See our privacy policy for details."

---

### Panel 4: Data Deletion (Destructive action)

**Headline:** "Delete your account" (red text or warning color)  
**Description:** "Permanently delete your account and all associated data. This action cannot be undone."

**Control:** "Delete account" button (secondary, red/destructive)

**On click:**
- Confirmation modal appears:
  - Headline: "Delete your account?"
  - Warning text: "This will permanently delete your profile, messages, avatar, and all data associated with your account. You will be removed from all study servers. **This cannot be undone.**"
  - Checkbox (required to proceed): "I understand that this cannot be reversed. I want to delete my account."
  - Optional text field: "Why are you leaving? (optional feedback)" — helps product team understand churn
  - Buttons: "Cancel" (dismiss) | "Delete everything" (destructive, red)
- **Fallback (optional email verification):** "To confirm, we've sent a verification link to your email. Click the link to finalize deletion." (This is a good safety measure for destructive actions; user must verify via email before hard delete.)
- **After confirmation:**
  - Account flagged as deleted (soft delete) or hard-deleted per policy (likely soft delete first, hard delete after 30-day grace period for GDPR compliance)
  - User is logged out (session cleared)
  - Routes to landing.md with toast: "Your account has been marked for deletion. You'll receive a confirmation email."
  - (Optional) Follow-up email: "Your account deletion is complete. If you change your mind within 30 days, reply to this email to recover your account." (Grace period UX)

**Legal note (small, gray, below button):** "Account deletion is subject to our Terms of Service. See our privacy policy for our data retention schedule."

---

### Panel 5: Settings & Preferences (General)

**Heading:** "General privacy settings"

**Toggles (each with on/off state):**

1. **"Allow analytics"** (optional; depends on product analytics strategy)
   - Default: On (or Off for GDPR-first approach; MVP may simplify by not asking)
   - Description: "Help us improve StudyHall by sharing anonymized usage data (e.g., features used, page load times). No personal information is included."
   - If off: No analytics events sent (feature 3 design system may have analytics built-in; this toggle disables it)

2. **"Email notifications for reminders"** (feature 14 adjacent)
   - Default: On
   - Description: "Receive email reminders for assignment due dates and mentions. Adjust frequency in your Notifications settings."
   - If off: No assignment reminder emails; in-app notifications still show

3. **"Show me in online status"** (feature 7 presence; future refinement)
   - Default: On
   - Description: "Let server members see when you're online. Turning this off shows you as 'away' even when active."
   - If off: Presence data still collected (needed for voice room awareness) but shown as offline to others (privacy mode)

**Note:** These toggles are optional and may be simplified in MVP. Focus on the core data control panels (visibility, data download, deletion).

---

## Interactions (Elements → Side-effects)

### Profile visibility radio button
- Click radio option → option is selected (filled circle)
- UI updates immediately; no "Save" button required (auto-save pattern)
- Selection persists to `PATCH /api/me/privacy` in background
- Toast (subtle, lower-left): "✓ Saved" (appears 2 seconds, auto-dismisses)
- If save fails (offline or error): Toast "Could not save setting. Try again."
- Offline: Radio can be clicked; change queues locally + syncs on reconnect

### "Download your data" button
- Click → modal opens
- Check/uncheck options (include messages, attachments)
- Click "Download data" → `POST /api/me/data-export` request sent with options
- Response: `{ export_id, status: "processing", estimated_ready_at: "2026-06-26T18:00Z" }`
- Modal updates: "Export started. We'll email you when it's ready (~5 minutes)."
- Modal closes; user sees toast: "Data export started. Check your email for a download link."
- Background job runs; email sent with time-limited download URL
- (Optional) Export status in "Recent exports" section updates in real-time (if polling or WebSocket subscribed)

### "Delete account" button
- Click → confirmation modal opens
- Checkbox is required to enable "Delete everything" button
- Text field is optional (but encouraged for UX feedback)
- Click "Delete everything" → verification email sent to user's email address
- Modal updates: "Verification email sent. Click the link in your email to complete deletion."
- User clicks email link → `DELETE /api/me/account?token=xyz` endpoint called
- Account flagged as deleted; user logged out; routes to landing with toast: "Your account has been deleted."
- (Optional grace period) Email sent: "Your deletion is processing. Recover your account within 30 days by replying to this email."

### Data types collapsible
- Click to expand → shows list of data types + descriptions
- Click again to collapse
- No data fetching needed; list is static/informational

### Analytics toggle (optional)
- Click toggle → on/off state changes immediately
- `PATCH /api/me/privacy` sent with `{ analytics_enabled: true/false }`
- Toast: "✓ Saved"
- If off: All future `POST /api/events` calls are suppressed (client-side guard)

### Email notifications toggle
- Click → on/off state changes
- `PATCH /api/me/notifications` sent with `{ email_reminders_enabled: true/false }`
- Toast: "✓ Saved"
- If off: Organizer is still notified of user actions, but user won't receive email reminders

---

## Data Requirements

### API endpoints (placeholder names)

#### Read (GET)
- **`GET /api/me/privacy`** (or `GET /api/users/me/privacy`)
  - Response: 
    ```json
    {
      "profile_visibility": "servers_only" | "private" | "discoverable",
      "dm_policy": "anyone" | "friends_only" | "request_only",
      "analytics_enabled": true,
      "email_reminders_enabled": true,
      "show_online_status": true
    }
    ```
  - Used on page load to pre-fill form

- **`GET /api/me/data-export-status`** (list recent exports, optional)
  - Response:
    ```json
    {
      "exports": [
        { "id": "export_123", "created_at": "2026-06-26T12:00Z", "status": "ready", "download_url": "/api/exports/export_123/download", "expires_at": "2026-07-03T12:00Z" }
      ]
    }
    ```
  - Used to show "Recent exports" section

#### Write (PATCH, POST, DELETE)
- **`PATCH /api/me/privacy`**
  - Body:
    ```json
    {
      "profile_visibility": "servers_only",
      "dm_policy": "anyone",
      "analytics_enabled": true,
      "email_reminders_enabled": true,
      "show_online_status": true
    }
    ```
  - Response: Updated privacy settings object
  - Offline: Changes queue + sync on reconnect

- **`POST /api/me/data-export`**
  - Body:
    ```json
    {
      "include_messages": true,
      "include_attachments": true,
      "feedback": "optional user feedback on why they're exporting"
    }
    ```
  - Response: `{ export_id, status: "processing", estimated_ready_at }`
  - Async job: Aggregates data, compresses, uploads to object storage, emails download link
  - Email sent to user's email with time-limited link (e.g., 7 days)
  - Max 1 export per month (rate limit to prevent abuse)

- **`DELETE /api/me/account?token=<email_verification_token>`** (or POST with body)
  - Triggered by email verification link (user clicks link in deletion confirmation email)
  - Body: `{ confirmation_token: "xyz" }`
  - Response: 204 No Content
  - Side effect: Account soft-deleted (or hard-deleted after grace period; depends on policy)
  - User logged out, session cleared

#### Notifications / Email
- **`POST /api/me/send-deletion-verification-email`**
  - Triggered when user clicks "Delete everything"
  - Body: empty
  - Response: `{ message: "Verification email sent" }`
  - Email contains one-time link to `DELETE /api/me/account?token=<token>` endpoint

#### Data types informational (no API needed for MVP)
- Static HTML content in collapsible section; no backend call

### Session & auth details
- User must be authenticated to access this page. If session expires, redirect to signin.
- Deletion request requires email verification (additional security gate).

### Local storage (offline support)
- **Privacy settings draft:** Store in localStorage under key `draft:privacy` (optional; auto-save is immediate).
- **Export status:** Cache list of recent exports in localStorage; check for updates on reconnect.

### Data model schema (reference)
```
privacy_settings table:
  id: UUID (PK)
  user_id: UUID (FK, unique)
  profile_visibility: Enum("private", "servers_only", "discoverable", default "servers_only")
  dm_policy: Enum("anyone", "friends_only", "request_only", default "anyone")
  analytics_enabled: Boolean (default true)
  email_reminders_enabled: Boolean (default true)
  show_online_status: Boolean (default true)
  updated_at: DateTime

data_exports table:
  id: UUID (PK)
  user_id: UUID (FK)
  status: Enum("processing", "ready", "expired", "failed", default "processing")
  include_messages: Boolean
  include_attachments: Boolean
  file_url: String (S3 URL, nullable until ready)
  expires_at: DateTime (7 days from creation)
  created_at: DateTime
  downloaded_at: DateTime (nullable; track if user actually downloaded)

deletion_requests table:
  id: UUID (PK)
  user_id: UUID (FK)
  status: Enum("pending", "confirmed", "completed", default "pending")
  verification_token: String (unique, one-time use)
  feedback: Text (optional)
  requested_at: DateTime
  confirmed_at: DateTime (when email link clicked)
  completed_at: DateTime (when deletion is finalized)
  grace_period_until: DateTime (30 days from confirmed; allow recovery)
```

---

## Empty / Error / Loading States

### Loading (page first load)
- Skeleton loaders for each settings panel (gray placeholder bars)
- Spinner in header
- Duration: Typical load <1s; if >3s, show error state

### Privacy settings loaded, default state
- "Servers only" radio selected (default)
- Other toggles show current values
- All controls enabled and ready to interact

### Radio button selected
- Selected radio is filled (blue circle)
- Toast appears: "✓ Saved"
- No page reload needed

### Data export processing
- Modal closed; toast: "Data export started. Check your email."
- (Optional) "Recent exports" section shows new export with status "Processing..."
- Email sent to user's registered email with download link when ready

### Data export download
- User clicks email link → browser downloads `.zip` file
- File contains JSON files (profile.json, messages.json, assignments.json) + folders (attachments/, if included)

### Account deletion verification pending
- Modal closed; toast: "Verification email sent. Check your inbox to confirm deletion."
- User receives email with one-time deletion confirmation link
- User clicks link → account is marked for deletion

### Account deleted
- User logged out
- Redirects to landing.md
- Toast: "Your account has been deleted."
- (Optional) Follow-up email: "Your account deletion is complete. You can still recover it for 30 days by replying to this email."

### Error: Network failure (toggle / radio change fails)
- Toast: "Couldn't save setting. Check your connection and try again."
- Retry button in toast
- Offline: Change queues; syncs on reconnect

### Error: Export failed
- Toast: "Data export failed. Please try again or contact support if the problem persists."
- "Recent exports" section shows failed export with retry button

### Error: Session expired (mid-page)
- Redirects to signin with return URL: `/settings/privacy`
- User signs back in → returns to this page

### Offline state
- Connection indicator banner: "You're offline. Privacy changes will sync when you reconnect."
- Radio / toggle buttons still functional; changes queued
- "Download data" button disabled: "Go online to request a data export."
- "Delete account" button disabled: "Go online to delete your account."

---

## Responsive Breakpoints

### Desktop (≥960px)
- **Layout:** Single-column, centered (max 600px width for readability)
- **Panels:** Full width, stacked vertically
- **Modals:** 70% viewport width, centered
- **Typography:** Full scale; ample line-height

### Tablet (600–960px)
- **Layout:** Single-column, full width (with padding)
- **Panels:** Full width, stacked
- **Modals:** 90% viewport width, centered
- **Typography:** Slightly smaller; optimized for touch

### Mobile (if supported in future; <600px)
- **Out of scope for MVP.** Settings routes to landing ("StudyHall is optimized for desktop").

---

## Success Metrics

### Adoption & awareness
1. **Privacy settings page visits:** # of unique members who visit `/settings/privacy` within 30 days. Target: ≥20% (many students may not visit; privacy is passive feature).
2. **Profile visibility changes:** % of members who adjust profile visibility from default. Target: ≥5% (expected low; most use default).
3. **Data export requests:** # of members who download their data per month. Target: ≥1% (expected low; exercise of privacy right, not routine).

### Privacy trust signals
- **"I trust StudyHall with my academic data"** — Likert survey post-MVP. Target: ≥4/5 (privacy positioning should drive high trust).
- **"StudyHall respects my privacy better than Discord"** — Binary survey. Target: ≥70% of students agree (validates the differentiator).
- **Account deletion rate:** # of account deletions citing privacy concerns (via deletion feedback form). Target: <2% of total churn (privacy shouldn't be a reason to leave).

### Compliance readiness (H2+, when feature 24 is live)
- **FERPA audit readiness:** Can institutions audit their student data via StudyHall? Yes (data export feature). Target: 100% of export requests succeed (zero failures).
- **Data deletion fulfillment:** 100% of deletion requests are completed within SLA (e.g., 7 days). Target: SLA met for 100% of requests.
- **GDPR compliance:** Policies in place for data retention, export, deletion. Target: Legal review passed.

### Product satisfaction
- **Privacy controls ease-of-use:** "Privacy settings are easy to understand and change." Likert scale. Target: ≥4/5.
- **Transparency:** "I understand what data StudyHall collects about me." Likert scale. Target: ≥4/5 (indicates success of "what data do we store" informational panel).

---

## Competitor Comparison

### vs. Discord (Tier 1 primary benchmark)
| Dimension | Discord | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Profile visibility control** | ✗ No granular control; all servers see your profile; public server discovery exists but not configurable | ✓ Students choose: private, servers-only, or discoverable | StudyHall empowers student choice; Discord is broadcast-only. |
| **DM filtering** | ✓ Exists (DM settings: everyone, friends only, server members only) | ✓ Placeholder (H2); will mirror Discord's controls | Parity post-H2. Discord has it now; StudyHall deferred. |
| **Data export / right to data** | ✗ Very limited; no easy export; GDPR requests require manual support ticket | ✓ One-click data download + legal compliance (feature 24) | StudyHall emowers students to audit their data anytime; Discord requires legal request. |
| **Data deletion** | ✗ Account deletion exists, but no grace period; data retention unclear in public docs | ✓ Full account + data deletion with 30-day grace period | StudyHall's grace period is privacy-protective (reversible deletion); Discord's is unclear. |
| **Advertising / data collection** | ✗ Collects behavioral data for ad targeting (Quests); third-party data acquisition (Sep 2025 update); not FERPA-compliant | ✓ No ads, no behavioral tracking, no data brokers | **StudyHall's biggest privacy advantage.** Discord's ad infrastructure is a liability for academic use. StudyHall is ad-free by design. |
| **Transparency** | ~ Privacy policy exists but is dense; no in-app data visibility | ✓ "What data do we store" panel in settings + easy export | StudyHall's transparency is user-friendly; Discord's is legal-document-heavy. |
| **Analytics opt-out** | ~ No analytics opt-out (analytics are mandatory) | ✓ Toggle "Allow analytics" | StudyHall offers choice; Discord doesn't. |
| **FERPA compliance** | ✗ Not FERPA-designated; no compliance mode | ✓ (H2) Compliance features planned (feature 24); student-side privacy now | StudyHall positions as FERPA-friendly; Discord does not. |

**Key positioning:** "Discord monetizes your data with ads. StudyHall protects your privacy. Download your data anytime, or delete your account completely. You're in control."

### vs. Microsoft Teams (Tier 1 secondary benchmark)
| Dimension | Teams | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Profile visibility control** | ~ Controlled by institution (IT sets directory/search policies) | ✓ Student-controlled | StudyHall empowers individual; Teams empowers institution. |
| **Data export / GDPR** | ✓ Strong (Enterprise Data Subject Requests, GDPR-compliant) | ✓ (H2+) Feature 24 will add compliance export | Teams has mature compliance; StudyHall is building. Both will be strong; Teams is ahead now. |
| **Data deletion** | ✓ IT can delete user accounts; student-initiated deletion available | ✓ Student can self-delete (30-day grace period) | StudyHall's self-service deletion is stronger; Teams requires IT involvement. |
| **Privacy policy transparency** | ~ Teams' privacy is strong (Microsoft Privacy Statement) but dense and enterprise-focused | ✓ StudyHall's is student-focused + in-app transparency | StudyHall's messaging is clearer; Teams' is legalistic. |
| **Advertising** | ✗ Teams is ad-supported in some SKUs (enterprise vs. free) | ✓ No ads, ever | StudyHall advantage: truly ad-free; Teams may have ad variants. |
| **Analytics control** | ~ Analytics are on by default; no fine-grained opt-out | ✓ Analytics toggle in settings | StudyHall offers choice; Teams defaults-on. |

**Key positioning:** "Teams is built for enterprise IT. StudyHall is built for students who want control over their data."

### vs. Notion (Tier 2 secondary benchmark)
| Dimension | Notion | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Data export** | ✓ Export workspace (HTML/Markdown/PDF); strong feature for data portability | ✓ Account data export; similar concept | Both strong; Notion's is more mature (entire workspace). StudyHall's is account-scoped. |
| **Profile privacy** | ~ Notion profiles are workspace-scoped; limited cross-workspace privacy controls | ✓ StudyHall's profile visibility is cross-server configurable | StudyHall's privacy is finer-grained. |
| **Deletion** | ✓ Workspace deletion exists; account deletion deletes all linked workspaces | ✓ StudyHall: account deletion deletes all server membership + data | Parity. Both allow clean deletion. |
| **Transparency** | ~ Notion's privacy policy is readable; compliance-focused | ✓ StudyHall's in-app privacy panel is even more transparent for students | StudyHall is clearer. |
| **Advertising** | ✗ Notion is venture-backed; may introduce ads in future (not current, but risk) | ✓ No ads; StudyHall's business model TBD but not ad-driven | StudyHall safer for privacy; Notion is unclear long-term. |

**Key positioning:** "Notion lets you export your notes. StudyHall lets you export your academic data, including everything you've done in study groups."

### vs. Telegram (Tier 2 secondary benchmark)
| Dimension | Telegram | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Privacy stance** | ✓ Strong privacy posture (no ads, no tracking, user-focused company mission) | ✓ Same privacy stance (no ads, student-focused) | Parity. Both are privacy-protective. |
| **Data export** | ~ Telegram has GDPR export, but it's account-level, not conversation-granular | ✓ StudyHall will offer granular export (messages, assignments, etc.) | StudyHall's export is more granular (H2 feature 24). |
| **Group privacy** | ✗ Group messages lack E2E encryption (only 1-on-1 have E2E); groups are server-side encrypted only | ✓ (H3 future) Message encryption planned; MVP is server-side encrypted | Telegram has E2E for 1-on-1; StudyHall will add for groups (H3). Telegram ahead for now. |
| **Data deletion** | ✓ Account deletion option; message history can be deleted | ✓ StudyHall offers account deletion + grace period | Parity. |
| **Transparency** | ~ Telegram's privacy is strong but less transparent in UI (settings are deeper) | ✓ StudyHall's in-app privacy settings are user-friendly | StudyHall's UX is clearer. |

**Key positioning:** "Telegram is privacy-protective for messaging. StudyHall adds assignment tracking and academic-first tools to that privacy-first foundation."

---

## Offline-first behavior

**Privacy settings:**
- Toggling privacy settings while offline queues the change locally.
- On reconnect, `PATCH /api/me/privacy` is flushed.
- Profile visibility may be out-of-sync briefly on reconnect (user's old visibility cached in other members' browsers until they refresh).

**Data export:**
- Export job cannot be initiated while offline (server-side process required).
- Button disabled with tooltip: "Go online to request a data export."

**Account deletion:**
- Deletion request cannot be initiated while offline.
- Button disabled with tooltip: "Go online to delete your account."

---

## Ownership & Review Checklist

- **Product review (P-2 Spec):** Feature 16 spec embedded in task. Feature 24 (compliance) scoped separately; this page is H2 prep. Privacy-first positioning confirmed.
- **Legal review:** Privacy policy aligned with settings (no contradictions). GDPR / FERPA / COPPA compliance considered (even if H2 enforcement; MVP foundation is correct).
- **Design review (D-3):** Confirmation modals designed (dark theme, clear warnings). Data types collapsible list approved. Toggles and radio buttons styled consistently.
- **Engineering review (B-4):** Async data export job designed (compression, email, time-limited links). Deletion verification flow (email token) secure. Soft-delete + grace period implementation clarified.
- **Security review:** Deletion token is one-time use + expires. Export link is time-limited (7 days) + requires valid session. Rate limits on data export (1/month) to prevent abuse.
- **QA review (T-2 Integration):** Test matrix: toggle changes persist, radio selection auto-saves, export succeeds (async), deletion email is sent + link works, grace period recovery, offline queuing, session expiry redirect.
- **Accessibility audit (T-3):** All toggles and radio buttons have ARIA labels. Focus states visible. Warning modals have sufficient contrast. Keyboard navigation (Tab, Enter, Escape) works end-to-end.
- **Launch checklist (V-1 Review):** Confirmation email templates written. Export email template written. Privacy policy link functional. Help docs prepared.

---

## Implementation notes

### Tech stack guidance (for B-block)
- **Async export job:** Use a task queue (e.g., Bull, Celery, Google Cloud Tasks) to aggregate user data. Trigger on `POST /api/me/data-export`; job runs in background; email sent when complete.
- **Export format:** Generate JSON files (profile.json, messages.json, assignments.json, etc.) + optional folders (attachments/ if user selected). Compress to `.zip` + store in object storage (S3, GCS, etc.) with time-limited (signed URL) download link.
- **Deletion verification:** Generate secure one-time tokens (e.g., `crypto.randomBytes(32).toString('hex')`); send via email link; validate on `DELETE /api/me/account` endpoint. After verification, mark account for deletion (soft delete) or schedule hard delete after grace period.
- **Grace period:** If implementing grace period (recommended for GDPR/privacy trust), store deletion state (pending, confirmed, recoverable until [date]). Cron job to hard-delete after grace period expires.
- **Real-time export status (optional):** Use WebSocket subscription or polling to update export status in "Recent exports" section as async job progresses.

### Design system tokens
- **Panels:** Border `--border-subtle`, padding `--spacing-4`
- **Radio/Toggle labels:** Body Bold (font weight 600)
- **Hint text:** `--color-text-subtle` (lighter gray)
- **Destructive button (Delete account):** Background `--color-error`, text white
- **Warning modal:** Border `--border-warning` (yellow/orange), icon `--color-error` (red)
- **Success toast:** `--color-success` (green)
- **Collapsible toggle:** Icon rotates 180° on expand (CSS transform)

### Accessibility considerations
- **Toggles and radio buttons:** Use native HTML `<input type="radio">` + `<input type="checkbox">` or accessible custom components (Headless UI, Radix UI). All must have associated `<label>` elements.
- **Confirmation modals:** Use `<dialog>` element or ARIA `role="alertdialog"` (with `aria-modal="true"`). Focus trapped inside modal. Close on Escape.
- **Headings:** Page title = H1. Panel headings = H2. Subsection headings = H3 (if used).
- **Color:** Do not rely on color alone for warnings (red button alone isn't enough; include warning icon + text).
- **Links:** All links have visible focus states (outline or underline).

---

## Deferred features (H2+)

1. **Analytics granularity:** Allow students to toggle specific analytics (e.g., "Feature usage" on, "Crash reports" off).
2. **Email notification frequency:** Dropdown to choose: "All reminders", "Daily digest", "Weekly digest", "None".
3. **Device-specific settings:** Show list of devices that have accessed the account; allow "sign out from this device" per device.
4. **Login security:** Two-factor authentication (TOTP, WebAuthn) setup + backup codes.
5. **Account recovery:** Show account recovery options (phone number, recovery email) if account is compromised.
6. **Connected apps / OAuth:** Show apps with access to StudyHall account; revoke access per app (if StudyHall APIs grow).
7. **Audit log:** Append-only log of all privacy settings changes + data export requests (for transparency + compliance).
8. **End-to-end encryption:** Toggle to enable E2E encryption for group messages (H3 moat feature).
9. **Advanced consent:** Granular consent toggles for each data type (e.g., consent to store voice room metadata separately from message content).

---

## Cross-reference

- **Feature list:** Feature 16 (privacy controls), 24 (compliance export/delete, H2), 1 (auth), 14 (notifications related to email settings)
- **User flows:** F1 (signup may prompt privacy settings review; deferred to post-signup UX in MVP)
- **Tools/modules:** Authentication, User / profile management, Privacy controls
- **Related pages:** Settings-profile (identity); landing (privacy mentioned as differentiator); legal pages (/privacy policy, /terms)
- **Competitive benchmarks:** Discord (ad-driven, weak privacy), Teams (institution-controlled), Notion (workspace export), Telegram (privacy-protective)

---

## Why privacy is the differentiator

StudyHall's positioning centers on **student agency**. This page operationalizes that:

1. **vs. Discord:** Discord monetizes students via ads (Quests) + behavioral data collection (Sep 2025). StudyHall says: "No ads, no tracking, no data brokers. Your data is yours."
2. **vs. Teams:** Teams centralizes privacy in IT's hands (institution controls who sees what). StudyHall says: "You control your privacy, not IT."
3. **vs. Notion:** Notion is document-focused (no privacy surfacing needed). StudyHall says: "Academic data is sensitive; we make privacy controls visible and easy."

**Student testimonial (for future use):** "Discord's ads make me uncomfortable. I liked that StudyHall respects my privacy from day one — I can download my data, control who sees my profile, and delete everything if I want to."

This page is a trust statement. It's the proof that StudyHall means what it says about being student-first.

