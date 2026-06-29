# Wave 6 — B (CI boot-probe, devops-engineer)
- da242f6b (8d0c339): added `boot-probe` job to ci.yml — postgres:16 service (mirrors `test`), build, start `node apps/api/dist/src/main.js` bg with PORT=3000 + DATABASE_URL(throwaway) + dummy SUPERTOKENS_CONNECTION_URI/API_KEY + origins, poll /health 30×1s asserting status:ok, dump logs + exit 1 on timeout, pkill cleanup if:always. node dist vehicle (matches Railway).
- **Locally booted the compiled artifact**: Nest started ~160ms, /health → {"status":"ok",...,"version":"0.0.1"} → probe passes attempt 1 (proves no false-fail; lazy init + lazy pool confirmed).
- Branch protection: 6 required checks now (added boot-probe; preserved strict/0-approvals/enforce_admins-false).
- No app code change (CI-only). lint clean.
