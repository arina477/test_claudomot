# Wave 16 — V-2 Triage
## Blocking (0) — fast-fix queue EMPTY
Both APPROVE; T-block 0 wave-16 findings. The authed create-server E2E is verified-real + CI-green + creds-safe. No blocking findings.

## Non-blocking — dispositions
| id | source | summary | disposition |
|---|---|---|---|
| 9 pre-existing lint warnings | B-5/T-1 | useTyping.ts noNonNull (×6, wave-14) + ServerRolesPage unused suppressions (×3) — biome WARNINGS (don't fail CI); accumulating noise | INSERT task: clean up the 9 pre-existing biome warnings (noNonNull + unused suppressions) before they mask a real issue. |
| M-3 prod test-server accumulation | B-6 + P-4 Gemini | E2E creates throwaway servers on prod fixture; no teardown | ALREADY logged follow-up (P-4 gate-verdict): add teardown when DELETE /servers/:id ships. No new task (no max-servers limit + no delete affordance → NOT-MATERIAL). |
| M-1 broad testMatch, L-1..L-4 | B-6 | intended / cosmetic | accepted non-blocking (noise). |

```yaml
findings_blocking: []
fast_fix_queue: []
b_block_re_entry_required: []
non_blocking_dispositions: [lint-warnings→new-task, M-3→already-logged, rest→accepted]
```
