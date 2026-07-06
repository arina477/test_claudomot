# Wave-61 T-block findings aggregate
T-8 live throttle probe COMPLETE (load-bearing security verification). Result: PASS — all assertions.
- A1 DM-read override live: 18/18 GET /dm/conversations = 200 (pre-fix 429'd after ~10).
- A3 global limit still enforced: GET /me (non-DM-read) 429'd after ~global ceiling.
- Bucket isolation: /me=429 while /dm/{conversations,candidates,messages}=200 in one batch -> override scoped to 3 routes, not a blanket removal.
- A2 exact constant 60 (not 120), bounded not removed: boundedness live-verified; exact numeral code-verified (head-builder @Throttle literal 60 + api CI 152/152).
Code-level context: @Throttle(60/60s) on 3 DM reads, writes untouched, bounded 429 backoff reads-only, web 477/477.
findings: []
findings_total: 0
findings_critical: 0
