# B-3 — Frontend/E2E (wave-58)
Specialist test-automator. Commit a691ef7 (1 file, delete-any-message.spec.ts).
- Subscription-proof ready-gate (the P-4 carry): before A deletes, A sends a fresh probe message (aProbeMarker); B hard-asserts `expect(pageB.getByText(aProbeMarker)).toBeVisible({timeout:12000})` — B receiving A's message:new PROVES B is subscribed to channel:<id> (the SAME Socket.IO room that delivers message:deleted; in-process, no leave-window between). NOT an "online"/page-loaded wait (there's no join-ack).
- Hard delete-fanout assertion: replaced the soft-check with `expect(pageB.getByText(bMessageMarker)).toBeHidden({timeout:12000})` (Playwright auto-retry, bounded). Removed .catch(()=>false) + console.log (+ the biome-ignore noConsoleLog).
- RBAC/IDOR step 8 (:186) byte-identical (untouched, hard-asserted). No production change.
tsc clean, biome clean. E2E defers to CI. Deviation: none.
```yaml
skipped: false
specialists_spawned: [test-automator]
files_implemented: [apps/web/e2e/delete-any-message.spec.ts]
deviations: []
```
