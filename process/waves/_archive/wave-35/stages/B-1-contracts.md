# Wave 35 — B-1 Contracts

Contract surface changed (new Zod schemas) → B-1 ran. Specialist: typescript-pro.

## Authored
- `packages/shared/src/privacy.ts` — `PROFILE_VISIBILITY` / `WHO_CAN_DM` const tuples (single source of truth, reused by frontend selector); `PrivacySettingsResponseSchema`; `UpdatePrivacySchema` (PUT body, both fields required, `z.enum` → invalid value 400); types `ProfileVisibility`, `WhoCanDm`, `PrivacySettingsResponse`, `UpdatePrivacyInput`.
- `packages/shared/src/account-data.ts` — `AccountDataResponseSchema {profile{userId,displayName?,username?,avatarUrl?,accentColor?,email}, memberships[]{serverId,serverName,joinedAt}, activitySummary{serversJoined,accountCreatedAt}}`; type `AccountDataResponse`.
- `packages/shared/src/index.ts` — re-export blocks for both (ESM `.js` convention).

## Verify
- `pnpm --filter @studyhall/shared typecheck` — clean. Biome — clean.

## Deviation
- `activitySummary` kept minimal (`serversJoined` + `accountCreatedAt`) — no per-user message-count column exists; deriving `messagesPosted` would need a full-table aggregate (not trivial, not assumed). Non-breaking to add later if backend confirms a cheap path. Accepted (honest, avoids inventing a metric).

## Commit discipline note (for B-6)
Single `feat(contracts)` commit cites both 56a50862 (privacy) + a4169fac (account-data) because the shared `index.ts` barrel is genuinely cross-spec and splitting it would produce non-buildable intermediate commits. This is the contract-locking foundation stage, not a cross-spec implementation commit — head-builder to ratify.

```yaml
skipped: false
contracts_authored: [packages/shared/src/privacy.ts, packages/shared/src/account-data.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: ["activitySummary minimal (no message-count source)"]
```
