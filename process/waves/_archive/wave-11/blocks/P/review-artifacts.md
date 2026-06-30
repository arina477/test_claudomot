# Wave 11 — P-block review artifacts
**Block:** P · **Wave topic:** Provision a persistent VERIFIED prod test fixture (enables live authed-path verification) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | in-progress |
| P-1 | done (single-spec, override-tiny) |
| P-2 | done (provision+verify+record spec) |
| P-3 | done (signup→admin-verify→gitignored record→authed-proof) |
| P-4 | done | PASS (head-product APPROVED; Karen+jenny APPROVE; proof=POST /servers, verify=first-time) | |
## Context
- wave_db_id 7605792a (wave 11); M3 6198650e (just promoted). claimed [4a2ad286 verified-prod-fixture]. single-task test-infra/ops. design_gap_flag=false (no UI). 
- 4-wave escalation (waves 7-10 couldn't live-verify authed 403/permission paths for lack of a verified prod session). De-risks M3's heavily-authed messaging build. 
- Approach (likely): create a test user in prod (signup live api) → verify its email via the SuperTokens core admin API (the approach head-ci-cd used in waves 7/8/10 — generate+consume verification token; no founder dep) → record the fixture (email + password/session) in command-center/testing/test-accounts.md (GITIGNORED — rule 2: creds NEVER committed; project.yaml gets labels+emails only). Possibly a small reusable script. PUSH after stages. Autonomous mode: automatic.
