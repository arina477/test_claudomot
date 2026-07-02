# Wave 37 — T-8 Security (LIVE prod reproduction — owner-404 authz) — PASS

**Target:** api https://api-production-b93e.up.railway.app (deploy fa782b68; migrations 0015+0016; notifications table + 3 indexes verified at C-2).
**Fixtures:** A `studyhall-e2e-fixture` (`21984eb2…`) + B `studyhall-e2e-fixture-b` (`da74148e…`). Real SuperTokens sessions via `POST /auth/signin` (st-auth-mode: header → Bearer access token). Both signin → 200, user ids match registry.
**Method:** direct authenticated HTTP against the live API (deterministic, load-bearing). This LIVE-confirms the owner-404 IDOR that the `notifications-authz` integration test already proved against real PG in CI (T-4).

## Result: 4/4 checks PASS — 0 CRITICAL / 0 HIGH

Setup notification: as B, posted `@studyhallfixturea` in `#general` → A's persistent notification `e76a920c-5d29-40d0-a47e-8cb5e9c7165b` (type mention, unread).

### 1. owner-404 IDOR (CRITICAL) — PASS
`PATCH /me/notifications/e76a920c…/read` **as fixture B (B's session)**:
- **Response: HTTP 404** `{"message":"Notification not found","error":"Not Found","statusCode":404}` — NOT 200, NOT 403.
- A's notification **stays unread** — re-checked as A: `unreadCount:1`, `readAt:null`. No partial mutation.
- Correct anti-existence-leak convention: B cannot distinguish "not yours" from "does not exist". This is the core IDOR assertion — reproduced LIVE (rule-4 live confirmation).

### 2. auth boundary — PASS
- Unauthenticated `GET /me/notifications` → **HTTP 401** `{"message":"unauthorised"}`.
- Unauthenticated `PATCH /me/notifications/<uuid>/read` → **HTTP 401** `{"message":"unauthorised"}`.
- Unauthenticated `POST /me/notifications/read-all` → **HTTP 401**. (401 fires before any authorization/existence logic — guard order correct.)

### 3. self-scoping (CRITICAL) — PASS
- B's `GET /me/notifications` → 200, **0 items** (B has no notifications), unreadCount 0. A's notification `e76a920c…` **never** appears in B's list.
- `?userId=<A's id>` injection on B's session → HTTP 200, still **0 items** — the query param is ignored; scoping is session-derived only. No cross-user leak.

### 4. method — PATCH mark-read works + persists (HIGH-1 fix) — PASS
- Owner (A) `PATCH /me/notifications/e76a920c…/read` → **HTTP 200** `{"unreadCount":1}` (was 2 unread → 1); re-GET shows `readAt:"2026-07-02T21:43:09.310Z"` persisted, count decremented. Single-read persists.
- **HIGH-1 regression (was POST→404):** `POST /me/notifications/<id>/read` → **HTTP 404** `Cannot POST …/read` — POST is NOT the mark-read verb; PATCH is. The wave-37 HIGH-1 fix (api.ts POST→PATCH aligned to `@Patch` controller) is confirmed live.

## Evidence — actual status codes
| Check | Actor | Request | Status | Verdict |
|---|---|---|---|---|
| 1 IDOR | B | PATCH A's notif /read | **404** (+ A stays unread) | PASS (CRITICAL) |
| 2a | none | GET /me/notifications | 401 | PASS |
| 2b | none | PATCH /me/notifications/:id/read | 401 | PASS |
| 2c | none | POST /me/notifications/read-all | 401 | PASS |
| 3a | B | GET /me/notifications | 200, 0 items (no A leak) | PASS (CRITICAL) |
| 3b | B | GET …?userId=<A> | 200, 0 items (ignored) | PASS (CRITICAL) |
| 4a | A | PATCH own /read | 200 `{unreadCount:1}` + persist | PASS |
| 4b | A | POST own /read (old verb) | 404 (not the verb) | PASS (HIGH-1 confirmed) |

**Verdict: T-8 Security PASS. No CRITICAL/HIGH. The owner-404 IDOR and self-scoping — the load-bearing checks — hold LIVE against prod.**
