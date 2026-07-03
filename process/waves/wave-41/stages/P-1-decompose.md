# Wave 41 — P-1 Decompose

## Maximum size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~15–25 (schema: roles +moderate_members, server_members +muted_until; rbac.ts Zod; can(); moderation service; channel-message send-gate mute check; ServerRolesPage toggle; MessageList delete-any; member-timeout UI; message/member controllers; tests) | > 60 | no |
| New primitives | ~6–9 (2 columns + 1 migration + moderation service + timeout mechanism + 2-3 endpoints + UI affordances) | > 60 | no |
| Estimated net LOC | ~2,800–3,600 (role perm + delete-any [cheap, reuses can()+socket] + timeout mechanism [new muted_until + send-gate] + 2 UIs + real-PG authz/behavior tests) | > 5,000 | no |
| Stage-4 working set | moderate (~150K: 2 spec blocks + RBAC/messaging context + per-agent briefs) | > 350K | no |

**Max verdict:** not tripped. No size-forced split.

## Wave type
`claimed_task_ids = [6cf06f99 (seed), 6ddddc2d (sibling)]` → **multi-spec** (2 self-contained spec blocks; P-2 authors one per task; P-4 reviewers iterate per-block).

## Timeout-split decision (P-0 carry from problem-framer)
problem-framer flagged member-timeout as materially heavier than delete-any (new `muted_until` substrate + a new send-time mute gate, vs delete-any which reuses the shipped `can()` + `message:deleted` socket). **Decision: DO NOT split timeout out.** Rationale: (1) the max rubric is not tripped — no size force; (2) ceo HOLD-SCOPE — delete-any alone is near-inert (it mostly reuses shipped code), so the role would ship without a substantive new power; delete-any + timeout is the coherent "light moderation" `## Scope` item and the right "role does something on ship" ambition; (3) the timeout substrate is bounded (~1 column + 1 guard check + expiry), not a milestone-sized mechanism. If B-block finds timeout genuinely too heavy mid-implementation, the build-dispatcher can escalate a split then. Verdict: PROCEED (no split).

## Minimum floor
- multi-spec floor: net LOC `> 2,500` OR `claimed_task_ids.length >= 6`.
- Estimate ~2,800–3,600 LOC → **floor MET** (> 2,500). No floor-merge needed. (First real product-feature wave since the M7 polish waves; genuinely above floor.)

**Verdict:** PROCEED (multi-spec, no split, floor met).

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "member-timeout affordance: a member context menu / moderation control + a timeout-duration selector + a 'timed-out' member indicator — NO existing mockup; genuinely new interaction (D-1 audits)"
  - "educator role grant: extends the existing ServerRolesPage permission-toggle pattern (likely trivial — D-1 may empty-audit this one)"
  - "delete-any-message affordance: extends the existing MessageList hover-actions (likely trivial — D-1 may empty-audit)"
```
Rationale: the role-grant toggle + delete-any extend shipped patterns (ServerRolesPage toggles / MessageList hover-actions) — likely trivial. But the **member-timeout UI** (a moderation control + duration selection + muted-state indicator) is a plausibly-new interaction with no mockup → **design_gap_flag=true**; D-block runs. D-1's audit will confirm which surfaces are real gaps vs trivial extensions (empty-audit + skip if all covered). → P-block hands off to **D**.

```yaml
wave_type: multi-spec
verdict: PROCEED
timeout_split: false
floor_merge_attempt: n/a (floor met)
design_gap_flag: true
```
