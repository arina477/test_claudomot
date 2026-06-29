# Wave 5 — P-block review artifacts
**Block:** P · **Wave topic:** Foundation hardening — auth rate-limiting + avatar storage completion (M1 tail) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | PROCEED; multi-spec hardening; P-1 decouple (avatar cred-gated) |
| P-1 | stages/P-1-decompose.md | done | RESCOPE-AUTO-MERGE → 6-spec M1-hardening; design_gap_flag=false |
| P-2 | stages/P-2-spec.md | done | 6-block multi-spec (rate-limit/avatar/version/node20/branch-protect/CI-E2E) |
| P-3 | stages/P-3-plan.md | done | per-spec plan; specialists validated; avatar cred-gated; ci.yml coord noted |
| P-4 | blocks/P/gate-verdict.md | pending | |
## Context
- wave_db_id ae9e80b2 (wave 5); M1. claimed [839af17f rate-limit, 84e09891 avatar-storage]. multi-spec.
- Founder direction (2026-06-29): harden-then-core. These 2 = the named highest-value hardening.
- 839af17f: @nestjs/throttler ~10/min on auth endpoints (security-tightened gate APPLIES — auth surface). Self-contained.
- 84e09891: founder Railway Bucket creds (AWS_*) → set on api → verify avatar presign→PUT→confirm→render live + server-side 2MB enforcement (the V-2 AC7 fold-in). NEEDS FOUNDER CREDS (pending) at B-block.
- design_gap_flag: likely false (backend hardening; avatar UI control already shipped wave-4). Autonomous mode: automatic.
