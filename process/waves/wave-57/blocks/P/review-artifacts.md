# Wave 57 — P-block review artifacts
**Block:** P · **Wave topic:** DM→server nav correctness (ff09c4c9) — ServerRail selectServer/Home should exit dmHomeActive · **Gate:** P-4 · **Status:** gate-passed → B (D skipped)
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | done — PROCEED (minimal fix); design_gap false | done |
| P-1 | done — single-spec, floor override (obs-B 8th) | done |
| P-2 | done — spec in ff09c4c9.desc | done |
| P-3 | done — onExitDmHome callback + component test; react-specialist | done |
| P-4 | done — head-product APPROVED; karen+jenny APPROVE, Gemini 429. PASSED. B-carry: wire Home onClick |
- **Wave topic:** on the DM surface, ServerRail selectServer (ServerRail.tsx:237) + Home don't clear dmHomeActive → shell stays on <DmHome/> (AppShell.tsx ~:118 ternary), first click swallowed, double-click needed. Root cause: setDmHomeActive(false) lives only on the DM-rail button (onDmHome, AppShell.tsx:55-58); server-select + Home never reset it. Fix: those handlers should also setDmHomeActive(false) (or lift the reset into AppShell's server-select handler). ~few LOC. wave-51 T-5 F-1 (pre-existing, verified live).
- Short-circuit: no-prior-spec. Milestone M8 (in_progress), backfilled. **design_gap_flag:** likely FALSE (state-transition bug fix, no new UI surface). UI wave → mvp-thinner spawns.
- claimed [ff09c4c9]. Autonomous mode. Note: M9-Monetization STRONGLY flagged for founder (non-pausing).
## Gate verdict log
<head-product P-4>
