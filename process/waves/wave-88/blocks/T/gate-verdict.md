# Wave 88 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-88/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

Coverage is adequate and the evidence is REAL — independently verified against CI run 29051887913 (job 86234356653) on the merge commit d0646058, not taken on the stage authors' word.

**T-4 / T-8 integration evidence is genuine, DB-backed, and executed.** The four wave-88 senderKeyRef cases live in `apps/api/test/integration/dm-encryption.integration.spec.ts` (describe "encrypted send senderKeyRef re-validation (wave-88 B-2)", lines 421-548) and ALL ran GREEN against the `postgres:16` service container in the CI `test` job: MATCHING→row stored (90ms), MISMATCHING→rejected/no-row (101ms), no-key→fail-open (122ms), and **post-rotation T-8→current key B ACCEPTED, stale key A rejected (154ms)** — job log lines 3274-3279, integration project final tally 30 files / 290 tests passed (line 3695-3696). This is not mock-the-system-under-test: the file's first import is the real `pg-harness` side-effect (sets DATABASE_URL to the live test DB), and every assertion is a real `harnessQuery` SELECT against `dm_messages` / `user_encryption_keys` — the MISMATCH case asserts `count(*) = '0'` (side-effect-free rejection), the post-rotation case asserts a single `user_encryption_keys` row equal to key B before proving B is accepted and stale A throws BadRequestException. No mutation-sanity concern: the load-bearing revert-check was performed at B-5 (removing the production throw fails ONLY the mismatch case, fail-open still passes) — a real tripwire.

**Unit layer is honest.** The 5 AC cases (dm.service.spec) ran green in the same job (log lines 2017-2021), asserting no-insert + no-emit on mismatch (state change, not mock-call trivia), fail-open on no-key, and no-revalidation on the read path. 833/833 api unit green (line 3061-3062).

**T-8 security reasoning is sound.** (1) Server-side mismatch rejection PROVEN with zero-row side-effect assertion. (2) Fail-OPEN is the correct choice — a fail-closed design would DoS legitimate keyless senders and the register-then-send race; the keyless-send-succeeds case proves it. (3) Server-blind model preserved — the check compares two PUBLIC key strings (base64 SPKI senderKeyRef vs `user_encryption_keys.public_key`, the select projects public_key only); no plaintext/private/ciphertext-interior access, corroborated by the still-green server-blind invariant tests (content NULL for encrypted rows, log lines 3252-3256) and the "no private-key column exists" test. (4) Unspoofable — the check keys off session-derived callerId (`req.session.getUserId()`), never a client field, and superRefine forces senderKeyRef to accompany ciphertext so no path persists a key-ref while skipping the guard. (5) No privilege escalation — the check only RESTRICTS (write-path only, reads untouched); it cannot grant a capability. (6) The feared over-strict-validation failure mode (legitimate post-rotation send blocked) is neutralized and PROVEN neutralized by the UNIQUE(user_id) single-key + upsert-replace design plus the executing post-rotation CI case. No bypass surface identified.

**Skips are legitimate.** T-3 contract: correct SKIP — the DM send request/response shape is unchanged and senderKeyRef pre-existed; the new 400 is a new CAUSE under an existing status/shape, not a new contract surface. T-5 e2e: correct SKIP — in normal operation the client sends its OWN registered key, so the mismatch-400 never fires for a live user; the sole trigger is a stale client post-rotation (rare edge). T-6/T-7: correct SKIP — non-UI, non-heavy backend change.

**Client-handling assessment is adequate; no unverified security-relevant surface.** I independently checked `apps/web/src/shell/useDm.ts`: an API send failure (including the new mismatch-400) flips the matching optimistic row to `state: 'failed'` via the shared drain `onFailed`/`markFailed` handler (lines 46, 270-275) — a VISIBLE failed-send with retry, not a silent drop. The client-side "optimistic send: shows failed state + retry on API error" test ran green in CI. (Minor note: the T-8 write's `:610 catch` line reference points at the IDB-enqueue catch, not the API-send failure path — the substantive claim is correct, the cited line is imprecise; non-blocking, cosmetic.) The auto-re-register-on-keyref-mismatch enhancement is correctly filed as a low, non-blocking observation given the rare trigger and already-visible failure.

**Findings:** 2, both correctly classified non-blocking — a pre-existing non-required e2e sign-in flake (unrelated to wave-88, already tracked task 5cc59349) and the client-UX enhancement observation. No critical/high. The e2e job fail on this PR is that pre-existing flake in a non-branch-protection-required job; it does not gate.

No coverage theater, no mocked system-under-test, no flaky-retry masking, no untestable-surface scope creep. For a SECURITY change the load-bearing properties are CI-proven on real Postgres. Wave-88's security surface is clean.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
