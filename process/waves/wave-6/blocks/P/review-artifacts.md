# Wave 6 — P-block review artifacts
**Block:** P · **Wave topic:** Pre-merge CI compiled-artifact boot probe (closes the recurring compiled-dist prod-boot outage class) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | in-progress |
| P-1..P-4 | pending | |
## Context
- wave_db_id f09f5b9b (wave 6); M1; seed da242f6b (L-2 follow-up from wave-5). single-task infra/CI wave. design_gap_flag=false (CI-config only).
- Motivation: 4× CI-green-but-prod-boot-crash (wave-1/3/3/5; wave-5 version.ts MODULE_NOT_FOUND). Add a CI job that boots `node dist/src/main.js` (or docker) + curls /health pre-merge. BUILD rule 1 (boot-before-merge) exists; this enforces it at the PIPELINE level.
- Likely sub-floor (tiny) — P-1 assesses (no mergeable siblings: other M1 items founder-blocked). Autonomous mode: automatic.
