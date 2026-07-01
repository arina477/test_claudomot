# Wave 31 — B-6 Review
## Phase 1 — head-builder gate
Fresh head-builder (agentId a56bcf22a25fb79c6) → **APPROVED**, all 7 gate items sound (gate order, secret server-side, token correctness, ESM bridge, faithful client, scope, test honesty). Non-blocking note: weak anti-pattern-test assertion.

## Phase 2 — /review (adversarial, credential endpoint)
**No P0.** Findings + triage (all FIXED at 58aa145):
| Finding | Sev | Disposition |
|---|---|---|
| Gate-ordering info-leak — non-member enumerates channel existence+type (404/400/403 before membership check) vs the codebase's uniform-403 convention | **P1 (security)** | **FIXED** — reordered: canViewChannelById FIRST → uniform 403 (covers missing + non-member, no leak), then load+type (400, members only), then 503, then mint. |
| ESM dynamic import: concurrent-first-call race + import-failure → unhandled 500 (not 503) | P2 | **FIXED** — memoize in-flight promise; import throw → ServiceUnavailableException (503). |
| `canPublish:true` grants video+screen-share despite audio-first | P2 (security minimization) | **FIXED** — `canPublishSources:[TrackSource.MICROPHONE]` (audio-only authority). |
| client `onError` → pre-join (silent) instead of error state | P2 | **FIXED** — onError → error state; onDisconnected → pre-join (idempotent, no double-reset). |
| disconnect-on-unmount/Leave claimed but untested (unstable per-render mock) | P2 (test honesty) | **FIXED** — stable hoisted disconnect mock; asserts called on unmount + Leave. |

Re-verify after fix-up: typecheck 4/4, lint 0-err, api 425 + web 269 unit pass, build 3/3. All /review findings resolved.

## Action 6 — commit-per-spec (multi-spec): PASS — d8a85de0 (448d5fa server), 1dd1f2ca (747b15c client), 58aa145 (fix-up, both refs). No cross-spec bleed.
```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 1
findings_critical: []
findings_high: []                      # P1 enumeration-leak FIXED at 58aa145
findings_medium_accepted: []           # all P2s fixed
fix_up_commits: [58aa145]
final_verdict: APPROVE
carry_to_L1: ["spec reconciliation: 404→403 for missing channel (security default-deny); update the controller-spec 'missing channel' case + d8a85de0 spec doc"]
carry_to_T5_C2: ["LIVE voice-connect verification needs LIVEKIT creds (not set) — founder heads-up sent"]
```
