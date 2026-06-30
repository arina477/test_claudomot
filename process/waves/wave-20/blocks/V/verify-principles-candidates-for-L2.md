## L-2 promotion candidates (NOT yet rules — pending 2-wave confirmation + karen vet)

Contract-formatted observations from this V-block. Promote into `## Rules` only at L-2 Distill when a second wave confirms.

- Fast-fix a documented but unenforced acceptance criterion rather than defer on "UI-unreachable."
  Why: An unenforced AC behind a done flag is a partial ship; UI-unreachability breaks on the next client.
- Re-verify a routed fix against original source and git, never against the fixer agent's self-report.
  Why: A finding is closed only when the failing condition provably no longer reproduces in the tree.
- When an edge-case guard exists in one sibling method, require the same guard in peer methods on the same row.
  Why: A 409-on-deleted in edit but not in react is silent drift the reviewer must flag as a finding.
- Prove a client cursor or codec by round-tripping it through the server decode path, not the client inverse.
  Why: A client encoder that only round-trips against itself passes while the server rejects it with a 400.
