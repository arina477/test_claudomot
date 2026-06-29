# Wave 8 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn)
**Reviewed against:** process/waves/wave-8/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Both reviewers ran independently and emitted evidence-backed verdicts — not face-value "no findings." Karen APPROVE verifies all six security/correctness ACs (CSPRNG ≥128-bit, public-preview-minimal, verified-join, atomic max_uses with TOCTOU closed via conditional `UPDATE ... WHERE uses < max_uses RETURNING` + throw-rollback, idempotent re-join, member-gated create) and both carry-forwards (InvitesController-in-ServersModule; increment-only-on-genuinely-new-member) against live curl boundary probes + merged code on `main`. jenny APPROVE confirms all 4 spec blocks MATCH the contract on the deployed commit and that every out-of-scope surface (RBAC/per-role visibility, kick/ban/settings, realtime) is correctly deferred (M2 intentionally NOT fully closed). I independently re-probed the live boundary this session — `/health` 200, `GET /invites/<bad>` 404 with a minimal NotFound body (no server data leaked), unauthed `POST /invites/x/join` 401, unauthed `POST /servers/x/invites` 401 — corroborating both reviewers; the clean security verdict on this multi-user-unlock auth feature was probed, not rubber-stamped. V-2 triage classification is sound: every finding carries severity + disposition; the two drifts are partial-implementations of well-specified ACs (not spec gaps), so neither routes to ESCALATE, and both are legitimate accept-with-owner deferrals. No finding was closed by weakening a test or assertion. fast_fix_queue empty → Phase 2 skipped.

## Finding dispositions (head-verifier adjudication)

- **8a — migration 0004 omits the permanent-code backfill (Medium / spec-drift) → DEFER (follow-up task).** Confirmed AC miss, but blast radius is empirically nil: prod `servers` count = 0 (C-2 record) and every post-0004 server self-generates a CSPRNG `invite_code` at creation (`createServer` L57). Only pre-0004 NULL-code servers are affected — of which there are zero. No live break, no security exposure, ad-hoc path fully covers join. A fast-fix would be a zero-row data migration with migration-ordering risk for no behavioral gain. Owner: a one-line backfill UPDATE in a future migration IF any NULL-code servers ever exist. Recorded, not suppressed.
- **8b — InviteShareModal mints a fresh ad-hoc invite on every open instead of defaulting to the permanent `servers.invite_code` (Low / spec-drift) → DEFER (next M2 bundle).** Feature works end-to-end (every link is valid + joinable). Drift: tier-1 "permanent by default" is unsurfaced in UI + repeated opens accumulate ad-hoc rows. Declined fast-fix because the correct fix fetches the permanent code from server detail (not a clean ≤20 LOC drop-in), M2 is explicitly not fully closed this wave (the share surface is revisited in the later M2 bundle alongside RBAC), and the deferral cost is cosmetic row-accumulation on a self-use MVP with near-zero servers. Owner: default the share link to `servers.invite_code` in the next M2 polish bundle; mint ad-hoc only on an explicit "generate limited link."
- **T-9 deferrals (no-verified-fixture, revoked-no-endpoint, no-/invite-e2e) → DEFER (tracked).** Correctly non-blocking: revoked column + 404 path exist (schema-forward); authed paths covered by 180 green tests + integration suite vs Postgres 16; e2e gap covered by C-2 synthetic probes.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
