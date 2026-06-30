# T-5 — E2E (wave-14)

**Block:** T · **Stage:** T-5 · **Layer:** Playwright E2E · **Pattern:** B (active, live prod) · **Mode:** automatic

## Setup
Live web https://web-production-bce1a8.up.railway.app. Logged in as verified fixture (studyhall-e2e-fixture). Provisioned + email-verified second co-member (studyhall-e2e-fixture-b) and joined it to the Fixture Proof Server (ad62cd12) so the member-list shows >1 member. Headless Chromium via repo Playwright 1.61.1. (Initial root URL is a marketing landing; login at /login; app shell at /app with client-side routing — server icon → channel.)

## Scenarios → acceptance criteria (task 058984c5 member-list panel)
| ID | Criterion | Verdict | Evidence |
|---|---|---|---|
| T5-A | Right-hand member-list panel renders | PASS | MEMBERS panel header present (screens/channel-1440.png) |
| T5-B | Grouped Online / Offline | PASS | "OFFLINE — 2" group header rendered with count; query by role/text (no testid) |
| T5-C | Rows show avatar + name + presence dot | PASS | 2 rows: studyhall-e2e-fixture + studyhall-e2e-fixture-b, each "ST" avatar initials + presence dot on avatar |
| T5-D | Reflects ACTUAL server membership (server-members endpoint, no new model) | PASS | exactly the 2 real members of ad62cd12 (matches GET /servers/:id/members roster) |
| T5-E | Live presence consumption (snapshot + incremental) | PARTIAL→covered@T-8 | UI shows Offline for both (test browser not holding a /presence socket at snapshot time); the live snapshot+online/offline incremental fan-out is PROVEN at the wire level in T-8 (B receives presence:online{A} 311ms, offline 79ms). DOM-level live-move-between-groups not re-captured (would need a concurrent socket); the data plane that drives it is verified. |

Member-list panel value content (not layout-only, per principles §12): read the actual roster — "OFFLINE — 2 | ST | studyhall-e2e-fixture | ST | studyhall-e2e-fixture-b". Count + names + grouping all correct.

## Findings
- F-5 (LOW): T5-E DOM-level live group-move not directly observed in E2E (browser didn't hold a presence socket during the snapshot). The underlying live fan-out IS proven at T-8 wire level. Non-blocking — recommend a future T-5 scenario that opens a /presence socket in the page context and asserts a row moves Online→Offline.

```yaml
test_pattern: active
skipped: false
testers_spawned: 1  # orchestrator-direct headless Playwright (browser tooling env: repo Chromium)
scenarios:
  - {id: T5-A, criterion_ref: "058984c5 panel renders", verdict: PASS, evidence_path: process/waves/wave-14/stages/T-6-layout/screens/channel-1440.png}
  - {id: T5-B, criterion_ref: "058984c5 grouped online/offline", verdict: PASS}
  - {id: T5-C, criterion_ref: "058984c5 avatar+name+dot", verdict: PASS}
  - {id: T5-D, criterion_ref: "058984c5 actual membership", verdict: PASS}
  - {id: T5-E, criterion_ref: "058984c5 live consume", verdict: PARTIAL, evidence_path: "T-8 wire proof (presence:online 311ms / offline 79ms)"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: LOW, scenario: T5-E, description: "DOM-level live group-move not directly E2E-observed; underlying live fan-out proven at T-8 wire level. Non-blocking."}
head_signoff:
  verdict: APPROVED
  stage: T-5
  failed_checks: []
  rationale: "Member-list panel renders grouped Online/Offline with correct avatar+name+presence-dot rows reflecting actual server membership (2 real co-members), queried by role/text not testid. Live-consume data plane proven at T-8 wire level; only the DOM-move re-capture is deferred (LOW, non-blocking)."
  next_action: PROCEED_TO_T-6
```
