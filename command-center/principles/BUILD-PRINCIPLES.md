# Build Principles — <Your Project>

Cross-wave build / implementation / code-conventions rules promoted from L-2 distill. Append-only; numbered sequentially. Read at every B-block stage.

---

## Contract for new rules

Format (deterministic; karen + L-2 linter reject anything that doesn't match):

```
N. <one-line declarative rule, ≤120 chars, ending in a period>
   Why: <one-line causal explanation, ≤100 chars, ending in a period>
```

Hard limits: rule line ≤ 120 chars; why line ≤ 100 chars; entry = exactly 2 non-empty lines.

Forbidden tokens (rule or why line, case-insensitive): `we`, `our`, `the team`, `during wave-`, `wave-<N>`, `because ... because`, em-dash (`—`), any parenthetical longer than ~5 words.

### GOOD

```
4. Never mock the database in integration tests.
   Why: A passing mock that doesn't match prod schema masks broken migrations.
```

### REJECTED — multi-clause prose

```
4. We've found that mocking the database, while convenient, can sometimes lead
to issues during integration testing because the mock might not accurately
reflect the production schema, especially after migrations...
```

Reasons: prose voice (`We've found`), runs > 1 line, hedging (`can sometimes`), war-story preamble.

### REJECTED — wave reference

```
4. After wave-7's auth bug, always validate session tokens at the edge.
```

Reason: cites a wave; rules outlive the wave they were learned from.

### REJECTED — non-falsifiable

```
4. Write good error messages.
```

Reason: not falsifiable; can't be checked by any subsequent reviewer.

### Authoring discipline

- Before adding: grep for the concept; do not add a near-dup.
- Number sequentially; renumber on insert.
- Group under an existing H2 unless ≥3 new rules share a theme.
- Wave-specific ("broke once") stays in `process/waves/wave-<N>/blocks/L/observations.md` until a second wave confirms.

---

## Promotion path

Promoted at L-2 Distill from `process/waves/wave-<N>/blocks/L/observations.md` by `karen` (rule-quality vetter) when an observation appears across 2+ waves AND head-builder approves. Maximum 1 rule promoted per wave per file (cap is per-file, not per-wave — multiple principles files may each receive one). See `claudomat-brain/blocks/learn/stages/L-2-distill.md`.

---

## Rules

1. Boot the production-built artifact in a prod-like container and exercise its runtime config before merge.
   Why: Config and build-arg defects pass local and CI green but surface only on first prod boot.

2. Push the branch to origin after every B-block and D-block stage before starting the next stage.
   Why: A worker restart resets the local tree; unpushed commits are permanently lost.

3. Any seed applied by a backfill must also appear in the create transaction, column-for-column.
   Why: A backfill-only seed leaves the forward create path producing a different initial state.

4. Reproduce one negative path per authz or injection boundary at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient.
   Why: An absent guard or dead fault-injection passes code-read; only adversarial reproduction proves it.

5. Guard every reconnect-triggered async loop with an in-flight coalescing flag or promise-mutex at authoring time.
   Why: Socket-connect and window-online can fire together; an unguarded loop runs twice, doubling requests.

6. B-block specialists run the formatter on all touched files before reporting done, not only typecheck.
   Why: Format drift then surfaces only at the wiring stage or in CI, costing an extra fix cycle.

7. Run the lint/import-organizer check command, not the formatter alone, before reporting a build task done.
   Why: A formatter can pass while the CI check gate rejects import ordering it never touches.

8. Gate commits with a pre-commit hook running the format/import-sort check on staged files so violations cannot be committed.
   Why: A rule prescribing what to run is advisory and gets skipped; a hook enforces it at every commit.

9. Author an integration spec exercising every new service or DB boundary in the B-block, before the C-1 merge.
   Why: A deferred spec leaves the CI integration job green on new code it never exercises.

10. B-5 verify runs the exact CI commands, full lint and full test suite, not a subset, before B-6 review.
   Why: A subset missing the CI-identical lint or tests lets failures reach C-1 as post-merge fixes.

11. In a Dexie .version(N+1).stores() call, re-state every prior table verbatim; an omitted table is dropped on upgrade.
   Why: Dexie treats a table absent from a later version as a drop, irreversibly deleting its data.
