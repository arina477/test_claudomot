# Login — `/login`

## Purpose

The sign-in page for returning students. After email verification, users enter their credentials here to access their servers, messages, and study rooms. Success means the session is established and the user navigates to the home server rail (F1, resuming from step 5).

## Audience

**Primary:** P1 Student Member (unauthenticated, returning)  
**Secondary:** P2 Server Organizer (unauthenticated, returning)  
**Auth state:** Anonymous

## Entry points

- User opens the desktop app after signup → "Log in" tab on unauthenticated landing
- User clicks "Already have an account? Log in" from `/signup`
- User's session expires during use → auto-redirects to `/login` with message "Your session expired. Please log in again."

## Content sections (top-to-bottom)

1. **Header** — StudyHall logo + "Welcome back" title
2. **Email input** — label "Email", placeholder "you@university.edu", type email
3. **Password input** — label "Password", type password (masked bullets, not plaintext)
4. **Remember me checkbox** — label "Remember me for 30 days" (client-side only; stores session token in localStorage if checked)
5. **Log in button** — primary accent color, disabled until both fields have content
6. **Forgot password link** — "Forgot your password?" (text link to `/forgot-password`)
7. **Sign-up link** — "Don't have an account? Sign up" (text link to `/signup`)
8. **Fine print** — "By logging in, you agree to our [Terms](/) & [Privacy Policy](/privacy)"

## Interactions

| Element | Action | Destination / Effect |
|---------|--------|---------------------|
| Email input | Type | No client-side validation (server owns the record); enable "Log in" once both fields filled |
| Password input | Type | Masked display; enable "Log in" button once both fields filled |
| Remember me checkbox | Check | Client-side flag; if checked, session token persists in localStorage (enables login across app restarts) |
| Log in button | Click | `POST /api/auth/login` with `{email, password, remember_me?: boolean}` → on 200, set httpOnly cookie + in-memory session token + redirect to `/` (home / server rail); on error (401 invalid, 403 locked, 429 rate limit), show inline error message; disable button during request |
| Forgot password link | Click | Navigate to `/forgot-password` |
| Sign up link | Click | Navigate to `/signup` |

## Data requirements

- `POST /api/auth/login` — Input: `{email: string, password: string, remember_me?: boolean}` → Output: `{user_id: uuid, session_token: string, display_name: string, avatar_url?: string, email: string, dark_theme_applied: true}` or error `{code: string, message: string}`
  - Reject with 401 if email not found OR password incorrect (no enum leak — same message for both)
  - Reject with 403 if account is locked (too many login attempts) or email unverified
  - Reject with 429 if rate limit exceeded (max 5 attempts per email per hour)
  - On success, generate JWT session token (1h expiry) + httpOnly cookie (secure, sameSite=Strict)
  - If `remember_me=true`, also return long-lived refresh token (30d expiry) for localStorage storage
- Session token storage:
  - httpOnly cookie: prevents XSS theft; always set on successful login
  - localStorage backup: only if "Remember me" checked; stores refresh token (not auth token)
- User data returned on login: display_name, avatar_url, email (for profile rebuild after app restart)

## Empty / error / loading states

| State | Visual / Messaging |
|-------|-------------------|
| **Initial / empty** | Both inputs blank; "Log in" button disabled (gray); checkbox unchecked; connection indicator (top-right) shows online |
| **Email typed, password blank** | "Log in" button remains disabled |
| **Both fields filled** | "Log in" button enabled (teal accent) |
| **Invalid credentials (401)** | Inline alert (red background) "Email or password is incorrect. Try again or reset your password." (no enum leak: same message if email missing or password wrong) |
| **Account locked (403)** | Inline alert "Too many login attempts. Try again in 15 minutes or reset your password." |
| **Email unverified (403)** | Inline alert "Please verify your email first. Check your inbox for the verification link." (offer resend button to `/verify?email=<email>`) |
| **Rate limit (429)** | Inline alert "Too many requests. Wait a moment and try again." |
| **Submitting** | "Log in" button shows spinner; inputs disabled; no alert |
| **Offline before submit** | Connection indicator shows "offline" (red); "Log in" button disabled with tooltip "Internet required to log in" |
| **Offline after submit** | Inline alert "Connection lost. Please check your internet and retry." (no queue; auth requires online) |

## Responsive breakpoints

- **Narrow app window** (<600px): form full width with 20px side margins; inputs stack vertically
- **Normal window** (600–900px): form centered, 400px max-width
- **Wide window** (>900px): form centered, 450px max-width
- **Mobile**: Out of scope per feature-list.md

## Success metrics

- Page renders in <1.5s
- Email and password inputs are immediately focusable (keyboard navigation works)
- Password field is truly masked (bullets, not cleartext; verify in browser dev tools)
- "Log in" button is enabled once both fields have text (no artificial delay)
- Successful login redirects to home/server rail within 2s (network latency included)
- Session token is set as httpOnly cookie (visible in browser dev tools; cannot be read by JavaScript)
- If "Remember me" checked, session persists after app restart (refresh token works)
- If "Remember me" unchecked, session is cleared after app closes (in-memory only)
- Incorrect credentials are rejected without revealing whether email exists (both 401 cases use same message)
- Password is never logged, never sent in query string, never cached
- Dark theme is applied immediately after login (no flash of light theme)

## Competitor comparison

| Dimension | Discord | Teams | StudyHall |
|-----------|---------|-------|-----------|
| **Email + password** | Yes | Yes (Microsoft or email) | Yes |
| **Remember me** | No explicit checkbox; relies on browser | "Keep me signed in" checkbox | "Remember me for 30 days" checkbox (explicit, opt-in) |
| **Enum leak prevention** | "Invalid email or password" generic message | Multi-step: email check first, then password | Same generic message for both invalid email and wrong password |
| **Post-login redirect** | Server discovery / home | Teams chat | Home server rail (dark theme applied) |
| **Session persistence** | Browser-default (httpOnly cookie) | Microsoft auth session | httpOnly cookie + optional localStorage backup for "Remember me" |
| **2FA / MFA** | Optional (Nitro feature) | Optional (enterprise) | Not in MVP (H1 scope) |
| **Theme** | Dark by default | Light by default | Dark-first (matches signup, no light option) |

---

**Notes for implementation:**
- No multi-step redirect (not like Teams' email-first → password flow); single form is faster
- "Remember me" is opt-in (privacy conscious; students who share devices won't auto-login)
- No password strength feedback (not signup; users are re-entering their password, not creating new)
- No social auth (privacy wedge; all auth is first-party)
- Error messages must not leak whether an email is registered (prevents account enumeration attacks)
