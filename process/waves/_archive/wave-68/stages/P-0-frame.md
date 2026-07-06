# P-0 Frame — wave-68

## Discover
- wave_db_id: 3a682562-638b-4b04-961b-8ea4b645d95c (wave_number 68, running; milestone M11 backfilled)
- Prior-work: wave-67 shipped M11 discovery READ path (directory API + /discover UI + join) but no write-path → directory inert. THIS is the write-half + the folded memberCount:0 fix. Cited.
- Roadmap milestone: M11 Growth: server discovery (8d88e691), in_progress. ## Class product-feature (→ mvp-thinner spawned).
- Spec-contract short-circuit: no-prior-spec (seed 2bd37c4c prose).
- Product decisions: opt-in publish (is_public default false) + owner-gated; safe defaults. Moderation still deferred (documented product-decisions L732). Monetization/compliance/public-LAUNCH-go remain founder-reserved.

## Reframe (seed 2bd37c4c: publish-write-half + memberCount fix)
- **problem-framer: PROCEED** — owner-authz idiom EXISTS (server.owner_id !== callerId → ForbiddenException, servers.service.ts:368/408 invite revoke/rotate; + manage_server RBAC flag). Owner-gate belongs in SERVICE layer + must be a HARD AC (non-owner publishing someone's server = the REFRAME failure mode). memberCount:0 confirmed (correlated subquery textually-correct-returns-0; unit mocks it) → LEFT JOIN+GROUP BY fix + live-DB test; pairs (test needs published servers). Moderation deferral deliberate. NOTE: design/server-settings.html Roles tab is SUPERSEDED (forbidden permission matrix) — reuse only its Overview shell as prior art.
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — keystone (converts inert wave-67 infra into a working growth feature; direct completion of the read-half). Correct bundle (publish + memberCount; ranking/trending premature at 0 users). FLAGS: moderation-before-public-LAUNCH (sequence: publish now → moderation next → launch); founder-reserved boundary intact (opt-in low-risk; public-LAUNCH-go stays founder-reserved).
- **mvp-thinner: OK** — every AC traces M11 metric: is_public toggle + UNPUBLISH (safety floor, do-not-over-cut) + description/topic (metric names them verbatim → NOT deferrable) + memberCount (size signal). Reuse existing server-settings surface (toggle + 2 fields, no redesign). No peel.

**Disposition: PROCEED** to P-1.

**Final framing for P-block:** M11 bundle #2 = make discovery publishable + correct. (1) Owner-gated `PATCH /servers/:id` (toggle is_public + set description/topic) — SERVICE-layer owner-authz (reuse the :368/:408 owner_id gate; owner or manage_server), hard AC; opt-in default-false preserved; UNPUBLISH included. (2) server-settings UI: a publish/unpublish toggle + description/topic edit, reusing the existing server-settings Overview shell (NOT the superseded Roles tab). (3) memberCount:0 fix — LEFT JOIN + GROUP BY in discoverServers + a LIVE-DB test (real Postgres/pg-harness) as a hard AC. CARRIES: owner-authz service-side (security); memberCount live-DB test; reuse Overview shell. STRATEGIC (founder, not this wave): moderation bundle must precede public launch.

```yaml
short_circuit: no-prior-spec
roadmap_milestone: 8d88e691-5e39-492f-83a9-73a1a9440af3
disposition: PROCEED
wave_type_expected: multi-spec (publish backend + settings UI + memberCount fix — P-1 decomposes)
claimed_task_ids: [2bd37c4c-eca8-4eda-900b-0276fe46f1b3]
design_gap_flag: unset  # P-1 (likely minimal — reuse server-settings Overview shell)
strategic_notes: [moderation-before-public-launch]
