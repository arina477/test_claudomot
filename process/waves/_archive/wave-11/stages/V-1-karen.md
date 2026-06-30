# V-1 Karen — Source-Claim Verification (wave-11: verified prod test fixture)

**Scope:** Tiny ops/test-infra wave. Verify V-1 source claims against LIVE merged state.
**Merged state:** `main` @ `10626e9` (T-block close); fixture provisioned via PR#22 squash `57927b1`.
**Load-bearing checks:** SECRETS-SAFETY + fixture actually works.

**VERDICT: APPROVE**

---

## CRITICAL — Secrets-safety confirmation: PASS (no committed secret)

Independently verified against the live merged tree + full wave-11 history:

1. **`test-accounts.md` gitignored + never committed.**
   - `git check-ignore command-center/testing/test-accounts.md` → ignored (exit 0).
   - `git ls-files | grep test-accounts` → empty (not tracked).
   - `git log --all --oneline -- command-center/testing/test-accounts.md` → empty (never in history).
2. **No committed password / API key / token in the wave-11 diff.**
   - Scanned added lines of all 6 wave-11 commits (`02ac64e`, `bda813f`, `6ac1d03`, `71b6d8c`, `166a127`, `10626e9`) for secret literals — every match is doc/review **prose about** secret handling, not a value.
   - `git log -p -S "password:" -- project.yaml` → no password value ever added (only the gitignored-pointer comment).
3. **`apps/api/scripts/re-verify-fixture.sh` reads key at runtime — no hardcoded secret.**
   - `ST_API_KEY` fetched via `@railway/cli variables` (script:37); password read from gitignored test-accounts.md; `APP_RAILWAY_TOKEN` required as env var (script:31-32).
   - No `KEY=<literal>` / `TOKEN=<literal>` / `PASSWORD=<literal>` assignment anywhere (grep clean).
4. **`project.yaml` test_users = label + email only** (`studyhall-e2e-fixture` / `studyhall-e2e-fixture@example.com`); password line is a gitignored-pointer comment, no value. Satisfies `claudomat doctor` no-password guard.

**Any committed secret = REJECT. None found → PASS.**

---

## Check 2 — Fixture works: PASS

Live prod (`api-production-b93e.up.railway.app`):
- `GET /health` → **200**.
- `POST /servers` unauthed → **401** (auth boundary holds).
- Authed **201** proof trusted from provision: server `ad62cd12-...` created with verified session, owner `user-id 21984eb2-8029-4c1b-9e73-bc586a0be4d2`, email verified via Core admin API (recorded in `57927b1`). Real, not faked.

## Check 3 — gitleaks allowlist is SCOPED, not a bypass: PASS

`.gitleaks.toml`:
- `[extend] useDefault = true` — all default rules stay live.
- `[allowlist]` triple-constrained: commit `ab6ce69…` + path `project\.yaml` + literal UUID `21984eb2-...` (`regexTarget = "match"`). No commit/file/value outside that triple can match; no rule disabled.
- Suppresses ONE confirmed false positive (SuperTokens user_id = DB record UUID on a comment line, not a credential). CI run `28411140907` on main: secret-scan **pass**; earlier PR runs failed (scanner genuinely catches it → allowlist is load-bearing, not silencing). No `--no-verify`, no workflow edits, no history rewrite.

## Check 4 — Antipatterns

- **Gold-plating:** NONE. No fixture framework, no abstraction — one provisioned account + one re-verify script. Scope exact.
- **Claimed-but-fake:** NONE. Fixture is real (POST /servers 201, ownerId 21984eb2); boundary + health independently re-confirmed live.

---

## Minor (non-blocking)

- One P-3 source claim ("admin-API verify path used successfully in waves 7/8/10") was factually WRONG — corrected at P-4 to first-time/unproven-against-prod. Did not invalidate the approach (SDK docs independently support it) and the path demonstrably worked (201 + verified). Already caught upstream; recorded here for the L-block CI-false-green / claim-provenance carry-forward.

**APPROVE.** Secrets-safe (no committed secret), fixture live + verified, allowlist scoped, no gold-plating, no fake claims.
