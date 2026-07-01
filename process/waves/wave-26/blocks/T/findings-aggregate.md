# Wave 26 — T-block findings aggregate

## T-1 Static
- [INFO] 0 production-code static bypasses. 1 `as unknown as` in presence-dots.test.tsx:404 (test mock — acceptable).

## T-2 Unit
- (none — 17 presence-dot tests cover online/offline/unknown-no-dot/live-flip/a11y/member-panel-regression/single-socket)

## T-3 Contract — SKIPPED (no contract surface)
## T-4 Integration — SKIPPED (no schema/service change)

## T-5 E2E (live prod) — CRITICAL
- [CRITICAL / AC1-AC2 — RESOLVED fix-up cycle 1] Author-avatar presence dots DO NOT render on live prod (deploy 036c9612), incl. the fixture's own online message. DOM: every author-avatar column has only the initials div, no PresenceDot/sr-only/dot element. Root: `AuthorPresenceDot` returns null because `hasPresence(msg.authorId)` is false on prod. Candidate causes: (a) the /presence store excludes the connecting user's OWN presence (getCoMemberUserIds snapshot = co-members, self not included → self-authored messages never get a dot, contradicting the spec's self-author edge case "dot reflects viewer's own presence, online while connected"); (b) authorId-vs-presence-key mismatch (member panel briefly showed fixture emerald-online yet the message-row lookup still failed). Unit tests passed because they mocked the store WITH the author key present. → route to websocket-engineer (presence gateway + store) for root-cause + fix; re-run T-5. This is a T-5 fix-up cycle (cap 3).
- [PASS] AC5 member-panel dots (regression) — every member row has presence-dot-inner + sr-only label, online emerald / offline grey. Refactor onto shared PresenceDot did not regress.
- [PASS] a11y — presence label reachable (3/3, 0 suppressed); B-6 aria-hidden fix holds on prod.

- [RESOLVED] T-5 fix-up cycle 1: self-presence seed (PR #39, 12b5ec2, deploys api 539c476d + web 4a703d92/index-BAcJ6YNx.js). Re-verified LIVE ×2: self-author message → emerald online dot (rgb(16,185,129), presence-dot-inner + sr-only Online); 23-24/24-25 rows carry the dot; member panel + a11y unregressed. All 5 ACs verified live.
