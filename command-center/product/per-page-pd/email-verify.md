# Email Verify — `/verify`

## Purpose

The email verification page for newly signed-up students. After signup, users must prove email ownership by entering a 6-digit code (or clicking an email link). Success means the email is verified, the account is fully activated, and the user proceeds to profile setup or home (F1, step 2→3 or 5).

## Audience

**Primary:** P1 Student Member (partially authenticated, post-signup)  
**Secondary:** P2 Server Organizer (partially authenticated, post-signup)  
**Auth state:** Unauthenticated but email-pending-verification (can access verification flow only)

## Entry points

- Redirected from `/signup` after successful account creation → `/verify?email=<email>`
- Clicks email verification link in verification email → `/verify?token=<jwt>` (auto-verifies, redirects to home after 2s)
- Navigates directly to `/verify` (redirects to `/login` if already verified or no pending verification)

## Content sections (top-to-bottom)

1. **Header** — StudyHall logo + "Verify your email" title
2. **Email display** — read-only, masked (e.g., "j***@example.com") for privacy + confirmation
3. **Verification method selector** (optional, visual):
   - Tab 1: "Enter code" (default active)
   - Tab 2: "Use email link" (info text: "We also sent a link you can click directly")
4. **Six-digit code input** — 6 separate character boxes (50–60px each, auto-tabbing)
   - Label above: "6-digit code"
   - Info text below: "Enter the code we sent to [email]. It expires in 10 minutes."
5. **Verify button** — primary accent color, disabled until all 6 boxes filled
6. **Resend code section** — "Didn't receive a code?" + "Resend code" link (rate-limited, shows 60s countdown)
7. **Alternative section** — "or use the verification link sent to your email"
8. **Back to login link** — (optional fallback) "Already verified? Go to login" (if user navigates back after verifying)

## Interactions

| Element | Action | Destination / Effect |
|---------|--------|---------------------|
| Code boxes | Type digit | Auto-focus to next box; Backspace clears current + focuses previous; Tab moves forward; Shift+Tab backward |
| Code boxes | Paste multi-digit string | Auto-distribute to boxes (e.g., paste "123456" fills all 6 boxes) |
| Verify button | Click | `POST /api/auth/verify-email` with `{email: string, code: string}` → on 200, show "Email verified! Setting up your profile..." + redirect to `/home` or next onboarding step after 2s; on error (400 invalid_code, 400 expired_code, 429 too_many_attempts), show inline error + clear boxes (or disable form if too many attempts) |
| Resend code link | Click | `POST /api/auth/resend-email-verification` with `{email: string}` → on 200, show "Sent! Check your email." + disable link for 60s with countdown timer; on error (429 rate limit), show "You've sent too many codes. Try again in 1 hour." |
| Email link (if clicked from email) | Click → page load | Token auto-verifies server-side; page redirects to `/home` after 2s with message "Email verified! Redirecting..." (no manual action needed) |
| Email display | (read-only) | Shows masked email for confirmation (e.g., "j***@example.com"); user can verify they used the right email |

## Data requirements

- `POST /api/auth/verify-email` — Input: `{email: string, code: string}` → Output: `{success: true, user_id: uuid, message: string}` or error `{code: string, message: string}`
  - Validate code against server-stored 6-digit code for the email
  - Reject with 400 invalid_code if code incorrect
  - Reject with 400 expired_code if code >10 minutes old
  - Reject with 429 too_many_attempts if >3 failed attempts in 30 minutes (disable form; force resend)
  - On success, mark email_verified = true for user; return 200
  - Do NOT auto-login; user must still call `/login` after verification

- `GET /api/auth/verify-email-token?token=<jwt>` — Input: JWT token from email link → Output: `{success: true, user_id: uuid, message: string}` or error
  - Validate token signature, expiry, and purpose
  - Reject with 400 invalid_token if token malformed or wrong purpose
  - Reject with 400 expired_token if token >24 hours old
  - Mark token as consumed (single-use)
  - On success, mark email_verified = true; return 200 + auto-redirect to `/home`
  - (Page redirects client-side after 2s with "Email verified! Redirecting...")

- `POST /api/auth/resend-email-verification` — Input: `{email: string}` → Output: `{success: true, message: string}` or error `{code: string, message: string}`
  - Generate new 6-digit code; store with 10-minute expiry
  - Send transactional email with code + link (same email as signup)
  - Rate limit: max 5 resends per 24h per email (return 429 if exceeded)
  - On success, return 200 + "Sent!" message

- Email verification code: 6 random digits (0–9), no letters (easier for students to read/type)
- Code validity: 10 minutes from issuance
- Token (email link): JWT with payload `{email: string, exp: now + 24h, purpose: "email_verification"}`, single-use
- Email service: transactional (send latency <60s)

## Empty / error / loading states

