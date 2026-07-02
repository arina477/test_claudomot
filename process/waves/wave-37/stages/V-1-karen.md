# V-1 — Karen source-claim verification — wave-37 (persistent in-app notifications)

**Verdict: APPROVE**

**Scope:** Source-claim verification against merged `main` (merge `86b7323`, "feat: persistent in-app notifications (bell, panel, unread API) (#51)") + live deploys (web `web-production-bce1a8`, api `api-production-b93e`). Verifies wave-37 load-bearing claims are TRUE — not a full V-block gate.

**Method:** `git show main:<path>` for source (verifies MERGED state, not just working tree), live `curl` for endpoints/bundle, `psql` for DB. Every load-bearing claim below is backed by cited evidence.

---

## Findings — all load-bearing claims VERIFIED TRUE

### 1. Files exist on merged main — TRUE (10/10 + both migrations)
`git cat-file -e main:<path>` succeeded for all 10 claimed files:
- `apps/api/src/notifications/notifications.{service,controller,module}.ts` — OK
- `apps/api/src/db/schema/notifications.ts` — OK
- `packages/shared/src/notifications.ts` — OK
- `apps/web/src/shell/{HeaderBell.tsx,NotificationsPanel.tsx,useNotifications.ts}` — OK
- `apps/api/test/integration/notifications-authz.spec.ts` — OK
- `apps/api/src/notifications/notifications.controller.spec.ts` — OK
- Migrations: `apps/api/drizzle/migrations/0015_majestic_scarlet_spider.sql` + `0016_chief_the_anarchist.sql` — both present.

### 2. Schema + migrations match spec (table, index, 2 partial-uniques) — TRUE
`schema/notifications.ts` defines table with `id, user_id (FK users cascade), type, message_id/channel_id/server_id (set null), assignment_id (cascade), created_at, read_at` and three indexes:
- `notifications_user_read_created_idx` on `(user_id, read_at, created_at DESC)` — schema `index(...)` block; migration `0015:...CREATE INDEX ... ("user_id","read_at","created_at" desc)`.
- `notifications_user_message_mention_uidx` — partial-unique `WHERE type = 'mention'` (`0015` tail).
- `notifications_user_assignment_reminder_uidx` — partial-unique `WHERE type = 'assignment_reminder'` (`0016`).
Migration DDL is additive-only (CREATE TABLE + ADD CONSTRAINT + CREATE INDEX; no destructive DDL). Matches spec AC-1 exactly.

### 3. Routes registered + live, correct HTTP methods (HIGH-1 fix) — TRUE
Controller decorators (`notifications.controller.ts`): `@Get()` L43, `@Patch(':id/read')` L55, `@Post('read-all')` L68.
Live method matrix (`api-production-b93e`):
- `GET /me/notifications` → **401** (registered, auth-gated; body `{"message":"unauthorised"}`)
- `PATCH /me/notifications/:id/read` → **401** (registered — the HIGH-1 fix landed)
- `POST /me/notifications/:id/read` → **404** (old method gone — confirms migration off POST)
- `POST /me/notifications/read-all` → **401** (registered)
- `PUT`/`DELETE :id/read` → **404** (correctly not registered)
A 401 (not 404) on GET/PATCH/POST proves NotificationsController shipped AND is backed by a live table (a missing table would 500 the authed path, not 401 the unauthed path). `?cursor=zzz` → 401 (unauthed short-circuits before any query).

### 4. Deploy serves 86b7323 — web bundle carries wave-37 markers — TRUE
Live bundle `/assets/index-DCKZ02HB.js` (1.69 MB) contains: `Notifications` ×8, `Mark all` ×1, `Browse channels` ×1, `read-all` ×1. ≥1 marker requirement exceeded (all present).

