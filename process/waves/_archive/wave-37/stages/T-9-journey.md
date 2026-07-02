# Wave 37 — T-9 Journey (gate + journey regen)

## Phase 1 — head-tester gate verdict: APPROVED

Fresh head-tester spawn. Verdict + full checklist at `process/waves/wave-37/blocks/T/gate-verdict.md`.
Load-bearing evidence independently re-verified: CI run 28622699260 (`test` job 84882043926) log shows `notifications-authz.spec.ts` executing **6 tests / 0 skipped** against real Postgres 16 with real-DB latencies (54/173/407/201/203/84 ms) — owner-404, markRead idempotent, markAllRead scoping, mention dedup (exactly 1 row), listForUser A-scoping+enrichment; DB NOT mocked. `notifications.controller.spec.ts` 14 tests assert route-method metadata (method-drift guard). No coverage theater, no mock-the-SUT, no single-client realtime, no flaky-retry masking. All 7 CI jobs green.

## Phase 2 — Journey regen (REQUIRED — wave added new surface)

**Action-2 skip evaluation:** regen REQUIRED (NOT skipped). B-3 frontend fired (bell/panel components under `apps/web/src/shell/`: `HeaderBell.tsx`, `NotificationsPanel.tsx`, `useNotifications.ts`); wave_type touches UI. `journey_regen_skipped: false`.

**Crawl (bundled-chromium — Playwright MCP `chrome` channel absent, known carry waves 27/34/35; worked around via chromium-1228 `--no-sandbox`, never browser_close):**
- Fixture A (`studyhall-e2e-fixture`) signed in via real SuperTokens `/login` → reached `/app`.
- **Bell:** `<button aria-label="Notifications, 0 unread">` in the MainColumn header — role/label query, no test-id. Count 0 = clean prod state.
- **Panel:** opens on bell click as an **app-shell overlay** — URL stayed `/app` before AND after click (`url_unchanged: true`); header "Notifications" + "Mark all as read" + notification content present. NO new page route.
- **REST live:** `GET /me/notifications → 200` (load + open); unauthed `GET`/`PATCH`/`POST read-all` all → **401** (not 404 — routes serve, guard-first); old verb `POST …/:id/read` → **404** (HIGH-1 POST→PATCH fix live).
- api `/health` 200, web `/` 200.

**Regen diff vs prior map (v0.23 → v0.24):**
- **routes_added:** none (0 new page routes — bell+panel are an app-shell overlay on the existing `/app` shell).
- **endpoints_added:** `GET /me/notifications`, `PATCH /me/notifications/:id/read`, `POST /me/notifications/read-all` (3 new REST; all session-scoped, IDOR-closed, 401 guard-first).
- **realtime_added:** none (bell reuses the existing `mention` socket event).
- **surfaces_added:** header notifications bell + notifications panel popover (page-9 MainColumn header; added to page-9 inventory row + new flow F10).
- **routes_removed:** none.
- **coverage_gaps:** reminder-TYPE notification-row live-exercise (F37-T5-1, LOW — no reminder rows in prod, Resend-key-blocked/parked a1299e88; mention rows fully exercised, reminder-row rendering unit-covered, reminder generation real-PG integration-tested).
- **two-read-model annotation:** ADDED — bell/panel global server `read_at` (`useNotifications`) vs per-channel `useMentionBadge` are INTENTIONALLY independent counters (diverge by design: bell 7 vs channel badge 46 live), NOT a state-sync bug; `useMentionBadge` untouched.

**Scenario smoke (Action 4):** `user-scenarios/` directory ABSENT — no scenario smoke to run (noted).

**Cross-wave regression check (Action 6):** none. T-9 crawl re-confirmed `/app` shell, login, bell, and existing surfaces intact on deploy `index-DCKZ02HB.js`. Existing per-channel mention badge (`useMentionBadge`) confirmed untouched and still functioning (T-5 NON-GOAL independence). No existing journey broke.

**Findings triage (Action 7):** F37-T5-1 (LOW → V-2 disposition: honest external-credential gap, non-blocking), F37-T5-2 (INFO → V-2: cosmetic pre-auth 401). Both appended in findings-aggregate. 0 critical, 0 significant regressions.

---

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 2          # /login + /app (bell+panel overlay, no new route)
regen_diff:
  routes_added: []              # 0 new page routes — app-shell overlay
  endpoints_added:
    - "GET /me/notifications"
    - "PATCH /me/notifications/:id/read"
    - "POST /me/notifications/read-all"
  surfaces_added:
    - "header notifications bell (MainColumn header, aria-label='Notifications, N unread')"
    - "notifications panel popover (app-shell overlay, no route change)"
  routes_removed: []
  coverage_gaps:
    - "reminder-type notification rows not live-exercisable (Resend-key-blocked, parked a1299e88) — F37-T5-1 LOW"
  two_read_model_annotation: "bell/panel global server read_at (useNotifications) vs per-channel useMentionBadge — INTENTIONAL independent counters, not a sync bug; useMentionBadge untouched"
scenarios_run: 0                # user-scenarios/ absent
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 2bfa3f7594ac4669381b8f835d6c12fee3082379
findings:
  - {severity: LOW, journey: F10, description: "reminder-type notification rows not live-exercised — no reminder notifications in prod (Resend-key-blocked, parked a1299e88); mention rows fully covered; honest external-credential gap, not a defect (F37-T5-1)"}
  - {severity: INFO, journey: F10, description: "benign pre-auth 401 on initial /me/notifications fetch before session hydration, then re-fetches 200 (cosmetic) (F37-T5-2)"}
```
