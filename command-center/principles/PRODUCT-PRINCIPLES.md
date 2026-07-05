# Product Principles — <Your Project>

Cross-wave product / scope / problem-framing rules promoted from L-2 distill. Append-only; numbered sequentially. Read at every P-block stage and on every Tier 3 product decision.

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

Promoted at L-2 Distill from `process/waves/wave-<N>/blocks/L/observations.md` by `karen` (rule-quality vetter) when an observation appears across 2+ waves AND head-product approves. Maximum 1 rule promoted per wave per file (cap is per-file, not per-wave — multiple principles files may each receive one). See `claudomat-brain/blocks/learn/stages/L-2-distill.md`.

---

## Rules

1. Verify every seed claim about what exists or is absent in the code at P-0; decomposer prose drifts both ways.
   Why: A false-absent premise rebuilds existing work; a false-present one skips a needed addition.

2. Verify at P-0 that the seed's named entity is the real cost source or output boundary, not merely that it exists.
   Why: An existing but wrong-target entity sends the wave to fix nothing.

3. Build an external-SDK feature's credential-independent ACs now with a placeholder key; defer live verify to T-5/C-2.
   Why: Waiting on a founder-supplied credential stalls work that is verifiable without it.

4. Gate a 'state unreachable here' claim by also checking whether it can arrive pre-set from a prior surface transition.
   Why: A flag unreachable on surface A can still arrive set from surface B, stranding UI.
