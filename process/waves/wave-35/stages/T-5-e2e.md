# Wave 35 — T-5 E2E (settings-privacy flows + stubs + states)

Stage: T-5 (E2E) · Block: T (Test) · Mode: automatic
Target: LIVE prod deploy (deploy_commit `0c71585`)
- web: https://web-production-bce1a8.up.railway.app
- api: https://api-production-b93e.up.railway.app
Fixture: A = `studyhall-e2e-fixture@example.com` (username `studyhallfixturea`) — SuperTokens cookie/session auth via the real web login flow.
Tool: Playwright MCP instances all fail init — configured for `channel: chrome`, and Chrome is not installed (`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`). Per T-5 principle #1 (bundled-chromium fallback preserves the same render + network path), drove the bundled chromium directly (`/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`, playwright@1.61.x). No coverage lost — real browser, real network, real prod stack. **NEVER called browser_close** on any MCP instance.
Evidence screenshots: `process/waves/wave-35/blocks/T/shots/`.

## Overall verdict: PASS (6/6 flows) — all re-run LIVE this stage

| # | Flow | Verdict | Evidence |
|---|---|---|---|
| 1 | /settings/privacy renders (all 4 required elements) | PASS | t6-settings-privacy-viewport.png, t6-settings-privacy-full.png |
| 2 | Honest visibility control (Visible/Hidden) + persist across reload | PASS | PUT+GET /profile/privacy 200; `nobody` still checked after reload |
| 3 | who-can-DM DISABLED affordance (not a working toggle) | PASS | `<div aria-disabled="true">` opacity 0.55, pointer-events:none, 0 enabled inputs |
| 4 | Account-data section + Download my data (JSON) | PASS | studyhall-account-data.json (30,945 bytes, valid JSON) |
| 5 | /privacy + /terms stubs (public, no auth) + footer links | PASS | HTTP 200 both; footer hrefs `/privacy` `/terms` |
| 6 | Empty/error/loading states spot-check | PASS (note) | `sh-animate-pulse` skeleton on shell load; core privacy surface is synchronous single-fetch |

---

## Flow 1 — /settings/privacy renders
Logged in as A (POST-login lands `/app`), navigated `/settings/privacy` → renders. Confirmed present:
- Header "Settings — Privacy"; page heading "Privacy Settings" + honesty statement ("Your data is yours. StudyHall doesn't track you for ads or sell your data.").
- **profile-visibility control** ("Who can see your profile?") — 2 honest options (see Flow 2).
- **account-data section** ("Your data") — real profile (display name, username `@studyhallfixturea`, email) + membership summary. `hasUsername:true, hasEmail:true, hasMembership:true`.
- **disabled who-can-DM affordance** ("Who can message you?" + BETA FEATURE badge) — see Flow 3.
- **"Download my data" button** — see Flow 4.
Console on load: only a single benign `POST /auth/session/refresh -> 401` (unauthenticated pre-login refresh probe fired before session established). No app JS errors.

## Flow 2 — Honest visibility control + persistence
Enumerated `input[name="profile-visibility"]`: exactly **two** enabled radios —
- value `everyone` → label "Visible to classmates / Members of servers you've joined can see your profile card."
- value `nobody` → label "Hidden / Your profile card is hidden from all member lists."

These are **behaviorally honest** (visible-to-co-members vs hidden-from-all), NOT two live-identical "everyone" vs "server-members" choices. The 3-valued server enum (`everyone|server-members|nobody`) stays locked server-side; the UI collapses `server-members` into `everyone` (Visible) per the BOARD Path-A binding. **HONEST — PASS.**

Persist test: clicked "Hidden" → `nobody` radio checked → **PUT /profile/privacy → 200** auto-saved (no separate Save button). Full page reload → **GET /profile/privacy → 200**, `nobody` still checked. **Persisted across reload — PASS.** Restored to `everyone` via UI after the test (clean state).

Network trace (this stage, live):
```
POST /auth/signin        -> 200
GET  /profile/privacy    -> 200
GET  /profile/data       -> 200
PUT  /profile/privacy    -> 200   (on selecting Hidden)
GET  /profile/privacy    -> 200   (after reload — still nobody)
PUT  /profile/privacy    -> 200   (restore to everyone)
GET  /profile/data/export-> 200
```

## Flow 3 — who-can-DM is a disabled affordance (not a toggle)
Isolated the `[aria-disabled="true"]` element (the DM control):
- `<div aria-disabled="true">`, computed `opacity: 0.55`, `pointer-events: none`.
- Contains three static rows ("Anyone in my servers" / "Classmates only" / "No one") + subtext "Takes effect when direct messages arrive." + copy "Direct messaging is rolling out soon. Your preference will be saved and enforced once the feature is available." + "BETA FEATURE" badge.
- **0 enabled interactive descendants** (`input:not([disabled])`, `button:not([disabled])`, enabled `[role=switch]`); **0 radio inputs** inside.
- The ONLY enabled radios on the page are the 2 `profile-visibility` radios.
Looks inactive, is inactive. **Disabled affordance confirmed — PASS.**

## Flow 4 — Account data section + Download my data (self-scoped)
Read-only "Your data" section shows A's real profile / memberships / activity. Clicked "Download my data" → browser download fired:
- **filename: `studyhall-account-data.json`** ✓
- 30,945 bytes, **valid JSON** ✓
- top keys: `profile`, `memberships`, `activitySummary`
- `profile.email = studyhall-e2e-fixture@example.com`, `profile.username = studyhallfixturea` (A's own) ✓
- does **NOT** contain fixture B's email ✓ (self-scoped; structural IDOR proof in T-8)

## Flow 5 — /privacy + /terms stubs + footer links
- `GET /privacy` → HTTP **200**, heading "Privacy Policy", real stub content. Public, renders without auth.
- `GET /terms` → HTTP **200**, heading "Terms of Service", real stub content. Public, renders without auth.
- Footer anchors: `Privacy → /privacy`, `Terms → /terms` (verified hrefs on landing). Both reach the stubs.
**PASS.** Cosmetic note (LOW, pre-existing): stubs read "Last updated: 2024" — same pre-existing © 2024 string flagged non-blocking at B-6; not wave-35-introduced.

## Flow 6 — Empty/error/loading states spot-check
The app-shell load surfaces a `sh-animate-pulse` skeleton row (skeleton-based, not a full-page spinner), satisfying the DESIGN-SYSTEM §113 "skeletons not spinners" intent for reachable content lists. The wave-35 privacy surfaces themselves are synchronous single-fetch and render cleanly. Did not force-reproduce feed/assignments empty-states (not reachable without seeding); B-6 code-read covers those. The "notifications panel" surface does not exist yet — its states AC is N/A (not tested, not faulted).

```yaml
head_signoff:
  stage: T-5
  verdict: PASS
  flows_pass: 6
  flows_fail: 0
  tool: bundled-chromium-1228 (playwright MCP chrome-channel unavailable across all instances; drove bundled per T-5 rule 1; never browser_close)
  findings: []   # no functional defects; cross-stage MEDIUM coverage-gap (no automated regression tests) tracked in findings-aggregate
```
