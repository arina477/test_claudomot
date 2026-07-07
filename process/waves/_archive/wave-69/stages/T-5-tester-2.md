# T-5 E2E — Tester 2 — Owner/Moderator Report Inbox + Resolve Loop (PROD)

**Wave:** 69 · **Layer:** T-5 E2E (live production) · **Surface:** moderation Reports inbox + resolve loop (spec C AC2/AC3 + moderator-gate)
**Prod web:** https://web-production-bce1a8.up.railway.app · **Prod api:** https://api-production-b93e.up.railway.app
**Fixture A (owner/moderator):** studyhall-e2e-fixture@example.com (userId 21984eb2…, holds moderate_members on "Fixture Proof Server" ad62cd12)
**Fixture B (non-moderator co-member):** studyhall-e2e-fixture-b@example.com (userId da74148e…)

---

## Executive summary

The **UI-visual portion of all four scenarios is BLOCKED** — not by any product defect, but by **shared-browser-lock contention**. Every Playwright MCP instance (playwright-1…10) is bound to a single shared Chrome profile (`mcp-chrome-for-testing-51e10da`), and a sibling tester (tester-1, whose reports are visible in the prod inbox) held the exclusive lock continuously for the entire ~14-minute test window. All navigate attempts across instances 2/7/9/10 returned `Browser is already in use … use --isolated`. I could not break the lock (that requires `browser_close`, forbidden — kills the shared MCP for siblings) and `--isolated` is not exposed as an MCP tool parameter.

**However**, I validated the exact server-side contract every UI button must invoke, using authenticated API calls as both fixtures. The **core AC2/AC3 resolve loop and the moderator gate PASS at the API layer** — strong backing evidence that the feature's behavior is correct; only the visual/DOM confirmation (skeleton, toast, row-animate-out, affordance visibility) remains unverified.

---

## Per-scenario verdict table

| # | Scenario | UI verdict | API-layer verdict | Notes |
|---|----------|-----------|-------------------|-------|
| 1 | Inbox visible + populated (owner) | **BLOCKED-on-browser-lock** | **PASS** | `GET /servers/ad62cd12/reports` → A gets 200 with open reports listed. Endpoint exists + owner-authorized. UI affordance visibility unverified. |
| 2 | Resolve → row leaves (Dismiss) | **BLOCKED-on-browser-lock** | **PASS** | `POST /servers/ad62cd12/reports/{id}/resolve {action:'dismiss'}` → 200, sets status=dismissed + resolved_by/resolved_at. `?status=open` list no longer returns it. UI toast/animation unverified. |
| 3 | Loading + empty states | **BLOCKED-on-browser-lock** | N/A (UI-only) | Skeleton + empty-state are purely visual; cannot verify without browser. |
| 4 | Moderator-gate (negative) | **BLOCKED-on-browser-lock** (UI affordance) | **PASS** (server gate) | B (non-moderator) → `GET …/reports` returns **403 "Insufficient permissions: moderate_members required"**. A (owner) → 200. Server-side gate proven; UI affordance-hidden state unverified. |

**Overall:** 0 product FAILs found. The moderation resolve contract and moderator gate are behaviorally correct at the API layer. UI-visual verification is BLOCKED on infra contention and should be re-run by whichever tester next acquires the shared browser (or with an `--isolated` browser).

---

## Evidence (API-layer, authenticated as real prod fixtures)

### Auth
- Fixture A signin: `POST /auth/signin` (rid emailpassword, st-auth-mode header) → `status:OK`, access token (1002 chars) obtained.
- Fixture B signin: same → `status:OK`, token obtained. **Both fixtures authenticate against prod cleanly.**

### Scenario 1 — inbox exists + owner-authorized + populated
```
GET /servers/ad62cd12-b78e-4a85-a214-042cf176b16c/reports      (Bearer A)  → HTTP 200
  initial state: []  (empty open queue at start of my run)
  after filing:  lists open reports incl. mine (b01338a2) + sibling tester-1's
```
Report list rows carry: `id, reporter_id, target_type, target_server_id, target_user_id, target_message_id, reason, status, created_at, resolved_at, resolved_by` — sufficient to render target + reason + reporter + time + action buttons the spec requires.

Filed a report to populate the inbox (reporter = B, a plain member; correct DTO is **snake_case**):
```
POST /reports  (Bearer B)
  body: {server_id, target_type:"message", target_message_id:"89be6343…", reason:"…"}
  → HTTP 201  id=b01338a2-7d76-4f47-9eee-64963aad9ed4  status=open  reporter_id=da74148e (B)
  (DTO gotcha: rejects camelCase `targetType`; requires `target_message_id` when target_type=message)
```

