# V-1 — Semantic spec verification (jenny) — wave-8 M2 invites/join

**Verdict: APPROVE**

Verified the LIVE deployed state (main @ 8716b4e / PR#18; api https://api-production-b93e.up.railway.app) against the 4-block spec contract on task `c7443638` and its three siblings. All acceptance criteria that can be verified statically + via synthetic probes against deployed code MATCH. The three T-9 deferrals (no verified prod fixture, revoked-no-endpoint schema-forward, no /invite e2e) are intentional and tracked. One Low-severity drift in the share-modal default (ad-hoc-on-open vs permanent-code-default) — non-blocking.

Method: read the spec from DB; read live source (`servers.controller.ts`, `servers.service.ts`, `servers.module.ts`, `db/schema/invites.ts`, `auth/auth.guard.ts`, `auth/supertokens.config.ts`, `web/src/pages/InviteJoinPage.tsx`, `web/src/shell/InviteShareModal.tsx`, `web/src/router.tsx`); inspected migration `0004_gigantic_saracen.sql` at the deployed commit; read C-2 deploy record; live-probed the deployed API.

---

## Block c7443638 — Two-tier invite backend (CSPRNG) — **MATCHES**

- **Migration** — `invites` table created with all required columns + types in `apps/api/drizzle/migrations/0004_gigantic_saracen.sql` (id uuid pk; server_id uuid notNull → servers cascade; code text UNIQUE notNull; created_by text → users; max_uses integer null; uses integer notNull default 0; expires_at timestamptz null; revoked boolean notNull default false; created_at timestamptz default now). `servers.invite_code text` added + `servers_invite_code_unique` constraint. Drizzle TS schema (`db/schema/invites.ts`, `db/schema/servers.ts:11`) matches the SQL. C-2 confirms 0004 applied to prod BEFORE new code served; `invites` table + `servers.invite_code` present in prod.
- **CSPRNG codes** — `generateCode()` = `randomBytes(16).toString('base64url')` (`servers.service.ts:24-26`) = 128-bit entropy, ~22-char URL-safe, non-sequential/non-enumerable. Used for BOTH `servers.invite_code` (at server creation, L57-61) and ad-hoc `invites.code` (L207). MATCHES the ≥128-bit AC.
- **Member-gated createInvite** — `createInvite()` selects `server_members` for (serverId,userId); throws `ForbiddenException` (403) if not a member (`servers.service.ts:186-195`) BEFORE inserting. MATCHES "caller MUST be a member else 403". Live probe: `POST /servers/<id>/invites` unauthed → 401 (auth gate before member gate). Note: createInvite returns `{code}` only; `InviteResponse.url` is optional (`packages/shared/src/invites.ts:20`) and the client constructs the link from web origin — consistent with the "returns the code/link" AC.
- **Edge cases** — code collision: explicit retry loop on PG `23505` unique_violation, MAX_RETRIES=5 (L205-233). Permanent-code backfill: C-2 records prod `servers` count = 0, so backfill is a documented no-op; new servers self-generate `invite_code` at creation. Non-member → 403 (verified above). MATCHES.
- **Carry-forward (ServersModule placement)** — HONORED. No separate `InvitesModule` exists; `InvitesController` + invite methods live in `ServersModule` (`servers.module.ts:8` registers `[ServersController, InvitesController]`, both backed by `ServersService`). The spec's `contracts.api` text names "InvitesModule" as an option but the P-block carry-forward bound this to ServersModule placement; honored.

## Block 77e2041a — Invite-preview + join-membership API — **MATCHES**

- **GET /invites/:code (public, minimal)** — `InvitesController.getInvitePreview` has NO `@UseGuards` (`servers.controller.ts:110-113`). SuperTokens only intercepts `/auth/*` (apiBasePath `/auth`), so `/invites/*` is genuinely public — confirmed by LIVE probe returning **404** (not 401) for an invalid code. Returns exactly `{server:{id,name,memberCount}}` (`servers.service.ts:266-294`) — NO members list, NO channels, NO categories, NO owner. Resolves BOTH ad-hoc `invites.code` (tried first) AND permanent `servers.invite_code` (fallback). Invalid/revoked/expired/maxed → 404 via `validateInviteActive` (L32-47). C-2 live-probed a real valid permanent code → 200 minimal shape only, then 404 after cleanup. MATCHES the minimum-summary security AC.
- **POST /invites/:code/join (verified, atomic)** — `@UseGuards(AuthGuard)` (`servers.controller.ts:121-122`). AuthGuard runs `verifySession()` (`auth.guard.ts`); `EmailVerification.init({ mode: 'REQUIRED' })` (`supertokens.config.ts`) makes verifySession enforce the verified-email claim globally → unverified session = 403 INVALID_CLAIMS, unauthed = 401. MATCHES "VERIFIED session required". Live probe: unauthed join → **401**.
- **Atomicity / idempotency** — `joinViaInvite` wraps everything in `db.transaction` (`servers.service.ts:313-396`): resolve+re-validate inside txn (TOCTOU guard, L324-325); `INSERT server_members ... onConflictDoNothing().returning()` (L347-351) — idempotent on UNIQUE(server_id,user_id); `newMemberJoined` derived from RETURNING length. **max_uses enforced atomically** via conditional `UPDATE ... WHERE uses < max_uses RETURNING` (L369-378); 0 rows returned → throw → whole txn rolls back, so concurrent last-slot race yields exactly one winner. MATCHES the no-concurrent-overshoot AC.
- **Carry-forward (re-join no-double-increment)** — HONORED. uses is incremented ONLY when `newMemberJoined && isAdHoc && inviteId` (L364). Existing-member re-join → `onConflictDoNothing` returns empty → no increment, returns 200 `{serverId}`. Permanent code never increments (isAdHoc=false). MATCHES "re-join = no-op 200, doesn't double-increment".
- **Edge cases** — concurrent max_uses=1 (atomic conditional, exactly one wins); re-join no-op 200; owner already member (idempotent); permanent code never expires/maxes (no invites row to validate). All MATCH.

## Block 72fc08ea — Invite-join page (preview + join) — **MATCHES**

- **Route /invite/:code public-reachable** — registered under the Public group in `router.tsx:40`, no AuthGuard/GuestGuard wrapper. MATCHES.
- **8 states** — `InviteJoinPage.tsx` implements all eight: loading, invalid, unauthed, unverified, already-member, valid, joining, joined (`PageState` L42-50; render switch L650-662). Spec lists "loading / valid / invalid-or-expired / already-member / joining / joined" plus unauthed + unverified gates — all present. MATCHES.
- **Preview-then-gate flow** — fetches public `GET /invites/:code` first (L576), then derives session/verification/membership (L582-616); join → `POST /invites/:code/join` → success stores serverId in `sessionStorage('sh:select-server')` and navigates to `/app` (L628-634); ServerContext auto-selects (`ServerContext.tsx:84`). MATCHES "redirect into the server".
- **Login-return** — unauthed CTAs route to `/signup?next=/invite/:code` and `/login?next=/invite/:code` (L271,279) so the user lands back. MATCHES.
- **Unverified gate** — dedicated state with `sendVerificationEmail()` resend (L296-378). MATCHES the EmailVerification-gate AC.

## Block 54407e1d — Invite-create + share UI — **MATCHES (1 Low drift)**

- **"Invite people" affordance** — `data-testid="invite-people-btn"` in `ChannelSidebar.tsx:156-162`, only shown when a server is selected; opens `InviteShareModal` (L196-200). Member-gated implicitly (the channel sidebar only renders inside an authed, member-accessible server). MATCHES.
- **Modal + copy** — `InviteShareModal.tsx` reuses Modal/Button patterns (mirrors CreateServerModal), `<dialog>` with aria-modal, focus trap, Esc-to-close; Copy button → `navigator.clipboard.writeText` with execCommand fallback (L159-174) → Toast `aria-live` "Invite link copied" (L37-66). MATCHES "copy-to-clipboard (Toast on copy)".
- **Full /invite/:code URL on web origin** — `inviteUrl = invite.url ?? \`${window.location.origin}/invite/${invite.code}\`` (L78). MATCHES "link is the full /invite/:code URL" + "link uses the web origin".
- **No role/permission UI** — none present; only link + copy + done/retry. MATCHES "NO kick/ban/roles".
- **DRIFT (Low):** AC says the link should be "**the permanent `servers.invite_code` by default**, OR generate an ad-hoc invite." The modal instead calls `createInvite` (ad-hoc) on every open (`InviteShareModal.tsx:86-98`) and never surfaces the permanent code as the default. Functionally the produced link is valid and joinable, but (a) it mints a fresh ad-hoc `invites` row each time the modal opens, and (b) the "permanent code by default" intent is not met. Non-blocking — the share flow works end-to-end and the permanent code still exists/resolves via the preview+join path. Recommend a backlog note to default to the permanent code (or fetch it from server detail) and only mint ad-hoc on explicit "generate limited link." @code-quality-pragmatist could confirm the simpler permanent-default path.

---

## Scope discipline — all deferrals correct

- **No RBAC / per-role channel visibility** — DEFERRED correctly. No role/permission columns, no per-role channel filtering anywhere in invites/servers code. Spec + P-0 explicitly defer; M2 NOT fully closed (the join half of the success metric is delivered; RBAC is a later M2 bundle). Correct.
- **No kick/ban/settings** — DEFERRED. No such endpoints/UI. Correct.
- **No realtime (M3)** — DEFERRED. Member-count + server detail are request/response only; no Socket.IO pull-forward. Correct.
- **No gold-plating** — createInvite retry loop, atomic conditional consume, and TOCTOU re-validation are load-bearing security (P-0-flagged), not gold-plating. No speculative abstraction, no extra surfaces. Clean.

## Carry-forwards (both binding) — HONORED

1. **ServersModule placement** (no standalone InvitesModule) — honored (`servers.module.ts:8`).
2. **Re-join no-double-increment** — honored (`servers.service.ts:364`; increment gated on `newMemberJoined && isAdHoc`).

## T-9 deferrals — confirmed intentional/tracked

- No verified-email prod fixture (C-2 §"Authed-join fixture note"); authed paths covered by 179 green tests + integration suite vs Postgres 16. Fixture recommendation carried forward.
- Revoked-no-endpoint: `revoked` column + `validateInviteActive` revoked→404 exist (schema-forward); no revoke mutation endpoint this wave. Tracked.
- No /invite e2e: covered by unit/integration + C-2 synthetic probes. Tracked.

## Note on local working tree

The local checkout was missing migrations 0002/0004; verified against the DEPLOYED commit 8716b4e (which contains 0000/0001/0002/0004) — that is the state V-1 must judge. Deployed migrations + C-2's prod-applied confirmation are authoritative. No spec impact.

```yaml
v1_jenny_verdict: APPROVE
blocks:
  c7443638: MATCHES
  77e2041a: MATCHES
  72fc08ea: MATCHES
  54407e1d: MATCHES (Low drift: ad-hoc-on-open vs permanent-code-default)
carry_forwards: {servers_module_placement: HONORED, rejoin_no_double_increment: HONORED}
deferrals_correct: true   # RBAC/per-role-visibility, kick/ban/settings, realtime all deferred; M2 not fully closed by design
gold_plating: none
findings:
  - {severity: Low, block: 54407e1d, file: "apps/web/src/shell/InviteShareModal.tsx:86", issue: "share modal mints a fresh ad-hoc invite on open instead of defaulting to the permanent servers.invite_code", blocking: false}
```
