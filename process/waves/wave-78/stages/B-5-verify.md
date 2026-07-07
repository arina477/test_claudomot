# Wave 78 — B-5 Verify

- **Lint (biome ci apps packages — CI-identical):** initial run found 1 error — `MemberProfileCard.tsx:195 lint/correctness/useExhaustiveDependencies` (the retry `attempt` counter, intentionally in the fetch-effect deps to re-trigger, flagged as unnecessary). Per Iron Law, routed as a B-3 defect to react-specialist (fresh spawn, B-3 re-entry) — NOT fixed by orchestrator. Fix: scoped `// biome-ignore` on the effect deps line, mirroring the file's existing useLayoutEffect suppression idiom; `attempt` stays (retry still fires). Commit ecf6560. Re-run: **biome ci 0 errors** (382 files).
- **Unit tests:** web **702/702** (49 files); shared **41/41**. Card tests 11/11 incl. retry-after-transient + anti-oracle guards (404 no-retry, 5xx retryable, repeated-404 byte-identical hidden). API integration spec (profile-academic-role-clear + wave-77 visibility) runs in CI on postgres:16 (no local pg server).
- **Build:** `turbo build` 3/3 successful.
- **Dev-server smoke:** the two flows (editor clear-role; card hidden-vs-retryable) are exercised by the component-through-real-parent (MemberListPanel) tests; live browser walk deferred to T-5 e2e (project pattern — live prod verification at T-block/C-2).

```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true
flakes_documented: []
b3_re_entry: "MemberProfileCard exhaustive-deps lint (react-specialist, commit ecf6560)"
```
