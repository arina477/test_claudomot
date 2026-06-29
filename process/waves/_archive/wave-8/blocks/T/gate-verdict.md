# Wave 8 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-8/blocks/T/review-artifacts.md + T-1..T-8 deliverables + live boundary re-probe
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The T-block is honest: the security-critical surface of this wave (invites = access control) is proven at the layers that matter, not theater. T-1/T-2/T-3 are CI-verified (179 tests on Postgres 16 integration) covering CSPRNG code shape + uniqueness, preview-minimal via exact-key assertion, atomic max_uses concurrency (loser → rollback, not a single happy case), re-join-no-increment, and the member-gate — these assert user-observable outcomes, not mock call counts. T-4 integration verified the invite/join boundary live at C-2 with a throwaway prod fixture (preview 404 / 200-minimal / 404-post-delete; join 401; createInvite 401), and I independently re-confirmed the live boundary at gate time (invalid preview → generic 404 with no leak, unauthed join → 401, unauthed createInvite → 401). T-8 (mandatory) establishes the access boundary as genuinely sound: codes are CSPRNG ~128-bit base64url over UUID PKs (non-enumerable, no sequential surface), the public preview returns `{server:{id,name,memberCount}}` ONLY with no channels/members/owner/presence (the D-block stripped the mockup leak; the API was live-verified minimal), join is verify-required (401 unauthed / 403 unverified), max_uses is consumed via a conditional `UPDATE...WHERE uses<max_uses RETURNING` with throw-on-zero-rows rollback (TOCTOU fixed 92cc0f3, concurrency-tested), and re-join is idempotent (`ON CONFLICT DO NOTHING`, no use increment). No residual leak, enumeration, or overshoot risk. T-6 layout covers the 8-state invite-join page + 4-state share modal per the D-3-adopted designs (68 web tests), preview UI shows name+member-count only. T-7 skip is justified (not a heavy wave). Two gaps are recorded as non-blocking findings rather than REWORK because the load-bearing security paths are independently verified and the gaps are coverage/observation, not broken behavior: (1) the new public `/invite/:code` route has no Playwright e2e coverage — the smoke suite hits only `/` and `/login`; (2) authed-join is not live-probed (no persistent verified prod fixture, tracked 4a2ad286) — both route to V-2. The `revoked` column is schema-forward with no endpoint this wave (info). A green suite here does not hide a broken product.

## Findings (non-blocking → V-2)
| # | Severity | Stage | Category | Description | Tracking |
|---|----------|-------|----------|-------------|----------|
| 1 | info | T-8 | test-fixture | authed-join not live-probed (no persistent verified prod fixture); covered by 179 tests + CI integration | 4a2ad286 |
| 2 | info | T-8 | invite-mgmt | `revoked` column exists, no revoke endpoint/UI this wave (schema-forward; join honors revoked) | later bundle |
| 3 | significant | T-5 | e2e-coverage | new public `/invite/:code` route has NO Playwright e2e coverage; `smoke.spec.ts` covers only `/` and `/login`. Security paths covered by unit+integration+live probe, but the new public UI route is not browser-exercised end-to-end. | V-2 |

## Escalation
N/A — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- journey_regen: required (UI wave — new /invite/:code route + join flow + share entry)
- live_boundary_reprobe: "invalid preview 404 (no leak) / unauthed join 401 / unauthed createInvite 401 — re-confirmed at gate"
- findings_total: 3
- findings_critical: 0
