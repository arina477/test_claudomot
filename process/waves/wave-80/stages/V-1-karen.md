# V-1 Karen — wave-80 (presence privacy toggle, M13 leg-3b)

**Agent:** karen (source-claim verification + antipattern catalog)
**Axis:** load-bearing CLAIMS true in merge tree + deployed prod (NOT spec conformance — jenny's axis).
**Merge commit:** `4795638125301c0685864a3a5f58001373720059` (PR #99, merged, deployed).
**Deployed prod:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app`.

## VERDICT: **APPROVE**

All 6 load-bearing claims verified TRUE against the merge tree and the live deployed prod. No presence-leak path found. The one known cosmetic defect (`.strict()` comment/code mismatch, T-8 F-T3-1) is confirmed harmless — no mass-assignment risk. 0 REJECT.

---

## Findings (enumerated)

### CLAIM 1 — Files exist on merge tree — **APPROVE**
All named files present at `git show 4795638:<path>`:
- `apps/api/drizzle/migrations/0033_wave80_users_show_presence.sql` — 1 line: `ALTER TABLE "users" ADD COLUMN "show_presence" boolean DEFAULT true NOT NULL;`
- `apps/api/src/db/schema/users.ts:15` — `show_presence: boolean('show_presence').notNull().default(true),`
- `packages/shared/src/privacy.ts` — `showPresence: z.boolean()` in both `PrivacySettingsResponseSchema` (required) and `UpdatePrivacySchema` (`.object({...}).partial()`).
- `apps/api/src/privacy/privacy.service.ts` — partial update + audit gate + proactive emit (see claims 3/4).
- `apps/api/src/presence/presence.gateway.ts` — 3 emit gates + `onShowPresenceChanged` + per-user mutex (`withPresenceLock`) + `reconcileHiddenUser` (see claims 2/3).
- `apps/api/src/presence/presence.service.ts` — `getShowPresence` (:~200) + `getShowPresenceBatch` (:~215) present.
- `apps/web/src/pages/SettingsPrivacyPage.tsx:135,488` — real `useState` toggle wired to `handlePresenceChange` → `api.putPrivacy(...)`.

### CLAIM 2 — Honor real: 3 emit paths gate on show_presence — **APPROVE**
All three passive emit paths in `presence.gateway.ts` gate on the flag:
1. **Online (handleConnection step 5):** `if (wentOnline && showPresence)` — `showPresence` read at connect from `users.show_presence` (step 1, DB lookup, cached to `socket.data.showPresence`). Hidden user is excluded from the online broadcast.
2. **Offline (handleDisconnect):** `const showPresence = (socket.data.showPresence ...) ?? true; if (wentOffline && showPresence)` — uses the CACHED flag (no disconnect-time DB query). A user who never emitted online never emits offline.
3. **Snapshot (handleConnection step 4):** batches CO-MEMBERS' flags via `getShowPresenceBatch(coMemberIds)`; `const visible = showPresenceByUser.get(uid) ?? true; const online = visible && this.presenceService.isOnline(uid);`. Subject-set is co-members' flags (correct — a hidden co-member is reported offline to a connecting peer), NOT the connecting user's own flag (inbound view unaffected).

### CLAIM 3 — Proactive toggle emit (the AC mechanism) — **APPROVE**
`privacy.service.ts` calls `this.presenceGateway.onShowPresenceChanged(userId, after.showPresence)` after a committed `show_presence` change (gated on `showPresenceInPayload && showPresenceChanged && this.presenceGateway`). `onShowPresenceChanged` in `presence.gateway.ts`:
- Runs entirely under `withPresenceLock(userId, ...)` — per-user promise-chain mutex serializing against the connect-time online broadcast (F2).
- Emits `PRESENCE_EVENTS.OFFLINE` (hide) / `ONLINE` (un-hide) to `presence:server:<serverId>` rooms — the F3 audience is the UNION of the user's LIVE sockets' cached `socket.data.serverIds` (matches the H-1b disconnect invariant, avoids phantom-offline / missed-hide from a fresh DB query).
- No-ops when `!isOnline(userId)`.
- On hide, finishes with `reconcileHiddenUser(userId)` — re-reads the authoritative flag and emits a corrective offline if the user is hidden-but-online (closes the connect-vs-toggle race). The connect path's online broadcast likewise finishes with `reconcileHiddenUser` inside the lock.

### CLAIM 4 — Partial update (B-6 F1 fix) — **APPROVE**
- `UpdatePrivacySchema = z.object({profileVisibility, whoCanDm, showPresence}).partial()` — every field optional.
- `privacy.service.ts updatePrivacy` builds `setValues` from present keys only: `if (dto.profileVisibility !== undefined) ...; if (dto.whoCanDm !== undefined) ...; if (dto.showPresence !== undefined) ...` — untouched columns are never written (no cross-tab clobber).
- UI sends only the changed field: `SettingsPrivacyPage.tsx:215` — `await api.putPrivacy({ showPresence: value })`. `api.ts:745` — `putPrivacy(body: UpdatePrivacyInput)`. Partial body confirmed end-to-end.

### CLAIM 5 — Migration applied to prod + deploy hash — **APPROVE**
- **C-2 deliverable** (`C-2-deploy-and-verify.md`): migration applied to prod BEFORE api deploy (bare-node, no auto-migrate). Pre-state `information_schema` count = 0; post-verify `SELECT column_name,data_type,is_nullable,column_default WHERE column_name='show_presence'` → `show_presence | boolean | NO | true`. Matches migration spec.
- **Deploy hash (independent Railway GraphQL probe, `Project-Access-Token` header, project `ae55c191-...`):** latest deployment `status: SUCCESS`, `meta.commitHash: 4795638125301c0685864a3a5f58001373720059` (== merge SHA), `repo: arina477/test_claudomot`, `branch: main`. No SHA drift.
- **Live prod probes (independently re-run this verification):**
  - `GET /health` → **200** `{"status":"ok",...}`
  - `PUT /profile/privacy` (unauth) → **401** — route serves on new revision.
  - `GET /profile/privacy` (unauth) → **401**.
  - web `GET /` → **200**.

### CLAIM 6 — Antipattern sweep — **APPROVE**
- **Two-subject honor integration spec is REAL** (`presence-show-presence-honor.spec.ts`): uses a faithful in-memory socket.io Server double with GENUINE room routing — `.to(room).emit()` delivers ONLY to sockets whose `data.__rooms` Set contains `room`; `socket.to(room)` excludes self (mirrors socket.io). Two DISTINCT subject sockets (A toggles, B watches). Wiring is the production cross-module path: real `PrivacyService` → real `onShowPresenceChanged` → real gateway → routing double, with REAL Postgres co-member/flag queries (pg-harness). Assertions check B *received* `presence:offline`/`presence:online` for A via room delivery — NOT a self-emit or single-client. Cases cover: proactive hide/un-hide (no reconnect), snapshot exclusion for a new peer, the F2 connect-vs-toggle race ("B ends up seeing A OFFLINE"), and inbound-view-unaffected (hidden user still receives co-members' presence). **C-1 confirms this spec executed against Postgres in CI** (not skipped) — the `describe.skipIf(SKIP)` gate keys on `DATABASE_URL_TEST`, which C-1 reports was supplied ("the two new integration specs executed as part of the DB-backed suite. Not coverage theater").
- **No presence-leak path missed.** Outbound gates cover the only three emit surfaces (online/offline/snapshot); the proactive path closes the already-online mid-session case; `reconcileHiddenUser` under the per-user mutex closes the connect-vs-toggle race in both orderings. Inbound view is intentionally unaffected (documented, tested).
- **`.strict()` comment/code mismatch (T-8 F-T3-1) — confirmed COSMETIC.** `privacy.ts` comment claims "`.strict()` keeps unknown keys rejected" but the chain is `.object({...}).partial()` with NO `.strict()`. Harmless because: (a) Zod's default `.object()` STRIPS unknown keys, so unknown keys never reach `parsed.data`; (b) the controller passes `parsed.data` to the service, which maps ONLY the 3 known keys to columns via explicit `if (dto.<key> !== undefined)` guards — no mass-assignment / no dynamic column write. An unknown key is silently dropped, not persisted. Behavior is safe; only the comment is stale (a doc-fix candidate, not a defect).

---

## Notes for V-2 triage
- The `.strict()` comment (`packages/shared/src/privacy.ts`) is factually wrong but non-functional. Optional cosmetic doc fix; NOT a blocker.
