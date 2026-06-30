# Wave 12 — T findings (→ V-2/L)
1. (T-8, info) null-idempotency-key send-race — unreachable on prod path (client always sends crypto.randomUUID key) → V cleanup (.returning()).
2. (T-8, info) no live-socket eviction on RBAC revoke — join-time gate correct, out of M3 scope → H2.
3. (T-5, carry) authed messaging-UI full-browser e2e deferred (synthetic Socket.IO two-client probe is the authoritative substitute; below canary DAU).
4. (L-FLAG) head-ci-cd hand-added 2 CI-PRINCIPLES rules at C-2 (CLI-up transport; 404→401 route-probe) bypassing L-2/karen (same as wave-9) → L adjudicate (revert or karen-vet).
