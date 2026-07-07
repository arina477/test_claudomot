# B-1 — Contracts (wave-70)
Specialist: typescript-pro. packages/shared/src/blocks.ts: CreateBlockSchema ({blockedUserId min1}), BlockSchema (id uuid, blocker_id, blocked_id, created_at — snake_case mirroring the user_blocks row, matching reports.ts so the api returns the raw row with minimal mapping), BlockListResponseSchema ({blocks:[]}) + Block/CreateBlock/BlockListResponse types. Exported from index. Shared typecheck exit 0 (isolated), biome clean. No deviation.
```yaml
skipped: false
contracts_authored: [packages/shared/src/blocks.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
