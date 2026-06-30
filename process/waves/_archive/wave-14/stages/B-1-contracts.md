# Wave 14 — B-1 Contracts
```yaml
skipped: false
contracts_authored: [packages/shared/src/presence.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: ["TypingActiveSchema channelId got .uuid() for consistency with start/stop (contract-layer strictness; accepted)"]
```
Exports: PresenceStatus(Schema), PresenceState(Schema), PresenceSnapshot(Schema), Presence{Online,Offline}PayloadSchema, TypingStart/Stop/ActiveSchema, PRESENCE_EVENTS const, inferred types. Shared-package typecheck clean. Commit 9d8c3bf.
