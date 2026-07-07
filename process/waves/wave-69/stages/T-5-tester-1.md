# T-5 E2E — Tester 1 (Report SUBMISSION flow, spec C AC1 + edge cases)

**Target:** PRODUCTION — web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app
**Fixture:** A = `studyhall-e2e-fixture@example.com` (userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`, username `studyhallfixturea`). Owner of Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c` (holds moderate_members).
**Session:** shared Playwright MCP context (playwright-1) was already authenticated as Fixture A on entry (verified via `GET /me` → 200). Context left OPEN (never called browser_close).
**Channel under test:** `general` = `93982063-4b70-4394-beaf-37168aef7098` (50 msgs: 33 by Fixture A, 17 by Fixture B — all 17 of B's are soft-deleted/`isDeleted:true`).

---

## Per-scenario verdict table

| # | Scenario | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Report a message (submit → 201 + toast + close + double-submit disable) | **PASS** (with defect noted) | Submit flow fully works. Could NOT report a message I did NOT author — all non-own msgs are soft-deleted (no report btn). Used own-msg report btns, which are a DEFECT (see F1). Ran 3× (A/B/C) — no flake. |
| 2 | Report a member (target_type=member → submit → confirmation) | **PASS** (with defect noted) | Reported Fixture B correctly. Ran 2× — no flake. Self-row also carries a Report affordance = same DEFECT class (F1). |
| 3 | Report a server (discovery) | **BLOCKED** (cold-start) | `/discover` empty ("No public communities yet"), 0 cards. Affordance code-verified (F-none): `report-server-btn-${id}` + `<ReportDialog targetType="server">` in ServerDiscoverPage.tsx (lines 171, 824-825). Not a blocker per scenario brief. |
| 4 | Validation + dialog chrome (empty-submit block, Esc, focus trap, mobile bottom-sheet) | **PASS** | Empty submit blocked (no POST, `aria-invalid=true`, "Reason is required"). Esc closes. Focus trap wraps. <640px renders bottom-sheet. |

---

## Evidence

### Screenshots (absolute paths)
- `/home/claudomat/project/t5-01-app-loaded.png` — app loaded, authenticated
- `/home/claudomat/project/t5-02-report-dialog-message.png` — desktop message-report dialog (centered modal, red flag, "Report Message", "0 / 300" counter, focus-ringed textarea, emerald Submit + ghost Cancel)
- `/home/claudomat/project/t5-03-report-dialog-member.png` — member-report dialog ("Report Member" → Fixture B)
- `/home/claudomat/project/t5-04-discover-empty.png` — `/discover` cold-start empty state
- `/home/claudomat/project/t5-05-mobile-bottom-sheet.png` — 375px bottom-sheet (panel anchored to viewport bottom, rounded top 10px / square bottom, full-width)
- `/home/claudomat/project/t5-06-success-toast.png` — post-submit (toast auto-dismissed by capture; toast presence captured via DOM, see below)

### Network captures (POST /reports)
All 201. Payloads carry correct `target_type` + target id, `target_server_id` resolved server-side, and **NO `reporter_id` in request body** (server-derived — confirmed present only in the RESPONSE). Verified reporter_id in every response = Fixture A's userId (session-derived).

| Run | Scenario | target_type | target id in payload | Report id (from response) |
|-----|----------|-------------|----------------------|---------------------------|
| 1A | message | `message` | target_message_id `89be6343-5dff-4904-a572-c659e57a0e05` | `305f4b95-ecc1-4bbf-8c29-00c345b31ea1` |
| 1B | message | `message` | target_message_id `82cd703a-ce52-47c6-9dbd-4a6034770398` | `cd0a2d04-3a9e-42b7-925e-7da3c3b4fc86` |
| 1C | message | `message` | target_message_id `89be6343-5dff-4904-a572-c659e57a0e05` | `ae76e5ea-c1d9-42f5-96e0-bf795f56d761` |
| 2A | member | `member` | target_user_id `da74148e-...` (Fixture B) | `ca337bbe-72a8-4b8d-950c-a2c539fb0556` |
| 2B | member | `member` | target_user_id `da74148e-...` (Fixture B) | `75ec1fb4-f64a-4330-999b-3b4f1b910298` |

Sample verified payload (1A): `{"target_type":"message","target_message_id":"89be6343-...","reason":"..."}` — no reporter_id.
Sample verified payload (2A): `{"target_type":"member","target_user_id":"da74148e-...","target_server_id":"ad62cd12-...","reason":"..."}` — no reporter_id.

### Behavioral confirmations
- **Success toast:** `role="status"`, text "Report submitted successfully." (captured via DOM poll on run C).
- **Dialog auto-closes** on 201.
- **Double-submit disabled:** during in-flight request the `report-dialog-submit` button is `disabled=true` (sampled 30ms after click, run 1B).
- **Char counter:** live-updates ("0 / 300" → "99 / 300" as typed). Max 300 per D-3.
- **Empty-submit validation:** clicking Submit with empty reason fires NO POST, sets `aria-invalid=true` on textarea, shows "Reason is required". Dialog stays open.
- **Esc:** closes dialog.
- **Focus trap:** Tab cycles within the dialog (close → cancel → submit → textarea → wrap); focus never escapes to page.
- **Mobile bottom-sheet (375px):** panel `rgb(18,18,20)` (--surface-950) anchored to bottom (bottom=vh), full-width (375), rounded top corners (10px) / square bottom (0px) = bottom-sheet shape. sm+ = centered modal.
- **Moderator gate:** "Reports inbox" button (`report-inbox-btn`) renders for Fixture A (owner) — gate passes for owner.
- Console during flows: 0–2 errors (transient, from the 404 probes I issued against a non-existent `/servers/:id/channels` route — my own diagnostic calls, not app errors).

---

## Findings

### F1 — DEFECT (MAJOR, B-3 defect): Report affordance leaks onto the user's OWN messages and OWN member row
**Severity: MAJOR.** Spec C / B-3 require the message report button "non-own only" and the member report affordance on "a member other than yourself". In prod, Fixture A sees a `report-message-btn` on **all 33 of her own messages** and a `report-member-btn-<own-id>` on **her own member row** ("Report studyhall-e2e-fixture").

**Root cause (code-confirmed):** `apps/web/src/shell/MainColumn.tsx:343` passes `currentUserId={profile?.username ?? null}` (the **username** string, e.g. `"studyhallfixturea"`), but `MessageList.tsx:1060` computes `isOwn = msg.authorId === currentUserId` where `msg.authorId` is a **UUID** (`21984eb2-...`). Username ≠ UUID, so `isOwn` is ALWAYS false for channel messages. Consequences observed on own messages:
- `report-message-btn` renders (should be hidden) — the spec violation.
- Edit-your-message affordance is ABSENT (should be present).
- Delete shows the moderator variant label "Delete message (moderator)" instead of "Delete your message".

This is a pre-existing own/non-own detection bug in MessageList, surfaced by the wave-69 report affordance and the parallel member-row self-report affordance. Backend still stamps reporter_id from the session, so a self-report is created as normal data (harmless server-side) — but the UI lets a user report themselves, which is a real UX/spec defect. Recommend routing to react-specialist: pass the userId (not username) as `currentUserId`, or compare against the correct identity field, for MessageList/MemberListPanel own-detection.

**Reproduce:** log in as Fixture A → Fixture Proof Server → general → hover any own message → Report (flag) button is present; open member list → own row has a Report button.

### F2 — INFO: `/discover` is empty in prod (cold-start)
Scenario 3 could not be exercised end-to-end. Server report affordance + dialog wiring are code-present (ServerDiscoverPage.tsx). Not a defect; noted for completeness. If a public server is ever listed, re-run scenario 3.

---

## CLEANUP — test data created (please resolve/delete)
5 reports filed against Fixture-owned test content on the Fixture Proof Server (`ad62cd12-...`). All harmless (`status: open`, no destructive action taken). Report ids to clean up:
- `305f4b95-ecc1-4bbf-8c29-00c345b31ea1` (message)
- `cd0a2d04-3a9e-42b7-925e-7da3c3b4fc86` (message)
- `ae76e5ea-c1d9-42f5-96e0-bf795f56d761` (message)
- `ca337bbe-72a8-4b8d-950c-a2c539fb0556` (member → Fixture B)
- `75ec1fb4-f64a-4330-999b-3b4f1b910298` (member → Fixture B)

No messages deleted, no members timed out. Only reports filed.
