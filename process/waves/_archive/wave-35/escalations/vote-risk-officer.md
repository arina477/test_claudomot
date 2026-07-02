# BOARD vote — risk-officer — descope-who-can-dm-w35

## Vote
APPROVE Path A

## Rationale (≤150 words)
Path A is unambiguously the lower tech-risk surface. (a) A forward-persisted who-can-DM preference is a single additive enum column with a default — expand-contract compatible (BUILD-PRINCIPLES rule 3: seed the create path column-for-column, not backfill-only). No destructive migration, fully reversible, no lock-in. The only real shape risk is enum-value drift from the future DM guard; contain by fixing the enum contract now (`everyone`/`server-members`/`nobody`). (b) The profile-visibility gate on `GET /servers/:id/members` and `GET /profile` is additive server-side filtering, contained to the messaging/profile module — blast radius one module, testable at T-2/T-4. (c) Path B pulls a whole DM subsystem (new Socket.IO namespace + handshake auth + guard + schema + offline outbox) into a launch-polish milestone — StudyHall's highest-risk surface per BUILD-PRINCIPLES, multi-wave scope-blast, delayed launch. DMs are feature #21, deliberately H2-deferred (feature-list.md). Descoping to documented scope is correct, not a gap.

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
Lock the preference enum to the future DM guard's contract now, and prove the profile-visibility gate doesn't strip fields existing member-list consumers rely on via a B-6 negative-path test (rule 4).
