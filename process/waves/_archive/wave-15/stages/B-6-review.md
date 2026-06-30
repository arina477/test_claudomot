# Wave 15 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 2
findings_critical: []
findings_high: []   # H-1 (unread badge realtime dead — per-user room + mention event) + H-2 (singleton cross-user leak) FIXED (09f138a + 1f4bc30), re-review confirmed cleared
findings_medium_accepted:
  - "M-1 migration index ASC vs documented DESC (backward-scan works)"
  - "M-2 client @token extraction (MessageList) diverges from server parser — interior-dot tokens (@bob.dev) don't render pill"
  - "M-3 non-idempotent create re-selects canonical row by content (bounded by UNIQUE)"
  - "M-4 edit-diff delete+insert not wrapped in a transaction"
findings_low_accepted: [L-1 doc-keydown-capture, L-2 blur-timeout-not-cleared, L-3 redundant membership predicate, L-4 self-mention bootstrap phantom, L-5 nextCursor nullish vs nullable, L-6 bootstrap-vs-live transient double-count]
fix_up_commits:
  - "09f138a per-user room + mention event (H-1 backend)"
  - "1f4bc30 wire badge to mention event + reset on logout (H-1 client + H-2)"
final_verdict: APPROVE
```
- Phase 1 head-builder APPROVED (username chain closes end-to-end, /me/mentions authz session-derived, schema 0007 sound, combobox ARIA correct, commit-per-spec ok).
- Phase 2 /review: no Critical; 2 HIGH (unread-badge realtime dead + singleton leak) FIXED + re-confirmed cleared; no new Critical/High. Re-ran B-4 (typecheck 4/4) + B-5 (build 3/3, 471 tests) green.
- Carried M/L → L-2 observation candidates (M-2 client/server parser divergence + M-4 edit-diff txn are the notable ones). biome.json useSemanticElements:off flagged (head-builder F-3) — accepted for MVP.
