# Wave 72 — V-1 Karen (source-claim verification against DEPLOYED state)

**Scope:** Verify the wave's load-bearing claims are TRUE in the deployed production state (files exist on merged tree, exports present, route live + guarded, migration applied, deploy serves the merge commit, both re-auth doors are real code, no antipatterns). Deployed merge commit: **69ad79b** (PR #88 `e5bfba1` + P0 hotfix PR #89 → `69ad79b`).

## VERDICT: APPROVE

All 8 load-bearing claims are TRUE against the deployed state. Files + exports exist on the merged tree, the route is live and guarded (401 not 404), the migration is applied to prod, the served web bundle proves the P0 ESM fix is live, and both re-auth doors are real code — not just claimed. No fabricated or contradicted claims. One documentation nuance (C-2 records `e5bfba1`, not the final `69ad79b`) is explained below and does not undermine any claim.

---

## Findings (claim → evidence)

### F1 — Files exist on merged tree @ 69ad79b — CONFIRMED
All 5 claimed files present via `git cat-file -e 69ad79b:<path>`:
- `apps/api/src/privacy/account-deletion.service.ts` — EXISTS
- `apps/api/src/auth/supertokens.config.ts` — EXISTS
- `packages/shared/src/account-deletion.ts` — EXISTS
- `apps/web/src/shell/DangerZonePanel.tsx` — EXISTS
- `apps/api/drizzle/migrations/0027_cold_mikhail_rasputin.sql` — EXISTS

### F2 — Exports present — CONFIRMED
- `AccountDeletionService.deleteAccount` — `account-deletion.service.ts:12` `async deleteAccount(callerUserId: string): Promise<DeleteAccountResponse>`.
- Shared schemas all exported in `packages/shared/src/account-deletion.ts`: `DeleteAccountRequestSchema` (:12), `DeleteAccountResponseSchema` (:22), `DeleteAccountBlockedResponseSchema` (:35) — each with sibling `z.infer` type export.
- ESM emission: `packages/shared/package.json:5` `"type": "module"` at 69ad79b (absent at e5bfba1 — see F5). NOTE: `dist/index.js` is **gitignored** (`packages/shared/.gitignore: dist/`), so the built artifact is NOT verifiable from git — but it is verified live via the served bundle (F5). Claim "dist/index.js uses export not require" is confirmed at the deployed-artifact level, not the source-tree level.

### F3 — Route registered + LIVE — CONFIRMED
- `POST https://api-production-b93e.up.railway.app/profile/delete` (unauthenticated) → **HTTP 401** (guarded + mounted; NOT 404). `/health` → 200.
- `PrivacyModule` imported + registered: `app.module.ts:16` import, `:55` in module list.
- Route + guard real: `privacy.controller.ts:84` `@Post('delete')`, `:86` `@UseGuards(SessionNoVerifyGuard)`, `:97` delegates to `accountDeletionService.deleteAccount(callerId)`. Owner-guard comment at `:79` ("A user can only delete their own account (no IDOR)") — caller-id derived from session, no path/body id.

### F4 — Migration applied to prod — CONFIRMED
- Migration file content: `ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;` (additive, nullable, no backfill).
- C-2 deliverable (`C-2-deploy-and-verify.md:7`) records `pnpm db:migrate` applied 0027 against prod proxy (yamanote.proxy.rlwy.net:40008), verified `deleted_at | timestamp with time zone | YES` present post-migrate, absent pre-migrate.
- Live behavioral corroboration: `POST /profile/delete` returns 401 (guard fires) rather than a 500 — the deployed service references `users.deleted_at` in every auth path (F6) without crashing, consistent with the column existing.

