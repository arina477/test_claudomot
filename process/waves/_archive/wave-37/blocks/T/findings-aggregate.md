# Wave 37 — T-block findings aggregate
(T-1..T-4 CI-verified; notifications-authz integration + controller tests RAN in CI 0-skipped. The B-6 code-reviewer's 2 HIGH were fixed pre-merge; 1 INFO nit [stale UnreadCountResponse doc comment] non-blocking.)

---

## Active-execution layers (T-5 e2e / T-6 layout / T-8 security) — LIVE prod, 2026-07-02

**Per-layer verdict: T-5 PASS · T-6 PASS · T-8 PASS. 0 CRITICAL / 0 HIGH found in active execution.**
Stage files: `stages/T-5-e2e.md`, `stages/T-6-layout.md`, `stages/T-8-security.md`. Screenshots `/tmp/w37shots/`.
Tooling note: Playwright MCP `chrome` channel absent on host (known carry w27/34/35) → drove bundled chromium (chromium-1228, --no-sandbox), same workaround as prior waves. Fixtures A (studyhallfixturea 21984eb2…) + B (studyhallfixtureb da74148e…), co-members of Fixture Proof Server ad62cd12 / #general.

### T-8 Security (LOAD-BEARING) — all PASS, live evidence
- **owner-404 IDOR (CRITICAL) — PASS.** B PATCHes A's notification `e76a920c…/read` → **404** (not 200/403); A's notif stays unread (unreadCount 1, readAt null). No partial mutation. Live reproduction of rule-4 / the core IDOR assertion.
- **self-scoping (CRITICAL) — PASS.** B's `GET /me/notifications` → 0 items, A never leaks; `?userId=<A>` injection ignored (still 0). Session-derived scoping only.
- **auth boundary — PASS.** Unauth GET + PATCH + POST read-all → 401 (guard order: 401 before authz/existence).
- **method / HIGH-1 — PASS.** Owner PATCH own /read → 200 `{unreadCount:1}` + persisted readAt (single-read persists). Old verb `POST …/read` → 404 (not the verb) — the wave-37 HIGH-1 POST→PATCH fix confirmed live.

### T-5 E2E — 4/4 flows PASS
- Bell in MainColumn header (`aria-label="Notifications, N unread"`, emerald badge) — count matches server unreadCount live.
- Panel popover: §113 loading skeleton on open (animate-pulse, not spinner); list state (mention rows newest-first, actor+channel+relative-time+excerpt) AND empty state ("You're all caught up" / "No new notifications. Go ace your classes." / "Browse channels") both verified.
- Generate mention (B @mentions A) → A's persistent notif enriched correctly → click row fires `GET channel messages` + `PATCH …/read` 200, bell decrements, panel closes. (Nav keeps `/app` — SPA client-state routing, not a URL segment; evidenced by messages fetch + panel close, not a defect.)
- Mark all read → `POST …/read-all` 200, bell → 0, badge cleared, server 0 unread persisted.
- NON-GOAL confirmed: bell (7 unread) vs per-channel mention badge (46) are independent counts/subsystems; useMentionBadge untouched.

### T-6 Layout — PASS
- Emerald pill badge `rgb(16,185,129)` on `rgb(10,10,11)` text, radius 9999px; **9+ cap works** (10 unread → badge "9+", aria-label full count).
- Panel popover on dark surface; unread rows `rgba(16,185,129,0.06)` tint + emerald dot vs read rows transparent/no-dot (7/7 each in a mixed page) — clearly distinct.
- No horizontal overflow at 1440/1280/1024; no overlap/regression; header cluster (Search·Pinned·Notifications) intact.

### Findings (classified)
- **F37-T5-1 (LOW / informational):** Reminder-type notification rows NOT exercised live — no reminder notifications exist in prod (Resend-key-blocked per wave-30, parked task `a1299e88`). Mention rows fully exercised; reminder row rendering is component-level only this wave. Not a defect; a coverage gap gated by an external credential. Consistent with the existing M5 Resend park-or-key fork.
- **F37-T5-2 (INFO):** One benign `401` console error on the pre-auth initial `/me/notifications` fetch (fires before session hydration, then re-fetches 200). Cosmetic; no functional impact. Candidate: gate the first fetch on session-ready.
- **Prod-state note (not a finding):** test generated ~25 mention notifications on fixture A; left clean at unreadCount=0 (read-all). Rows persist as history (no DELETE endpoint — the documented no-teardown pattern for this project; harmless).

**Iron Law honored: bugs reported, none fixed.** No CRITICAL/HIGH → no head-tester ESCALATE trigger from active execution.
