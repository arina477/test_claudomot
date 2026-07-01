# Wave 25 — P-1 Decompose

## Bundle
claimed_task_ids = [c18b8089] (solo). **wave_type = single-spec.** Scope (P-0 minimal SCOPE-EXPANSION): extract the mention slug grammar to packages/shared (client↔server parity) + editMessage txn wrap + a real-PG rollback integration spec on the wave-24 tier.

## Maximum rubric — NO threshold trips
Files ~5-7 (packages/shared mention grammar + server parseMentions import + client renderBodyWithMentions import + messages.service editMessage txn + 1-2 test files). New primitives ~0-1 (a shared regex/constant; no new module/route/migration). Net LOC ~150-250. Working set small. No maximum threshold trips.

## Minimum floor — TRIPS (below)
single-spec floor >1,500 LOC. ~150-250 → **below floor → RESCOPE-AUTO-MERGE.**

### MERGE protocol (mandated decomposition-expansion attempt)
Fired milestone-decomposer expand-current-bundle (agentId a3f9e86fb082128c2) → **incomplete-scope**. M5 ## Scope = {assignment feature (SHIPPED w22-24) + reminders (cred-blocked)}. No unblocked adjacent scope; padding forbidden. floor_merge_attempt: 1.

### Resolution → PRECEDENT-APPLICATION override-ship (NOT a fresh BOARD)
4th consecutive identical floor-merge (w16/w21/w23/w24). The wave-24 BOARD (6/7 override-ship, product-decisions 2026-07-02) EXPLICITLY instructed "do NOT re-litigate a 4th per-wave." Applying the standing twice-decided ruling (override-ship the under-floor coherent slice) honors the gate rather than re-running the ceremony the BOARD deprecated. Recorded: product-decisions.md 2026-07-03.
- **ESCALATED (the real fix):** M5-disposition strategic question to the founder digest — provide the Resend key (→ build reminders → M5 closes) OR defer reminders to a later milestone (→ M5 feature-complete → transition → advance roadmap). The decomposer's remediation option (b). Surfaced outcome-first.
- Floor-rubric revision still open (karen rejected 2 codifications; falsifiable framing = re-anchor to BOARD-artifact-names-dependency).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
The client fix is a tokenizer-logic change + the EXISTING MessageList pill render (no new component/mockup). Shared grammar + server txn are backend. → next block **B** (skip D).

## Verdict
```yaml
wave_type: single-spec
verdict: ESCALATED-FLOOR-UNMET-RESOLVED-PRECEDENT-OVERRIDE-SHIP
minimum_floor_tripped: true
floor_merge_attempt: 1
decomposition_expansion_result: incomplete-scope
board_decision: "PRECEDENT-APPLICATION (standing w24 BOARD ruling: don't re-litigate 4th); M5-disposition escalated to founder"
claimed_task_ids: [c18b8089-a7bb-442f-890f-66649d7f746a]
design_gap_flag: false
```

## Exit
Sizing recorded. Floor exception via standing precedent + M5-disposition escalated. design_gap_flag=false (→ B after P-4). → P-2 Spec.
