# B-3 Frontend — wave-66
Specialist: react-specialist (agentId af094df8...). 2 files.
- ChannelSidebar.tsx — detailStatus==='error' branch split by useConnectionState (called once at :179): offline/reconnecting → "This server isn't available offline yet — reconnect to load its channels."; online → existing "Couldn't load channels." (AC2 preserved). Inline conditional, no new component, no logic change.
- shell-components.test.tsx — original single /couldn't load channels/i test replaced with 3 deterministic cases (offline, reconnecting → neutral; online → error), mocking useConnectionState at module boundary via vi.mocked.
Local verify (specialist, re-confirmed B-4/B-5): typecheck clean; biome clean (import-order auto-fixed pre-commit); web test 565 passed / 0 failed (+2 net).
Deviation (ACCEPT): mocked useConnectionState at module boundary vs underlying socket signal — cleaner + consistent with the file's api-mock convention; avoids also perturbing useMentionBadge. Sound.
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [ChannelSidebar.tsx, shell-components.test.tsx]
deviations: [{specialist: react-specialist, change: "mock useConnectionState at module boundary", plan_said: "mock connection state per case", why: "cleaner, matches api-mock convention", adjudication: accept}]
simplify_applied: true
```
