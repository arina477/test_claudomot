# Wave 36 — P-2 Spec (pointer)

Source of truth: spec contract in `tasks.description` of primary task **622a7bf3-94ff-464b-ad14-b37bcedf290d** (YAML head + `---` + prose).

- **wave_type:** multi-spec (3 blocks) · **design_gap_flag:** false → B after gate
- **claimed_task_ids:** [622a7bf3 (privacy regression tests), 73e96a9d (states-AC re-scope docs), b7feab30 (stub-date fix)]
- **security_scope:** user-data-authz + data-export (tests OF the shipped boundary) → T-8 reviews test honesty

## Acceptance criteria (copy)
**622a7bf3 tests:** real-Postgres integration (pg-harness, CI postgres:16 / DATABASE_URL_TEST) — roster nobody-hiding (A hidden from co-member B, A sees self; everyone/server-members visible) exercising the REAL listServerMembers query (NO mock-the-SUT); data-export IDOR (?userId ignored, session-scoped); controller contract enum-400; unit (toUiVisibility, updatePrivacy, beforeSend scrub). Integration tier must PROVABLY execute (real-DB row counts, not skipped — wave-17/24 false-green lesson).
**73e96a9d docs:** product-decisions/feature-list entry re-scoping the §113 states requirement off the non-existent notifications surface. No code.
**b7feab30:** /privacy + /terms show current year (not 2024).

## BINDING
Real-Postgres integration for authz tests — mocked db = REWORK. T-4 verifies the tier executed.
