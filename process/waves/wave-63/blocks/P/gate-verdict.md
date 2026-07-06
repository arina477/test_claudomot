# Wave 63 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-63/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-63 extends the shipped offline read-cache (proven for channels in M4 and DMs in bundle #1) to the academic content M12's success metric names — student assignments and class schedule — and ladders cleanly to the live offline-first moat bet. Framing is cause not symptom: both target read paths (AssignmentsPanel loadAssignments, ClassCalendar listSessions) currently dead-end to error/blank on a failed fetch, unlike the DM path that already falls back to cache; this wave gives them the same fallback. The two named high-risk acceptance criteria both land as hard, binary, tested conditions. (1) The Dexie v2→v3 data-loss guard is unambiguous: the seed AC requires `.version(3).stores()` to re-state ALL FIVE prior tables verbatim (channels, messages, outbox, dmConversations, dmMessages — each named), preserve the v1 and v2 blocks, and ships a fake-indexeddb test asserting a v1→v2→v3 upgrade preserves every prior table AND its rows — the exact named exit criterion, and correctly carried forward as the 2nd instance of the verbatim-restate lesson. (2) The sessions-window correctness AC is keyed to serverId + from/to window (the helper signatures carry the window params), with explicit "not a naive by-id snapshot" / "do NOT serve a mismatched window's data" language and a named window-scoping test — because the server expands weekly occurrences per window. Every AC across all three blocks is falsifiable via fake-indexeddb round-trips plus offline simulation. Multi-spec coherence holds: seed→two-sibling dependency is a hard one (both siblings need the v3 substrate); mvp-thinner confirmed both siblings are mvp-critical and that schedule is not splittable without re-paying the migration risk; the substrate is tight (2 tables, 2 DTO-intersection types, 4 read-through helpers, no orphans). Scope discipline is correct for a self-use-mvp wedge: the floor-waiver is validly applied on the infra-reuse exemption (wave-21/50 lineage, wave-62 precedent on this same milestone), there is no server change (both siblings reuse existing GET endpoints), design_gap_flag=false is right (reuses shipped offline UI and existing panels), and non-goals are named explicitly (write/conflict and offline media deferred; study-group data flagged as bundle #3). No auth/session/cookie/rate-limit surface is touched — the client-only IndexedDB read-cache does not trip the tightened security gate. Every P-0→P-3 stage-exit checkbox ticks from a concrete artifact (the seed's multi-spec YAML head in tasks.description, the three DB task rows with confirmed parent linkage, and the four stage deliverables), so the head gate passes to Phase 2.

## Stage-exit checklist (evidence-backed)
- **P-0 Frame** — problem is root cause (dead-end read paths vs cached-fallback), maps to M12 (36378340) + offline-moat bet (ad1a3685), falsifiable (offline still shows assignments/schedule), problem-framer PROCEED + ceo-reviewer HOLD-SCOPE reconciled. PASS.
- **P-1 Decompose** — one seed + only the two siblings that must ship together for the metric-named claim; both siblings mvp-critical (mvp-thinner OK); no bundle task depends on an unbuilt out-of-bundle task. PASS.
- **P-2 Spec** — ACs enumerated + independently verifiable; empty(cold-cache)/loading/error/offline states specified per surface; non-goals named; NO security surface flagged (correct — client-only cache); full spec contract embedded as fenced YAML head of seed c5689dc5.description. PASS.
- **P-3 Plan** — reuses established Dexie/cache architecture (bundle #1 verbatim in shape); introduces no MVP-unneeded infra; each step maps to a bundle task with an observable artifact (per-spec commits). PASS.
- **P-4 Gate (Phase 1)** — every upstream checkbox ticked from artifact; design_gap_flag=false handoff → B-block is correct. PASS.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged) — GATE PASSED
- **karen (ab8873e1deca01af5): APPROVE** — 6/6 claims VERIFIED. **EXACT v2 .stores() for B-3 verbatim v3 restate (db.ts:96-100):**
  `messages: 'id, channelId, [channelId+createdAt], createdAt'` / `channels: 'id, serverId'` / `outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]'` / `dmConversations: 'id, createdAt'` / `dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt'` — v3 MUST contain these 5 + cachedAssignments + cachedScheduledSessions; keep v1+v2 blocks; preservation test asserts ROWS survive. Endpoints confirmed (listAssignments api.ts:443-444; listSessions api.ts:584-591, window-scoped, server expands occurrences). Read paths network-only (AssignmentsPanel loadAssignments:111/catch:124; ClassCalendar **loadSessions**:474/listSessions:486/catch:495). DTOs exist. Note: wire-in targets in shell/.
- **jenny (a0b28d7873ba66420): APPROVE** — all 5 MATCH. Mirrors shipped DM/M4 offline pattern verbatim; bundle #2 = academic (on-plan; study-group→#3); design_gap_flag=false correct (annotation-only per bundle-#1 precedent); honesty OK (read-first; conflict-UI+media deferred). Window-keyed sessions cache CORRECT (server compute-on-read occurrence-expansion per window, scheduling.service.ts:32; naive by-id would mismatch).
- **Gemini:** see P-4-gemini-review.md (UNAVAILABLE=degradable non-block).
## B-block carry-forwards (binding)
1. **Dexie v2→v3:** `.version(3).stores()` = the 5 v2 lines above VERBATIM + cachedAssignments + cachedScheduledSessions; keep v1+v2 blocks. Test asserts v1→v2→v3 preserves prior ROWS. head-builder byte-compares.
2. CachedAssignment/CachedScheduledSession = DTO-intersection (& cachedAt).
3. Sessions cache keyed by serverId + the EXACT serialized from/to ISO values passed to listSessions (ClassCalendar.tsx:482-483,486) — NOT naive by-id; store the window-expanded response.
4. Offline fallback triggers on fetch-CATCH (mirror useDm), NOT a navigator.onLine pre-gate. Cache-only when disconnected (live success wins).
5. Wire-in targets: shell/AssignmentsPanel.tsx (loadAssignments), shell/ClassCalendar.tsx (loadSessions).
6. T/V: v1→v2→v3 preservation test = NAMED exit criterion (green without it = REWORK).
GATE PASSED → design_gap_flag=false → B-0.
