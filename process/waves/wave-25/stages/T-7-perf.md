# Wave 25 — T-7 Perf — SKIPPED

## Skip decision
`wave_type` = [backend, ui], does NOT include `heavy`. Per T-7 skip condition + judgment clause:
- **No perf-sensitive change.** `renderBodyWithMentions` change is algorithmically equivalent to the prior code — still splits the body once and maps tokens; `extractMentionSlug` is a single regex match per `@`-token (no worse than the prior `.replace()` per token). No new loops, no N+1, no added network calls.
- **editMessage txn:** wraps 3 pre-existing writes (UPDATE + DELETE + INSERT) in one transaction — same query count, one round-trip fewer transaction-boundary overhead is negligible; no new hot query.
- **Bundle:** `mentionSlug.ts` = 47 LOC pure util; **no new dependency added** (package.json unchanged). Web bundle delta trivial (<1KB).

No perf budget at risk. Skip.

```yaml
test_pattern: active
skipped: true
skip_reason: "wave_type not heavy; tokenizer change algorithmically equivalent to prior (single regex/token, no new loops/deps); mentionSlug 47 LOC no new dependency; editMessage txn same query count. No perf-sensitive surface."
bundle_delta: {per_route: [], per_package: [{package: web, note: "<1KB — 47-LOC util, no new dep"}]}
vitals: []
api_latency: []
fix_up_cycles: 0
findings: []
```

## Exit
Skipped (not heavy, no perf-sensitive change). → T-8.
