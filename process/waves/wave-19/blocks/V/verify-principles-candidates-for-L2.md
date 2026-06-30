## L-2 promotion candidates (NOT yet rules — pending 2-wave confirmation + karen vet)

Contract-formatted observations from this V-block. Promote into `## Rules` only at L-2 Distill when a second wave confirms.

- Fast-fix a documented but unenforced acceptance criterion rather than defer on "UI-unreachable."
  Why: An unenforced AC behind a done flag is a partial ship; UI-unreachability breaks on the next client.
- Re-verify a routed fix against original source and git, never against the fixer agent's self-report.
  Why: A finding is closed only when the failing condition provably no longer reproduces in the tree.
- When an edge-case guard exists in one sibling method, require the same guard in peer methods on the same row.
  Why: A 409-on-deleted in edit but not in react is silent drift the reviewer must flag as a finding.
- For any untrusted-upload + authz boundary, prove the persisted value is server-derived by feeding a spoofed client value and asserting the stored row differs.
  Why: A test that only sends valid input cannot distinguish a real server-side re-derive from a client-trusted passthrough.
- Treat an unenforced security key-scope as a defect even when the offending key is unreachable from the current UI.
  Why: An anchored cross-channel/traversal regex must hold at the API, not rely on the client never sending the key.
- A prod-only state claim not queryable from the brain DSN is APPROVABLE only when an upstream stage direct-queried it; cite that stage as chain-of-custody.
  Why: An indirect file-plus-live-401 inference is weaker than a same-wave direct table/FK/index query already on record.
- An empty fast-fix queue is a valid block-exit only after each cited reviewer clean-verdict is independently spot-checked at source.
  Why: A rubber-stamped no-findings on an auth-boundary change converts the gate into theater.
