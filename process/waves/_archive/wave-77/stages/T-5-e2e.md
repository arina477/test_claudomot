# Wave 77 — T-5 E2E

Pattern B (active). Live prod (web-production-bce1a8, api 633f362e). 

## Swarm note
Spawned 2 ui-comprehensive-testers (playwright-2, playwright-3) per Action 2 — BOTH returned BLOCKED: all 10 playwright MCP instances share ONE chrome profile dir (launched without `--isolated`), so only one browser can be acquired at a time (single-owner Singleton lock). Per T-5 principle #1 (drive the working browser rather than mark BLOCKED), executed scenarios SEQUENTIALLY on the healthy playwright-1 (which held the lock + a live Fixture-A session). No coverage lost. Finding recorded (infra, low) for the swarm-config fix.

## Scenarios (traced to acceptance criteria)

### S1 — Academic-identity editor round-trip (AC a98286cb #1) — PASS
- /settings/profile renders all academic fields with proper labels: Pronouns, Bio, Institution, Program/Field, Academic role (SELECT: student/educator/staff — exact enum), Academic year.
- Edited via real UI (typed + selected), clicked **"Save academic identity"** → **PATCH /profile 200** (network-panel captured), body reflects edits (she/her, MIT, Physics, educator, Senior).
- Dirty-tracking correct: unrelated "Save"/"Save username" stayed disabled.
- **Persistence: full page RELOAD → all values persisted** (test-principle #29 close+reopen). PASS.
- academicRole select offers ONLY student/educator/staff; NO verification/authority option. No "verified/badge" text anywhere (fenced). PASS.

### S2 — Cross-server member profile card (AC a98286cb #2) — PASS
- In Fixture Proof Server → General channel → MemberListPanel, clicked member ("View studyhall-e2e-fixture's profile") → **GET /profile/:userId 200** (network captured), card opened.
- Card renders full academic identity: username, she/her, bio, Institution MIT, Program/Field Physics, **Academic Role Educator (PLAIN TEXT)**, Academic Year Senior.
- **Response + card contain NO email** (grepped: absent). **NO verification badge** on academicRole (fenced). PASS.
- Card is read-only, portaled (position:fixed, z-120, direct body child, not clipped), Esc dismisses + card unmounts. PASS.

## Note on hidden-state card
B-3 carried a low UX obs: non-404 network errors render the same calm "Profile Unavailable" as a genuinely-hidden profile (no distinct retry). Carried to V-2 (low). The 404/hidden path itself returns uniform 404 (proven at T-8).

```yaml
test_pattern: active
skipped: false
testers_spawned: 2   # both BLOCKED on shared-profile MCP contention; ran sequentially on playwright-1 instead
scenarios:
  - {id: S1, criterion_ref: "a98286cb AC1 editor round-trip", verdict: PASS, evidence_path: "PATCH /profile 200 + reload-persist; wave-77-T6-profile-editor-1440.png"}
  - {id: S2, criterion_ref: "a98286cb AC2 member card", verdict: PASS, evidence_path: "GET /profile/:userId 200; wave-77-T5-T6-member-profile-card.png"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: "T-5 swarm infra", description: "all playwright MCP instances share one chrome profile (no --isolated); parallel swarm cannot acquire >1 browser. Ran sequentially per T-5 principle #1. Fix: per-instance --user-data-dir or --isolated."}
```