### F5 — Deploy serves the merge commit (P0 ESM fix live) — CONFIRMED
- Served web bundle: `https://web-production-bce1a8.up.railway.app/` references `/assets/index-DcCKmloX.js`. Fetched (2,006,318 bytes). **Raw `require("./` count = 0** — the P0-fix confirmation. The sole `require(` occurrence is `esForReactRouterDom(require("react-router-dom")…` — a Vite-generated CJS-interop shim for a third-party dep, expected/benign in an ESM Vite bundle, NOT the raw internal-module `require` that caused the white-screen.
- Lineage: `git merge-base --is-ancestor e5bfba1 69ad79b` → true. `e5bfba1:packages/shared/package.json` has NO `"type"` field (the CJS bug); `69ad79b` has `"type":"module"` (the fix). So the served bundle proves prod runs 69ad79b's ESM output, not e5bfba1's broken CJS.
- **Documentation nuance (not a defect):** `C-2-deploy-and-verify.md` records both api+web SUCCESS on **e5bfba1** (PR #88), because C-2 ran before the P0 white-screen was discovered. The subsequent hotfix (#89 → 69ad79b) redeployed. `T-9-journey.md:12,14` explicitly records prod on **69ad79b** / "P0 white-screen fixed" / re-crawled clean. The C-2 file is stale-by-one-commit relative to final prod, but the served-bundle evidence (zero raw `require("./`) is the authoritative live proof that 69ad79b is deployed.

### F6 — Both re-auth doors are real code — CONFIRMED
Not merely claimed — both doors exist in `supertokens.config.ts`:
- **Door (i) signIn override** (`:61`): after `original.signIn`, selects `users.deleted_at` (`:65`); if non-null returns `{ status: 'WRONG_CREDENTIALS_ERROR' }` (`:71`) — login rejected for soft-deleted account.
- **Door (ii) session-verify overrides** — BOTH paths covered:
  - `getSession` override (`:147`): selects `deleted_at`, throws `Session.Error.UNAUTHORISED` (`:157-160`) — access-token verify path returns 401 for deleted user.
  - `refreshSession` override (`:167`): selects `deleted_at`, throws `UNAUTHORISED` (`:176-179`) — refresh-token rotation path also closed (prevents a still-valid refresh token minting new access tokens).
This is the AND-guard-on-both-doors design from P-3; both are present.

### F7 — Atomic SERIALIZABLE erasure — CONFIRMED
- `account-deletion.service.ts`: pre-check selects `deleted_at` (`:24`); idempotent early-return if already soft-deleted (`:30`). The three erasure mutations run inside a transaction with `{ isolationLevel: 'serializable' }` (`:95`) — closes the TOCTOU window (comment `:36-37`). Scrubbed fields match P-4 security findings: `username: null` (`:81`), `avatar_key: null` (`:84`), `deleted_at: new Date()` (`:85`). Post-commit `revokeAllSessionsForUser` is defence-in-depth, its failure logged non-fatal (`:110`) — correct, since both doors already gate on `deleted_at`.

### F8 — B-2 deviations are real (not phantom) — CONFIRMED
- **presence-via-socket-disconnect:** real + documented in code, `:115-118` — "Presence is purely in-memory (PresenceService.presenceMap) — no DB rows to clear… socket connections dropped… gateway's disconnect handler clears presence normally." The deviation is that presence is NOT explicitly erased in the transaction because it has no DB residue; this is a genuine design decision, not an omission.
- **username=null:** real — `:72` comment + `:81` `username: null` mutation in the erasure block.

---

## Antipattern sweep — CLEAN
No claimed-but-fake findings. Route is genuinely live+guarded (401 probe, not a mock). Both re-auth doors are executable code with the correct error types. SERIALIZABLE transaction genuinely present. The one seam a skeptic should note — `dist/` being gitignored so the ESM claim isn't git-verifiable — is fully covered by the live served-bundle evidence (F5). The C-2/T-9 commit-sha discrepancy (e5bfba1 vs 69ad79b) is a stale-doc artifact of the P0 hotfix sequence, corroborated as resolved by the live bundle + T-9 record, not a fabrication.

## Recommendation
APPROVE. Load-bearing claims hold in the deployed state. Minor housekeeping (non-blocking): the C-2 deliverable's `commit: e5bfba1` fields are stale-by-one-commit relative to final prod (69ad79b); a one-line addendum noting the P0 redeploy would remove the only source of apparent contradiction between C-2 and T-9.
