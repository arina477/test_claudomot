# V-1 Karen — source-claim verification (wave-46, M8 direct messages slice 1)

**Scope:** verify wave-46 LOAD-BEARING CLAIMS are TRUE against reality (merged source on `main` @ merge SHA `2a738f7b`, HEAD `d895094`; deployed api/web serving that SHA). NOT spec-conformance (jenny's lane).
**Method:** git-show against `main` (not working tree), live route probes against deployed api, C-2 deploy deliverable cross-read. `$CLAUDOMAT_DB_URL` was probed but points at the BRAIN db, not the StudyHall app db (see Finding 8) — app-schema truth taken from C-2's authoritative `to_regclass` verification against the production app db (`DATABASE_PUBLIC_URL`).

---

## Deep-verified high-leverage claims

### CONFIRM 1 — DM schema file + migration exist and match spec (Critical claim)
- Claim: NEW `apps/api/src/db/schema/dm.ts` exported from `schema/index.ts`; ONE Drizzle migration with the 3 tables + UNIQUE + indexes + FKs.
- Evidence:
  - `main:apps/api/src/db/schema/dm.ts` present. Defines `dm_conversations` (id uuid pk, is_group bool NOT NULL default false, created_by text NOT NULL FK users, created_at tz default now), `dm_participants` (+ `unique('dm_participants_conversation_user')` on (conversation_id,user_id), `index('dm_participants_user_id_idx')` on user_id, conversation_id FK ON DELETE cascade), `dm_messages` (+ `unique('dm_messages_conversation_idempotency_key')` on (conversation_id,idempotency_key), `index('dm_messages_conversation_created_at_idx')`, conversation_id FK ON DELETE cascade). Matches spec AC "Schema" verbatim.
  - `main:apps/api/src/db/schema/index.ts:11` → `export * from './dm';`
  - `main:apps/api/drizzle/migrations/0021_true_yellowjacket.sql` — single migration; creates all 3 tables, both UNIQUE constraints, both indexes, all 5 FKs (2 cascade on conversation_id, 3 no-action on user refs). Exactly one DM migration in the tree (0014–0021; only 0021 mentions dm_).
- Verdict: TRUE.

### CONFIRM 2 — who_can_dm enforcement is NEW, present, and NON-STUB (Critical — load-bearing claim #1)
- Claim: enforcement (everyone / server-members=shared-server / nobody=reject) is net-new in the create path; any target rejects → whole create 403; no partial conversation.
- Evidence (`main:apps/api/src/dm/dm.service.ts`):
  - `private async enforceWhoCanDm(creatorId, targetId)` fetches `users.who_can_dm`; `nobody` → `ForbiddenException`; missing target → treated as nobody → `ForbiddenException`; `server-members` → real `server_members`-join EXISTS query requiring ≥1 shared server, else `ForbiddenException`; `everyone` → pass. This is genuine logic, not a TODO/no-op/stub.
  - `createConversation` calls `for (const targetId of participantIds) { await this.enforceWhoCanDm(callerId, targetId); }` BEFORE any DB write (before the find-or-create and before the INSERT transaction) → any rejection fails the whole create, no partial row. Matches AC2.
- Verdict: TRUE, non-stub.

### CONFIRM 3 — /dm routes registered AND live on deployed api (Critical)
- Claim: POST/GET `/dm/conversations` and POST/GET `/dm/conversations/:id/messages` registered.
- Evidence:
  - `main:apps/api/src/dm/dm.controller.ts` — `@Controller('dm/conversations')` with `@Post()`, `@Get()`, `@Post(':id/messages')`, `@Get(':id/messages')`.
  - `main:apps/api/src/app.module.ts:8,40` — `DmModule` imported and registered.
  - LIVE probes against `https://api-production-b93e.up.railway.app`:
    - `POST /dm/conversations` → **401**; `GET /dm/conversations` → **401**; `POST /dm/conversations/abc/messages` → **401**; `GET /dm/conversations/abc/messages` → **401**.
    - Control `GET /dm/nonexistent-xyz` → **404**.
  - 401 (not 404) proves the routes are mounted on the deployed revision; the 404 control proves an unmounted path returns 404. `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- Verdict: TRUE, live.

### CONFIRM 4 — IDOR guard is server-derived + idempotency present + correct (Critical)
- Claim: participant gate derives caller from session (never client userId); idempotency via UNIQUE + code path; non-participant → 403/404 never data.
- Evidence:
  - Controller: `const callerId = req.session.getUserId();` on all four routes — never from body/param. `:id` routes carry `@UseGuards(AuthGuard, DmParticipantGuard)`; `main:apps/api/src/dm/dm-participant.guard.ts` present.
  - Service `sendMessage` / `listMessages`: `isParticipant(conversationId, callerId)` gate; non-participant → `NotFoundException` ("Conversation not found") — IDOR-safe 404 non-leak, matches AC.
  - Idempotency: `insert(...).onConflictDoNothing({ target: [conversation_id, idempotency_key] })`; when 0 rows returned (conflict), re-fetches the existing row by (conversation_id, idempotency_key) and returns it — same message, no dup, no error. Backed by the UNIQUE constraint in 0021. Fan-out `dm.message` emitted only on `isNewInsert` (no double-emit on replay). Matches AC + edge-cases.
- Verdict: TRUE.

### CONFIRM 5 — outbox routing-key discriminator GENERALIZED, not channelId-hardcoded (Critical — load-bearing claim #2)
- Claim: outbox generalized from channel-only to `{kind:'channel',channelId}|{kind:'dm',conversationId}` without regressing channel send.
- Evidence (`main:apps/web/src/features/sync/`):
  - `types.ts:53` → `export type OutboxTarget = { kind:'channel'; channelId:string } | { kind:'dm'; conversationId:string };`; `OutboxItem.target?: OutboxTarget`.
  - `outbox.ts`: `SendFn` now takes `(target: OutboxTarget, body)`. `enqueue(store, target, content, ...)` accepts the discriminator. `drain` resolves per-item: `const resolvedTarget = item.target ?? { kind:'channel', channelId: item.channelId }` — legacy pre-M8 rows (no `target`) fall back to channel, so existing channel offline send does NOT regress. Then `send(resolvedTarget, {content, idempotencyKey, ...})`.
  - Client dispatch surface: `main:apps/web/src/auth/api.ts:699–737` implements POST/GET `/dm/conversations` + `/dm/conversations/:id/messages`. Tests exercise both kinds: `outbox.test.ts` asserts `target.kind === 'channel'` and `=== 'dm'` dispatch paths (lines 630/680/737/779).
- Verdict: TRUE — genuinely generalized, backward-compatible.

---

## Cross-read findings

### CONFIRM 6 — shared Zod schemas all exported (High)
- All spec-named exports present in `main:packages/shared/src/dm.ts`: `DmParticipantSchema`, `DmConversationSchema`, `DmMessageSchema`, `CreateConversationSchema`, `SendDmMessageSchema`, `DmConversationListResponseSchema`, `DmMessageListResponseSchema` (+ `DmMessageEventSchema`, `DM_MESSAGE_EVENT='dm:message'`). All re-exported from `packages/shared/src/index.ts` (values at 169–178, types at 180–188; `CreateConversationSchema` at index.ts:172, `CreateConversationInput` at :183). Verified individually — no missing re-export.
- Verdict: TRUE.

### CONFIRM 7 — deploy hash match / health live (High)
- `/health` → 200 live now. C-2 records both api (`89139ef5`) and web (`4bd89414`) at Railway deployment-state SUCCESS with `commitHash == 2a738f7b` (merge SHA). Consistent with prompt's assertion; spot-confirmed live.
- Verdict: TRUE.

### INFO 8 — `$CLAUDOMAT_DB_URL` is the BRAIN db, NOT the app db (methodology note, not a defect)
- Probing `$CLAUDOMAT_DB_URL` shows `current_database=railway`, `current_user=brain_47236d07…`, and `public` contains only `founder_bets, milestones, notifications, tasks, waves`. `dm_*` tables absent there — as expected: DM tables live in the StudyHall APP db (Railway Postgres service `8d177be8`, reached via `DATABASE_PUBLIC_URL`), a different database. The prompt's "probe the deployed schema via `$CLAUDOMAT_DB_URL`" is inaccurate for this repo (that var is the orchestration db), so app-schema truth rests on C-2's authoritative verification: `to_regclass('public.dm_conversations'|'dm_messages'|'dm_participants')` all present; both UNIQUE constraints + both indexes + 5 FKs verified; ledger row corrected to id=22 (phantom DDL-less id=21 removed by postgres-pro before cutover). The live 401 (not 500) on `/dm/conversations` is independent corroboration that the tables exist against the serving revision. No mutation was performed on either db.
- Verdict: no defect; app tables confirmed present via C-2's independent `to_regclass` check + live-route corroboration.

### CONFIRM 9 — deferrals are documented, not fake (Low)
- block/report, read receipts, reactions, typing, attachments, group-admin, DM search are named in spec § "Deferred to later M8 DM slices" and § Load-bearing carry-forwards #3. Legitimate scoping, not phantom completion.

### Antipattern scan — CLEAN
- No claimed-but-fake: every claimed file/export/route exists on `main` and (for routes) serves live.
- No decorative tests observed at this layer: `outbox.test.ts` asserts real channel-vs-dm dispatch discrimination; `dm.service.spec.ts` present (T-block owns depth).
- No undocumented deferred work found — deferrals all named in spec.
- One benign extra beyond spec: 1:1 find-or-create (returns existing 1:1 instead of duplicating) added at B-6 review. It preserves who_can_dm-before-find ordering. Not a spec violation; noted for jenny's semantic lane.

---

## KAREN VERDICT: APPROVE

**Findings (severity-ranked):**
1. [Critical] DM schema + migration 0021 (3 tables, 2 UNIQUE, 2 indexes, 5 FKs) — CONFIRMED present on `main` + verified in prod app db per C-2. TRUE.
2. [Critical] who_can_dm enforcement — CONFIRMED net-new, present, non-stub, enforced pre-write with whole-create-fails-403 semantics. TRUE.
3. [Critical] /dm routes registered + LIVE — CONFIRMED (source + 401-not-404 on all 4 deployed routes; 404 control). TRUE.
4. [Critical] IDOR server-derived gate + idempotency (onConflictDoNothing + re-fetch, UNIQUE-backed, fan-out only on new insert) — CONFIRMED. TRUE.
5. [Critical] outbox routing-key discriminator generalized (channel|dm) with legacy fallback, no channel regression — CONFIRMED. TRUE.
6. [High] all shared Zod schemas exported + re-exported from index — CONFIRMED. TRUE.
7. [High] deploy serves merge SHA; /health live — CONFIRMED. TRUE.
8. [Info] `$CLAUDOMAT_DB_URL` is the brain db (not app db); app-schema truth from C-2 authoritative `to_regclass` + live 401 corroboration — no defect.
9. [Low] documented deferrals legitimate; antipattern scan clean; one benign beyond-spec 1:1 find-or-create (for jenny).

No claimed-but-fake work, no stubs on any load-bearing path, no undocumented deferrals. Source claims match reality.
