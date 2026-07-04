# Wave 47 — B-1 Contracts
typescript-pro: packages/shared/src/dm.ts += DmCandidateSchema {userId, displayName, avatarUrl:string|null} (mirrors ServerMemberSchema) + DmCandidate type. Response = bare DmCandidate[] (mirrors GET /servers/:id/members convention). shared+api+web typecheck clean.
```yaml
skipped: false
files: [packages/shared/src/dm.ts, packages/shared/src/index.ts]
typecheck: clean
```
