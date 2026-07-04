# T-5 Live E2E — direct-playwright (wave-42, StudyHall)

**Method:** Playwright MCP bypassed (channel-pinned to missing `/opt` chrome). Drove the
deployed app via standalone `playwright-core` Node scripts with explicit
`executablePath`. **Direct-playwright browser launched successfully on the FIRST binary
(`chromium-1208`)** — `chromium-1228` fallback not needed.

- Launch line: `chromium.launch({ executablePath: '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome', headless: true, args: ['--no-sandbox'] })`
- `playwright-core` resolved from npx cache (`/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core`) via absolute-path CommonJS default import in an `.mjs` (repo `node_modules` has no playwright-core).
- Target: `https://web-production-bce1a8.up.railway.app` (web) + `https://api-production-b93e.up.railway.app` (API), HTTP 200.
- Account: Fixture A `studyhall-e2e-fixture@example.com` (userId `21984eb2-…`). Fixture B login broken (single-account run).
- Scripts: `/tmp/t5-*.mjs`. Screenshots: `/tmp/t5-*.png`.

## Scenario results

### 1. Sign in — **PASS**
Login page (`/login`) rendered: "Welcome back / Sign in to your study space", `#email` + `#password`, "Sign In". Filled + submitted → redirected to `/app` (server rail + channel view). Screenshot `/tmp/t5-04-post-login.png`. Only console noise: one `401 POST /auth/session/refresh` on the pre-auth landing page (expected — no session yet); zero errors post-login.

### 2. Student submit → own-submission card → edit/resubmit — **PARTIAL (UI BLOCKED by single-account; backend PASS)**
Root cause: **every one of A's 376 servers has `ownerId === A`** (verified via `GET /servers`). A is organizer everywhere, so the student-side "Your Work" submit form never renders for A — the panel shows the organizer/roster side instead. With fixture B's login broken, no non-organizer member session is available. This sub-scenario's *UI path* is therefore **BLOCKED** (expected per prompt scenario 5; backend proven at T-4).

Verified against the blocker:
- **Assignments panel + submit lifecycle proven at the backend/data layer.** Created assignment via UI (`POST` create dialog: Title/Description/Due/optional Attachment — no grade field). Submission accepted: `POST /assignments/:id/submit` → **200**, returned real record `{id, userId, text, submittedAt, returnedAt, organizerComment}`.
- **Own-submission card renders after submit** (organizer view of it): roster row shows relative time ("just now") + quoted submission text + status pill. Screenshot `/tmp/t5-16…`, `/tmp/t5-20-returned.png`.
- **Edit / in-place resubmit — PASS (backend):** re-`POST /submit` with new text kept the **same submission id** (`0eef8f77…`), replaced `text`, refreshed `submittedAt`, and **reset `returnedAt`→null + cleared `organizerComment`** (resubmit re-opens a returned submission → back to "Awaiting Return"). Confirms the in-place-update + return-fail lifecycle. The student-facing "Edit submission" *button* was not reachable (organizer-only view).

### 3. Submissions roster + Return dialog (manage_assignments) — **PASS**
A holds manage everywhere. Verified on "Fixture Proof Server":
- **Empty state:** freshly-created assignment showed "Submissions Roster 0/0 · No submissions yet · Students haven't submitted…" (screenshot `/tmp/t5-09-created.png`).
- **Populated roster:** after a submission existed → "Submissions Roster **0/1** · just now · "…" · **Awaiting Return**".
- **Return dialog:** `role=dialog`, `aria-modal=true`, `aria-labelledby` set; title "Return to…"; body = optional "acknowledgement note" textarea (NOT a grade); focus moved into the textarea on open. Emerald "Mark Returned" + "Cancel". Screenshot `/tmp/t5-17-return-dialog.png`.
- **Esc closes + focus restore — PASS:** Escape closed the dialog **and returned focus to the "Return" trigger button** (active element after Esc = BUTTON "Return"). Accessibility focus-restore confirmed.
- **Confirm return — PASS:** "Mark Returned" → toast "Submission marked as returned", roster flipped to "**1/1**" with an **emerald "RETURNED" badge + check icon** (computed emerald color verified programmatically + visually in `/tmp/t5-20-returned.png`).

### 4. No grade/score/rubric anywhere — **PASS**
Scanned create dialog, assignment card, roster, own-submission card, and Return dialog for `grade|score|rubric|points|marks` — **zero matches** in every view. Data model fields are `submittedAt / returnedAt / organizerComment` only — no scoring field exists. Return is acknowledgement-only.

### 5. Panel + submit form render fallback — **N/A / satisfied**
Not needed as a pure fallback — panel rendering was directly confirmed (scenarios 3–4). Note the student *submit form* specifically could not be rendered for A (organizer-only), captured under scenario 2.

## Console / network health
- No JS console errors during any authed flow.
- No 4xx/5xx during authed flows **except** one transient **HTTP 429** that appeared only when a diagnostic script looped `GET` over all 376 servers (rate-limiter working as intended); it cleared after cooldown and did not affect any user-flow assertion. The single expected pre-auth `401 /auth/session/refresh` is normal.

## Verdict
Direct-playwright launch: **SUCCESS (chromium-1208, no fallback needed).**
- S1 Sign in: **PASS**
- S2 Student submit/edit: **UI BLOCKED (single-account, organizer-only) / backend PASS**
- S3 Roster + Return (Esc-close, focus-restore, emerald Returned): **PASS**
- S4 No grade/score/rubric: **PASS**
- S5 Panel render: **PASS**

Only gap is the student-side submit UI, blocked strictly by the single-account constraint (fixture B broken) — the same-user path lands A as organizer on all servers. Recommend restoring a second non-organizer fixture to close the student "Your Work" submit + "Edit submission" button UI coverage in a future run.
