# Wave 2 — P-1 Decompose

## Maximum size rubric (split when over) — none trip
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~18-25 (db module + drizzle schema/migrations/seed, auth module: supertokens init/config/recipes/guards/middleware, email/resend service, main.ts wiring, env, tests) | no |
| New primitives | >60 | ~14 (DbModule, Drizzle schema(users/profiles), migration set, seed, AuthModule, SuperTokens recipes×3 [EmailPassword/EmailVerification/Session], verifySession guard, ST middleware, EmailModule+Resend client, config) | no |
| Net LOC | >5,000 | ~2,000-2,600 | no |
| Stage-4 working set | >350K tok | plan + ST/Resend SDK docs + briefs ≈ 150K | no |

## wave_type + minimum floor
- claimed_task_ids = [b9118041] → length 1 → **wave_type: single-spec**
- single-spec floor: net LOC >1,500. Estimate ~2,000-2,600 → **above floor**.

## Verdict: PROCEED
Coherent irreducible foundation slice (per P-0 problem-framer). No split, no merge.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # backend-only — no UI this wave (auth/profile frontend pages = separate task 9aae8255). D-block SKIPS → B.
```

```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0
claimed_task_ids: [b9118041-06c0-4478-9d15-dfc715e3b97a]
design_gap_flag: false
```
