verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [2, 10]
reasoning: |
  Symptom-vs-cause (mandatory): the symptoms (two generic 500s, both LOW/no-leak) are real. Fix #2
  (catch HeadObject NoSuchKey in checkAvatarSize/confirm → 404/400) is correctly-layered — PROCEED on
  that half. Fix #1 (ParseUUIDPipe on the :userId route param) is the wrong root fix and contradicts a
  LIVE architectural decision. Wave-33 already resolved this exact bug class project-wide: the journey
  map (last_updated_wave33) records that non-UUID route-param 500s were fixed by a GLOBAL exception
  filter mapping Postgres 22P02 (invalid_text_representation) → 400 "applied project-wide across all
  UUID-typed route params (NOT a per-route ParseUUIDPipe sweep)". That filter is live at
  apps/api/src/auth/auth.exception.filter.ts (registered in main.ts:121) and explicitly rejects the
  ParseUUIDPipe approach the task now proposes (antipattern #10, spec contradiction).
  Two compounding facts make ParseUUIDPipe actively wrong here (antipattern #2, wrong layer):
  (a) users.id is `text('id').primaryKey()` (apps/api/src/db/schema/users.ts), populated by SuperTokens
  session.getUserId() — an opaque provider string, NOT contractually a canonical UUID. ParseUUIDPipe
  would return 400 on a legitimate avatar fetch for any user whose id is not UUID-shaped. A plain
  non-UUID string correctly 404s TODAY precisely because the column is text (no uuid cast).
  (b) Because :userId hits a `text` column, a NUL byte does NOT raise 22P02 (there is no uuid cast), so
  the existing global 22P02 filter never catches it — the NUL byte fails deeper (Postgres untranslatable
  -character / driver protocol rejection). The true cause is "the global filter's SQLSTATE mapping does
  not cover the text-column NUL-byte error", not "the param needs UUID-shape validation".
proposed_reframe: |
  Keep fix #2 as-is (catch NoSuchKey in checkAvatarSize/confirm → 404/400 — sound, correctly layered).
  Reframe fix #1: do NOT add ParseUUIDPipe to :userId. Instead reuse and extend the project's already-
  adopted root-cause pattern — the global SupertokensExceptionFilter (apps/api/src/auth/auth.exception.
  filter.ts). Two acceptable directions for the spec to pick between at P-2:
    (A) Reject the NUL byte at the boundary WITHOUT imposing a UUID shape the SuperTokens id-space does
        not guarantee (e.g. a lightweight guard/pipe that 400s on control chars / NUL for the text-keyed
        :userId param), OR
    (B) Extend the global filter to also map the text-column NUL-byte SQLSTATE (Postgres untranslatable-
        character, ~22021 / invalid-message driver error) → 400, mirroring the existing 22P02 branch, so
        the fix is once-in-one-place and covers any other text-keyed route param with the same exposure.
  Whichever is chosen, the framing MUST acknowledge the wave-33 global-filter decision and NOT reintroduce
  the per-route ParseUUIDPipe pattern that decision retired. The corrected fix must never 400 a legitimate
  non-UUID SuperTokens user id (add a test asserting a valid non-UUID-shaped id still 302s/404s, not 400s).
escalation_reason: |
  (not an escalation — recoverable at P-0 with the reframe above)
sibling_visible: false
