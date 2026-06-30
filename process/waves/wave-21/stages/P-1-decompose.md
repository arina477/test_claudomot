# Wave 21 — P-1 Decompose
## Max-size rubric (no trip)
| Measure | Est | Threshold | Pass |
|---|---|---|---|
| Files | ~10-16 (useConnectionState hook + AppHome wiring + AppShell prop flow; runDrainAndCatchup loop in useMessages; api unchanged; + tests) | >60 | ✓ |
| Net LOC | ~1800-2400 | >5000 | ✓ |
## Wave type + floor
- claimed = [c1dbee64 (live connection-state), 94e41695 (catch-up loop), 2fe6b517 (tests)] → 3 → **multi-spec**. Floor (multi-spec): >2500 LOC OR >=6 specs. Est ~1800-2400 LOC / 3 specs → **BELOW floor**.
- **FLOOR EXEMPTION (wave-16 legit-small-increment precedent):** this is a genuine UX-COMPLETION wave on a MULTI-WAVE milestone (M4) — it reuses the shipped ConnectionStateIndicator + getSocketState (3-state) + the wave-20 Dexie/outbox/?after= cursor, so it's legitimately small (wiring live state + a bounded catch-up loop + tests), NOT under-scoped or padded. mvp-thinner OK (no thinness; the one split candidate CREATES net work). Per the wave-16 product-decision (test-coverage/UX-completion waves exempt from the feature-LOC floor when reusing shipped infra), this wave is floor-exempt. Do NOT pad with unrelated re-homed tech-debt. → record the exemption in product-decisions at P-2/L.
## Verdict: PROCEED (multi-spec, floor-exempt — legit small UX-completion increment)
## design_gap_flag: FALSE (D skips — ConnectionStateIndicator + pending/failed UI already built+adopted; this wave is live-wiring + catch-up-loop logic + tests, no new design surface)
## Premises (rule-1 verified at P-0): getSocketState() returns online/reconnecting/offline (messagingSocket.ts); AppHome.tsx hardcodes connectionState="online" (the dead wiring); runDrainAndCatchup one-shot (useMessages.ts). Wave WIRES + LOOPS + TESTS — no rebuild.
