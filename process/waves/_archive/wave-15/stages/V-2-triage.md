# Wave 15 — V-2 Triage
## Blocking (0) — fast-fix queue EMPTY
Karen APPROVE + jenny APPROVE; T-block 0 crit/0 high. The @mention feature is verified-real + live (mention realtime alive two-client, my-mentions IDOR-closed, username chain closes). No blocking findings.

## Non-blocking — explicit dispositions
| id | source | summary | disposition |
|---|---|---|---|
| T4-F1 / G1 | T-4 + jenny | No real-PG integration tier for message_mentions (mocked unit + boot-probe + C-2 prod-verify cover it) — 2-wave recurrence | **NOT a silent carry: explicitly mapped to existing task 02fa8011 (wave-14 V-2, "Real-Postgres integration test tier"). 2nd confirming wave — bumped note added to that task's description. No duplicate row.** |
| T5-F1 / G2 | T-5 | Playwright MCP chrome-channel absent (worked around via bundled chromium) | INSERT task: reconfigure Playwright MCP to bundled chromium before next UI wave (tooling). |
| M-2 / G3 | B-6 + jenny | client tokenizer (MessageList) diverges from server parser — interior-dot @bob.dev renders plain (no false pill, no security) | INSERT task: client/server mention-token parser parity. |
| M-4 | B-6 | edit-diff delete+insert not in a transaction | INSERT task: wrap mention edit-diff in a txn (robustness). |
| M-1, M-3, L-1..L-6 | B-6/review | index ASC, non-idempotent create re-select, minor frontend cleanups | accepted non-blocking (noise/opportunistic); not tasked. |

```yaml
findings_blocking: []
fast_fix_queue: []
b_block_re_entry_required: []
non_blocking_dispositions: [T4-F1→existing-02fa8011, T5-F1→new-task, M-2→new-task, M-4→new-task, rest→accepted]
```
