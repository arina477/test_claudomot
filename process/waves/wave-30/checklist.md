## Wave 30 stage completion

**Wave:** 30
**Active milestone:** a5232e16 — M5 Academic tooling: assignments [in_progress]
**Topic:** M5 assignment due-date REMINDERS arc (cron + NotificationsModule via Resend) — the M5 headline, unblocked (Path A, Resend key set)
**Bundle (multi-spec):** 4a4c2715 (cron scan) + c5c30363 (tracking table) + 0ba853e2 (email template)

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [x] B-1 Contracts (skipped)
- [x] B-2 Backend
- [x] B-3 Frontend (skipped)
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge — PR #43 merged (squash) → 81dc821; 7/7 checks green; integration cron cases executed (CI rule 5)
- [x] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract (skipped — no contract/Zod/API surface)
- [x] T-4 Integration (real-PG tier EXECUTED nonzero — CI rule 5)
- [x] T-5 E2E (skipped — no user-visible UI/browser flow)
- [x] T-6 Layout (skipped — no app UI)
- [x] T-7 Perf (skipped — not heavy)
- [x] T-8 Security (judged-run light source-pass)
- [x] T-9 Journey — gate APPROVED (head-tester abcf3b7a); F6/F9 reminders LIVE; map bf87957

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close) — APPROVED (empty queue, closed without fix)

LEARN:
- [x] L-1 Docs — CHANGELOG #43 (assignment reminders); M5 metric MET (15 done/6 open), stays in_progress (N closes after disposition); README skipped (no feature list/env table)
- [x] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
