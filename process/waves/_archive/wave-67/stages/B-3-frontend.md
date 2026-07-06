# B-3 Frontend — wave-67
Specialist: react-specialist (ababd991). Files: api.ts (+getDiscoverServers/+joinPublicServer), icons.tsx (+CompassIcon), ServerDiscoverPage.tsx (NEW), ServerDiscoverPage.test.tsx (NEW, 9 tests), router.tsx (/discover AuthGuard route), ServerRail.tsx (Discover entry), + 3 test files wrapped in MemoryRouter (ServerRail now uses router hooks).
- Page per canonical design/server-discover.html: debounced search (300ms) + aria-describedby→results-count aria-live; responsive card grid; skeleton height=card; 5 states (loading/results/cold-empty honest/no-match/retryable error); load-more; per-card joining/joined/open; dark-on-emerald Join (§8 fix).
- Join wiring: api.joinPublicServer → ServerContext.refetch() + sessionStorage 'sh:select-server' pending-select (applyPendingSelect in fetchServers .then) → joined→"Open"→selectServer+/app. Mirrors InviteJoinPage.
Verify (specialist): typecheck clean, biome clean, web test 574/574 (+9; pre-existing study-timer flake cleared on re-run).
Deviation (ACCEPT, verify at B-6/T): /discover is a standalone AuthGuard route rendering full-canvas (matches design's full-directory layout) rather than embedded in AppShell's 4-col shell; ServerRail's useLocation activates the Discover button. Verify rail-presence + layout at B-6/T-6.
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [api.ts, icons.tsx, ServerDiscoverPage.tsx, ServerDiscoverPage.test.tsx, router.tsx, ServerRail.tsx]
designs_consumed: [design/server-discover.html]
deviations: [{specialist: react-specialist, change: "standalone /discover route vs AppShell-embedded", why: "matches design full-canvas directory layout", adjudication: accept-verify-at-B6}]
simplify_applied: true
```
