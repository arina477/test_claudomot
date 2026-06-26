# Forgot Password — `/forgot-password` and `/reset-password`

## Purpose

A two-step password recovery flow for students who've forgotten their credentials. Step 1 (`/forgot-password`) requests a reset email. Step 2 (`/reset-password?token=<jwt>`) validates the token and sets a new password. Success means the user can log in with their new password (F1 recovery path).

## Audience

**Primary:** P1 Student Member (unauthenticated, forgot password)  
**Secondary:** P2 Server Organizer (unauthenticated, forgot password)  
**Auth state:** Anonymous

## Entry points

- User clicks "Forgot your password?" from `/login`
- User navigates directly to `/forgot-password`
- User clicks a password-reset link in an email → lands at `/reset-password?token=<jwt>` (single-use JWT encodes user_id + expiry)

## Content sections (top-to-bottom)

### `/forgot-password` (request reset email)

1. **Header** — StudyHall logo + "Forgot your password?" title
2. **Email input** — label "Enter your email", placeholder "you@university.edu", type email
3. **Send reset email button** — primary accent color, disabled until email field has text
4. **Info text** — "We'll send a link to reset your password. Check your spam folder if you don't see it."
5. **Back to login link** — "Back to login" (text link to `/login`)
6. **Fine print** — "By using this service, you agree to our [Terms](/) & [Privacy Policy](/privacy)"

### `/reset-password` (enter new password)

1. **Header** — StudyHall logo + "Reset your password" title
2. **New password input** — label "New password", type password (masked), real-time strength indicator (red/yellow/green bar + requirement text "12+ chars, mix of upper/lower/number/symbol")
3. **Confirm password input** — label "Confirm password", type password, validation message "Passwords match" (green) or "Passwords don't match" (red)
4. **Reset password button** — primary accent color, disabled until both fields match and password is strong
5. **Back to login link** — "Back to login" (text link to `/login`; if token invalid/expired, keep link but disable form with error message)

## Interactions

### `/forgot-password`

| Element | Action | Destination / Effect |
|---------|--------|---------------------|
| Email input | Type | Enable "Send reset email" button once field is not empty; no client-side validation |
| Send reset email button | Click | `POST /api/auth/forgot-password` with `{email: string}` → on 200, show success message "Check your email for a reset link. Link expires in 24 hours." + redirect to `/login` after 5s (offer "Go to login" link); on error (429 rate limit), show "Try again later" (generic, no enum leak) |
| Back to login link | Click | Navigate to `/login` |

### `/reset-password`

| Element | Action | Destination / Effect |
|---------|--------|---------------------|
| Page load | Validate token | If token invalid/expired, show error "Link expired or invalid. Request a new reset." + disable form + offer link to `/forgot-password`. If token valid, enable form. |
| New password input | Type | Real-time zxcvbn strength calculation; update bar + label; disable reset button if weak |
| Confirm password input | Type | Compare to new password; show match status; update button enable state |
| Reset password button | Click | `POST /api/auth/reset-password` with `{token: string, password: string}` → on 200, show "Password reset successfully. Redirecting to login..." + redirect to `/login` after 2s; on error (400 invalid_token, 400 weak_password, 429 rate limit), show inline error message + clear form (except if token error, disable form) |
| Back to login link | Click | Navigate to `/login` |

## Data requirements

- `POST /api/auth/forgot-password` — Input: `{email: string}` → Output: `{success: true, message: string}` or error `{code: string, message: string}`
  - **Always return 200 + success message** regardless of whether email exists (no enum leak)
  - Email transactional service sends reset link: `https://studyhall.local/reset-password?token=<jwt>`
  - JWT payload: `{user_id: uuid, exp: now + 24h, purpose: "password_reset"}`
  - Rate limit: max 3 reset requests per email per hour (return 429)
  - Email subject: "Reset your StudyHall password"
  - Email body: plain text or simple HTML; includes link + code (QR optional)

- `POST /api/auth/reset-password` — Input: `{token: string, password: string}` → Output: `{success: true, message: string}` or error `{code: string, message: string}`
  - Validate token signature, expiry, and purpose
  - Reject if token invalid (400 invalid_token) or expired (400 expired_token)
  - Reject password if <12 chars or insufficient complexity (400 weak_password)
  - Invalidate all existing sessions for the user after password reset (logout everywhere)
  - Mark token as consumed (single-use; return 400 if already used)
  - Rate limit: max 5 reset attempts per IP per hour (return 429)

- Email verification: transactional send latency <60s
- Token validity: 24 hours from issuance
- Password strength: client-side zxcvbn; server-side re-check on POST

## Empty / error / loading states

### `/forgot-password`

