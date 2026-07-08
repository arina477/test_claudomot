# Wave 79 — V-2 Triage

Master list: T-block (3) + Karen (0) + jenny (3) + B-6 carried (F3/F5/F8) → dedup → 6 distinct. **Zero blocking.**

## Classification
| # | Finding | Source | Bucket | Disposition |
|---|---|---|---|---|
| 1 | DM auth-guard race (bounce to / on transient 401) | T-5 F-T5-1 (MED) + jenny corrob | **Non-blocking** | task 0e58af8e (unassigned — cross-cutting auth/UX) |
| 2 | Server-side senderKeyRef validation (defense-in-depth) | B-6 F3 + T-8 F-T8-2 (LOW) | **Non-blocking** | task 1f48f4db (unassigned — crypto hardening) |
| 3 | Header capability-lock over-reads plaintext threads | jenny F-J2 (LOW/obs) | **Non-blocking** | task ae1c82a5 (unassigned — UX honesty polish) |
| 4 | Can't toggle who_can_dm=nobody live (Fixture B pw absent) | jenny F-J1 (GAP) | **Noise** | suppress — gate proven via CI integration matrix + Karen source axis; already tracked (unassigned "Fix userB e2e fixture password") |
| 5 | who_can_dm key-fetch timing oracle | B-6 F5 | **Noise** | suppress — T-8 found NOT present (uniform ~0.10s) |
| 6 | GET encryption-key rate-limit | B-6 F8 | **Noise** | suppress — T-8 found RESOLVED (ThrottlerGuard active, 429 no state leak) |
| — | group DM not live-constructible | T-8 F-T8-1 (info) | **Noise** | suppress — fail-closed verified structurally (CI + DOM + negative control) |

## Blocking
None. Server-blind invariant proven live (jenny) + CI; who_can_dm uniform-404 byte-identical; honest indicator fail-closed (per-message authoritative); private key never on wire; all 5 P-4 corrections honored; B-6 crypto fixes (F2/F4/F7) present in merge tree.

## Non-blocking tasks (wave_id NULL — seedable)
- 0e58af8e — DM auth-guard race (MED — the most impactful)
- 1f48f4db — server senderKeyRef validation (crypto hardening)
- ae1c82a5 — header indicator capability-semantic polish

```yaml
findings_input_count: 9
findings_blocking: []
findings_non_blocking:
  - {id: 1, source: "T-5-F-T5-1+jenny", summary: "DM auth-guard race", task_id: 0e58af8e-efed-43cb-b3eb-f1b962066c51, milestone_id: null}
  - {id: 2, source: "B-6-F3+T-8", summary: "server senderKeyRef validation", task_id: 1f48f4db-451f-44a4-b7d4-abb1572ea7b5, milestone_id: null}
  - {id: 3, source: "jenny-F-J2", summary: "header capability-lock over-read", task_id: ae1c82a5-8fc2-4011-9728-1e5a0a54ab7a, milestone_id: null}
findings_noise:
  - {id: 4, source: jenny-F-J1, rationale: "gate proven via CI matrix+Karen; fixture-B-pw already tracked"}
  - {id: 5, source: B-6-F5, rationale: "T-8 found timing oracle NOT present"}
  - {id: 6, source: B-6-F8, rationale: "T-8 found rate-limit RESOLVED (ThrottlerGuard)"}
  - {id: 7, source: T-8-F-T8-1, rationale: "group not live-constructible; fail-closed verified structurally"}
fast_fix_queue: []
b_block_re_entry_required: []
```
