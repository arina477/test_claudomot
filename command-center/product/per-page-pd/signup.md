# Signup — `/signup`

## Purpose

The entry point for new students to create a StudyHall account. This page captures email and password, with optional invite-link pre-fill if the student was invited to a server. Success means the account is created and the user advances to email verification (F1, step 1→2).

## Audience

**Primary:** P1 Student Member (unauthenticated, first-time)  
**Secondary:** P1 Student Member invited via link (unauthenticated, but with invite context pre-filled)  
**Auth state:** Anonymous

## Entry points

- User opens the desktop app for the first time → sees unauthenticated landing with "Sign up" button
- User clicks an invite link in email/chat → lands at `/signup?invite=<code>` with server name pre-populated

## Content sections (top-to-bottom)

1. **Header** — StudyHall logo (dark-themed, teal accent) + "Create your account" title
2. **Server preview** (if invite link present) — card showing server icon + name + member count + "You're invited to join" accent
3. **Email input** — label "Email", placeholder "you@university.edu", type email
4. **Password input** — label "Password", type password (masked), real-time strength indicator below (red/yellow/green bar + "Weak" / "Fair" / "Strong" label; requirement text "12+ chars, mix of upper/lower/number/symbol")
5. **Confirm password input** — label "Confirm password", type password, validation message "Passwords match" (green) or "Passwords don't match" (red)
6. **Sign up button** — primary accent color, disabled until email valid + password strong + confirm matches
7. **Sign-in link** — "Already have an account? Log in" (text link to `/login`)
8. **Fine print** — "By signing up, you agree to our [Terms](/) & [Privacy Policy](/privacy)"

## Interactions

| Element | Action | Destination / Effect |
|---------|--------|---------------------|
| Email input | Type | Client-side RFC 5322 validation; show "✓ Valid" or "✗ Invalid format" inline |
| Password input | Type | Real-time zxcvbn strength calculation; update bar + label; disable sign-up button if weak |
| Confirm password | Type | Compare to password; show match status; update button enable state |
| Sign up button | Click | `POST /api/auth/signup` with `{email, password, invite_code?}` → on 201, redirect to `/verify?email=<email>`; on error (409 duplicate, 400 weak password, 429 rate limit), show inline error message |
| "Already have an account?" link | Click | Navigate to `/login` |
| Privacy link | Click | Open privacy policy in modal or new tab |

## Data requirements

- `POST /api/auth/signup` — Input: `{email: string, password: string, invite_code?: string}` → Output: `{user_id: uuid, email: string, requires_email_verification: true}` or error `{code: string, message: string}`
  - Validate email uniqueness server-side; return 409 if duplicate
  - Reject password <12 chars or insufficient complexity; return 400
  - If `invite_code` present, validate and attach user to server's default member role
  - Rate limit: max 5 signup attempts per IP per hour (return 429)
- `GET /api/invites/<invite_code>` (if invite link in URL) — Returns `{server_id, server_name, icon_url, member_count}` for preview card; return 404 if expired/invalid
- Password strength: client-side zxcvbn or similar; server-side re-check on `POST /api/auth/signup`
- Email validation: client-side RFC 5322; server-side MX check optional at v6

## Empty / error / loading states

| State | Visual / Messaging |
|-------|-------------------|
| **Initial / empty** | All inputs blank; password strength bar absent; "Sign up" button disabled (gray); no server preview (invite link not present); connection indicator (top-right) shows online |
| **Email typing** | Real-time validation: "✓ Valid" (green) or "✗ Invalid email format" (red) below input |
| **Weak password** | Strength bar red; label "Weak"; button disabled; tooltip "Password must be 12+ chars with uppercase, lowercase, number, and symbol" |
| **Mismatched confirm** | Red border on confirm input; message "Passwords don't match" below input; button disabled |
| **All valid, ready** | Strength bar green; all borders green; "Sign up" button enabled (teal accent) |
| **Duplicate email error** | Inline alert (red background, light text) "Email already in use. Try logging in or use a different email." (no enum leak) |
| **Weak password error (server reject)** | Inline alert "Password doesn't meet requirements. Use 12+ chars with upper, lower, number, symbol." |
| **Rate limit error** | Inline alert "Too many signup attempts. Try again in a few minutes." |
| **Submitting** | "Sign up" button shows spinner; inputs disabled; no alert |
| **Offline before submit** | Connection indicator (top-right) shows "offline" (red); "Sign up" button disabled with tooltip "Internet required" |
| **Offline after submit** | Inline alert "Connection lost. Please check your internet and retry." (no queue; auth requires online) |
| **Invite link invalid/expired** | Server preview card shows error "Invite expired or invalid. You can still sign up and join later." (allow signup to proceed) |

## Responsive breakpoints

- **Narrow app window** (<600px): form full width with 20px side margins; input fields stack vertically; server preview card takes full width
- **Normal window** (600–900px): form centered, 450px max-width; inputs 100% of form width
- **Wide window** (>900px): form centered, 500px max-width; unchanged
- **Mobile**: Out of scope per feature-list.md

## Success metrics

- Page renders in <2s (including logo animation)
- Email validation is instant (client-side, <100ms)
- Password strength meter updates on every keystroke (<100ms)
- "Sign up" button transitions to enabled state once all validations pass (no lag)
- Successful signup redirects to `/verify?email=<email>` within 3s (network latency included)
- Invite link pre-fill appears in preview card within 1s of page load
- Error messages are specific and actionable, not generic (e.g., "Email already in use" not "Error 409")
- Dark theme is applied from first render (no flash of light theme)
- Keyboard navigation works (Tab → Enter to submit)
- Form works offline gracefully (button disabled with explanation, not hidden)

## Competitor comparison

| Dimension | Discord | Teams | StudyHall |
|-----------|---------|-------|-----------|
| **Email capture** | Yes, required | Yes, required (or OAuth) | Yes, required |
| **Password strength** | No in-form feedback | Strength meter inline | Real-time zxcvbn meter (red/yellow/green bar + requirement text) |
| **Invite link integration** | Separate flow; not pre-filled on signup | Separate flow; not pre-filled | Pre-filled server preview on `/signup?invite=<code>`; first-class citizen |
| **Social OAuth** | Yes (Discord, Google) | Microsoft account required or email | Email-only (privacy wedge; no tracking pixels from third parties) |
| **Confirm password** | No; must login to verify | No; email verify does this | Yes; UX benefit (reduces typos, faster email verify) |
| **Theme** | Dark by default (2024+) | Light by default; dark mode opt-in | Dark-first throughout (no light option in MVP) |
| **Privacy positioning** | Collects behavioral data for ads | Enterprise default; ad-free | No ads; no 3rd-party data; strong privacy-by-default (studied appeal for schools) |

---

**Notes for implementation:**
- Avoid upfront upsell (Discord shows Nitro banner; Teams upsells premium); focus on account creation speed
- Confirm-password field reduces support load from typos
- Invite link pre-fill proves StudyHall's server-first (not user-first) design
- Dark theme from frame one reinforces brand identity and student preference
