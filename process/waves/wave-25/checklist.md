## Wave 25 stage completion

**Wave:** 25
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Seed task:** c18b8089-a7bb-442f-890f-66649d7f746a — Mention token parser parity (client MessageList ↔ server) + edit-diff
**Bundled siblings (0):** none — solo-task bundle
**claimed_task_ids:** [c18b8089]

**Pending ritual outcomes / carry-ins for P-0:**
- **User-visible correctness wave (M5 backlog).** After 3 under-floor/debt waves (w23 authz, w24 test-tier), head-next picked the highest USER-VISIBLE debt: mention token parser PARITY between the client MessageList renderer and the server parser (they can diverge → a mention renders as a pill on one side but plain text on the other, or an edit-diff mis-detects added/removed mentions). Re-homed M3 debt (from wave-15 @mentions).
- **Seed scope (c18b8089):** align the client (apps/web MessageList mention-token parser) with the server (apps/api messaging mention parser + message_mentions persistence) so both use the same word-boundary/token rules; + the edit-diff add/remove path. VERIFY at P-0 what the two parsers actually are (PRODUCT-PRINCIPLES rule 1) — the client renders pills, the server persists message_mentions (migration 0007, wave-15).
- **NEW real-PG integration tier available (wave-24):** c18b8089 can land real-DB integration coverage on the extended wave-17 harness (pg-harness.ts). If the fix touches server mention resolution, add an integration spec.
- **CI-PRINCIPLES rule 5 (NEW, promoted w24):** assert a nonzero executed-count from the CI integration job log — a green exit with zero specs run is a false-green. Apply at T-4/C-1 if this wave adds integration specs. Plus rule 4 (formatter-check-at-wiring) + BUILD rule 6 (specialists run formatter before reporting).
- **design_gap likely FALSE/PARTIAL** — mention parity is mostly parser logic; may touch the MessageList pill render (existing component, token-level). Confirm at P-1.
- **Founder-digest carries (record-only):** (1) **Resend key = the SOLE blocker to closing M5** (sharpened — reminders is the last M5 scope; every other lane is self-serve debt); (2) chrome-absent 67881a58 keeps presence-UI debt (10b9d18e) unverifiable; (3) principles-write structural guard unimplemented (4th hold). Digest: process/session/updates/board-digest-2026-07-02.md.
- **M5 backlog (future seeds):** d058283d (invite rotation — head-next runner-up, security), 6a546c7b (presence perf — now test-covered), 10b9d18e (presence dots — chrome-absent-blocked), d23a0740 (cleanup); + cross-cutting 4a92327c (ParseUUIDPipe), 875b97f4 (security hardening), 72cb6ebb (stale-comment sweep), 226c7e42 (integration-tier hardening); + wave-22 V-2 follow-ons. Reminders arc = M5 headline, cred-blocked.

PRODUCT:
- [x] P-0 Frame (no-prior-spec; problem-framer PROCEED [both premises code-verified] + ceo-reviewer SCOPE-EXPANSION [shared slug grammar] + mvp-thinner OK → accepted MINIMAL expansion: extract slug regex to packages/shared + editMessage txn wrap + real-PG rollback spec; claimed [c18b8089])
- [x] P-1 Decompose (single-spec below floor → decomposition incomplete-scope [reminders cred-blocked] → PRECEDENT-APPLICATION override-ship [4th; w24 BOARD said dont-re-litigate]; M5-disposition escalated to founder; design_gap_flag=false → skip D)
- [x] P-2 Spec (single-spec; 5 ACs to c18b8089.desc — shared slug grammar extraction + client parity + editMessage txn wrap + real-PG rollback spec)
- [x] P-3 Plan (shared slug grammar extraction + server/client imports + editMessage txn + real-PG rollback spec; typescript-pro/backend-developer/react-specialist; no dep/migration)
- [x] P-4 Gate APPROVED (head-product APPROVED + karen+jenny APPROVE; Gemini CONCERN→NOT-MATERIAL [usernames exclude dots, client-match-server correct]; B-1 carry: name export MENTION_TOKEN_SLUG_RE)

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [x] B-1 Contracts
- [x] B-2 Backend
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify
- [x] C-3 Canary — SKIPPED (DAU<1000)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract
- [x] T-4 Integration
- [x] T-5 E2E
- [x] T-6 Layout
- [x] T-7 Perf
- [x] T-8 Security
- [x] T-9 Journey

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
