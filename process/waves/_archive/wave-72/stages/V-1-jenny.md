# V-1 — jenny (semantic-spec verification) — Wave 72 Account Self-Deletion

**Verifier:** jenny (independent spec-compliance auditor)
**Executed:** 2026-07-07
**Deployed commit:** 69ad79b · repo HEAD 2112472 (docs-only delta after deploy)
**Targets:** API `https://api-production-b93e.up.railway.app` · Web `https://web-production-bce1a8.up.railway.app`
**Spec source of truth:** `tasks.description` DB row `9658fb0b-567a-44f7-b873-c8d110e7d391` (multi-spec YAML head: erasure API 9658fb0b + DTO e11f8746 + Danger-Zone UI 898490b1)

---

## VERDICT: APPROVE

Deployed behavior matches the spec-contract **intent** across every acceptance criterion in scope: the soft-delete erasure regime, the both-doors re-auth block (hard AND), the owner-block-not-orphan guard, the copy reconciliation, and the no-IDOR invariant. All findings below are non-blocking; two are spec-gaps (spec incomplete/silent, code behaves reasonably), the rest are cosmetic or already-dispositioned-to-V-2 carryovers. No spec-drift finding rises to REJECT.

Spot-confirmed live this run:
- `POST /profile/delete` unauthenticated → **HTTP 401** (re-confirmed independently, matches T-8 Probe 1).
- Web root `/` → **HTTP 200** (P0 white-screen confirmed fixed on the deployed bundle).

---

## Per-AC semantic findings

### AC-1 — Erasure semantics (soft-delete regime) — SATISFIED
Spec (9658fb0b, ERASURE + SCHEMA ACs): reversible soft-delete (NOT a SuperTokens hard-delete), PII scrub incl. `avatar_key`, `deleted_at` marker, session-revoke, leave-all-servers; authored messages keep the tombstone convention.

Deployed source `apps/api/src/privacy/account-deletion.service.ts` matches intent exactly:
- **Soft-delete, not hard-delete:** the users row is UPDATEd, never DELETEd (`account-deletion.service.ts:77-88`); no `SuperTokens.deleteUser` call anywhere — grep-confirmed. Reversible-by-clearing-`deleted_at` is preserved.
- **`deleted_at` marker:** column exists (`apps/api/src/db/schema/users.ts:19`, `timestamp withTimezone nullable`); set to `now()` in the scrub (`:85`).
- **PII scrub incl. `avatar_key`:** `display_name → 'Deleted user'`, `username → null`, `email → deleted+<id>@deleted.invalid` (unique-safe per the NOT NULL + UNIQUE constraint), `avatar_url → null`, **`avatar_key → null`** (`:82-84`). The `avatar_key` residue the P-4 security review flagged is explicitly nulled — the spec's most specific scrub requirement is met.
- **Leave-all-servers:** `tx.delete(server_members).where(user_id = caller)` (`:93`).
- **Session-revoke:** `Session.revokeAllSessionsForUser(callerId)` (`:107`), correctly positioned AFTER the committed transaction and wrapped best-effort (a revoke failure does not strand the committed erasure — the deleted_at doors already close re-auth).
- **Tombstone convention:** no mass message purge; the scrubbed row resolves authored messages to "Deleted user" (spec-consistent; confirmed no message-DELETE in the service).
- **Atomicity beyond spec:** owner-check + scrub + membership-delete run in ONE `serializable` transaction (`:49-96`), closing the TOCTOU window where a concurrent `createServer` could orphan a server between check and scrub. This is stronger than the spec required — a positive over-delivery, not drift.

T-8 live evidence corroborates functional erasure (both doors closed post-delete). Deep PII-scrub was not directly API-observable without a second shared-server account (T-8 documented this as a test limitation, not a gap) — but the scrub is unambiguous in deployed source, so intent is verified.

### AC-2 — Both re-auth doors (the CRITICAL AC, hard AND) — SATISFIED
Spec (9658fb0b, RE-AUTH BLOCK): a deleted user MUST NOT re-authenticate; guard on BOTH doors, each independently + each T-8-verifiable, as an AND (not AND/OR).

