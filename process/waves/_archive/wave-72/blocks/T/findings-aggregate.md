# Wave 72 — T-block findings aggregate

(no findings yet)

## T-8 Security (live prod probes)
- **[MEDIUM] session-token-storage (FINDING-1):** SuperTokens is in HEADER token-transfer mode (api/web are different Railway origins + no explicit `tokenTransferMethod` on either `Session.init()`), so session tokens arrive as JS-readable `st-access-token`/`st-refresh-token` response headers, not httpOnly cookies. Server `cookieSameSite:'none'`/`cookieSecure:true` is present but never exercised. **PRE-EXISTING app-wide posture — NOT a wave-72 regression** (wave-72 did not touch tokenTransferMethod; the erasure + both re-auth doors work correctly regardless of transport). Remediation: either document header mode as intentional on both sides, OR set `tokenTransferMethod:"cookie"` on both `Session.init()` calls (server config already prepared). → V-2 classify; likely a `bug-security` follow-up task/wave (changing auth transport is a significant standalone change).
- **[LOW] rate-limit-boundary (FINDING-2):** `POST /profile/delete` unauth burst → 401×8 then 429 (throttler active at ~8). 401 guard is primary; tightening to 3-5 optional. → V-2.
- **[INFO] cookie-samesite-config-gap (FINDING-3):** server cross-origin cookie config correct but unexercised (subsumed by FINDING-1).
- **PASS (wave-72 erasure ACs, all live-verified):** no-IDOR (401, userId body ignored); owner-block 409 (Fixture A blocked + intact); erasure (throwaway 200 deleted); BOTH re-auth doors reject deleted user (door i signIn WRONG_CREDENTIALS_ERROR; door ii access-token 401 + refresh-token 401); secret grep 0.

## T-5 E2E / T-6 Layout (live prod, post-hotfix)
- **PASS (all wave-72 UI ACs):** Danger Zone renders (danger #b91c1c); acknowledgment checkbox gates the destructive confirm (disabled→enabled); owner-block 409 surfaces the server list non-destructively (no logout/redirect, Fixture A intact); copy reconciled (no email-verify/30-day/permanent-purge promise); layout clean + portaled dialog at 1440/1024.
- **[LOW/ops] F1 service-worker-stale-bundle:** a returning user with the pre-fix service-worker registration gets the OLD broken bundle once until the SW self-updates, then recovers. New visitors get the fixed build. Recommend SW cache-bust / skipWaiting on deploy. → V-2 (bug-design/ops follow-up).
- **[COSMETIC] F2 heading-copy:** section heading "Delete your account" vs design-ref "Danger Zone (Deletion)" label. → V-2 (non-blocking).
- **[COSMETIC/fixture-only] F3 tall-owner-block-dialog:** Fixture A owns ~600 servers so the owner-block list makes the dialog tall (internal scroll, footer pinned, no clip). Real users unaffected. → no action.

## P0 (RESOLVED this wave)
- **Prod white-screen (require is not defined):** the B-5 namespace-import workaround shipped raw CJS require() into the browser bundle. Fixed forward (PR #89 / 69ad79b): @studyhall/shared now emits ESM; api.ts reverted to named imports; both services redeployed; prod renders. STRONG L-2 candidate: BUILD-PRINCIPLES rule 1 (boot the prod-built artifact before merge) was skipped at B-5 (dev-smoke deferred) — that gap let the runtime require() bug reach prod despite green CI build.
