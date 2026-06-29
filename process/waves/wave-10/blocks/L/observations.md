# Wave 10 — L observations (candidate learnings; L-2 distill vets via karen)

Append-only scratch. Not promoted. L-2 distill decides if any of these crosses the
2+-wave bar AND head-verifier-approved bar, then karen formats per each principles
file's Contract (≤1 promotion per file per wave).

## V-block candidates (from head-verifier, V-3 adjudication of split V-1)

- **Safe-by-default does not equal AC-met.** Findings #1/#2 were dispositioned as
  literal unmet spec ACs even though the system was safe-by-default (owner superuser
  + null-role default-deny). Candidate rule shape: a safe-by-default fallback never
  satisfies an explicit acceptance criterion; the AC must be demonstrably met.
  Why-shape: safe-by-default behind a "done" flag is acceptance-by-assertion and ships
  partial features. (Carries the spec-drift / acceptance-by-assertion anti-patterns.)

- **Split reviewer verdicts adjudicate on the standard, defer on the bound.** When
  Karen (claim/AC standard) and jenny (impact bound) split on severity but agree on
  facts, the cheap explicit-AC gaps fast-fix now; the genuinely forward-scoped
  primitives defer. Candidate rule shape: an explicit unmet AC that is cheap to close
  is fast-fixed, not deferred; only forward-scoped primitives defer.

- **Create-path and backfill-path must seed identical defaults.** Backfill seeded a
  default role for existing servers but the create txn did not, so the two paths
  diverged for new vs existing servers. Candidate rule shape: any seed applied by a
  backfill must also be applied in the create transaction, column-for-column.
  Why-shape: a backfill-only seed leaves the forward create path producing a different
  (incomplete) initial state.

## Cross-cutting / recurring (NOT V-block-new — already escalation-critical)

- **verified-prod-session fixture `4a2ad286` is now 4 waves `todo`.** Live authenticated
  403 non-permitted RBAC core is not exercised against prod; only the 401 boundary is.
  This is a recurring verification blind spot on a security-critical surface. N/L should
  prioritize the fixture so future auth/RBAC waves live-verify the 403 core. (This is a
  recurring-debt escalation, already flagged at C-2 and both V-1 reviews — not a new
  rule; a prioritization carry.)
