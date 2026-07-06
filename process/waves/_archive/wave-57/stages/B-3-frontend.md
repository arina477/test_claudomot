# B-3 — Frontend (wave-57)
Specialist react-specialist. Commit 6e0d803.
- AppShell.tsx: `onExitDmHome={() => setDmHomeActive(false)}` passed to ServerRail (onDmHome toggle UNCHANGED).
- ServerRail.tsx: props + `onExitDmHome`; server-icon onClick calls `selectServer(s.id); onExitDmHome()` (UNCONDITIONAL — re-select-same-server exits); the Home button (was NO onClick — B-carry) now `onClick={onExitDmHome}` (ServerContext has no home-nav concept → exiting DM to the last server view is the correct minimal semantic, matches AC).
- Test (AppShell.test.tsx +4): server exits on first click, Home exits on first click, DM-rail still enters DM (regression), re-select-same-server exits. + 3 missing api mocks fixed.
- UNCHANGED: onDmHome, backend, schema.
tsc clean, biome clean, 20 AppShell tests pass (web suite 456).
Deviation: Home wired to onExitDmHome only (no server-nav) — ServerContext lacks selectHome; exiting DM to last server is the sensible + AC-matching behavior. ALLOWED.
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [AppShell.tsx, ServerRail.tsx, AppShell.test.tsx]
deviations: [{change: "Home→onExitDmHome only", why: "no selectHome in ServerContext; exits DM to last server, matches AC", adjudication: allowed}]
```