| State | Visual / Messaging |
|-------|-------------------|
| **Page load, valid email** | Six code boxes visible, all empty; "Verify" button disabled; "Resend code" link enabled; info text shows email expiry (10 min); connection indicator shows online |
| **Page load, token param (email link)** | Show "Email verified! Redirecting..." + spinner; auto-redirect to `/home` after 2s (no manual input needed) |
| **Page load, invalid token** | Error message "This link is invalid or expired. Resend a new code and try again." (red alert); all boxes disabled (grayed); offer "Resend code" link |
| **Typing code** | Real-time digit entry with auto-advance; "Verify" button enabled once all 6 boxes filled |
| **Invalid code (401)** | Shake animation on all boxes (brief visual feedback); error message "Code is incorrect. Try again." (red alert below boxes); boxes remain filled (allow quick retry) |
| **Expired code (400)** | Error message "Code expired. Request a new one." (red alert); clear all boxes; offer "Resend code" link |
| **Too many attempts (429)** | Error message "Too many attempts. Resend a new code and try again." (red alert); disable all boxes + "Verify" button (force resend) |
| **Submitting** | "Verify" button shows spinner; boxes disabled |
| **Success** | Message "Email verified! Setting up your profile..." (green); spinner; auto-redirect to `/home` after 2s |
| **Resending code** | "Resend code" link shows spinner or "Sending..." state; link disabled; show countdown timer (60s → 59 → 58 → ... → "Ready", then link re-enabled) |
| **Rate limit on resend (429)** | Inline alert "You've sent too many codes. Try again in 1 hour." |
| **Already verified** | If user navigates back to `/verify` after verification, show "Already verified! Redirecting to home..." + auto-redirect to `/home` |
| **Offline before submit** | Connection indicator shows "offline" (red); "Verify" button disabled with tooltip "Internet required to verify" |
| **Offline after submit** | Inline alert "Connection lost. Check your internet and retry." |

## Responsive breakpoints

- **Narrow app window** (<600px): six code boxes stack to 48px × 48px each; 3 boxes per row if needed; centered
- **Normal window** (600–900px): six code boxes 60px × 60px each; all on one row; centered
- **Wide window** (>900px): six code boxes 60px × 60px; unchanged
- **Mobile**: Out of scope per feature-list.md

## Success metrics

- Page renders in <2s
- Email is masked correctly (j***@example.com format, not plaintext)
- Typing a digit auto-advances to next box (UX delta vs typing into a single input)
- Backspace clears current box and focuses previous (intuitive navigation)
- Pasting "123456" into the first box auto-distributes to all 6 boxes
- All 6 boxes must be filled before "Verify" button enables (no premature submit)
- Verification succeeds within 2s of submit (network latency included)
- Invalid code is rejected with specific message, boxes remain filled for quick retry
- Expired code shows specific message and clears boxes (prompts resend)
- Too many attempts (3+) disables form and forces resend
- Resend countdown timer is accurate and blocks re-send until 60s elapsed
- Rate limit on resend enforces max 5 per 24h (return 429 after 5th attempt)
- Email verification link (from email) auto-verifies without user code entry
- Email verification link is single-use (second click returns "expired" error)
- On success, user is redirected to `/home` or next onboarding step (profile setup)
- Dark theme throughout
- Keyboard navigation works (Tab between boxes, Shift+Tab backward, Enter to submit)
- Code boxes are large enough for touch (48–60px; out of scope for MVP but should be accessible)

## Competitor comparison

| Dimension | Discord | Teams | StudyHall |
|-----------|---------|-------|-----------|
| **Email verification** | Not required for free accounts (Nitro can enable) | Required; email link + one-click verification | Required; 6-digit code input + email link backup |
| **Verification method** | Email link (if enabled) | Email link only | Dual: 6-digit code (main) + email link (alternative) |
| **Code format** | N/A | N/A | 6 digits (0–9); easy to read/type |
| **Code boxes** | N/A | N/A | 6 separate character boxes with auto-advance (better UX than single input) |
| **Code expiry** | N/A | Typically 24h | 10 minutes (stricter for security; balance with usability) |
| **Resend limit** | N/A | Typically unlimited or rate-limited | Max 5 per 24h (prevent abuse) |
| **Single-use enforcement** | N/A | Typically yes | Yes (token consumed after first use) |
| **Theme** | Dark by default | Light by default | Dark-first |
| **Privacy** | No PII leak (email masked) | Likely shows full email | Email masked (e.g., j***@example.com) |
| **Accessibility** | Link-based (no typing) | Link-based | Dual method accommodates both preferences + accessibility |

---

**Notes for implementation:**
- 6-digit codes are a good UX compromise: longer than 4 (more secure), shorter than 8 (faster to type)
- Auto-advance to next box on digit entry is a key UX win vs a single input field
- Email link is a fallback for users who don't want to type codes (reduces support burden)
- Masking the email (j***@example.com) prevents typos and gives user confidence they signed up with the right email
- 10-minute code expiry is standard in fintech/banking (students expect it)
- Single-use tokens prevent code reuse even if someone else has access to the email
- Consider sending a "new device signed in" notification after verification (helps users detect account takeover attempts)
