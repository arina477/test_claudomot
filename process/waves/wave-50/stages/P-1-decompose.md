# P-1 — Decompose (wave-50)

## Maximum size rubric (split when over) — all clear
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~7 (study-timer.ts schema+migration, service, controller, shared contract, StudyTimerWidget, globals.css) | no |
| New primitives | > 60 | ~4 (2 duration columns or config, 1 configure endpoint, 1 widget affordance) | no |
| Estimated net LOC | > 5,000 | ~400-600 (reuses wave-49 schema/service/widget) + 1-line CSS | no |
| Stage-4 working set | > 350K tokens | small (delta on shipped substrate) | no |

No max threshold trips → not RESCOPE-AUTO-SPLIT.

## wave_type + minimum floor
- `claimed_task_ids = [f4b3659e, ffd98a36]` → length 2 → **wave_type: multi-spec**.
- multi-spec floor: net LOC > 2,500 **OR** claimed_task_ids ≥ 6. This wave: ~400-600 LOC, 2 specs. **Floor TRIPS** (sub-floor).

## Floor-trip resolution — override-ship (floor waived), resolve-by-rule
RESCOPE-AUTO-MERGE would normally expand the bundle to meet the floor. **Expansion is inappropriate here and was NOT performed**, for cited reasons:
1. **All 3 P-0 reviewers unanimously scope-fenced against expansion** — problem-framer PROCEED (scope ONE work/break pair), ceo-reviewer PROCEED/HOLD-SCOPE (the only adjacent scope — joinable study-sessions, whiteboard — are big standalone slices, "not cheap add-ons," each its own wave), mvp-thinner OK + `floor_constraint_active: true` (re-thinning/expanding a prior THIN deferral = double-cutting).
2. **The floor's purpose (prevent wasteful tiny waves) does not apply** — this wave completes a founder-committed deferred feature (custom durations, deferred from wave-49 P-0 by mvp-thinner) + fixes a shipped regression (F-1) on the LIVE timer, reusing existing substrate. It is high-value, not filler.
3. **No BOARD convene** — `board-process.md` § "When BOARD fires" lists the P-1 *monolith* (max split), NOT floor-merge; § "Out of BOARD scope — resolve by rule, never convene" + anti-pattern #1 direct routine sizing to be resolved by rule. The strategic BOARD seat (ceo-reviewer) already ruled HOLD-SCOPE on this exact scope at P-0, so a floor-override BOARD would re-litigate a settled strategic call.
4. **No milestone-decomposer expand call** — it would author scope the reviewers just fenced out (off-track DM stragglers or big standalone slices); to reach 2,500 LOC would need ~5× the scope. Futile + counterproductive.

**Resolution:** override-ship the sub-floor wave (recursion-guard path (a)), logged in `command-center/product/product-decisions.md`. Recurring pattern → flagged as an L-2 carve-out candidate (the floor rubric needs a "reuse-heavy feature-completion / shipped-regression-fix" exemption so it stops mechanically tripping on legitimately-small high-value waves).

## design_gap_flag (mandatory)
```yaml
design_gap_flag: true
missing_surfaces:
  - study-timer duration-config affordance: how a member sets per-server custom work/break minutes on the widget (placement + control + invalid-range/apply-while-running states) — NOT in design/study-timer.html (which shows fixed 25/5). Prior art: design/study-timer.html widget chrome + DESIGN-SYSTEM input/button primitives; scope-fenced to a minimal affordance (2 validated number inputs + apply), NOT a heavy settings panel.
```
The F-1 slim-bar fix has NO design gap (restores the already-adopted design/study-timer.html slim-bar).

## Verdict
**PROCEED** (max clear; floor tripped but override-ship by rule; design_gap_flag: true → D-block runs next).

```yaml
wave_type: multi-spec
max_rubric: clear
floor: tripped (multi-spec, ~450 LOC < 2500 / 2 specs < 6)
floor_resolution: override-ship (resolve-by-rule, no BOARD per board-process fires-list + anti-pattern-1; P-0 trio unanimous scope-endorsement)
floor_merge_attempt: 0
siblings_created: []
claimed_task_ids: [f4b3659e-842b-450c-9869-750b64685d63, ffd98a36-9d01-4fba-98ce-1c283c2553e3]
design_gap_flag: true
l2_flag: "recurring sub-floor feature-completion override — floor rubric carve-out candidate for reuse-heavy completion/debt-fix waves"
```
