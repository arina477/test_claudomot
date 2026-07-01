# Wave 25 — T-2 Unit (Pattern A: CI-verified)

## Action 1 — CI evidence
C-1 run **28512345221** `test` job SUCCESS on a730caf. Unit tiers: **api 395 passed**, **web 234 passed** (216 baseline + 5 MessageList mention tests + 13 mention-slug-parity cases). Integration tier (15 tests) also ran in the same job — audited at T-4.

## Action 2 — Coverage audit (modules the wave touched)
| Module | New behavior | Unit coverage |
|---|---|---|
| packages/shared/src/mentions.ts | `extractMentionSlug`, `MENTION_TOKEN_SLUG_SRC/RE` (derived) | mention-slug-parity.test.ts (13 cases: @bob.dev→bob, @alice!→alice, @carol-X, @a_b-c, @, @., empty, no-sigil, @pre.fix class-boundary) — asserts shared==local identity |
| apps/api/src/messaging/mentions.ts | server RegExp from shared SRC (behavior-preserving) | mentions.spec.ts 24/24 (regression guard — pattern unchanged) |
| apps/api/src/messaging/messages.service.ts | editMessage txn wrap | mentions.spec.ts editMessage describe (txn mock) unit-side; real atomicity at T-4 integration |
| apps/web/src/shell/MessageList.tsx | renderBodyWithMentions tokenizer | messaging.test.tsx +5 (AC2 pill+trailing, AC3 no-false-pill, two-pills, unresolved superset) |
| apps/web/src/shell/mentionSlug.ts | web-local mirror | mention-slug-parity.test.ts (parity vs shared) |

Every modified module has new-or-updated unit coverage. Adequate.

## Action 3 — Flake observation
C-1 `flake_rerun_succeeded`: n/a (no flake fired in the green run). B-5 documented flake `server-roles.test.tsx "shows 409 conflict error on save rejection"` (unrelated RBAC, passes on re-run) — did NOT fire in the C-1 green run. Carried as a coverage-quality signal for L-2 (not blocking).

## Action 4 — Discipline note
- **Cross-package parity via contract test** (mention-slug-parity.test.ts imports BOTH shared + web-local impls, asserts identity) is a strong canonical pattern for the CJS-avoidance mirror case — makes drift a red test. → T-2.md candidate.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28512345221 (a730caf) SUCCESS — api 395, web 234 unit"
modules_audited: [packages/shared/mentions, api/messaging/mentions, api/messaging/messages.service, web/MessageList, web/mentionSlug]
new_flakes: []
findings: []
```

## Exit
Unit CI evidence confirmed, coverage adequate across all modified modules. → T-3/T-4 band.