Deployed `apps/api/src/auth/supertokens.config.ts` implements **three** independent `deleted_at IS NOT NULL` checks — the door (i) signIn plus door (ii) split into its two real vectors:
- **Door (i) — signIn override** (`:61-75`): after a successful credential match, looks up `deleted_at`; if set, returns `WRONG_CREDENTIALS_ERROR` (no deletion-status leak). Closes the fresh-login path.
- **Door (ii-a) — getSession override** (`:147-166`): every `verifySession` verify path re-checks `deleted_at` and throws `UNAUTHORISED {clearTokens:true}`. Closes the replayed-pre-deletion-access-token path.
- **Door (ii-b) — refreshSession override** (`:167-184`): re-checks `deleted_at` after rotating the refresh token. Closes the refresh-rotation path — the subtle vector where a valid pre-deletion refresh token could silently mint a new access token.

This is a true AND: revoke-alone is explicitly NOT relied upon (the service comment at `:98-105` documents revoke as defence-in-depth). T-8 live-probed all three independently and all PASSED (T-8 Probe 3c/3d/3e: signin→WRONG_CREDENTIALS_ERROR, pre-deletion access token→401, pre-deletion refresh token→401). The spec's split-identity concern (SuperTokens owns the auth user; local row owns `deleted_at`) is correctly resolved without an irreversible hard-delete. **The critical AC is met, not partially.**

### AC-3 — Owner-block semantics (block-if-owner, not orphan) — SATISFIED
Spec (9658fb0b, OWNED-SERVER GUARD): if the caller owns any server, REJECT 409/400 + list the blocking servers; do NOT orphan a server with a scrubbed owner.

Deployed `account-deletion.service.ts:51-64`: owner-check runs FIRST inside the transaction; if `servers.owner_id = caller` returns any rows, throws `ConflictException` (409) carrying `{status:'blocked', reason:'Transfer or delete the servers you own before deleting your account', servers:[{id,name}...]}` — and because it's the first statement in the txn, nothing is mutated (non-destructive). No orphaning path exists.

T-5 Probe 2 + T-8 Probe 2 live-confirmed: Fixture A (owner of ~600 servers) → HTTP 409 with the server list, account intact, re-sign-in succeeds immediately after. Matches intent.

### AC-4 — Copy reconciliation — SATISFIED (spec's promise-nothing-unimplemented requirement honored)
Spec (898490b1, COPY RECONCILIATION): the shipped UI copy must NOT promise email-verification / 30-day-grace / permanent-purge, since this slice ships immediate soft-delete.

Deployed `apps/web/src/shell/DangerZonePanel.tsx`:
- Section body: "Deactivate your profile, remove your personal data, and sever all server associations. This action will be processed immediately." (`:83-86`) — no verify/grace/permanent promise.
- Acknowledgment label: "I understand my account will be deactivated and my personal data removed" (`:410`) — the mockup's "permanently deleted" was softened to soft-delete-accurate wording (documented in the component header `:7-14`).
- Consequence list (`:306-338`) describes deactivate / remove data / leave servers / "Deleted user" tombstone — all accurate to what ships.

T-5 Probe 4 recorded the shipped strings live and confirmed no forbidden promises. **Satisfied** — the code honors the spec's reconciliation requirement.

### AC-5 — No-IDOR — SATISFIED
Spec (9658fb0b + edge-cases): a user can only delete their OWN account; session-only callerId, no userId in path/body; 401 unauth.

Deployed `apps/api/src/privacy/privacy.controller.ts:84-98`: `POST profile/delete` takes callerId ONLY from `req.session.getUserId()` (`:96`); no userId path/body param is read (an injected `userId` in the body is ignored — the service signature is `deleteAccount(callerUserId)`). Guarded by `SessionNoVerifyGuard`, which fully verifies the access token (see AC-note below). Body is Zod-validated (`confirm: z.literal(true)`) → 400 on absent/false (`:91-93`).

