# Wave 5 — B-2 CI/ops (3 specs, devops-engineer)
- a7667fb7 node-20 (6c5bb4b): ci.yml actions/checkout@v4→v5, setup-node@v4→v5 (clears Node-20 deprecation); 5 jobs unchanged structurally.
- c51589cd CI-E2E (df61cc7): apps/web/playwright.config.ts (chromium, baseURL E2E_BASE_URL=live web) + e2e/smoke.spec.ts (/ + /login render asserts) + ci.yml `e2e` job (install --with-deps chromium + run). Non-required check (targets live; non-blocking). [test-automator→devops swap per rule 11.]
- 478e9d43 branch-protection (ops, ACTIVE): main requires PR + 5 status checks (lint/typecheck/test/build/secret-scan), strict, 0 approvals, enforce_admins false (bot squash-merge unblocked), no force-push/delete. Closes the eed4c3c direct-push gap.
