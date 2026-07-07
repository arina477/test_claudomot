# Wave 77 — T-block findings aggregate

(V-2 canonical input. Append-only as T-stages run. Severity: critical | high | medium | low.)

## T-1 Static
- [low] test files: 5 `as any` casts confined to test scaffolding; zero production type escapes. Non-blocking.

## T-2 Unit
- (none) — api 811/811, web 696, shared 41 all green in CI test job.

## T-3 Contract
- (none) — GET/PATCH /profile + GET /profile/:userId contracts traced to live probes; round-trip + enum-reject 400 confirmed; PublicProfile excludes email.

## T-4 Integration
- (none) — 13-case profile-visibility matrix ran green in CI on postgres:16 (merge-blocking); resolver uses correct shared-server EXISTS idiom (not the leak-prone listServerMembers shortcut).

## T-5 E2E
- [low] T-5 swarm infra: all playwright MCP instances share one chrome profile (no `--isolated`); parallel swarm cannot acquire >1 browser. Ran scenarios sequentially on playwright-1 per T-5 principle #1 (no coverage lost). Fix: per-instance `--user-data-dir`/`--isolated` in MCP launch config.
- [low] (carried from B-3) member card renders same calm "Profile Unavailable" state for a non-404 network error as for a genuinely-hidden profile; no distinct retry affordance. UX. Route to V-2.

## T-6 Layout
- (none) — card dark tokens (bg rgb(18,18,20), text rgba(255,255,255,.92), radius 8px) trace to DESIGN-SYSTEM; portal not clipped; no verification badge; academicRole plain text.

## T-7 Perf
- SKIPPED (not heavy; read-only endpoints + small card).

## T-8 Security (crown jewel)
- [low] restore-to-unset gap: PATCH /profile cannot clear academicRole back to NULL once set (enum .optional() rejects null/empty). Not a leak; UX/data-hygiene. Route to V-2.
- [info] uniform-404 posture: malformed :id returns uniform 404 not 400 (stronger anti-oracle posture; no 500). Accepted, not a finding.
- ALL crown-jewel privacy cases PASS: nobody→hidden, everyone→visible, server-members co-member→visible, stranger-not-leaked (CI real-DB + resolver code confirmed), bidirectional block→hidden, NO email leak (live grep), unauth→401, uniform-404 (no info-leak oracle).

## Summary
- findings_total: 4 (low: 3, info: 1) + 1 test-file-cast low = 4 low + 1 info
- findings_critical: 0
- No blocking findings. Crown-jewel privacy enforcement verified LIVE + CI-authoritative.
