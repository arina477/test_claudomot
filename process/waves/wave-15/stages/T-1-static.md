# T-1 — Static (wave-15 M3 @mentions)

**Pattern:** A — Verified-via-CI. **Merge SHA:** fd86540 (squash of PR#27). **CI run:** 28431946584, HEAD 878f0569.

## Action 1 — CI evidence (both jobs green on merge commit)

Per C-1 `verdict_evidence`:
- **lint** — pass, 18s (biome).
- **typecheck** — pass, 28s (tsc).

Both ran on the PR HEAD `878f0569` (single SHA; squash-merged to fd86540). Neither skipped/cancelled. CI permissions least-privilege (`contents: read`).

## Action 2 — Coverage audit (static-bypass grep on wave diff)

`git diff fd86540^..fd86540 -- '*.ts' '*.tsx' | grep -nE '@ts-expect-error|@ts-ignore|: any|as any|as unknown as'`

- **19 total matches**, but **18 are in test files** (`*.spec.ts` / `*.test.tsx`): mock-injection casts (`db.select as unknown as MockFn`, `eventEmitter as any`, `socket as unknown as Socket`, `gateway as any`, `api as unknown as`) — standard test boilerplate at the mock boundary, NOT production type-system bypasses. These do not weaken prod type safety.
- **1 production-code cast:** `apps/web/src/shell/MentionAutocomplete.tsx:242` — `handleKeyDown(e as unknown as React.KeyboardEvent)`. This is the DOM `KeyboardEvent` → React synthetic-event cast inside the document-level keydown listener (the B-6 **L-1** carry). The handler only reads `.key`/`preventDefault()` which exist on both shapes; low-risk, already logged as L-1.

**Net production bypass count this wave: 1 (L-1 carry).** New surface (`mentions.ts`, `MentionAutocomplete.tsx`, `useMentionBadge.ts`, shared Zod) is otherwise fully typed — lint+typecheck cover all new `.ts`/`.tsx`.

## Action 3 — Discipline note

- **biome.json gained `a11y.useSemanticElements: off`** (B-5). AUDITED + JUSTIFIED: MentionAutocomplete implements the WAI-ARIA 1.2 combobox-with-listbox pattern, which requires `role="listbox"`/`role="option"` on `<div>`s (native `<option>` mandates a `<select>` parent that cannot keep focus on the textarea for `aria-activedescendant`). The rule is a false positive for this pattern. Call sites already carry inline `biome-ignore lint/a11y/useSemanticElements` comments (lines 299, 310) citing the WAI-ARIA spec. **Concern (LOW):** the flag was turned off GLOBALLY rather than relying on the existing inline `biome-ignore`s — this silences the rule project-wide, so a FUTURE genuine semantic-element violation (e.g., a clickable `<div>` that should be a `<button>`) would no longer be caught. Recommend reverting the global-off and keeping only the two inline ignores. Logged as finding T1-F1 (LOW, → V-2).

## Action 4 — Mask-mode self-check

- C-1 evidence cites both lint + typecheck on merge commit. ✓
- Bypass grep ran (19 matches; 18 test-mock, 1 prod L-1 carry). ✓
- Findings concrete (file:line, severity). ✓

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28431946584 (HEAD 878f0569) green, 18s"
  - "C-1 typecheck job: run 28431946584 (HEAD 878f0569) green, 28s"
findings:
  - {severity: low, location: "biome.json:23 (a11y.useSemanticElements:off)", description: "T1-F1 — combobox false-positive correctly suppressed, but globally-off silences the rule project-wide; prefer the existing inline biome-ignore comments and revert the global disable. Future genuine semantic violations would go uncaught."}
ts_bypasses_in_wave_diff: 1   # production-code (L-1 carry); 18 further matches are test-mock casts
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Lint and typecheck both ran green on the merge commit per C-1 (run 28431946584, HEAD 878f0569;
    squash to fd86540), neither skipped. The static-bypass grep on the wave diff returns 19 matches,
    of which 18 are mock-injection casts inside test files (the type system is intentionally bypassed
    at the test mock boundary — standard, not a prod risk) and exactly 1 is a production cast
    (MentionAutocomplete.tsx:242, the L-1 document-keydown shortcut already carried from B-6). The new
    mention surface is otherwise fully typed. The biome useSemanticElements:off change is a legitimate
    combobox false-positive suppression backed by inline WAI-ARIA citations, but the global-off is
    broader than needed — logged LOW (T1-F1) for V-2, not blocking.
  next_action: PROCEED_TO_T-3
```
