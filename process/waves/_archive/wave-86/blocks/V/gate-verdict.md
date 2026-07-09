# Wave 86 — V-3 Block-Exit Gate Verdict

**Block:** V (Verify) · **Gate:** V-3 Fast-fix · **Attempt:** 1
**Reviewer:** head-verifier (fresh independent review — read the merged/deployed code directly, did not trust the stage reports)
**Wave:** SuperTokens `antiCsrf` made EXPLICIT (`'NONE'`, header-correct) + strengthened CSRF regression guard · scope=SECURITY (auth CSRF posture) · backend config-only · deployed live @a9556248 (api `0f38d1fe`, PR #106 squash `83c308a6`)
**Spec task:** `f8fb8023` (REFRAMED — seed's `VIA_TOKEN` was a cookie-mode value, wrong post header-transport pin)
**Phase 2:** skipped — empty fast-fix queue (V-2 triage: 0 blocking, 0 non-blocking, 0 noise).

## VERDICT: **APPROVED**

The security wave is correctly and safely shipped. The load-bearing acceptance claim — a cookie-only forged cross-site POST is rejected on the deployed binary — is proven on live infrastructure (T-8 pen-test, 401, airtight same-route control), not merely asserted in tests. The regression guard is a genuine tripwire wired to the prod config. `antiCsrf: 'NONE'` is the correct, non-weakening value under the pinned header transport, SDK-verified against `supertokens-node@24.0.2` at B-6. The branch-recovery concern is fully dispelled: the strengthened version is what is live on main.

---

## Judgments (against the five live checks)

### 1. Are the karen + jenny APPROVEs earned? — YES, sufficient depth for a security wave.
- **karen (source-claim, 0 findings):** 6/6 load-bearing claims re-verified by me on `main` via `git show`: `CSRF_POSTURE` const (`config:27-30`, `antiCsrf:'NONE'` `as const`, NOT `VIA_TOKEN`), Session.init sources it (`:148` transport, `:215` antiCsrf — both `CSRF_POSTURE.*`, not hand-copies), test imports the shared const (`:75`), the real-tripwire structure is present, docs accurate, deploy live. Earned.
- **jenny (semantic-spec, 0 findings):** 4/4 ACs conform on deployed reality, cross-checked against T-8's live pen-test. AC-to-deployed-behaviour mapping is sound (AC1 header transport + explicit NONE, AC2 live forged-POST 401, AC3 bearer unregressed, AC4 docs + wave-84 cross-ref). No drift vs product-decisions:907-911; correctly frames this as conformance to the REFRAMED spec, not a gap vs the superseded seed. Earned.
- Depth is appropriate: for a config-only posture wave the load-bearing proof is (a) the value is correct against SDK source and (b) the live posture rejects the forgery — both are independently established (B-6 SDK read + T-8 live pen-test), and both reviewers cross-checked T-8 rather than relying on green tests alone.

### 2. Acceptance-by-assertion? — NO. Proven on the deployed binary.
- The load-bearing AC (cookie-only forged cross-site POST rejected) is proven at **T-8 on the live api**: forged POST /servers carrying ONLY `Cookie:sAccessToken=<valid>` + `Origin:evil`, no Authorization/anti-CSRF header → **401**. Same-route triangulation (Bearer→201, cookie-only→401, no-auth→401) simultaneously proves the route is genuinely state-changing-and-guarded AND that cookie-only forgery cannot authenticate. Not vacuous, not assertion-only.
- The regression guard is genuinely effective: it sources both transport AND antiCsrf from the shared prod `CSRF_POSTURE` const (auto-fails on prod drift), uses a **structurally-valid** access-token JWT as the forged cookie (so a failure means the transport pin rejected it, not a malformed-token 401), and includes an `'any'`-transport CONTROL block proving the SAME cookie IS read under `'any'` but ignored under `'header'` — i.e. flipping the pin flips the outcome and breaks the assertions. T-4 records the flip was actually exercised. Real tripwire, not green-by-construction.

### 3. The whole arc — correctly shipped? Is `NONE` right + safe? — YES on both.
- Arc is coherent: P-0 both-REFRAME (seed's VIA_TOKEN wrong post header pin) → P-4 no-BOARD (technical-correctness under an already-decided transport, no user-facing change, no live vuln — correctly distinguished from wave-84's could-break-login transport call) → B-2 chose NONE → B-6 (head-builder + adversarial caught the tripwire-sensitivity gap and it was strengthened) → T-8 live-proved. Each gate's skip/no-BOARD call is justified.
- `antiCsrf: 'NONE'` is correct + non-weakening: B-6 read `supertokens-node@24.0.2` source directly and confirmed `doAntiCsrfCheck` is force-disabled under header transport (two independent force-false paths), so NONE/VIA_CUSTOM_HEADER/VIA_TOKEN are behaviourally identical today; NONE is chosen over VIA_CUSTOM_HEADER because the latter is a live footgun if transport ever reverts to cookie/'any'. The doc correctly names VIA_CUSTOM_HEADER (not VIA_TOKEN) as the value to restore on a cookie migration. Sound.

### 4. Branch-recovery sanity-check — CONFIRMED: live main is the STRENGTHENED version.
This was the highest-risk concern (code merged, origin branch dropped, recovered from local git objects). I verified directly, not via the reports:
- `83c308a6` (PR #106 squash) and `a9556248` are **both ancestors of `main`** (`git merge-base --is-ancestor` → YES).
- `git diff a9556248 main` on `supertokens.config.ts` + `csrf-posture.spec.ts` is **empty** — the deployed commit's code is byte-identical to live main.
- On main: `CSRF_POSTURE = { tokenTransferMethod:'header', antiCsrf:'NONE' } as const` (`:27-30`); Session.init wires `CSRF_POSTURE.tokenTransferMethod` (`:148`) + `CSRF_POSTURE.antiCsrf` (`:215`); the test imports the shared const (`:75`), has `buildStructurallyValidAccessTokenJwt` (`:116`) as `FORGED_COOKIE_VALUE` (`:134`), and the `'any'`-transport control block (`:272+`). No `.skip`/`.only`.
- The **old weak forged string** (`forged.prior.sAccessToken.value`) that B-6 flagged is **entirely absent from main** (grep count 0) — decisive proof the pre-strengthening version is NOT what shipped. `85b270de` (the pre-strengthening B-2 branch commit) is correctly NOT an ancestor of main; it was superseded.
- Conclusion: the strengthening B-6 recommended (structurally-valid cookie JWT + load-bearing control block + shared-const import) was applied and is exactly what is live. karen's on-main verification is corroborated.

### 5. Operational findings — correctly out-of-scope to backlog 1c728847. — YES.
PATCH /servers/:id 500-on-malformed-body (a validation-gap 500 that should be 400 — NOT an auth bypass), missing server-delete route, and the benign leftover e2e fixture row (needs out-of-band DB cleanup, no delete route exists) are all genuinely unrelated to a CSRF-posture wave. None is a CSRF/auth regression. Filing to backlog 1c728847 rather than bundling is the right disposition; consistent across T-8, V-2, and the T-9 gate.

---

## Gate integrity
- Reviewer independence honoured: parallel karen + jenny at V-1, triage at V-2, this fresh head-verifier verdict at V-3 — I re-derived the load-bearing claims from the merged/deployed source rather than trusting the stage reports.
- No acceptance-by-assertion (live pen-test), no spec drift (jenny 0), no reviewer false-negative surfaced on re-check, no runaway fix loop (0 cycles), no green-by-suppression (no `.skip`/`.only`; integration spec runs the real SDK recipe).
- Cross-block consistency: P-4 APPROVED, B-6 APPROVED, T-9 APPROVED all align with this verdict.

**Ship. Proceed to L (Learn).**

*Follow-up already captured (non-blocking, do NOT re-open this wave): the operational findings on backlog `1c728847`. The B-6 tripwire-sensitivity gap was resolved in-wave (the strengthened test is live), so no L-2 hardening task is required for it.*