### Scenario 2 — resolve → status flips + leaves open queue (AC2/AC3)
```
POST /servers/ad62cd12/reports/b01338a2/resolve  (Bearer A, moderator)
  body: {action:"dismiss"}
  → HTTP 200  status:"dismissed", resolved_by:21984eb2 (A), resolved_at populated

GET /servers/ad62cd12/reports?status=open  (Bearer A)
  → dismissed report b01338a2 NO LONGER in list (count drops, all remaining status=open)
```
**Correct resolve route:** `POST /servers/{serverId}/reports/{reportId}/resolve` (NOT `/reports/{id}/resolve` — that 404s). Payload `{action:'dismiss'}` matches the spec.

### Scenario 4 — moderator gate (server-side, PROVEN)
```
GET /servers/ad62cd12/reports  (Bearer B, non-moderator co-member)
  → HTTP 403  {"message":"Insufficient permissions: moderate_members required","error":"Forbidden"}
GET /servers/ad62cd12/reports  (Bearer A, owner/moderator)
  → HTTP 200
```
The reports read is correctly gated on `moderate_members` server-side. This is the authoritative gate (a hidden UI affordance without this would be a security hole; the server enforces it regardless of UI).

---

## Findings

### F1 — [Sev: LOW / informational — CONTRACT NOTE for frontend, not a backend bug]
`GET /servers/{id}/reports` **without** a `?status` filter returns **all** reports including `dismissed`/resolved ones; only `GET …/reports?status=open` returns the open-only queue.
- Verified: unfiltered call returned `count 6, statuses [dismissed, open]`; `?status=open` returned `count 5, statuses [open]`.
- **Implication for AC2 ("dismissed row leaves the open queue"):** correct behavior depends on the frontend calling `?status=open` (or client-side filtering on `status`). If the inbox component fetches the unfiltered endpoint and doesn't filter, a dismissed report would visually persist in the "open" inbox after Dismiss — which would present as an AC2 FAIL in the UI.
- **Action:** T-block / B-3 should confirm the ChannelSidebar Reports inbox fetch uses `?status=open` (or filters client-side). I could not confirm which the UI does — that requires the blocked browser session. Flagging so the UI re-run explicitly checks the network tab for the query param on the inbox GET.

### F2 — [Sev: LOW / infra — TEST-INFRA, not a product defect]
All 10 Playwright MCP instances share one Chrome profile dir and serialize on a single OS-level lock; concurrent T-5 testers cannot run UI sessions in parallel. Sibling tester-1 held the lock for my full window, fully blocking scenarios 1–4's visual verification. Recommend the T-5 harness launch each tester's browser with `--isolated` (separate profile) so parallel testers don't starve each other, or explicitly serialize tester dispatch.

### No product FAILs
No missing-inbox-for-moderator and no resolve-doesn't-remove-row defects were observed at the layer I could reach. The API contract (the substance behind both UI buttons) is correct: inbox is owner-visible + moderator-gated, and Dismiss flips status + removes from the `?status=open` queue.

---

## Cleanup

- Report I created: **b01338a2** (reporter B, target message 89be6343) — **DISMISSED** (resolved_by=A). My contribution to the open queue is fully reverted.
- I did NOT resolve/timeout/delete anything else. The 5 remaining open reports (`305f4b95, cd0a2d04, ca337bbe, 75ec1fb4, ae76e5ea`) are **sibling tester-1's** (reporter=A, tester-1's own scenario labels) — left untouched for tester-1's own cleanup, as they may be mid-scenario.
- No members timed out. No real messages deleted. Only the non-destructive `dismiss` action was used, and only on my own throwaway report.

## Re-run guidance for whoever next holds the shared browser
1. Log in as Fixture A → open "Fixture Proof Server" → locate the moderator **Reports** affordance in ChannelSidebar/server header (gated on moderate_members).
2. Open inbox → confirm it lists the currently-open reports (5 present at handoff time) with target/reason/reporter/time + Timeout/Delete/Dismiss buttons; observe the **loading skeleton** on first open.
3. Click **Dismiss** on one open report → confirm: row animates out, success toast, `POST …/reports/{id}/resolve {action:'dismiss'}` → 200 in network tab, and — critically — **confirm the inbox GET carries `?status=open`** (per F1).
4. Log in as Fixture B → open the same server → confirm the Reports affordance is **hidden** (server gate already proven at 403; verify UI honors it).
