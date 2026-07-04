# Wave 47 — B-3 Frontend
- react-specialist. **10967558 (make DMs startable):** api.ts getDmCandidates()→bare DmCandidate[]; StartDmPicker source getServerMembers(serverId)→getDmCandidates() (removed serverId prop + gate + "join a server" dead-end; empty-state "No one to message yet — join a study server with others"); DmHome removes serverId prop/useServers. **379978a4 (id-space, coupled in DmHome):** DmHome currentUserId = profile.userId (true users.id, NOT username/NOT profile.id) → self-exclusion + optimistic author correct; cures wave-46 F7. useDm NOT touched (F7 cure was the DmHome id source). dm.test.tsx: picker uses getDmCandidates + empty state + startable e2e + self-exclusion + F7-author-not-Unknown.
- Deviation: removed currentUserId prop from StartDmPicker (self-exclusion now server-side in getDmCandidates → cleaner; biome noUnusedVariables). 379978a4 physically coupled with 10967558 in one DmHome hunk → both in the 10967558 frontend commit (flagged for B-6).
- Verify: 377 web tests pass; biome 0; tsc clean.
```yaml
skipped: false
files: {10967558: [api.ts, StartDmPicker.tsx, DmHome.tsx(entry-gate), dm.test.tsx], 379978a4: [DmHome.tsx(currentUserId, coupled)]}
tests: {web: 377}
commit_coupling: "379978a4 delivered within 10967558 frontend commit (un-splittable DmHome hunk)"
