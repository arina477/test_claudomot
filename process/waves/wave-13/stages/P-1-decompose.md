# Wave 13 — P-1 Decompose
- wave_type: multi-spec (3 tasks). design_gap_flag: TRUE (inline-edit + delete-tombstone + reaction-pills UI; server-channel-view.html exists → component-level delta).
- Sizing: ~2200-2800 LOC. KEEP WHOLE — edit/delete + reactions share the messages/message_reactions tables, the ChannelMessageGuard chain, the /messaging gateway, the shared Zod (one cohesive message-lifecycle bundle). Both P-0 reviewers: not a split (cohesive, reuses built infra). 
- Bundle: seed e12886d7 (edit/delete + realtime, the schema-extending foundation) → d78df376 (reactions toggle + realtime) + f323a71f (UI, depends on both contracts).
- CARRY TO P-2/T-8: edit = AUTHOR-ONLY; delete = author OR moderator role-perm (manage_channels) — SERVER-SIDE via can()+authorship (no cross-user edit/delete unless permitted); reaction toggle idempotent per UNIQUE(message_id,user_id,emoji); soft-delete ROW-LEVEL (is_deleted/deleted_at, tombstone — NO thread machinery); fan-out message.updated/deleted + reaction.added/removed ROOM-ONLY (no-leak) via the existing gateway; aggregated reaction counts on list/get; committed migration (no auto-migrate). Reuses ChannelMessageGuard. T-8 two-client + wave-11 fixture.
- verdict: PROCEED (multi-spec, whole lifecycle, UI → D-block).
```yaml
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [e12886d7-532b-4824-906a-7f336bacfd65, d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]
