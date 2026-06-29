# Wave 9 — P-1 Decompose
- wave_type: multi-spec (3 tasks). design_gap_flag: TRUE-delta (revoke affordance + share-modal change; invite-share.html exists).
- Sizing: SMALL completion bundle (revoke endpoint+UI + 2 drift fixes), same subsystem (ServersModule invites + InviteShareModal). KEEP WHOLE — coherent invite-completion vertical. Not splittable meaningfully.
- Bundle: 08ff762f (8a backfill — FIRST, so permanent code exists) → 5331b7d5 (8b share-modal defaults to permanent) → 863c10ef (revoke endpoint+UI). Seed is 863c10ef (revoke, the feature) but 8a must land before 8b in B.
- CARRY (P-0/BOARD): revoke authz = owner_id + invites.created_by (server-side; RBAC-admin deferred); revoked→preview+join 404 (read path already checks); 8a idempotent+collision-safe (WHERE NULL, CSPRNG, 23505-retry), committed migration; 8a before 8b. T-8 applies (revoke = access control).
- verdict: PROCEED (multi-spec, whole, UI delta → D-block).
```yaml
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [863c10ef-4f58-4451-9172-d319e751ec07, 5331b7d5-511c-4370-9d86-b6729b60ced5, 08ff762f-c4fb-4f80-87f6-e12796a2a485]
```
