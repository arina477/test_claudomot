# V-1 Summary — wave-61
- **Karen (acad6234f39a2f632) APPROVE:** HEAD=e0e842e verified (clean tree, what shipped = what reviewed). 3 @Throttle(60/60s) on GET reads (dm.controller.ts:93/141/182), constant 60 (no 120), writes bare, no @SkipThrottle; retryOn429 (max4/base300/cap10s/Retry-After, 429-only) wraps only 3 DM reads, writes unwrapped; non-429 rethrow tested; web 477/477 + api 152/152 reproduced; deploy 200s; T-8 live evidence coherent. Non-blocking: per-IP ceiling (shared-NAT share bucket) = accepted design.
- **jenny (aa1b420244e0a2925) APPROVE:** all 5 ACs satisfied. AC1/AC2/AC4 LIVE-verified (T-8: 18/18 reads 200, /me 429 after 10, bucket-isolated); AC3 live(separate bucket)+code(limit 60); AC5 code+tests (retryOn429.test 10/10 assert bounded/Retry-After/writes-excluded). No drift, no gap. design_gap_flag=false correct.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
karen_findings_count: 0
jenny_findings_count: 0
spec_drift_count: 0
spec_gap_count: 0
findings: []
```
