# Wave 44 — P-0 Frame

## Discover section
- **wave_db_id:** 50238bd8 (wave_number 44)
- **Prior-work citation:** the 6 tasks are V-2/T-6 follow-ups on shipped M8 core (waves 41 moderation, 42 assignment collect/return, 43 class scheduling). Re-homed into this bundle at wave-43 N-1 (seed 8e54799a).
- **Roadmap milestone:** M8 (84e17739) in_progress, product-feature. wave milestone_id backfilled.
- **Spec-contract short-circuit verdict:** no-prior-spec (each task has a V-2 prose spec, no YAML head). P-2 consolidates.
- **Product-decision resolutions:** none Tier-3. Metric-independent (debt on shipped core; the M8 metric-TBD + discretionary priority is an escalated founder-checkpoint, NOT needed for this polish wave).

## Reframe section
- **Original framing:** M8 polish/hardening — 6 pre-triaged follow-ups (seed 8e54799a class-scheduling responsive+a11y; siblings 683fec9b assignment-UI-polish, 8d971bc2 assignment-test-coverage, 8828484f muted-indicator-padding, ca43eb12 delete-any-E2E, 0308cdf1 scheduled-session-DTO+coverage).
- **problem-framer verdict:** PROCEED (file P-0-problem-framer.md). All 6 correctly-framed cause-layer polish/coverage; no antipatterns (no new feature smuggled as polish; 683fec9b stale-comment doc-only, no authz rewrite). Symptom-vs-cause passed incl. T6-F1 (root = members panel fails to collapse ≤1024 per DS §9; 28px is symptom). **3 flags → P-1/B:** (1) ca43eb12's 2-client E2E depends on fixture-B, and the fixture-B fix task **c50f3040 was STRANDED** (wave-41 wave_id, wave closed, task todo — the wave_id-strand trap) — un-stranded here (wave_id→NULL); B-block re-provisions fixture-B (resolving c50f3040) before authoring ca43eb12's E2E. (2) 8d971bc2's attachment-integration half needs S3/Tigris CI test creds (blocked) — build the UNIT half now, defer the attachment-integration AC in-task. (3) 6-item mixed bundle coherent (no auto-split).
- **ceo-reviewer verdict:** PROCEED / HOLD-SCOPE (file P-0-ceo-review.md). Right thing now (debt on shipped core; MAJOR responsive defect on the LIVE class calendar worth doing); metric-independent; no SCOPE-EXPANSION (discretionary barred until founder metric). Nothing DROP-worthy.
- **mvp-thinner verdict:** OK / `flag_metric_undefined: true` (file P-0-mvp-thinner.md). Debt-clearing, no new mvp-critical feature claim; nothing to peel. Same blocked-dep coherence flag (ca43eb12 fixture-B; 8d971bc2 S3-creds).
- **Mediation outcome:** no ceo/mvp conflict. All-PROCEED → P-1.
- **Sibling task IDs created:** none new (bundle re-homed by decomposer at wave-43 N-1). c50f3040 un-stranded (wave_id NULL).
- **Disposition:** PROCEED (metric-independent polish; blocked-dep handling — fixture-B re-provision for ca43eb12; 8d971bc2 attachment-integration deferred-in-task — carried to P-1/P-3/B).

### Final framing
**Wave-44 = M8 polish/hardening: class-scheduling 1024-responsive + a11y (seed) + assignment/moderation UI polish + scheduled-session DTO fields + test coverage. 6 tasks. Metric-independent. NO new features. (multi-spec)**
- B-block re-provisions fixture-B first (resolves stranded c50f3040) → then ca43eb12 delete-any 2-client E2E.
- 8d971bc2: unit coverage now; attachment-presign integration deferred-in-task (CI Tigris creds).
