# Wave 39 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-w39-T9)
**Reviewed against:** process/waves/wave-39/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
Every layer proves a user-observable outcome and every load-bearing assertion is mutation-sane. The crux (spec AC-7, UI-only avatar reachability, closes wave-38 F1) is proven by a real live round-trip — `presign 200 → PUT 200 → confirm 200 → img naturalWidth=64` (a decoded 64px image, not a 0-width broken tag) plus persistence across a fresh login — anchored to the interface-only path, not asserted. The T-8 logout claim is genuinely a server-side revocation test, not a client redirect: the same protected `GET /profile` returns 200 while authed and **401 after signout**, with httpOnly tokens cleared and `/app` bouncing — a real negative test proving SuperTokens revoked the session. Skipping T-3/T-4/T-7 is correct, not evasion: the spec declares `api: none new`, `data: none (frontend-only, no schema delta)`, and `design_gap_flag: false`, so there is no contract/schema/service system-under-test to exercise and nothing is mock-substituted for a real dependency (the mock-the-SUT trap is avoided by absence, not by faking). T-6 popover coverage is adequate for the real risk surface of a dark-only brand — dark-token correctness with an explicit no-light-flash check, upward-open placement, in-viewport/not-clipped, no overflow @1280. Keyboard accessibility (Enter/Space open, Esc-close+refocus, outside-click, close-on-select, reject-path) is covered across T-2 (8 UserMenu unit tests incl. the logout-reject-still-navigates guard) and T-5 live. Scenarios ran ≥2× with zero flakes and `fix_up_cycles: 0` — no flaky-retry masking. The two minor findings (avatar-preview low contrast = tiny-PNG fixture artifact; 429 = expected rate-limit under a rapid test loop) are correctly classified as non-defects rather than silenced real bugs. No realtime path exists this wave, so two-client verification is not applicable; LiveKit media-plane is out of scope entirely. Suite is honest; it would fail on a plausible real regression of the doorway, the logout, or the avatar round-trip.

## Rework instructions  (only if REWORK)
n/a

### Cascade
T-block cascade rules — no rework triggered, no downstream re-run.

- **Stages that must re-run after the above:** none
- **Stages that stay untouched:** all (T-1, T-2, T-5, T-6, T-8; T-3/T-4/T-7 remain skipped)

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
