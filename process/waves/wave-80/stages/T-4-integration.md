# T-4 — Integration (wave-80, presence privacy toggle — the honor matrix)

**Pattern:** A — Verified-via-CI. The two new DB-backed integration specs executed in the C-1 `test` job (postgres:16 + pg-harness).

## Action 1 — Pattern
CI runs an integration-test job against real Postgres (pg-harness, CF-2: pg-harness imported first so SUT db singleton binds to test DB). Pattern A authoritative. C-1: `test` job 1m55s pass, CI run 28917150735, on 4795638.

## Action 2/4 — Boundary coverage audit (read both specs in full)

### presence-show-presence-honor.spec.ts (TWO-SUBJECT — the whole wave)
Drives REAL PresenceGateway + REAL PresenceService (in-memory ref-count + real getShowPresenceBatch DB query) + REAL PrivacyService (real Postgres UPDATE) against a faithful in-memory socket.io Server double with GENUINE room routing (`.to(room).emit` delivers ONLY to sockets that joined the room). Asserts events the CO-MEMBER socket B RECEIVES — not self-emits. Not coverage theater. Cases:
1. **Proactive honor (LOAD-BEARING):** A online, B watching → A PUT showPresence=false via real privacy path → B RECEIVES presence:offline for A WITHOUT A reconnecting; A un-hides → B RECEIVES presence:online. This is the AC-2 proactive cross-module emit (updatePrivacy → onShowPresenceChanged).
2. **Snapshot honor:** new peer C connects while A hidden → C's presence:snapshot reports A NOT online (co-members' show_presence batch gate).
3. **F2 connect-race:** A hidden in DB then a new A tab connects → B ends up seeing A OFFLINE, never online (reconcile re-check closes the window).
4. **Own-visibility-only:** hidden A still RECEIVES B's presence:online (inbound view unaffected by outbound hide).
5. **Offline-gate:** A connected already-hidden emits NO online AND NO offline to co-members on disconnect (cached socket.data.showPresence, no disconnect-time DB query).

### privacy-events.spec.ts (audit seam)
Real PrivacyService.updatePrivacy → privacy_events row event_type='privacy_settings_changed'; context carries ONLY non-PII visibility/whoCanDm/showPresence enum+boolean values (no email/display_name). no-op re-save writes NO event; no-IDOR (listForActor excludes other user's events); best-effort non-blocking (throwing append stub → update still succeeds).

## Boundaries traced
- Migration 0033 users.show_presence → exercised by getPrivacy/updatePrivacy real-DB reads/writes across both specs.
- getShowPresenceBatch(coMemberIds) → snapshot-honor case.
- privacy.service cross-module onShowPresenceChanged → proactive-honor case (real gateway).
- AppendPrivacyEventService showPresence audit → privacy-events case 3 + no-PII case 8.

All boundaries covered by passing integration tests on real Postgres. No mocked DB.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [migration-0033-show_presence, getShowPresenceBatch, privacy->presence onShowPresenceChanged, showPresence audit event]
ci_evidence: ["C-1 test job (postgres:16 + pg-harness) CI run 28917150735 green on 4795638; both new integration specs collected+executed in the DB-backed suite"]
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
```
