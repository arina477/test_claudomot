# Wave 21 — V-1 Summary
- **Karen APPROVE** — 5/5 VERIFIED. SOURCE-PRIORITY honest signal STRUCTURALLY can't show online-while-disconnected (useConnectionState.ts:23-43 — online reachable ONLY when navigator.onLine AND socket.connected; window-offline short-circuits; window-online :76 re-eval-trigger-only; D1/D2 .not.toBe('online')). AppHome.tsx:25/42 live (hardcode gone). No-data-loss catch-up (useMessages.ts:104-201 loop-until-null; cursor from SERVER nextCursor OUTSIDE setRealMessages :175-177 [karen carry]; per-page write-through :163-169; dedup-by-id; MAX_ITERS=100 preserves partial :190-196; multiPageCatchup test proves 3-page+dedup+terminate+MAX_ITERS-no-loss on observable state). No rebuild (reused getSocketState + single ConnectionStateIndicator + Dexie). LIVE bundle serves the new strings (MAX_ITERS/Reconnecting). 1 LOW (L2 resume-test gap) → V-2.
- **jenny APPROVE** — all ACs MATCH, no drift. SOURCE-PRIORITY verbatim; catch-up loop opaque-cursor + karen-carries honored; tests incl D1/D2. M4 ## Scope (live indicator + multi-page catch-up + heavily-tested) + "no data loss" metric (past-page-1 gap closed); floor-exemption consistent (~912 LOC, wave-16 precedent); no rebuild; M4 multi-wave not over-claimed. 2 non-blocking notes (empty-page-non-null-cursor termination relies on server contract; lastSeenCursorRef re-derivation) → L-1.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: [L2 resume-after-mid-loop-failure test gap (cheap)]
```
