# Wave 14 — V-2 Triage
## Blocking (1) → V-3 fast-fix
| id | source | summary | fast_fix_candidate |
|---|---|---|---|
| F-4 | T-8 + Karen + jenny | typing emitTypingActive broadcasts actor-excluded list to whole room → recipients get [] typers; typing AC (task 58633934) UNMET in prod | YES (<20 LOC, single-file gateway emit; per-recipient exclusion; +test asserting recipient sees actor) |

## Non-blocking → task rows (INSERTed)
- F-3/F-3b: integration tests mock the DB (no real-Postgres tier) — co-member/member-gate carried by live T-8; recurring infra gap.
- M-1 (KI-1): getCoMemberUserIds full-membership scan per connect (perf; SELECT DISTINCT).
- M-3 (KI-2) + M-4 (KI-3): email.split('@')[0]→'' displayName fallback gap; unused ServerMembersResponseSchema wrapper vs bare-array wire shape (latent contract trap).

## Noise (suppressed)
- F-5 (e2e live-move re-capture) — low, T-8 two-client already proved live presence transitions. 
- F-6 (info). L-2/L-3/L-4 (cosmetic).
```yaml
findings_input_count: 9
findings_blocking: [{id: F-4, source: T-8+V-1, summary: typing-broadcast-composition, fast_fix_candidate: true}]
fast_fix_queue: [F-4]
b_block_re_entry_required: []
```