| State | Visual / Messaging |
|-------|-------------------|
| **Initial / empty** | Email field blank; "Send reset email" button disabled (gray); connection indicator shows online |
| **Email typed** | "Send reset email" button enabled (teal accent) |
| **Submitting** | Button shows spinner; input disabled |
| **Success** | Message "Check your email for a reset link. Link expires in 24 hours." (green background); auto-redirect to `/login` after 5s with "Go to login now" link |
| **Rate limit (429)** | Inline alert "Too many reset attempts. Try again in 1 hour." |
| **Generic error** | Inline alert "We couldn't process your request. Try again later." (no enum leak) |
| **Offline before submit** | Connection indicator shows "offline" (red); button disabled with tooltip "Internet required" |
| **Offline after submit** | Inline alert "Connection lost. Check your internet and retry." |

### `/reset-password`

| State | Visual / Messaging |
|-------|-------------------|
| **Page load, valid token** | Form enabled; info text "Enter a new password for your StudyHall account." |
| **Page load, invalid token** | Error message "This link is invalid or expired. Request a new password reset." (red alert); form fully disabled (inputs grayed out, button disabled); offer link "Request a new reset" to `/forgot-password` |
| **Page load, expired token** | Same as invalid token |
| **Typing new password** | Real-time strength meter updates (red/yellow/green bar); "Reset password" button disabled if weak |
| **Mismatched confirm** | Red border on confirm input; message "Passwords don't match" below input; button disabled |
| **All valid, ready** | Strength bar green; all borders green; "Reset password" button enabled (teal accent) |
| **Submitting** | Button shows spinner; inputs disabled |
| **Success** | Message "Password reset successfully. Redirecting to login..." (green); auto-redirect to `/login` after 2s |
| **Weak password error** | Inline alert "Password doesn't meet requirements. Use 12+ chars with upper, lower, number, symbol." |
| **Token expired on submit** | Inline alert "Link expired. Request a new password reset." + disable form + offer link to `/forgot-password` |
| **Rate limit (429)** | Inline alert "Too many reset attempts. Try again in 1 hour." |
| **Offline before submit** | Button disabled with "Internet required" |
| **Offline after submit** | Inline alert "Connection lost. Check your internet and retry." |

## Responsive breakpoints

- **Narrow app window** (<600px): form full width with 20px side margins
- **Normal window** (600–900px): form centered, 400px max-width
- **Wide window** (>900px): form centered, 450px max-width
- **Mobile**: Out of scope per feature-list.md

## Success metrics

- `/forgot-password` page renders in <2s
- Email field accepts text immediately (no validation delay)
- "Send reset email" button enables/disables based on field content (instant)
- Success message appears within 2s of submit (network latency included)
- Reset email arrives within 60s (transactional send SLA)
- Reset link in email is valid for exactly 24 hours from send time
- Reset link is single-use (second click returns "link expired" error)
- `/reset-password?token=<jwt>` auto-loads and shows form (no extra click needed)
- Password strength meter updates on every keystroke (<100ms)
- On successful reset, user can log in with new password within 2s
- Old sessions are invalidated (logout everywhere; user must re-login on other devices)
- Dark theme is applied throughout
- Keyboard navigation works (Tab → Enter to submit)
- No password or token appears in logs, URLs (except the token in the email link, which is intended)

## Competitor comparison

| Dimension | Discord | Teams | StudyHall |
|-----------|---------|-------|-----------|
| **Email-based reset** | Yes | Yes | Yes |
| **Reset link delivery** | Email with link | Email with link | Email with link + single-use JWT |
| **Link validity** | Unknown (likely 24–48h) | 24h | 24h |
| **Page after email click** | Embedded reset form (in-browser, same origin) | Embedded reset form (in-browser) | Separate `/reset-password?token=<jwt>` page (bookmarkable, supports copy-paste) |
| **Password strength feedback** | No | Strength meter on reset page | Real-time zxcvbn meter (red/yellow/green bar + requirement text) |
| **Token re-use** | Unknown | Single-use | Single-use (returns error if re-used) |
| **Logout everywhere** | Unknown | Typically yes (depends on policy) | Yes (all sessions invalidated on password reset) |
| **Account enum protection** | Generic "email not found" or similar | Likely yes | Generic success message regardless of email existence |
| **Theme** | Dark by default | Light by default | Dark-first |

---

**Notes for implementation:**
- Avoid email enumeration by returning the same "success" message whether the email exists or not
- Do not include password reset link in SMS or other side channels (email-only)
- Mark reset tokens as single-use; attempting reuse should fail gracefully
- Invalidate all user sessions after password reset (security best practice; prevents attacker from keeping backdoor access if they knew the old password)
- Consider sending a "password changed" notification email after successful reset (helps users detect unauthorized resets)

---
**Approved design (v9):** `design/forgot-password.html`
