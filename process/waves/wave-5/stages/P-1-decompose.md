# Wave 5 — P-1 Decompose — RESCOPE-AUTO-MERGE → M1-hardening multi-spec
Rate-limit (839af17f) alone (~300 LOC) is below the single-spec floor (>1500). Founder ruling: "rate-limit + avatar priority; fold the rest in." → MERGE into one comprehensive M1-hardening wave that finishes the foundation's engineering follow-ups.
## Bundle (multi-spec, 6 specs → meets >=6 floor)
| Task | Item | Size | Dep |
|---|---|---|---|
| 839af17f | Auth rate-limiting (@nestjs/throttler 10/min, in-memory) | S code | — (priority) |
| 84e09891 | Avatar storage: founder bucket creds → verify upload live + server-side 2MB | M code | FOUNDER Railway Bucket creds (pending) (priority) |
| e38c306e | API version align (health reports package version) | XS code | — |
| a7667fb7 | Clear CI Node-20 deprecation warnings | XS CI | — |
| 478e9d43 | Branch protection on main (require PR + green CI) | XS ops | (I do via gh API) |
| c51589cd | CI browser E2E job (Playwright chromium) | M CI | — |
## Excluded: a1299e88 (Resend domain) — pure founder DNS, no code → stays standalone tracked (founder does anytime; not an engineering blocker for M1 close).
## After this wave: M1 engineering hardening done → M1 closeable (only a1299e88 founder-DNS remains) → M2 servers/messaging.
```yaml
wave_type: multi-spec
verdict: RESCOPE-AUTO-MERGE → PROCEED-AFTER-MERGE
claimed_task_ids: [839af17f-fa3d-4212-a17b-d34bfbb231d7, 84e09891-2b2f-4b68-b6e2-e2ef340ef32a, e38c306e, a7667fb7, 478e9d43, c51589cd]
design_gap_flag: false
notes: "avatar (84e09891) credential-gated → founder Railway Bucket creds; rate-limit ships independently; branch-protection via gh API; security-tightened gate APPLIES (rate-limit auth surface) → T-8."
```
