# P-0 — Frame (wave-54)

## Discover section
- **wave_db_id:** `2492ad63-38ab-4469-9833-6db44d03c7e9` (wave_number 54).
- **Prior-work:** direct continuation of wave-53 (study-room info-disclosure fix, LIVE). Seed c52a7a52 was the wave-53 mvp-thinner "app-wide sweep" split.
- **Roadmap milestone:** M8 `84e17739` (in_progress); wave-54 backfilled. Draining the hardening tail.
- **Spec-contract short-circuit:** no-prior-spec (prose seed) → full P-1..P-3.
- **Product-decision:** none Tier-3. Security-scope → T-8 + P-4 tightened gate.

## Reframe section

**Original task framing (seed c52a7a52):** "app-wide sweep — apply the wave-53 isUuid guard to all remaining client-id → uuid-cast sites that may leak raw Drizzle errors (info-disclosure hardening)."

**Scope audit (orchestrator):** REST controllers ALREADY covered by the global `SupertokensExceptionFilter` (main.ts:121, 22P02→400 generic). 4 Socket.IO gateways: study-room FIXED (wave-53); presence validates via Zod `.uuid()`; study-timer + messaging = candidate gap.

**problem-framer — REFRAME (matched antipattern #1 symptom-vs-cause false-present, #7 validation theater).** VERIFIED in code + confirmed by orchestrator grep: the wave-53 leak's load-bearing fix was `safeErrorMessage` (the catch forwarded raw `err.message`), NOT `isUuid` (defense-in-depth). **Decisive:** NO gateway besides study-room forwards `err.message` — study-timer (`:189`) + messaging (`:133`) catches emit hard-coded LITERAL strings ("Internal error checking membership" / "...channel access"); presence Zod `.uuid()`; REST filter. **The info-disclosure class is ALREADY CLOSED — zero remaining leaking sites.** The "sweep" as a leak-fix is validation theater. Reframe → (A) verify-only regression tests per WS handler proving the class is closed; (B) optional isUuid consistency hardening (NOT a security fix); do NOT build a shared WS-error-filter (guards nothing); do NOT re-touch REST.

**ceo-reviewer (re-judged) — SCOPE-REDUCTION.** Prior SELECTIVE-EXPANSION (shared WS filter) dead — rested on the false premise. Trim to (A) regression-lock only; drop (B) to optional style-parity; fold (C) canonical error string into (A)'s assertions. **Flag:** verified `344eabde` (who_can_dm='server-members' positive-control) is a GENUINELY-MISSING control — the real-Postgres DM-candidates suite tests `nobody`+`everyone` but NOT the third enum `server-members`, an unverified path on the who-can-DM bet differentiator (bet `ad1a3685`). Prefers repurposing the wave to 344eabde with (A) folded as siblings; shipping (A) alone is "acceptable but thin."

**mvp-thinner (re-judged) — OK (floor-blocked).** Keep (A) regression-lock + (C) error string; (B) isUuid is the only separable AC but pure consistency (catch already prevents leak) — keep in-wave or drop, NOT a sibling (peeling yields a ~20-40 LOC micro-sibling below the floor = floor's anti-goal). Not OVER-CUT. Worth-it/repurpose is ceo/problem-framer's lane.

**Mediation + disposition (orchestrator merge, resolve-by-rule):** All three converge — the leak-fix premise is FALSE; the class is already closed. Applied **REFRAME in place** (the documented Action-6 REFRAME = rewrite framing, not re-seed):
- Wave-54 = **verify-and-harden c52a7a52** (reframed): **(A)** a negative regression-lock test per WS gateway handler (study-timer, messaging, presence) proving a malformed non-UUID client id → generic non-leaking response + still denied — LOCKS the class closed so a future refactor reintroducing `err.message` forwarding is caught (the catches use literals today, safe-by-construction but UNTESTED — a real, if modest, regression risk). **(C)** standardize one canonical generic error string across gateways (folds in the wave-53 V-2 spec-gap). **(B) DROPPED** — defense-in-depth isUuid on timer/messaging is not-worth-the-LOC per both re-judged reviewers (the literal catch already prevents any leak; pure consistency).
- **Did NOT repurpose to 344eabde:** that's an N-2 re-seed of a distinct DM-REST surface; bundling it into a WS-gateway wave is the cross-surface grab-bag N-1 explicitly avoids. Instead **flagged 344eabde as the HIGH-PRIORITY N-1 seed for wave-55** (ceo-reviewer's finding: who_can_dm='server-members' is a real untested privacy control on the differentiator bet). Recorded for N-1.
- The "app-wide guard sweep" framing does NOT survive — no leaking sites exist to guard.

**Disposition:** PROCEED (reframed to verify-and-harden: WS regression-lock + canonical error string; B dropped).

**Final framing the rest of P-block will use:** wave-54 ships **negative regression-lock tests** for the study-timer + messaging (+ presence confirm) Socket.IO gateways — each proving a malformed non-UUID client id returns a generic, non-leaking, still-denied response — plus a **single canonical generic error-string** standardized across gateways. NO production leak-fix (the class is already closed); NO isUuid guard additions (dropped); NO shared WS-filter; NO REST changes. `claimed_task_ids = [c52a7a52]` (reframed). design_gap_flag: false (test + string-constant only, no UI). Security-scope → T-8 verifies the class stays closed. Likely sub-floor (~80-150 LOC, mostly tests) → P-1 override-ship by rule (PRODUCT rule 5).

**N-1 carry (wave-55):** seed `344eabde` — who_can_dm='server-members' positive-control integration test is a genuinely-missing privacy control (real coverage gap on the who-can-DM differentiator), higher-value than remaining hardening tail. Prioritize.
