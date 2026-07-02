## Wave 37 stage completion

<!--
Seeded by wave-36 N-3 handoff.
Active milestone: M7 (6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007) — Privacy controls, notifications & launch polish [in_progress]
Seed task:  0b33df33 — Add persistent in-app notifications model + read/list API
Siblings:   f3f52d9a (mark-notification-read endpoints — single + all)
            edac03e0 (web notifications center + unread indicator)
claimed_task_ids: [0b33df33, f3f52d9a, edac03e0]
Pending ritual outcomes affecting P-0: milestone-decomposition fired at wave-36 N-1 (bundle authored;
  commit 98a9f45). No founder-pending rituals.
Parked (do NOT auto-seed): a1299e88 (Verify Resend domain) + 84e09891 (Railway bucket creds)
  — both credential-blocked founder-ops (status='blocked'); unblock only when founder provides keys.
Note: In-app notifications wave — persistent notification model + read/list/mark-read API + web
  notifications center with unread indicator. Backend NotificationsModule already exists (mentions
  built); this adds the persistent feed + web surface. UI wave (web notifications center) — P-1 owns
  the D-block decision. M7 remaining scope after this: final deploy-verification + canary wiring, plus
  the 2 credential-blocked founder-ops (Resend reminders, Railway bucket).
-->

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
- [x] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [x] B-1 Contracts
- [x] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
