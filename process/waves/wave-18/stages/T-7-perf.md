# Wave 18 — T-7 Perf
```yaml
test_pattern: active
skipped: false
api_latency: [{endpoint: "GET /messages/:parentId/replies", note: "index-covered keyset (thread_parent_id,created_at); denormalized reply_count avoids count-on-read N+1; count++ in-txn"}]
findings: []
```
- Light/Pattern-A wave; no new deps. No regression.
