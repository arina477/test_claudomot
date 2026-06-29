# Wave 8 — B-6 Review (gate) — APPROVE (attempt 2)
## Phase 1 — head-builder
Attempt 1 REWORK: max_uses TOCTOU (non-atomic). Fixed 92cc0f3 (atomic conditional UPDATE...WHERE uses<max_uses RETURNING + throw-on-zero-rows rolls back member insert; per-row lock serializes concurrent joiners → exactly one wins; concurrency test added). Attempt 2 APPROVED. Verified: carry-forward A (InvitesController in ServersModule), B (re-join no-increment), CSPRNG 128-bit, public minimal preview (no channels/members leaked), verified join (401/403), member-gated createInvite, frontend public route+login-return, migration 0004, commit-per-spec. 179 tests (111 api + 68 web).
## Phase 2 — secret-grep clean.
```yaml
phase1_head_builder_verdict: APPROVED (attempt 2)
phase2: secret-grep clean
final_verdict: APPROVE
```
