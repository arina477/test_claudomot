# V-1 Karen — Source-Claim Verification (wave-49 study timer)

**Verifier:** karen (V-1 source-claim)
**Wave:** 49 — M8 study-group tools slice 1: server-scoped shared study timer (Pomodoro)
**Merge commit under review:** `3835100250b7de1b68232026af7030c57586948f` (on `main`)
**Local tree state:** HEAD `ef6c982b3a271651750dce4ba301a44ddf27a115` (a later commit on `main` that contains the merge; all source checks run explicitly against the `3835100:` tree, not the working copy).
**Deployed targets:** api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`.

## VERDICT: APPROVE

Every load-bearing claim in the wave's P-3 plan, B-0/B-1/B-2/B-3/B-6 build deliverables, and C-1/C-2 CI/CD deliverables is TRUE against the merge tree AND substantiated in the deployed production state. No claimed-but-fake, no decorative tests, no disguised-poll, no undocumented deferrals were found. The one accepted-debt item (frontend does not yet subscribe to the join-error channel) is explicitly documented in B-6 as carry-forward and is not a false completion.

---

## Karen protocol findings (each: claim → evidence)

### 1. File existence — CONFIRMED (13/13)
All 13 claimed files exist on the `3835100` tree (`git cat-file -e 3835100:<path>`):

| File | Result |
|---|---|
| `apps/api/src/db/schema/study-timer.ts` | EXISTS |
| `apps/api/src/study-timer/study-timer.service.ts` | EXISTS |
| `apps/api/src/study-timer/study-timer.controller.ts` | EXISTS |
| `apps/api/src/study-timer/study-timer.module.ts` | EXISTS |
| `apps/api/src/study-timer/study-timer.gateway.ts` | EXISTS |
| `apps/api/src/study-timer/study-timer.service.spec.ts` | EXISTS |
| `apps/api/test/integration/study-timer.integration.spec.ts` | EXISTS |
| `apps/api/drizzle/migrations/0022_unusual_clint_barton.sql` | EXISTS |
| `packages/shared/src/study-timer.ts` | EXISTS |
| `apps/web/src/shell/StudyTimerWidget.tsx` | EXISTS |
| `apps/web/src/shell/studyTimerSocket.ts` | EXISTS |
| `apps/web/src/shell/study-timer.test.tsx` | EXISTS |
| `apps/web/src/shell/studyTimerSocket.test.ts` | EXISTS |

### 2. Function / export existence — CONFIRMED
- `StudyTimerService` — `study-timer.service.ts:100` (`export class StudyTimerService implements OnModuleDestroy`).
- `rowToDto` (compute-on-read) — `study-timer.service.ts:155` (`private rowToDto(row: ServerStudyTimer): StudyTimer`).
- `armAutoAdvance` (one-shot) — `study-timer.service.ts:283` (`private armAutoAdvance(serverId, endsAt): void`).
- `doPhaseAdvance` (idempotent) — `study-timer.service.ts:330` (`async doPhaseAdvance(serverId, expectedEndsAtMs)`); UPDATE guarded on `ends_at = expected` (header comment `service.ts:13`).
- `selfHealIfOverdue` — `study-timer.service.ts:227`.
- `assertMember` — `study-timer.service.ts:132` (`private async assertMember(userId, serverId): Promise<void>`).
- Shared consts — `packages/shared/src/study-timer.ts`: `StudyTimerSchema` (`:33`), `STUDY_TIMER_UPDATE_EVENT='study-timer:update'` (`:50`), `STUDY_TIMER_PRESENCE_EVENT='study-timer:presence'` (`:53`), `STUDY_TIMER_JOIN_ERROR_EVENT='study-timer:join_error'` (`:60`).
- `StudyTimerGateway` on `@WebSocketGateway({ namespace: '/study-timer' })` — `study-timer.gateway.ts:73-74` (exact `namespace: '/study-timer'`).
- Frontend `studyTimerSocket` connects `io(\`${BASE}/study-timer\`)` — `studyTimerSocket.ts:57`. **Namespace-mismatch bug from B-6 attempt-1 is genuinely fixed** (header comment `:27` "corrected namespace from /messaging to /study-timer"; connection at `:57` reads `/study-timer`, not `/messaging`).

### 3. Route registration — CONFIRMED in source AND live on deployed api
Source — all 5 routes registered on `@Controller()` in `study-timer.controller.ts`:
- `@Post('servers/:serverId/study-timer/start')` `:47`
- `@Post('servers/:serverId/study-timer/pause')` `:66`
- `@Post('servers/:serverId/study-timer/resume')` `:85`
- `@Post('servers/:serverId/study-timer/reset')` `:103`
- `@Get('servers/:serverId/study-timer')` `:123`
- `StudyTimerModule` imported in `app.module.ts:19` + registered in imports array `:53`.

Deployed probes (anon, curl) against `api-production-b93e`:
```
GET  /servers/<uuid>/study-timer        → 401
POST /servers/<uuid>/study-timer/start  → 401
POST /servers/<uuid>/study-timer/pause  → 401
POST /servers/<uuid>/study-timer/resume → 401
POST /servers/<uuid>/study-timer/reset  → 401
GET  /servers/probe/study-timer          → 401   (the id C-2 used)
GET  /servers/<uuid>/nonexistent-xyz     → 404   (negative control)
```
The negative control returning **404** proves the 401s are meaningful route+guard hits, not a catch-all. All 5 controls are live and auth-guarded on the serving revision. **C-2's "401 not 404" claim independently reproduced.**

### 4. Migration applied — CONFIRMED (behaviorally + ledger-substantiated)
- Migration SQL (`0022_unusual_clint_barton.sql`) creates `server_study_timer` with the anchors-only columns: `id`, `server_id` (UNIQUE, FK→servers ON DELETE cascade), `phase` (default 'work'), `run_state` (default 'idle'), `started_at`, `ends_at`, `paused_remaining_ms`, `updated_by` (FK→users), `created_at`, `updated_at`, plus `server_study_timer_server_id_unique`. Matches C-2's 10-column list exactly.
- Journal idx 22 registered — `meta/_journal.json`: `{"idx":22,"tag":"0022_unusual_clint_barton","when":1783252929946}`. `when` matches C-2's post-apply `latest=1783252929946` claim exactly.
- C-2 substantiates apply: pre-apply ledger 21 rows (`latest=1783157153353` = 0021 journal), `to_regclass` null; post-apply 22 rows, `to_regclass('public.server_study_timer')` present, unique constraint present.
- Behavioral re-confirmation: the timer route returns **401 (auth), not 500** — if the table/module failed to load, the guarded handler would 500 on DB access. 401 implies the table exists and StudyTimerModule bootstrapped cleanly. Claim upheld.
- *Minor note (non-blocking):* the SQL types `updated_by` as `text` (with a FK to `users.id`), not `uuid`. This is internally consistent (users.id is text) and matches the deliverable's column list; not a discrepancy.

### 5. Env-var presence — CONFIRMED as recorded (no leak)
C-2 records: api scope holds `DATABASE_URL`/`DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI`/`SUPERTOKENS_API_KEY`, `LIVEKIT_API_KEY/SECRET/URL`, `SESSION_SECRET`, storage+email creds — all satisfied; no new env var this wave. web scope holds ONLY `VITE_API_ORIGIN` + `VITE_LIVEKIT_URL` (no DB creds, no secrets — least-privilege). The claim is recorded in the C-2 deliverable table (`C-2:22-25`); values are not leaked. The 401-not-500 behavior of the DB-backed route corroborates that api DB creds are actually present and valid on the serving revision.

### 6. Deploy hash match — CONFIRMED substantiated
C-2 substantiates via Railway's authoritative `deployments` endpoint: api deployment `476d8a0d` = SUCCESS @ commit `3835100…` (= merge SHA); web deployment `d6f480c0` = SUCCESS @ commit `3835100…` (= merge SHA), with matching `staticUrl`s. Live health probe reproduced: `GET api/health → 200 {"status":"ok","service":"studyhall-api","version":"0.0.1"}`; `web/ → 200`. Deployment-state + live serving signal agree; serving revision is the merge commit.

### 7. Antipattern catalog — CLEAN (all binding-model claims real)
- **No per-server timer loop — REAL.** Grep of `study-timer.service.ts` for `setInterval|@nestjs/schedule|@Cron|@Interval|SchedulerRegistry` returns only a header comment at `:9` ("FORBIDDEN: per-server setInterval / @nestjs/schedule tick loop"). No actual loop primitive. Auto-advance uses a one-shot `setTimeout` keyed per server: `timeouts = new Map<string, …setTimeout>` (`:108`), armed at `:291`, cleared/re-armed at `:121/:287/:308`, cleared in `onModuleDestroy`. This is a genuine armed one-shot, **not a disguised poll**.
- **Presence genuinely in-memory — REAL.** `study-timer.gateway.ts` presence uses `timerPresence = new Map` (`:91`) + `socketPresenceIndex = new Map` (`:97`). Full grep for DB mutation (`.insert(`/`.update(`/`.delete(`/`INSERT`/`db.`) in the gateway returns only in-memory `Map.delete()` calls (`:154`, `:255`, `:310`, `:312`, `:315`) — zero DB writes. Presence is ephemeral, rebuilt from live sockets, as claimed.
- **Auto-advance idempotent one-shot — REAL.** `doPhaseAdvance` (`:330`) UPDATEs `WHERE … ends_at = expected` → concurrent/second fire finds a changed row → 0-row no-op (log at `:342/:375`); `selfHealIfOverdue` (`:227`) re-derives phase from anchors on read. Idempotency + self-healing present as claimed.
- **Tests not decorative — REAL.** unit spec `study-timer.service.spec.ts`: 27 `it/test` blocks, 68 `expect()`. integration `study-timer.integration.spec.ts`: 70 `expect()`, guarded by `describe.skipIf(SKIP)` with `SKIP = !process.env.DATABASE_URL_TEST` (`:45,:68`) — runs against real PG in CI (C-1 confirms it ran on the Postgres v16 service). Frontend `study-timer.test.tsx`: 53 `expect()`; `studyTimerSocket.test.ts`: 5 `expect()`. Substantive assertions, not stubs.
- **Deferred-but-undocumented — NONE FOUND.** The lone client-side gap (frontend not yet subscribing to `study-timer:join_error`) is explicitly documented as accepted-debt / carry-forward in `B-6-review.md:40`. Documented, not hidden.

---

## Carry-forward for later V/T stages (non-gating, already flagged by B-6)
- **T-4 E2E:** a real two-client `/study-timer` socket round-trip (join → control → both observe update + presence) is the true multi-client proof; unit/integration do not exercise a live namespace round-trip. This is the highest-value remaining verification and is correctly deferred to T-block, not falsely claimed here.
- **join-error UX:** non-member socket joins currently fail silently client-side (server emits the event; client has no subscriber yet). Accepted-debt per B-6.

## Summary
| Severity | Count | Notes |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 0 | `updated_by` typed `text` (consistent, non-issue); join-error client subscription is documented accepted-debt |

All source claims TRUE on the merge tree; all deploy/migration/route claims substantiated and independently reproduced against production. **APPROVE.**

```yaml
v1_karen_verdict: APPROVE
files_verified: 13
files_missing: 0
routes_live_on_deploy: 5
negative_control_404: true
socketio_handshake: 200
migration_0022_substantiated: true
deploy_hash_matches_merge: true
antipatterns_found: []
binding_model_confirmations: {no_timer_loop: true, presence_ephemeral: true, idempotent_one_shot_autoadvance: true, decorative_tests: false}
documented_deferrals_ok: true
findings_critical: 0
findings_high: 0
findings_medium: 0
findings_low: 0
```
