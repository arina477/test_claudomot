# V-1 Karen — Source-Claim Verification (wave-43, class scheduling)

**Scope:** Verify load-bearing CLAIMS are true in the merge tree + deployed state. NOT spec conformance (jenny owns that).
**Merge:** PR #57 squash `7b0bc478`; api redeployed to `e7f1f7a` (T-4-caught createSession weekly-guard fix, api-only). Main HEAD `ec643fe` (T-block test/journey commits ⊇ e7f1f7a).
**Verdict:** **APPROVE** — 0 blocking findings, 2 informational notes.

---

## Claim-by-claim

### 1. Migration 0020 — VERIFIED
- File `apps/api/drizzle/migrations/0020_graceful_cerebro.sql` exists at `7b0bc478`: CREATES `scheduled_sessions` with all 12 columns (id, server_id, organizer_id, title, description, starts_at, ends_at, recurrence, recurrence_until, is_deleted, created_at, updated_at), FK server_id→servers ON DELETE cascade, FK organizer_id→users, and INDEX `scheduled_sessions_server_id_starts_at_idx (server_id, starts_at)` — matches the P-3 data-model spec exactly.
- Reflected in drizzle journal: `meta/_journal.json` idx 20, tag `0020_graceful_cerebro`.
- **Reflected in DEPLOYED DB:** live api scheduling routes return 401 (guarded), not 500-on-missing-table — the table is present and queried. C-2 records pre-migrate `to_regclass=false`→post `true`, applied count 20→21.

### 2. Backend module — VERIFIED
`apps/api/src/scheduling/scheduling.service.ts`:
- `createSession` carries BOTH defensive guards: `endsAt <= startsAt` (line 169) AND weekly `recurrenceUntil < startsAt` (lines 172-178 — the e7f1f7a fix).
- `updateSession` effective-value re-check (lines 247-257): recomputes eff-starts/eff-ends/eff-until from patch-or-existing, throws 400 on one-sided PATCH that would produce ends≤starts or until<starts — the B-6 H1 fix.
- `softDeleteSession` (278), `getSession` (303), `listSessionsForServer` with weekly recurrence expansion + 90-day hard cap (`MAX_WINDOW_MS`, lines 38/348-351) all present.
- **IDOR-safe:** :id routes (update/delete/get) fetch the row and derive `server_id` from `existing.server_id`/`row.server_id` (lines 221, 288, 313) — never a client param.
`scheduling.controller.ts`: 5 routes present (POST + GET on `servers/:serverId/scheduled-sessions`; GET/PATCH/DELETE on `scheduled-sessions/:id`).
`scheduling.module.ts`: controller + service registered; `SchedulingModule` imported + listed in `app.module.ts:46`.

### 3. Shared contract — VERIFIED
`packages/shared/src/scheduling.ts`: `ScheduledSessionSchema` (11), `CreateScheduledSessionSchema` (37) with `z.string().datetime()` on startsAt/endsAt (41-42) + two cross-field `.refine`s (46, 50), `UpdateScheduledSessionSchema` (70) with `.datetime().optional()` + two refines (79, 91), `ScheduledSessionListResponseSchema` (109). All re-exported from `index.ts` (lines 141, 147).

### 4. Frontend — VERIFIED
- `SessionForm.tsx`, `ClassCalendar.tsx`, `SessionDetail.tsx` all present at `7b0bc478`.
- `auth/api.ts` has all 5 fns: createSession (530), listSessions (541), getSession (554), updateSession (561), deleteSession (571).
- Wiring: `ServerContext.tsx` `scheduleOpen` state (47/91/231); `ChannelSidebar.tsx` Schedule tab (`name="Schedule"` 371, `onClick={openSchedule}` 373, `active={scheduleOpen}` 372); `MainColumn.tsx` branch renders `<ClassCalendar>` when `scheduleOpen` (167-174).

