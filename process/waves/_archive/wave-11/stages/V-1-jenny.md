# V-1 — jenny semantic-spec verification (wave-11)

**Spec:** `wave-11-verified-prod-fixture` (single-spec) · task `4a2ad286-c068-406b-a2b3-4fee2a4d528b`
**Deployed:** main @ `57927b1` (PR#22, MERGED 2026-06-30) · current HEAD `10626e9`
**Verdict: APPROVE**

Verified independently against the LIVE prod api + Core and the committed git tree at the time of review — not relying on C-2/B-block reports.

## Per-AC

| AC | Status | Evidence |
|---|---|---|
| AC1 — persistent verified prod user (signup + admin-API email-verify; EV claim satisfied → passes global REQUIRED gate) | **MATCHES** | Live signin `POST /auth/signin` → `status:OK`, `user.id=21984eb2-8029-4c1b-9e73-bc586a0be4d2`. Authed `POST /servers` → **201** proves the EmailVerification REQUIRED claim is satisfied (a non-verified user would 403 on this privileged route). Re-run live at review time, not just provision-time. |
| AC2 — creds in gitignored test-accounts.md; project.yaml label+email only | **MATCHES** | `git check-ignore command-center/testing/test-accounts.md` → exit 0; `git ls-files` empty (untracked). Password `Qbq5...` (32-char CSPRNG) **not in git history** (`git log --all -S` → 0 hits) and not in the tracked tree (`git grep` → empty). `project.yaml test_users.local_dev[]` carries label+email only, password explicitly deferred to the gitignored file; user-id comment was removed to clear a gitleaks false positive. |
| AC3 — end-to-end proof: verified session → POST /servers → 201 (NOT /me, which is EV-exempt) | **MATCHES** | Live, this review: `Bearer <st-access-token>` → `POST /servers` → **201** `{id, ownerId=21984eb2}`; unauthed → **401**. Hits the privileged EV-gated route per spec, not the EV-exempt `/me`. |
| AC4 — tiny re-verify snippet/script (NOT a framework) | **MATCHES** | `apps/api/scripts/re-verify-fixture.sh` — single linear bash script (generate→consume→confirm token via Core admin API, temp Railway domain provision+teardown, no hardcoded secrets, reads userId/email from constants + API key from Railway CLI). Mirrored as a doc snippet in test-accounts.md § Re-verify. Minimal; not a fixture-management framework. |

## Edge cases / binding constraints
- **Idempotent provision** — re-verify path is find-by-userId + re-verify (not duplicate); script confirms `isVerified` rather than re-creating. MATCHES intent.
- **CSPRNG password, brain-generated** — 32-char high-entropy, no founder dependency. MATCHES.
- **Secrets only in gitignored file; project.yaml no password** — confirmed (AC2). MATCHES.
- **SuperTokens user-id recorded** for future re-verify-not-recreate — recorded in test-accounts.md + script. MATCHES.

## Scope discipline
Exactly the fixture: a provisioning artifact (script) + a gitignored credential record + project.yaml metadata + a `.gitleaks.toml`. **No app code, no migrations, no runtime change** (C-2 correctly skipped deploy — config/docs/script-only diff). Closes the 4-wave authed-verification gap and enables M3 messaging live-verify. No scope creep observed.

## Notes (non-blocking)
- C-2 did not run an independent post-merge `/health` curl (no public api URL committed). Non-blocking for THIS spec — the spec asks for an authed-route proof, which V-1 independently re-ran live (201). Health of the api is implicitly transited by the signin + POST /servers round-trip.
- DELETE not implemented on /servers, so the proof server `ad62cd12` (+ this review's `eefbe99b`) persist in prod DB. Cosmetic test-data residue; out of this spec's scope, no AC impact.

**This is the faithful minimal implementation of the spec. APPROVE.**
