# Wave 27 — T-block findings aggregate

## T-1 Static — 0 prod-code bypasses.
## T-2 Unit — api 395 + web 254; subscription-count 2→1 + CARRY-B test cover Spec B.
## T-3 Contract — SKIPPED (no contract surface).
## T-4 Integration — presence-index-scan.spec.ts EXECUTED + PASSED in CI (Index Scan on server_members_user_id_idx via enable_seqscan=off; migration 0012 applied); behavior-preserving co-member set.
## T-5 E2E (live) — PASS ×3, zero flake: author-avatar presence dots UNREGRESSED after the subscription lift (self emerald online dot; member panel online/offline; a11y reachable). Behavior-preserving confirmed live.
## T-6 Layout — no visual delta (PresenceDot component unchanged; dots render identically per T-5).
## T-7 Perf — the perf improvement IS the wave: EXPLAIN proves the index used (T-4); subscription-count test proves O(rows)→O(1) subscribers (T-2). No user-facing perf regression; no load-test needed at ~0 users.
## T-8 Security — SKIPPED (non-auth; secret-grep clean; index+client refactor, no new surface).