### 5. Routes LIVE — VERIFIED
Live probes against deployed api (unauthenticated):
| Route | Observed |
|---|---|
| POST /servers/<uuid>/scheduled-sessions | **401** |
| GET /servers/<uuid>/scheduled-sessions | **401** |
| GET /scheduled-sessions/<uuid> | **401** |
| PATCH /scheduled-sessions/<uuid> | **401** |
| DELETE /scheduled-sessions/<uuid> | **401** |
| /health | **200** |
| bogus /scheduled-sessions-nonexistent/<uuid> | **404** (control — confirms 401s are real guarding, not catch-all) |
All 5 CRUD routes registered + guarded (401, not 404). The 404 control proves the 401s are genuine guard hits.

### 6. Deploy hash — VERIFIED
- web: `index.html` references `index-C8KFLd6n.js` (changed from baseline `index-BCqGLUBX.js`). Bundle 200, 1.77 MB, contains `scheduled-sessions` (5), `New session` (2), `Schedule` (11), `recurrence` (12). (Note: `ClassCalendar`/`SessionForm` symbol names are 0 — expected, minifier renames component identifiers; the route strings + user-facing copy are the real signal.)
- api: Railway GraphQL confirms the latest SUCCESS deployment (`9f3adbfb…`) serves `commitHash e7f1f7accab…` with message "fix: T-4 createSession defensive weekly recurrenceUntil guard for wave-43". `e7f1f7a` is a descendant of merge `7b0bc478`, and the weekly guard string is present in its scheduling.service.ts (lines 177, 256). **Served revision == the guard-fix commit — the weekly guard is live.**

### 7. T-4 integration claim — VERIFIED
- Spec file `apps/api/test/integration/scheduled-sessions.integration.spec.ts` is **NOT at merge `7b0bc478`** but IS at HEAD; added by `a5ef4d1` ("T-4 scheduled-sessions real-PG integration specs") — a T-block test-authoring commit AFTER the feature merge. This is correct T-4 sequencing, not a fabrication (see Note A).
- 22 `it()` cases; the lone `it.skip` (line 621) is a graceful DATABASE_URL_TEST-absent fallback, NOT one of the 22.
- **CI run 28693093402** (headSha `e7f1f7a`, conclusion success): `test` job ran with real `DATABASE_URL_TEST: ***localhost:5432/studyhall_test`; integration suite = 32 files / 551 tests passed; **all 22 `scheduled-sessions.integration.spec.ts` cases enumerated as ✓, 0 failed, 0 skipped**. Cases cover create/update/delete/get/list + authz (403 non-organizer/non-member), IDOR (server_id derived from row), single-field PATCH guards (B-6 H1), soft-delete exclusion, weekly expansion, 90-day cap, and no-RSVP/reminder/ICS field assertions. Genuinely ran against Postgres — NOT decorative/skipped.

### 8. Antipatterns — CLEAN; deferrals genuinely disclosed
- **Student read-only E2E deferral:** disclosed in `T-5-tester-direct.md:73` + `T-5-e2e.md:18` + `T-9-journey.md:19` (coverage_gaps) — fixture A is organizer everywhere, fixture B broken; member-vs-organizer RBAC proven at T-4 real-PG. Honest BLOCKED, not a hidden gap.
- **T-6 responsive (1024) finding:** disclosed in `T-9-journey.md:4` as "compressed-not-broken (1280/1440 clean)" → non-blocking V-2; layout probes at 1024 exist (`T-6-layout/detail*.mjs`).
- **M3 bad-UUID→500 deferral:** disclosed in `B-6-review.md:7` (DEFERRED, pre-existing project-wide) and `T-8-security.md:8` — and scheduling routes actually 400 cleanly (better than M3 predicted). Genuinely documented.
- No claimed-but-fake artifact found; no decorative test found.

---

## Notes (informational, non-blocking)
- **Note A — T-4 spec absent at merge commit, present at HEAD.** The integration spec was authored in the T-block (`a5ef4d1`) after the C-block merge/deploy — correct wave-loop ordering (B builds, C ships, T tests). The prompt's phrasing "exists in the merge tree" holds against main HEAD/CI, not against `7b0bc478` specifically. Not a defect; recorded for provenance clarity.
- **Note B — web bundle serves 7b0bc478, api serves e7f1f7a.** Expected + documented in C-2: e7f1f7a is api-only (no web-affecting change). Both consistent with the recorded deploy state.

**Findings: 0 blocking, 2 informational. Verdict: APPROVE.**
