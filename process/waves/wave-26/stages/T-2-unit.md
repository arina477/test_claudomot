# Wave 26 — T-2 Unit (Pattern A: CI-verified)

## Action 1 — CI evidence
PR #38 run 28519830784 `test` job SUCCESS: **web 251 passed**, **api 395 passed**. Integration tier (5 real-PG specs) still executed non-zero (CI rule 5 — not dropped; frontend-only wave adds none).

## Action 2 — Coverage audit (wave modules)
| Module | New behavior | Coverage |
|---|---|---|
| PresenceDot.tsx | shared dot (online/offline/size, a11y label) | presence-dots.test.tsx (online emerald / offline muted / size / sr-only label reaches a11y tree / outer not aria-hidden) |
| MessageList AuthorPresenceDot | live author-avatar dot, tri-state, unknown→no-dot | presence-dots (online/offline/unknown→NO dot/live online↔offline flip/online→unknown transition/pending+failed no-dot/single-socket AC4) |
| presenceSocket hasPresence | known-vs-absent accessor | mocked + asserted via the unknown→no-dot cases |
| MemberListPanel | refactor onto PresenceDot | member-panel regression tests (online/offline/mixed, a11y label) |
| assignments.test (clock-mock) | deterministic NOW | 22/22 (repairs the time-dependent flakiness) |

Every modified module covered. Adequate.

## Action 3/4 — Flakes / discipline
Documented flakes: server-roles "409 conflict" + assignments optimistic-toggle timing — did NOT fire in the C-1 green run. The a11y ancestor-walk assertion (strengthened at B-6) is a good canonical pattern (JSDOM getByText ignores aria-hidden — assert the a11y-tree path) → T-2 candidate.

```yaml
test_pattern: ci-verified
skipped: false
evidence: ["PR#38 run 28519830784 test job SUCCESS — web 251, api 395; integration 5 specs executed"]
modules_audited: [PresenceDot, MessageList/AuthorPresenceDot, presenceSocket/hasPresence, MemberListPanel, assignments.test]
new_flakes: []
findings: []
```