T-8 Probe 1 live-confirmed: unauth → 401; `userId`-in-body injection → still 401 (guard rejects before handler). Re-confirmed 401 live this run. No IDOR vector exists.

---

## Findings (tagged spec-drift vs spec-gap)

- **F1 — SATISFIED / not-drift: `SessionNoVerifyGuard` vs the spec's literal "AuthGuard".**
  Classification: **NOT a defect** (spec-intent satisfied; documentation nuance).
  The spec text says "POST /profile/delete (AuthGuard)". Deployed uses `SessionNoVerifyGuard` (`privacy.controller.ts:86`), which fully verifies the session access token but strips the EmailVerification REQUIRED claim validator (`session-no-verify.guard.ts:19-26`). This is the CORRECT choice and matches the sibling `/profile/*` privacy routes: it lets an authenticated-but-email-unverified user delete their account (the spec's own edge-case 3a explicitly deletes a `verified:false` throwaway — full AuthGuard would have 403'd it on the EmailVerification claim). So the deployed guard is what the spec's edge-cases actually require; "AuthGuard" in the prose is shorthand for "session-guarded." No action.

- **F2 — spec-gap (LOW, out of this spec's scope): session-token storage is header-mode, not httpOnly cookies.**
  Classification: **spec-gap** — pre-existing, app-wide, NOT introduced by wave-72.
  T-8 FINDING-1 (MEDIUM): tokens are delivered as JS-readable `st-access-token`/`st-refresh-token` response headers, not httpOnly Set-Cookie, because `apiDomain ≠ websiteDomain` and `tokenTransferMethod` is unset on both SDKs. The wave-72 spec is silent on token-transfer mode (it inherited the auth topology). This is a real posture gap worth a future P-2 (decide: document header-mode as intentional, or switch to cookie-mode — the server already carries `cookieSameSite:'none'`/`cookieSecure:true` for it), but it is orthogonal to the erasure feature and correctly dispositioned to V-2. Not a wave-72 acceptance blocker.

- **F3 — spec-gap (LOW, ops): stale service-worker serves the pre-fix bundle once to returning users.**
  Classification: **spec-gap** — deployment/SW-lifecycle behavior the spec didn't anticipate.
  T-5 F1: the first load of a returning visitor with the old SW registration hits the pre-fix (white-screening) bundle exactly once, then self-updates and recovers; new visitors get the working build immediately. The spec never addressed SW cache-busting / `skipWaiting`. Reasonable to flag for the C-block/ops as a future hardening item; not an erasure-feature defect and does not affect the deployed erasure behavior. Dispositioned to V-2.

- **F4 — cosmetic (spec-gap, trivial): section heading "Delete your account" vs design-ref label "Danger Zone".**
  Classification: **spec-gap** (design-ref label not enforced) — cosmetic only.
  T-5 F2: the danger-red styling, intent, and destructive affordance all match the design; only the literal "Danger Zone" label differs. The spec AC referenced the design panel by name but did not mandate the literal string. No functional impact.

- **F5 — informational: rate-limit onset at ~8 requests (T-8 FINDING-2, LOW).**
  Classification: not-a-defect. The 401 guard is the primary gate; the throttler (429 at req ~8-9) is defence-in-depth. Optional tightening only. No action needed for acceptance.

---

## Spec-gap detection summary (verification axis 6)

Deployed behavior surfaced three things the spec did not anticipate: header-mode token storage (F2), the SW-stale-bundle lifecycle (F3), and the design-label drift (F4). None are erasure-logic defects; F2 and F3 are the two worth carrying into a future P-2 / ops note (both already captured in the V-2 findings-aggregate). Everything the spec DID specify — soft-delete regime, both doors, owner-block, copy-reconcile, no-IDOR — is implemented in deployed source and corroborated by live T-5/T-8 probes plus this run's independent 401-unauth + web-renders spot-checks.

**Bottom line: deployed behavior faithfully implements the spec-contract intent. APPROVE.**
