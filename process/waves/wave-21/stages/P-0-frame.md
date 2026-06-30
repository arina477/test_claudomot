# Wave 21 — P-0 Frame

## Discover
- **wave_db_id:** a059fe21-5af7-4bee-afda-697b2e91c2ab (wave_number 21)
- **Milestone:** M4 — Offline-first reliability (eb2a1688), in_progress, MULTI-WAVE. Wave-20 shipped the SPINE (exactly-once+in-order outbox + Dexie store + forward ?after= cursor, LIVE). This is M4 wave-2 (offline UX completion).
- **Spec-contract short-circuit:** no-prior-spec (decomposer prose) → full P-1..P-3. NOTE: the decomposer ALREADY applied PRODUCT-PRINCIPLES rule 1 (premise-verified the bundle: dropped already-shipped pending/failed UI, corrected the dead-component task).

## Reframe (trio)
- **problem-framer: PROCEED** — all 3 premises RE-VERIFIED (rule 1): ConnectionStateIndicator built+wired but DEAD (AppHome.tsx:39 hardcodes "online"); runDrainAndCatchup calls getMessagesAfter ONCE + ignores nextCursor (useMessages.ts:138 — loses messages past page 1/50); pending/failed UI already shipped (MessageList PendingRow@1215/FailedRow@1296 — correctly dropped). Symptom-vs-cause: fixes target the cause (the hardcode + the single-shot fetch), not symptoms. No gold-plating; coherent slice; no split.
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — traces to the live wedge bet + M4's "no data loss" metric; both fixes land on the unmet residual (invisible-wedge + silent-data-loss-past-50). No jump-to-M5. Right-sized UX-completion wave (smaller than the spine, reuses shipped components — correct). No over-reach. design_gap FALSE (no new design surface — component already adopted).
- **mvp-thinner: OK** — already minimal (decomposer-refined). Tested+rejected the one THIN (2-state-now/reconnecting-later): getSocketState() ALREADY returns 3 states + the component renders 3 → splitting CREATES net work (fails peel-off test). Catch-up loop closes a metric-critical data-loss gap (KEEP). Tests scoped to the 2 gaps (not gold-plated). Floor flag (advisory): ~1800-2600 LOC may be at/below the 2500 multi-spec floor → P-1 call.
- **Merge: PROCEED (all 3 tasks; no split).** design_gap FALSE → D-block SKIPS.

## Carries to P-1/P-2/P-3
1. **Premises verified (rule 1):** ConnectionStateIndicator + getSocketState() (3-state) + pending/failed UI all EXIST — this wave WIRES live state + LOOPS catch-up + TESTS; does NOT rebuild components. getSocketState() (messagingSocket.ts:228) already returns online/reconnecting/offline — the hook just reads + plumbs it (replace AppHome.tsx:39 hardcode).
2. **Catch-up loop:** runDrainAndCatchup loops getMessagesAfter until nextCursor null (bounded loop-until-null), recovering all missed pages (the M4 "no data loss" gap).
3. **FLOOR (P-1 decision):** if est <2500 LOC / 3 specs, apply the wave-16 legit-small-increment exemption (a real UX-completion wave on a multi-wave milestone — record the product-decision precedent) OR pull one small re-homed M4 tech-debt (e.g. 10b9d18e author-presence-dots) to clear the floor. Prefer the exemption (don't pad with unrelated debt).
4. **gating AC (T/V):** the multi-page catch-up recovers ALL missed messages (no data loss past page 1); the connection-state dot reflects real socket state (online/reconnecting/offline) — tested.
- **Final framing:** wave-21 completes the M4 offline UX: live connection-state derivation (plumb getSocketState into the shipped indicator) + multi-page catch-up loop (recover all missed pages) + focused tests. claimed = [c1dbee64, 94e41695, 2fe6b517].
