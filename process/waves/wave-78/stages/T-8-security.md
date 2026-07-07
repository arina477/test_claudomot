# T-8 — Security (wave-78)

**Pattern:** B — Active-execution. PRIVACY crown-jewel wave (uniform-404 anti-oracle is a hard AC tagged for T-8). Probed live against prod (855e811), fixture A (Bearer session) + client-side fetch interception on the open playwright-1 context.

## wave_type / applicable probes
`wave_type` = ui + backend + auth(privacy). The security-relevant surface is the profile-visibility anti-oracle (`GET /profile/:userId` uniform 404) and the write authz on `PATCH /profile`. Applicable probes: **anti-oracle (custom, primary)**, session/authz (401 gate), secret_grep (always). CSRF: PATCH /profile is session-cookie (SameSite) auth, unchanged this wave; auth-smoke/rate-limit: no auth-flow or rate-policy change this wave.

## Probe 1 — 404 byte-identical (anti-oracle) — PASS
Live `GET /profile/:userId` for non-visible / nonexistent / malformed targets:
| Target | HTTP | bytes | body |
|---|---|---|---|
| nonexistent UUID `00000000-…` | 404 | 68 | `{"message":"Profile not found","error":"Not Found","statusCode":404}` |
| malformed non-UUID `not-a-uuid` | 404 | 68 | *(identical)* |
| second nonexistent `deadbeef-…` | 404 | 68 | *(identical)* |

`diff` of bodies (a) vs (c): **byte-for-byte IDENTICAL**. A probing stranger cannot distinguish hidden / blocked / soft-deleted / nonexistent — all collapse to the same 68-byte 404. (Malformed non-UUID also maps to the uniform 404, not a 400/500, so id-format validity doesn't leak either.) **CARD side (live, Probe C):** a forced 404 renders the byte-identical HIDDEN state (`Profile Unavailable` / "hidden due to visibility settings") with **NO retry button** (`member-card-retry` absent from DOM).

## Probe 2 — Transient → retryable (distinct state) — PASS
Live client-side fetch interception on the card (playwright-1):
- **5xx (forced 500):** card → ERROR state, verbatim `Couldn't load profile` + retry `<button data-testid="member-card-retry">`. Repeated retry under sustained 500 → STAYS retryable (Probe A).
- **network throw:** the recovery path (Probe B) removed the fault and clicking "Try again" recovered to LOADED — proving the retry re-issues the real fetch. The transport-throw → ERROR branch is the same allowlist arm (`!(err instanceof HttpError)`), unit-covered (network-TypeError→retryable test) + exercised by the recovery.
The retryable state is visibly DISTINCT from hidden (amber "couldn't load — try again" vs calm "Profile Unavailable"), so a transport blip no longer masquerades as a deliberate privacy state.

## Probe 3 — Fail-closed (the B-6 hardening) — PASS (proven LIVE + in CI)
The fail-closed allowlist routes every non-5xx HttpError status (401/403/410/429) to the byte-identical HIDDEN state, so no target-specific status can become a privacy oracle.
- **LIVE (Probe D):** a forced **403** on the card's `GET /profile/:userId` collapsed to the HIDDEN state, byte-identical copy to the 404 hidden, **NO retry button** (`isError=false, isHidden=true`). This directly exercises the fail-closed arm in the deployed binary — stronger than "proven only in CI".
- **CI:** the B-6 hardening (commit 1fca71a) inverted the original fail-OPEN default to fail-CLOSED and added the **403→hidden guard test** in `member-profile-card.test.tsx`; web suite 703/703 green (C-1 run 28905313490). Confirmed present + passed.
- **Server side:** `profile.controller.ts` returns a uniform `NotFoundException` (no 403 path) for every non-visible cause (B-6 verified), so a live 403 is not server-constructible — the client fail-closed is defense-in-depth for any future target-specific status. Honest note: the live 403 above was injected client-side (browser fetch patch) precisely because the server never emits one; that is the correct way to prove the client branch without fabricating a server 403.

## Probe 4 — No email leak — PASS
`GET /profile/:userId` PublicProfile is exactly an 11-key allowlist: `academicRole, academicYear, accentColor, avatarUrl, bio, displayName, institution, program, pronouns, userId, username`. **No `email`/`mail` key** on either the self target OR a real co-member (fixture-b da74148e, visible → 200). Grep clean on both.

## Probe 5 — Unauth → 401 — PASS
Unauthenticated `GET /profile/:userId` → **401** `{"message":"unauthorised"}` (auth gate fires before authz; no anon read of the public-profile route). Consistent with C-2's unauth 401 probe.

## Action 5 — Secret grep — PASS (zero)
`git diff 31b7550..855e811 -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api[_-]?key|secret|token|password|bearer…'` → the only hit was the literal word **"retry"** inside a source comment (regex substring of no secret). **Zero real credential matches.**

## Triage
No critical / high / medium security findings. Anti-oracle preserved and hardened (fail-closed proven live). Nothing to route.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [anti_oracle_404, transient_retryable, fail_closed, no_email_leak, session_401, secret_grep]
auth_smoke: null
csrf_results: null
session_results:
  - "unauth GET /profile/:userId -> 401 {message:unauthorised}"
rate_limit_results: null
anti_oracle_results:
  - "404 byte-identical across nonexistent/malformed/second-nonexistent (68 bytes, diff clean)"
  - "card: forced 404 -> byte-identical HIDDEN, no retry (Probe C)"
  - "card: forced 5xx -> retryable ERROR + retry button; sustained retry stays retryable (Probe A)"
  - "card: retry-after-transient -> LOADED recovery (Probe B)"
  - "card: forced 403 -> byte-identical HIDDEN, no retry (fail-closed proven LIVE, Probe D)"
  - "CI 403->hidden guard test present + passed (web 703/703)"
  - "PublicProfile 11-key allowlist, NO email (self + co-member fixture-b); grep clean"
secret_grep_findings: []
fix_up_cycles: 0
findings: []
```
