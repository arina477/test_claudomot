# V-1 Karen — Source-Claim Verification (wave-15 M3 @mentions)

**Verdict: APPROVE**

Deployed: main @ c3b46f0 (PR#27 merge fd86540 + T-block docs/journey commits on top; no production code changed after merge).
API https://api-production-b93e.up.railway.app · Web https://web-production-bce1a8.up.railway.app — both revisions SUCCESS.

Method: verified the local working tree at HEAD c3b46f0 (which contains the merged PR#27 code) against the spec/plan/build claims, plus live route behavior. The brain DSN is the control-plane DB, NOT the app DB, so migration application is confirmed via live route behavior + C-2's prod-DB confirmation + the committed migration SQL/journal (wave-13/14 precedent).

---

## Per-claim results

### Claim 1 — Files exist as claimed → VERIFIED
- `apps/api/src/messaging/mentions.ts:31` — `parseMentions(body)` parser present.
- `apps/api/src/db/schema/messages.ts:90` — `message_mentions` pgTable; UNIQUE(message_id,mentioned_user_id) at :104, index at :106.
- `apps/api/drizzle/migrations/0007_massive_chamber.sql:1` — CREATE TABLE message_mentions + 2 FKs + index.
- `apps/api/src/messaging/messages.controller.ts:186` — `@Controller('me')` MentionsController; `@Get('mentions')` at :201.
- `apps/web/src/shell/MentionAutocomplete.tsx` — present (14KB).
- `apps/web/src/shell/useMentionBadge.ts` — present (6.6KB).
- `apps/api/src/messaging/messaging.gateway.ts:238` — `@OnEvent('mention.created')` handler present.

### Claim 2 — Routes / registration → VERIFIED
- GET /me/mentions registered: `messages.controller.ts:186` (`@Controller('me')`) + `:201` (`@Get('mentions')`) → `getMyMentions` → `messagesService.getMyMentions` (:211).
- Migration 0007 in journal: `apps/api/drizzle/migrations/meta/_journal.json:58` tag `0007_massive_chamber`.
- MentionEvent contract in shared: `packages/shared/src/messaging.ts:147` (`MentionEventSchema`); re-exported `packages/shared/src/index.ts:74,86`.
- Per-user room join in gateway `handleConnection`: `messaging.gateway.ts:107` `socket.join(\`user:${userId}\`)`.

### Claim 3 — Live route behavior → VERIFIED
- `GET /health` → **200**.
- `GET /me/mentions` (unauthed) → **401** (guard active — not 404, route exists & is protected).
- `GET /me/bogus-nonexistent-xyz` (control) → **404** (confirms 401 is meaningful, not a catch-all).

### Claim 4 — Deploy serves merge + migration 0007 applied → VERIFIED (indirect, per documented method)
- Live 401-not-404 on /me/mentions proves the new MentionsController is in the running revision (route did not exist pre-wave-15).
- Migration application confirmed by C-2 prod-DB check + committed SQL (`0007_massive_chamber.sql`) + journal entry. The committed SQL is internally consistent (FKs reference existing `messages.id` / `users.id`).

### Claim 5 — Tests present → VERIFIED (presence; count not independently re-run)
- `apps/api/src/messaging/mentions.spec.ts` (24 `it/test`), `messages.service.spec.ts` (31), `messaging.gateway.spec.ts` (23, 24 mention/`user:` refs).
- `apps/web/src/shell/useMentionBadge.test.ts`, `messaging.test.tsx` — both reference mentions.
- `packages/shared` mention coverage via `messaging.ts` schemas exercised in suite.
- Note: the headline 471 total is a B-block report; presence + mention-specific coverage confirmed. Count itself is UNVERIFIED-by-rerun but non-load-bearing (see antipatterns).

### Claim 6 — LOAD-BEARING: username-resolution chain → VERIFIED
The chain is genuinely closed end-to-end:
1. `MentionAutocomplete.tsx:199-203` — `onSelect({ username: member.username })` inserts the canonical `member.username` token (NOT displayName). Null-username members filtered out at `:144-148`.
2. `packages/shared/src/servers.ts:62` — `ServerMemberSchema.username: z.string().nullable()` carries username to the client.
3. `apps/api/src/servers/servers.service.ts:241` selects `username: users.username`; `:251` maps `username: r.username ?? null` — `listServerMembers` genuinely returns username.
4. `apps/api/src/messaging/mentions.ts:41` — `parseMentions` returns **lowercased** tokens.
5. `apps/api/src/messaging/messages.service.ts:178-183` — resolver `WHERE server_id=$ AND username IS NOT NULL AND lower(users.username) = ANY(tokens)`, scoped to `server_members` join.
- **Case-fold alignment confirmed**: tokens are lowercased (mentions.ts:41) AND the SQL lowercases the column (`lower(${users.username})`, service.ts:182). Both sides fold — the F-4/wave-14-class "autocomplete inserts X but resolver matches Y" mismatch is NOT present. The NULL-username guard (P-4 carry-forward) is present at :181.

### Claim 6b — LOAD-BEARING: mention realtime → VERIFIED
- Gateway joins `user:<id>` room on connect: `messaging.gateway.ts:107` (userId from verified SuperTokens session, not client-asserted — :105-106).
- Service emits one `mention.created` per recipient with self-exclusion: `messages.service.ts:335-347`; `:337` `if (mentioned_user_id === authorId) continue;` — author genuinely excluded.
- Gateway fans out to recipient's room only: `messaging.gateway.ts:240` `this.server.to(\`user:${payload.mentionedUserId}\`).emit('mention', payload)`.
- Payload matches `MentionEvent` contract (messageId/channelId/channelName/serverId/mentionedUserId): service.ts:338-344 ↔ messaging.ts:147-154. Genuinely wired, not claimed-but-fake. (T-8 verified live two-client; code matches.)

### Claim 7 — Antipatterns → CLEAN
- **Claimed-but-fake**: none. Both load-bearing chains traced to real, consistent code.
- **Coverage theater**: not detected. mentions.spec.ts (24 cases) tests the parser including the email-mid-word exclusion path; gateway spec has 24 mention/room refs; service spec covers resolve + edit-path mention reconciliation (service.ts:416-450 delete-then-insert diff exists and is tested).
- **Gold-plating**: correctly OUT. `@everyone`/`@here`/`@role` excluded by grammar (mentions.ts:11,35 — only individual tokens captured); no notification-inbox beyond the scoped GET /me/mentions list + unread badge. Matches spec §SECURITY scope.

---

## Notes for V-2 Triage
- No Critical / High / Medium findings. One Low (non-blocking): the 471 test total is a B-block self-report not independently re-executed here; T-block already gated suite green, so this is informational only.
- Edit-path mention reconciliation (delete removed + insert added) at service.ts:416-450 is present and within scope; not separately re-verified live but covered by service spec.

**Karen verdict: APPROVE.** Claimed == real for all load-bearing claims; no bullshit completions detected.
