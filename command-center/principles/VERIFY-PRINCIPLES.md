# Verify Principles — <Your Project>

Cross-wave verification / Karen / jenny / triage / fast-fix rules promoted from L-2 distill. Append-only; numbered sequentially. Read at every V-block stage.

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

Promoted at L-2 Distill from `process/waves/wave-<N>/blocks/L/observations.md` by `karen` (rule-quality vetter) when an observation appears across 2+ waves AND head-verifier approves. Maximum 1 rule promoted per wave per file (cap is per-file, not per-wave — multiple principles files may each receive one). See `claudomat-brain/blocks/learn/stages/L-2-distill.md`.

---

## Rules

1. Verify seeding ACs by inspecting create-path source, not runtime behavior; a safe fallback hides a missing seed.
   Why: A default-deny or nullable fallback passes runtime probes while the required seed is absent.

2. When deployed behavior diverges from a spec AC and is more correct, amend the spec to match, not the code.
   Why: Reverting correct shipped behavior to a weaker spec ships the worse option; the spec was the defect.

3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: A source-clean fix can still fail live; deployed re-run on real state is the only proof.

---
