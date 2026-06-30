# Wave-21 T-block — Findings Aggregate (V-2 canonical input)

**Wave:** 21 — M4 wave-2 offline UX (live connection-state indicator + multi-page reconnect catch-up). FRONTEND-ONLY (apps/web). SHIPPED LIVE (PR#33 merge 9c48007; web deploy 032dc384 SUCCESS; api NOT redeployed; NO migration).

**T-block disposition:** every layer PASS / RECORD; T-9 gate APPROVED. The two load-bearing invariants (honest connectivity signal + no-data-loss multi-page catch-up) are genuinely proven (mutation-sanity bar met), not theater. No Critical, no High. All findings below are non-blocking carries -> V-2 classifies.

---

## Findings (all non-blocking — carried for V-2 triage)

### Carried from B-6 review (advisory hardening — NOT correctness defects)

| ID | Severity | Surface | Description | Disposition |
|---|---|---|---|---|
| M1 | MEDIUM (perf, not correctness) | useMessages.ts:204-226 | Concurrent runDrainAndCatchup from socket-connect + window-online runs two overlapping catch-up loops on a real reconnect. The catch-up while-loop is NOT re-entrancy-guarded (unlike drain() at outbox.ts:138). Dedup-safe — final state correct (functional dedup-by-id + idempotent cache bulkPut + both loops converge to same HEAD cursor). Cost: doubled network round-trips per reconnect (up to 2x100 getMessagesAfter on a deep gap). Suggested fix: in-flight ref guard around the loop, per-channel-aware. | -> V-2 perf/redundancy. Correctness preserved; safe to ship as-is. |
| M2 | MEDIUM | useMessages.ts:165-168 | Cache write-through inside the catch-up loop is fire-and-forget (void putCachedMessages) — per-page durability on a kill-mid-write is best-effort, not synchronous. Masked on the happy path (reload re-seeds from network; lastSeenCursorRef in-memory). Doc comment at useMessages.ts:136-137 over-claims synchronous per-page consistency. Fix: await the write before advancing the cursor, OR downgrade the comment. | -> V-2. Non-blocking (no persistent gap). |
| M3 | MEDIUM | useMessages.ts:217-226 | Window 'online' catch-up can fire while the socket is still reconnecting, hitting REST before the socket replays. Desirable in isolation; flagged only as upstream cause of M1 redundancy. All three paths dedup-safe by id. No separate fix beyond M1's guard. | -> V-2. Subsumed by M1. |

### Carried from B-6 review (Lows — test-completeness + advisory)

| ID | Severity | Surface | Description | Disposition |
|---|---|---|---|---|
| L1 | LOW | useConnectionState.ts:25 | deriveState() returns online when neither navigator nor socket exists (SSR/build) — the one direction the honest-signal contract warns against. Inert (AppHome client-only). Worth a one-line comment. | -> V-2. Harmless. |
| L2 | LOW (test coverage gap — head-tester RATIFIED) | multiPageCatchup.test.ts:381-423 | Test 5 name over-claims ("simulated mid-loop disconnect") vs what it asserts: resolves BOTH pages then checks cache — proves per-page write-through, NOT the page-2-rejects -> resume-from-page-1-cursor case. The named "no-data-loss-on-resume-after-mid-loop-failure" invariant is proven by code + server-contract reasoning (strictly-> keyset, nextCursor=last-row), NOT by an executing test. Recommended: add a variant where page-2 getMessagesAfter rejects and assert (a) page-1 rows in cache and (b) lastSeenCursorRef resume on a 2nd reconnect fetches from page-1's last cursor with no gap/dup. | -> V-2. HEAD-TESTER VERDICT: NON-BLOCKING test-completeness gap, not a correctness defect. MAX_ITERS test already proves partial-page preservation under an unbounded server; cursor-advance-outside-setState verified at B-6; resume re-seeds from network on reload. Cheapest remaining test to add. |
| L3 | LOW | useConnectionState.ts:68-73 | Six socket subscriptions; socket.io-client v4 emits reconnecting/reconnect/reconnect_attempt/reconnect_failed on the socket.io MANAGER, not the socket instance — several .on may never fire. Not a bug (symmetric add/remove, no leak); intent served by disconnect + getSocketState().active. Prune or attach to socket.io. | -> V-2. No leak; cosmetic. |
| L4 | LOW | useMessages.ts:193-195 | console.warn on MAX_ITERS is the only operator signal of a deferred-tail (up to 5000 msg/reconnect; longer outage resumes from lastSeenCursorRef next reconnect). Consider telemetry routing. | -> V-2. Fine as-is. |
| L5 | LOW (positive) | useConnectionState.ts:83-96 | Listener cleanup verified correct — symmetric add/remove, stable refs, debounce timer cleared on unmount, no double-subscribe, no leak, no stale closure. | No action — positive confirmation. |

### Known non-blocking carries (cross-wave)

| ID | Severity | Description | Disposition |
|---|---|---|---|
| KI-biome | LOW | 9 pre-existing biome warnings (4e994e96) — predate this wave, not introduced by the diff. | -> L-2 / carry. Not gating. |
| KI-m3-debt | LOW | 6 re-homed M3 tech-debt items (M4 backlog) carried from wave-20. | -> milestone backlog. Not this wave's scope. |
| KI-playwright | MEDIUM (infra) | Playwright MCP chrome-channel absent (/opt/google/chrome/chrome not found; recurring since wave-14). Bundled chromium exists in ms-playwright cache but the MCP is hardwired to the chrome distribution. Live-browser E2E + live two-client offline round-trip NOT runnable via MCP this wave. | -> V-2 / infra backlog. Worked around: CI e2e job (green on merge SHA) + deterministic fake-indexeddb tests cover the layer. NON-BLOCKING — the invariants ARE proven deterministically; only the live-prod observation is deferred. |
| KI-prod-data | LOW | Prod test-data accumulation (no DELETE /servers/:id) — carried. | -> backlog. |

---

## Layer verdict summary

| Layer | Pattern | Verdict | Evidence |
|---|---|---|---|
| T-1 Static | A (CI-verified) | PASS | CI run 28475903958: lint + typecheck jobs conclusion=success on merge SHA 106e70e. |
| T-2 Unit | A (CI-verified) | PASS | test job: web 13 files / 193 passed incl useConnectionState.test.tsx (9 tests incl D1/D2) + multiPageCatchup.test.ts (5). api 346 unchanged. Tests confirmed EXECUTED via test-job log read (not skipped). |
| T-3 Contract | A (project-internal) | RECORD | No new shared schema/route. Reuses connectionState 3-state union (getSocketState) + wave-20 MessagesAfterResponse + ?after= route. No contract drift. |
| T-4 Integration | A (CI-verified) | PASS — no-data-loss RATIFIED | Multi-page catch-up proven via fake-indexeddb (real Dexie, per-test IDBFactory, no real timers): 3-page in-order recovery (index-ordering assertion), dedup-by-id exactly-once, terminate-on-null, MAX_ITERS bound preserves all 100 pages (no data loss). Genuine assertions on observable state — mutation-sanity met. L2 resume-after-failure path proven by reasoning only (non-blocking gap -> V-2). No new server integration (consumes wave-20 ?after= route). |
| T-5 E2E | B (disposition) | RECORD (live deferred, non-blocking) | CI e2e job green on merge SHA = layer covered. Live offline round-trip via Playwright MCP NOT run (chrome-channel absent, recurring KI). fake-indexeddb tests + CI e2e are the authoritative signal. web root 200 live-probed. |
| T-6 Layout | static | PASS | ConnectionStateIndicator renders all 3 states (online sr-only / reconnecting amber+spinner+"Reconnecting…" / offline danger-dot+"Offline — messages will send when you're back"); role=status aria-live, state in TEXT not color alone (a11y-as-contract). Dot is LIVE (AppHome wiring test asserts "Reconnecting…"/"Offline" render from live hook, would fail if still hardcoded "online"). No getByTestId. No new design surface (design_gap FALSE). |
| T-7 Perf | light | PASS (M1 carried) | Catch-up loop bounded (MAX_ITERS=100). M1 (double-loop on overlapping reconnect -> up to 2x round-trips, dedup-safe, correctness preserved) carried to V-2. No regression introduced. |
| T-8 Security | light | RECORD | Frontend-only, NO new server surface (?after= route + auth shipped wave-20, route-agnostic default-deny guard). Connection-state hook is client-local — no authz/secret surface. No new IDOR/auth door. gitleaks (secret-scan) conclusion=success on merge SHA. |
| T-9 Journey | B (gate) | APPROVED | Journey map regenerated (wave-21 entry + F5 annotation: connection-state indicator now LIVE + multi-page catch-up complete — the wave-20 "OUT" items now shipped). |

**findings_total:** 12 (3 M + 5 L + 4 KI carries) | **findings_critical:** 0 | **findings_high:** 0
