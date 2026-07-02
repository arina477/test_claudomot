# Wave 33 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~2-8 (a bounded global invalid-UUID→400 mechanism [filter or pipe] + main.ts registration + tests; voice controllers if per-route) | No |
| New primitives | > 60 | ~1 (one shared validation mechanism) | No |
| Net LOC | > 5,000 | ~200 (mechanism ~40-80 + tests ~100-150) | No |
| Stage-4 working set | > 350K | small (7 known controllers, one mechanism) | No |

No maximum threshold trips. problem-framer's RESCOPE-AUTO-SPLIT was directional ("scope too narrow → expand to root cause"), NOT a size-max trip — the deterministic max rubric is clean.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [a2dd9f3d]` → length 1 → **wave_type: single-spec**.
- Single-spec floor: net LOC > 1,500. Estimate ~200 → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE evaluation → override-ship under-floor
Floor unmet. Expansion analysis: even the FULL root-cause convention (all ~30 UUID params across 7 controllers, or a single global mechanism covering them) is ~200-350 LOC — cannot reach the 1,500 floor. The only adjacent M6 `## Scope` items (screen-share, audio-fallback) are CREDENTIAL-BLOCKED (LiveKit keys absent) → cannot be bundled as credential-independent expansion. So decomposition-expand is futile. **Override-ship the under-floor residual** per the standing precedent (wave-24 BOARD do-not-relitigate ruling, applied w25-w32; + wave-16 test/tech-debt exemption cited by ceo-reviewer + mvp-thinner). `floor_merge_attempt: 0`. No BOARD (precedent-application).

## Scope resolution (mediating P-0 RESCOPE-AUTO-SPLIT tension)
- problem-framer (evidence): the malformed-UUID→500 is project-wide (zero ParseUUIDPipe; ~30 raw-string UUID params across 7 controllers; no global validation). Fixing only 2 voice routes = whack-a-mole.
- ceo-reviewer + mvp-thinner: hold scope, no sprawling per-route sweep, don't gold-plate.
- **Resolution:** frame the wave around the ROOT CAUSE — a **bounded, single global mechanism** that maps a malformed-UUID route param to 400 before DB access, covering all authenticated `:id`-style params (incl. both voice routes as the verified finding). This is the ROOT fix (problem-framer satisfied) AND minimal/bounded (one mechanism, ~40-80 LOC — NOT a 30-param manual per-route sweep, so ceo/mvp's anti-sprawl respected). The 2 voice routes get explicit regression tests (the finding); ≥1 non-voice route also asserted (proves the convention, per problem-framer).
- **P-3 owns the exact mechanism:** global `BadRequestException` filter for Postgres invalid-uuid cast errors (SQLSTATE 22P02 / QueryFailedError) vs a global `ValidationPipe`/`ParseUUIDPipe`-on-uuid-params approach. P-3 confirms it's BOUNDED — changes the error contract ONLY for the current malformed-UUID→500 case (500→400, a strict improvement everywhere, no other route behavior changed). Re-evaluate mvp-thinner's global-filter keep-OUT against problem-framer's "global is the minimal root fix" evidence at P-3.
- keep-OUT (carried from mvp-thinner + ceo): NO manual per-route pipe on all 30 params (a single mechanism instead); NO broad error-normalization refactor beyond the malformed-UUID case; NO over-testing (targeted regression tests, not a fuzz battery).

## Step 3 — design_gap_flag
**design_gap_flag: FALSE.** Backend-only (a NestJS global filter/pipe + unit tests). No UI surface, no page/component/flow. → **D-block SKIPS**, straight to B.

```yaml
verdict: PROCEED (override-ship under-floor — bounded root-cause param validation; expansion futile [rest cred-blocked]; precedent-application)
wave_type: single-spec
claimed_task_ids: [a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354]
max_rubric_trips: []
floor_threshold: "1500 LOC (single-spec)"
estimated_net_loc: "~200"
floor_met: false
floor_merge_attempt: 0
override_basis: "bounded root-cause hardening; full convention still <350 LOC (cannot reach floor); adjacent M6 scope cred-blocked; wave-24 do-not-relitigate + wave-16 test-debt precedent"
board_convened: false
design_gap_flag: false
missing_surfaces: []
scope: "bounded global malformed-UUID-route-param -> 400 mechanism (root cause), covering both voice routes [finding] + a non-voice regression assertion; P-3 picks filter-vs-pipe + confirms bounded"
security_surface: "input-validation hardening on auth-gated routes (malformed id -> 400 not 500, no leak); T-8 re-probe applies"
n_block_flag: "park-or-key MANDATORY at N-block (ceo-reviewer) — no credential-independent M6 work remains after this wave"
```

## Exit
Single-spec, override-ship under-floor (precedent, floor_merge_attempt 0, no BOARD). Scope = bounded root-cause malformed-UUID→400 mechanism (both voice routes + a non-voice assertion). design_gap_flag=FALSE → **D-block SKIPS → straight to B**. Security-adjacent (T-8 re-probe). N-block park-or-key flagged. → P-2 Spec.
