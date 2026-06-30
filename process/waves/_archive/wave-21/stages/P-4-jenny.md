# P-4 Phase-2 — jenny spec-vs-roadmap drift check (wave-21)

**Verdict: APPROVE** — spec MATCHES M4 ## Scope + ## Success metric, no drift. All premises independently re-verified against the live codebase.

## Sources read
- Spec: `tasks.description` (c1dbee64 + 94e41695 + 2fe6b517), wave-21 3-spec contract
- M4 milestone `## Scope` / `## Success metric` (eb2a1688)
- product-decisions.md (wave-16 floor-exemption :215-218; M3→M4 re-home :237; M4 activation :240-242), feature-list.md #12, P-0-frame.md
- Codebase: AppHome.tsx:39, useMessages.ts:104-153, ConnectionStateIndicator.tsx, messagingSocket.ts

## Per-item drift

| # | Spec item | Source matched | Verdict | Evidence |
|---|-----------|----------------|---------|----------|
| 1 | Live connection-state derivation → plumb into shell (c1dbee64) | M4 ## Scope "connection-state indicator (online/reconnecting/offline)" | **MATCHES** | M4 scope names exactly the 3-state indicator. Premise verified: `apps/web/src/pages/AppHome.tsx:39` hardcodes `connectionState="online"` (dead); `getSocketState()` in `messagingSocket.ts` already returns the 3 states; `ConnectionStateIndicator.tsx` already shipped. Spec WIRES live state into the shipped component — does not rebuild it. AC explicitly forbids new indicator/visual change (design_gap FALSE). |
| 2 | Multi-page reconnect catch-up loop, no data loss past page 1 (94e41695) | M4 ## Scope "catch-up via paginated history (?after= keyset cursor)" + ## Success metric "no data loss" | **MATCHES** | M4 success metric = "...on reconnect every queued message sends exactly once in order with **no data loss**." Premise verified: `useMessages.ts:104 runDrainAndCatchup` calls `api.getMessagesAfter(...)` ONCE (:138) and ignores `result.nextCursor` for catch-up — a >50-msg offline window silently loses pages 2+. The loop-until-null fix closes the metric-critical data-loss gap. Uses the wave-20 opaque forward cursor (correct, no raw-timestamp drift). |
| 3 | Tests — connection-state transitions + multi-page catch-up (2fe6b517) | M4 ## Scope "Heavily tested (fake-indexeddb unit + integration)" | **MATCHES** | M4 scope mandates heavy testing. Tests scoped to the 2 gaps this wave touches, reuse the wave-20 fake-indexeddb harness, deterministic (no real timers). No coverage theater; no gold-plating. |

## Cross-cut checks

- **Floor-exemption (BELOW-2500-LOC):** CONSISTENT with the wave-16 precedent (product-decisions.md:215-218). Note: wave-16's recorded text is narrower ("test-coverage / test-infra tech-debt wave"); wave-21 extends it to a "legit-small UX-completion wave reusing shipped infra." This is a reasonable principle-extension, not a contradiction — both rest on the same rationale (LOC floor guards thin *feature* waves; padding with unrelated debt adds ceremony without value). NOT under-shipping: both gaps are unmet residuals on a live milestone metric (invisible-wedge + silent-data-loss). The wave should record the extended precedent in product-decisions.md per the P-0 carry (#3) — minor housekeeping, not a gate blocker.
- **Scope creep:** NONE. Spec OUT-list correctly excludes rebuild of shipped components (ConnectionStateIndicator, pending/failed UI, Dexie/outbox/?after=), connection-state on non-message surfaces, reconnect animations, and offline for other entities. Verified no rebuild: all three named components exist and the specs WIRE/LOOP/TEST only.
- **Does NOT over-claim M4 complete:** CORRECT. Spec + P-0 state M4 stays multi-wave (this is wave-2). The 6 M3→M4 re-homed tech-debt tasks (incl. 10b9d18e author-presence-dots) remain backlog per product-decisions.md:237 — not swept into this wave. No premature milestone-close framing.

## Clarification needed
None.

## Recommendation
Proceed. At L-1/distill, record the extended floor-exemption precedent (UX-completion-reusing-shipped-infra) in product-decisions.md so it isn't re-litigated. For functional validation that the catch-up loop actually recovers all pages and the dot reflects real socket state, route to @task-completion-validator at V-block (not a P-4 concern).
