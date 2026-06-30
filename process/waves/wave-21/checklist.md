## Wave 21 stage completion

**Wave:** 21
**Active milestone:** eb2a1688 — M4 Offline-first reliability (the wedge) [in_progress]
**Seed task:** c1dbee64-ca16-43d4-aef3-2c1bd1377614 — Derive live connection state and plumb it into the app shell
**Bundled siblings (2):**
- 94e41695-8326-4807-9e34-a85c55c7288f — Loop the reconnect catch-up so multi-page offline windows fully drain
- 2fe6b517-825c-4ac6-b2fe-01896be15915 — Test the live connection-state transitions and multi-page catch-up drain
**claimed_task_ids:** [c1dbee64, 94e41695, 2fe6b517]

**Pending ritual outcomes / carry-ins for P-0:**
- Wave-21 is the 2nd M4 wave (offline UI data-source + multi-page catch-up loop). CONSUMES the wave-20 spine (Dexie store, outbox, ?after= forward cursor) — does NOT rebuild. Verify seed premises vs codebase per PRODUCT-PRINCIPLES rule 1.
- design_gap QUALIFIED: connection-state component already shipped + design-system §8 compliant; pending/failed message UI already shipped. P-0/P-block decides whether D-block fires — likely NOT (no new visual surface). The seed is a data-source/plumbing + non-visual catch-up loop.
- Carried T-findings: M1 POST-succeeds/delete-fails window untested; catch-up-loop tests now seeded (sibling 2fe6b517). Playwright chrome-absent (task 67881a58).
- obs-4 (principles-bypass guard, 6th recurrence) is record-only at N — already in founder digest; not a wave-21 build item.

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate APPROVED

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [x] B-1 (SKIP)
- [x] B-2 (SKIP)
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [x] T-1 Static (PASS — CI lint+typecheck green on merge SHA)
- [x] T-2 Unit (PASS — web 193 EXECUTED, api 346)
- [x] T-3 Contract (RECORD — no new schema/route)
- [x] T-4 Integration (PASS — no-data-loss multi-page catch-up RATIFIED)
- [x] T-5 E2E (RECORD — live deferred, chrome-absent KI; CI e2e + fake-indexeddb authoritative)
- [x] T-6 Layout (PASS — connection-state indicator LIVE, a11y-as-contract)
- [x] T-7 Perf (PASS — M1 carried, dedup-safe)
- [x] T-8 Security (RECORD — frontend-only, no new server surface, gitleaks green)
- [x] T-9 Journey (APPROVED — 0 Critical/0 High; journey map regen v0.16→0.17)

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
