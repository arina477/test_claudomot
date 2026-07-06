# P-0 Frame — wave-67

## Discover
- wave_db_id: a6c97a92-599c-40ba-a90b-f81db43a4a24 (wave_number 67, running; milestone M11 backfilled)
- Prior-work: fresh milestone (M11 just promoted from M12 close, founder Option A). No prior discovery waves. StudyHall servers are invite-only today (findMyServers member-scoped; joinViaInvite membership core).
- Roadmap milestone: M11 Growth: server discovery (8d88e691), in_progress. ## Class product-feature (→ mvp-thinner spawned).
- Spec-contract short-circuit: no-prior-spec (decomposer prose across 3 tasks).
- Product decisions: visibility default = OPT-IN (is_public default false) — a privacy-safe default (not a founder poll; safe default per rule 17). Moderation deferred. Monetization/compliance (M9/M10) founder-reserved, untouched.

## Reframe (3-task M11 bundle #1: 609c9bdd seed + 37b78777 + e363dac2)
- **problem-framer: PROCEED** — verified in code: seed's is_public defaults FALSE (opt-in; existing servers stay private, no backfill exposing them → no public-by-default privacy defect); join sibling gates on servers.is_public server-side (rejects non-public joins; does NOT weaken the invite path); coherent browse→see→join vertical; moderation/ranking deferred correctly. Absence-claims accurate (no is_public/description/topic/discover-endpoint exist today).
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — strong pick: both bet legs (academic tools M5/M8 + offline-first M4/M12) already done, so discovery is the genuine next unbuilt frontier + the only buildable growth milestone (M9/M10 founder-reserved, M13 H3/partnership-heavy). Maps to weekly-active-students north star. 3-task slice is the minimum coherent milestone claim (not expandable — ranking/trending sort an empty shelf at 0 users; not reducible). COLD-START FLAGS (non-blocking): (1) directory renders empty until owners opt in → make honest empty-state an explicit P-2 AC; (2) populating the directory is a GTM/seeding action (founder as first publisher), not code; (3) a moderation follow-up bundle should land BEFORE any public LAUNCH (not before build).
- **mvp-thinner: OK** — every AC traces to M11's explicit success metric verbatim (search, description, topic/size, one-click join all named); pagination is defensive-LIMIT (cheap correctness); moderation/ranking/categories/trending correctly fenced OUT to later bundles. No peel; splitting further = OVER-CUT.

**Disposition: PROCEED** to P-1 (multi-spec, 3 tasks, ~2200 LOC — above floor).

**Final framing for P-block:** M11 discovery bundle #1 = turn StudyHall invite-only → discoverable. Seed: is_public (default FALSE/opt-in) + description + topic on `servers` + migration; `GET /servers/discover` public directory (name/description/topic/member-count, basic pagination + search); member-scoped `GET /servers` untouched. Sibling: new `/discover` browse UI (list + search + community info). Sibling: one-click join gated server-side on is_public (reuse joinViaInvite membership core, no invite token required for public). CARRIES for P-2: honest empty-state AC; server-side is_public join gate (security); opt-in visibility (no backfill). design_gap_flag likely TRUE (new /discover page → D-block). STRATEGIC NOTE for founder digest (not this wave): moderation bundle required before public launch; directory needs GTM seeding.

```yaml
short_circuit: no-prior-spec
roadmap_milestone: 8d88e691-5e39-492f-83a9-73a1a9440af3
disposition: PROCEED
wave_type_expected: multi-spec
claimed_task_ids: [609c9bdd-0a7b-4173-affa-298344325ac3, 37b78777-1196-4c84-8b2c-ac5dec3fd05b, e363dac2-bfed-448d-a740-36631bd5ddcf]
design_gap_flag: unset  # P-1 (likely true — new /discover page)
strategic_notes: [moderation-before-public-launch, directory-needs-GTM-seeding]
