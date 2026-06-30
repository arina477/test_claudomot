# Wave 15 — P-0 Frame

## Discover
- **wave_db_id:** 94713075-bac7-426b-8f38-adf1668acf83 (wave_number 15)
- **Prior-work:** reuses wave-13 messaging persistence (a0c322b4 REST data plane, e12886d7 edit/delete fan-out) + wave-12 /messaging gateway (723b5b6a) + wave-14 presence/member data (058984c5) as mention-resolution source. NO new namespace/infra.
- **Roadmap milestone:** M3 (6198650e) in_progress; Class=product-feature, Tier=T2, H1. Wave-15 milestone backfilled. Maps to M3 ## Scope "mentions".
- **Spec-contract short-circuit:** no-prior-spec (seed prose ## What/Why/Acceptance, no fenced YAML) → full P-1..P-3.
- **Product decisions:** none Tier-3. my-mentions authz (no cross-user read) + membership-scoped mention resolution = security-tightened path → T-8 + P-4. SCHEMA: message_mentions table (first schema change since wave-13 0006) → B-0 migration.

## Reframe
- **problem-framer: PROCEED** — root primitive at correct layer; message_mentions table correct (parse-on-read can't serve authz-scoped my-mentions / unread / M4-offline); demo-paths enumerated (edit add/remove, non-member→plain, authz); @everyone/notif-center correctly OUT (feature-list #8 mention-primitive vs #14 notifications boundary). Coherent vertical slice — no split.
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — right next pick (lightest unshipped M3 vs threads-schema/attachments-SDK); includes read-side (my-mentions+unread) so not half-built; @everyone/@role/notif-inbox correctly out; traces to displace-Discord engagement bet.
- **mvp-thinner: OK (floor-blocked)** — 2 ACs (GET my-mentions, unread-affordance) would trace as nice-to-have, BUT wave is ~2200 LOC / 3 specs, ALREADY BELOW the multi-spec floor (>2500 LOC OR >=6 specs); cutting would breach further → refuse THIN, emit OK. Flag: if P-1 RESCOPE-AUTO-MERGE pulls more M3 scope and clears floor, re-eval THIN.
- **Mediation:** no ceo-expansion vs mvp-thin tie (mvp-thinner OK, not THIN). No conflict.
- **Disposition: PROCEED.** Carry the FLOOR FLAG to P-1: wave ~2200 LOC may be below the 2500 multi-spec floor → P-1 estimates precisely and decides PROCEED (if true LOC ≥2500 with migration+parsing+authz+autocomplete+pills+unread+tests) vs RESCOPE-AUTO-MERGE (expand bundle with an adjacent M3 sibling).
- **Final framing:** Wave-15 ships M3 @mentions: data plane (parse/resolve/persist message_mentions + realtime fan-out reusing /messaging + GET my-mentions authz-scoped) + composer @autocomplete member-picker + mention pills + unread-mention affordance. claimed_task_ids = [3d238446, cd585f04, c3f3f62a].