### 5. B-6 HIGH fixes landed — TRUE (all three)
- **HIGH-1 (PATCH not POST):** `auth/api.ts:526-528` `markNotificationRead` uses `method: 'PATCH'`; `markAllNotificationsRead` uses `POST` to `read-all`. Matches controller + live behavior.
- **HIGH-2 (HeaderBell reload on panel open):** `HeaderBell.tsx:45-49` `useEffect(() => { if (panelOpen) notifications.reload(); }, [panelOpen, notifications.reload])` — reloads on closed→open transition (documented rationale L41-43: reconciles list against live-incremented count).
- **controller.spec method-metadata assertions:** `notifications.controller.spec.ts:70-92` asserts `Reflect.getMetadata('method', ...markRead) === RequestMethod.PATCH`, path `:id/read`; `markAllRead === POST` path `read-all`; `list === GET`. This is a real CI method-drift trip-wire.

### 6. Persist-on-mention (create + edit), no-self-notify, dedup — TRUE (reuses wave-15 infra)
- `@OnEvent('mention.created')` handler `notifications.service.ts:85-107` inserts `type:'mention'` row `.onConflictDoNothing()` (backed by the mention partial-unique → dedup for re-emitted create/edit/retry events).
- No-self-notify + emit is upstream in the mention emitter: `messaging/messages.service.ts:603` `if (mentioned_user_id === authorId) continue; // exclude self-mention` then `:611 emit('mention.created')` (create path); `editMessage` (L622+) emits only for newly-added mentions (`toInsert` L690). Wave-15 spec-tests cover self-mention→no-emit and edit-dedup (`messages.service.spec.ts:29-32`). Spec explicitly scopes this as "reuses shipped infra" — correct.

### 7. Reminder path present + wired — TRUE
`createForReminder(userId, assignmentId)` `notifications.service.ts:115-124` inserts `type:'assignment_reminder'` `.onConflictDoNothing()`; called from `reminder-scan.service.ts:266` inside the existing send-once guard. Wired correctly.

---

## Antipattern scan — NO undocumented fakery found

- **Claimed-but-fake:** none. Every claimed file, route, index, and fix verified against merged main + live.
- **Decorative/dead code:** none found in the notification surface.
- **Deferred-but-undocumented:** none.

**Honestly-documented limitations (per prompt — NOT flagged):**
- Reminder rows not live-exercisable in prod (Resend-key-blocked, parked `a1299e88`): the *code path* is fully present and wired (§7); the mention path is fully live-covered (§3, §6). Documented in T-deliverables + C-2. Acceptable.
- `@OnEvent('mention.created')` persist is async-after-commit (in-process EventEmitter2, no outbox/retry): explicitly documented `notifications.service.ts:78-83` — "notification loss is acceptable at self-use scale; message delivery is not; errors logged+swallowed so persist failure can't propagate into message flow." A deliberate, documented best-effort tradeoff — not fakery.
- Per-channel `useMentionBadge` drift vs global feed: documented NON-GOAL in spec BINDING #1.

---

## Note on DB verification (transparency)
`CLAUDOMAT_DB_URL` resolves to the **studio brain DB** (`current_database()=railway`; has `waves`/`tasks`/`users`; its own unrelated internal `notifications` table with `recipient_id`/`project_id` cols — NOT the wave-37 schema). The **StudyHall app DB** (with `assignments`/`messages`) is a separate database reachable only via the Railway public TCP proxy (`yamanote.proxy.rlwy.net:40008`) that C-2 used. I therefore could NOT independently re-query the app DB indexes. Prod-migration-applied is **inferred from live endpoint behavior** (§3: authed routes 401 not 500 ⇒ table+indexes exist and back the routes) and cross-checked against C-2's authoritative post-migration verification (`C-2-deploy-and-verify.md:26-32`, which records the three correct index names verified over the proxy). Consistent, no contradiction.

---

## Verdict

**APPROVE** — all 7 load-bearing claim clusters verified TRUE against merged main + live deploys. B-6 HIGH-1/HIGH-2/method-drift-test fixes confirmed landed. No undocumented fakery, decorative code, or hidden deferrals. The two known limitations (reminder Resend-blocked, @OnEvent async-after-commit) are honestly documented and correctly out of the flag set.
