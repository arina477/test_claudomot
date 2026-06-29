# Wave 9 — T-9 Gate Verdict (T-block exit)

**Block:** T (Test) · **Wave topic:** M2 invite-completion (revoke + permanent-default + 8a backfill, LIVE) · **Gate:** T-9 Journey · **Security gate:** APPLIES (revoke = access control)

## Stage entry
```json
{ "agent": "head-tester", "stage": "T-9", "status": "gating", "block_state": { "claimed_layers": ["T-1","T-2","T-3","T-4","T-5","T-6","T-7","T-8","T-9"], "layer_verdicts": {"T-1":"PASS","T-2":"PASS","T-3":"PASS","T-4":"PASS","T-5":"PASS","T-6":"PASS","T-7":"SKIP","T-8":"PASS"}, "flaky_quarantine": [], "escalation_log": [], "coverage_deltas": {"api_tests":123,"web_tests":73,"total":196} } }
```

## Per-layer judgment

| Layer | Verdict | Basis |
|---|---|---|
| T-1 unit | PASS | 196 tests; pure-logic (conflict-free authz check, validateInviteActive) tested with assertions, not mock counts. |
| T-2 contract | PASS | `POST /invites/:code/revoke` typed; `server.inviteCode` in detail; shared types. |
| T-3 integration | PASS | revoke authz 403 (controller+service specs), revoked→404, 8a idempotent + 23505 retry, 8b no-mint regression-guard. Both allow and deny sides. |
| T-4 integration/E2E | PASS (with recorded carry-forward gap) | revoke 401 / preview 404 live-verified (independently re-confirmed at T-9); 8a backfill ran clean (0 rows). Authed-revoke/join browser e2e deferred — recorded V-2 gap (fixture 4a2ad286), carry-forward not regression. |
| T-5 layout | PASS | share-modal permanent-default + revoke UI (limited-invites list + trash + two-step confirm + revoked state) per D-3 APPROVED; 1 a11y contrast fix. |
| T-6 | PASS | folded into T-5 deliverable. |
| T-7 perf | SKIP (justified) | No new heavy surface — revoke endpoint + modal default change; no bundle/TTI delta. |
| T-8 security (MANDATORY) | PASS | All 4 P-4 conditions genuinely covered (below). Revoke access boundary IDOR-tested both sides. No critical/high. |
| T-9 journey | PASS | journey-map light-touched (revoke live, share-modal permanent-default, rotation deferred); F8 lifecycle now create→join→revoke. |

## T-8 — 4 P-4 conditions (security-tightened; revoke = access control)
1. **revoke authz, no IDOR** — owner_id OR invites.created_by, server-side, userId from session. Non-owner/non-creator → 403 (tested); unauthed → 401 (live, re-confirmed). Permanent code → 404 (not revocable via this path). **Deny side asserted, not just allow.** SOUND.
2. **revoked → 404** — both `GET /invites/:code` preview and `POST /:code/join` via shared validateInviteActive (honors `invites.revoked`). Idempotent re-revoke tested. COVERED.
3. **8a idempotent backfill** — app-side randomBytes base64url + 23505 retry, WHERE invite_code IS NULL (re-run no-op). Ran clean on prod (0 rows). NOT pgcrypto/auto-migrate. COVERED.
4. **8b no-mint-on-open** — InviteShareModal mints NO ad-hoc invite on plain open (regression-guard tested); permanent invite_code from member-gated findServerDetail; null fallback. COVERED.

Secret grep (wave-9 diff): clean.

## Deferrals (non-blocking, correctly info-severity)
- **invite-rotation** (d058283d, Gemini flag): permanent `invite_code` irrevocable, no rotate endpoint. 0 prod servers → no live exposure. Correctly non-blocking.
- **session-scoped limited-invites list**: no list-ad-hoc GET endpoint — honest gap, not a defect.

## Live spot-check (head-tester independent, 2026-06-29T20:xxZ)
- `POST /invites/<code>/revoke` unauthed → **401** ✓
- `GET /invites/<unknown>` → **404** ✓
- `GET /servers/<id>` unauthed → **401** ✓
- `GET /health` → **200** ✓

