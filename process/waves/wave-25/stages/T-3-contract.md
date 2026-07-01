# Wave 25 — T-3 Contract (Pattern A: CI-verified)

## Action 1 — Pattern decision
B-1 authored a project-internal shared-type/constant contract: `MENTION_TOKEN_SLUG_SRC`, `MENTION_TOKEN_SLUG_RE`, `extractMentionSlug` in packages/shared, consumed by BOTH the server (apps/api imports directly) and the client (apps/web via the `mentionSlug.ts` mirror, CJS-avoidance). No external SDK. → **Pattern A** (CI-verified). Not skipped (B-1 was not skipped).

## Action 2 — CI evidence + coverage
- Contract test: **`apps/web/src/shell/mention-slug-parity.test.ts`** (13 cases) ran green in C-1 run 28512345221 `test` job (part of web 234).
- It imports BOTH the shared `extractMentionSlug`/`MENTION_TOKEN_SLUG_SRC` AND the web-local mirror, asserting per-input identity — this is the load-bearing contract that the two implementations agree. Drift (shared vs mirror) → RED test.
- Server side: the server RegExp derives from the same `MENTION_TOKEN_SLUG_SRC`; `mentions.spec.ts` (24/24) is the behavior-preserving regression guard for the server parser.

## Action 4 — Coverage audit
| Contract surface (B-1) | Test | Negative cases |
|---|---|---|
| `extractMentionSlug` (shared) | mention-slug-parity.test.ts | `@`, `@.`, empty → null covered |
| `MENTION_TOKEN_SLUG_SRC` (shared, drives regexes) | parity test asserts `localSrc === sharedSrc` + `@pre.fix`→`pre` class-boundary row (catches SRC-widening drift) | class-boundary covered |
| web-local mirror parity | parity test (both impls, identity) | full table |
| server parser derives from SRC | mentions.spec.ts 24/24 (unchanged behavior) | existing negative cases |

Every B-1 contract surface traced to a passing test, including the class-boundary negative case. No wire/API-endpoint contract changed (editMessage request/response shape unchanged) — nothing else to trace.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [extractMentionSlug, MENTION_TOKEN_SLUG_SRC, MENTION_TOKEN_SLUG_RE, web-local-mirror-parity]
ci_evidence:
  - "C-1 run 28512345221 test job SUCCESS — mention-slug-parity.test.ts (13 cases) green; mentions.spec.ts 24/24"
active_probe_results: []
infrastructure_gap_recorded: false
findings: []
```

## Exit
Shared slug grammar contract fully traced to the parity contract test (drift = red). → T-5 (after T-4).
