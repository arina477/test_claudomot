# Wave 57 — B-block review artifacts
**Block:** B · **Wave topic:** DM→server nav papercut fix (onExitDmHome) · **Gate:** B-6 · **Status:** gate-passed → C-block
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch; claim ff09c4c9; schema SKIP |
| B-1 | done | SKIP — no shared contract (component prop wiring) |
| B-2 | done | SKIP — no backend |
| B-3 | pending | react-specialist: onExitDmHome + wire Home onClick + test |
| B-4/B-5/B-6 | pending | |
- claimed [ff09c4c9]. Branch wave-57-dm-server-nav-fix. No schema/deps.
## B-3 CARRY (from P-4): ServerRail Home button (:120-131) has NO onClick — ADD one. Reset must NOT depend on selectedId changing (re-select-same-server edge case). Preserve onDmHome toggle-into-DM.

## Handoff
```yaml
build_block_status: complete
branch: wave-57-dm-server-nav-fix
review_verdict: APPROVE
last_commit_sha: 6e0d803
ready_for_ci: true
```