All match C-2 evidence. No stale-revision divergence observed.

## Stage-exit checklist (T-9 + security-applicable)
- [x] T-1 units assert state/return, not mock counts.
- [x] Mutation-sanity: a plausible real bug (e.g. dropping the owner||creator check) fails revoke-403 test.
- [x] T-2 typed error codes (401/403/404) asserted on invalid/unauthorized payloads.
- [x] T-3 real-Postgres integration (per C-block CI), DB not mocked.
- [x] T-7/T-8 RBAC IDOR-tested — unauthorized user asserted 403, not only allowed 200.
- [x] T-7/T-8 negative auth tests (401 unauthed, 403 non-owner) present + live.
- [x] T-9 user-journey-map.md updated (light touch — same surface, no new route) + every flow has smoke assertion; F8 lifecycle current.
- [x] Untestable/scope-excluded surfaces documented (LiveKit media-plane N/A this wave; authed-browser e2e gap recorded → V-2).
- [x] No flaky-retry masking; no single-client realtime claim (no realtime surface this wave).

## FLAG → L-block (do NOT act here — record only)
head-ci-cd hand-added **4 rules** to `command-center/principles/CI-PRINCIPLES.md` (rules 1–4) at C-2, bypassing the L-2/karen promotion gate. This violates: (a) always-on rule 12 (principles edits go through the Contract + L-2 path), (b) the file's own promotion contract ("Promoted at L-2 Distill ... by karen ... when an observation appears across 2+ waves AND head-ci-cd approves"), and (c) the **≤1 rule promoted per wave per file** cap (4 added at once). The rules themselves appear format-compliant and substantively reasonable, so adjudication options are: **revert** (re-route through L-2/karen next wave) OR **karen-vet in place** (retroactively validate 2+-wave recurrence + format, keep whichever pass). L-block to decide; not a T-9 blocker.

## journey_regen
```yaml
journey_regen:
  done: true
  mode: light-touch
  reason: "revoke + permanent-default are changes to the existing /invite/:code + share-modal surface; no new route, no new page inventory row."
  updated: ["last_updated/version bump (0.5 -> 0.6)", "page 12 revoke row Not-built -> Live", "share-modal row permanent-default note", "wave-9 deployment-status section", "F8 flow lifecycle create->join->revoke"]
  file: command-center/artifacts/user-journey-map.md
```

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9
  reviewers: {}
  failed_checks: []
  rationale: >
    Invite lifecycle is now complete (create -> join -> revoke) and every layer proves a user-observable
    outcome. The security-tightened T-8 gate passes on all 4 P-4 conditions: revoke is owner-or-creator
    gated server-side with userId from session (no IDOR) and is asserted on BOTH the deny side (403
    non-owner test, 401 unauthed live + independently re-confirmed at T-9) and the allow side; revoked
    invites 404 on both preview and join via a shared active-check; the 8a backfill is an idempotent
    run-once app script (ran clean, 0 rows, not auto-migrate); 8b mints no ad-hoc row on plain modal open
    (regression-guarded). T-1/2/3 assert state/typed errors rather than mock counts, with both happy and
    error paths on the new access-control path. T-7 perf skip is justified (no new heavy surface). The two
    deferrals (invite-rotation d058283d, session-scoped revoke list) are honest, info-severity, and break
    no tested boundary. The authed-revoke/join browser e2e remains uncovered — same recorded carry-forward
    gap (fixture 4a2ad286, V-2 finding), with deny-side boundaries live-proven and allow-side CI-covered;
    not a T-9 blocker. Journey map light-touched (same surface, no new route). One process violation flagged
    for the L-block: head-ci-cd hand-added 4 CI-PRINCIPLES rules at C-2 bypassing the L-2/karen gate and the
    1-rule-per-wave cap — recorded for L to revert or karen-vet, non-blocking for T.
  next_action: PROCEED_TO_V-block
```
