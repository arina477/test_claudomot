# Wave 78 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-block gate)
**Reviewed against:** process/waves/wave-78/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
Every layer proves a user-observable outcome, and the crown-jewel anti-oracle is genuinely proven — not asserted. I independently confirmed the fail-closed branch in source (`MemberProfileCard.tsx` L215: `if (!(err instanceof HttpError) || err.status >= 500) → error, else → hidden`) is a true allowlist: only a non-HttpError throw or a 5xx retries; every other HttpError status (401/403/404/410/429) collapses to the byte-identical hidden state. The CI 403-guard test (`member-profile-card.test.tsx` L184-198) asserts real DOM — `Profile Unavailable` present, `member-card-retry` absent, `try again` button absent, `couldn't load` absent — so a mutation to `>= 400` or a fail-OPEN default fails it (mutation-sanity holds). T-8's live 403-via-client-injection is legitimate and honestly scoped: the server emits no 403 (uniform `NotFoundException`), so injecting the status client-side is the correct way to exercise the client fail-closed arm in the deployed binary without fabricating a server path — the honest note in T-8 Probe 3 documents exactly this. T-3 proves all five write-contract ACs (null→200, ''→null, absent→unchanged, teacher→400) live on prod plus shared 41/41 in CI, asserting the typed 400 on invalid enum rather than a bare throw. T-4 reads the cleared value back through a SEPARATE harness connection, proving committed SQL NULL rather than in-session SUT state — real-Postgres, not mocked. T-8 covers the IDOR/anti-oracle surface (404 byte-identical across nonexistent/malformed/second at 68 bytes with clean diff), the negative unauth→401 path, and the no-email 11-key allowlist on self AND a co-member. No coverage theater, no mock-the-SUT, no single-client-echo (this wave has no realtime path — two-client discipline is correctly N/A), no flaky-retry masking (zero flakes fired; the medium finding is a Playwright profile-dir infra issue, not an app defect or a blind retry). T-7 SKIP is legitimate (~90 LOC, no heavy type, no new dep/route/migration/hot-query). The only field-level finding (T-3 #1, displayName sibling couldn't restore to its original null) is prod-state residue on a NON-wave field; the wave's own field (academicRole) was restored exactly to "educator", confirmed twice. All three findings are non-blocking and correctly surfaced to V-2 rather than fixed in-block. Every applicable stage-exit checkbox ticks.

## Cascade

T-block cascade rules (no rework required — APPROVED):

- **Stages that must re-run after the above:** none
- **Stages that stay untouched:** T-1, T-2, T-3, T-4, T-5, T-6, T-7 (skipped), T-8

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
