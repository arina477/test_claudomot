# Wave 23 — T-6 Layout

**Pattern:** B (active). wave_type includes `ui` → fires. UI delta is minimal + reuses existing components.

## Applicability
- **Actions 1-3 (screenshot diff vs canonicalized design):** N/A — design_gap_flag=false, no D-block ran, so there is NO `design/<feature>.html` canonicalized surface to diff against. The wave introduced no new page/primitive.
- **Action 4 (token compliance):** RAN via static diff audit (definitive for this wave — see below).

## Token compliance audit (Action 4) — PASS
The wave's UI delta:
1. `ServerRolesPage.tsx` PERM_FLAGS 5th entry — `{key, label, description}` strings ONLY; renders through the EXISTING checkbox-row template (inherits all styling from the 4 sibling entries). Zero new styles.
2. `AssignmentsPanel.tsx` CTA gate — a boolean visibility condition change (owner→owner||manage_assignments); no new element, no style change.

**Diff audit (`git diff main~1..main -- apps/web/**/*.tsx`):** ZERO new inline hex / rgb / `style={{}}` / className introduced. No invented tokens, no off-token spacing, no fabricated shadows. The wave consumes only existing DESIGN-SYSTEM tokens by construction (nothing new to consume). Layout-regression risk is structurally near-zero — a 5th identical checkbox row + a show/hide boolean.

## Live visual-diff
BLOCKED by the Playwright chrome-absent infra (task 67881a58 — same blocker as T-5, F23-T-5). Not re-logged as a new finding (single shared infra finding). Low risk here: no new visual surface + conclusive static token audit.

## Findings
None wave-specific. (Shared infra F23-T-5 covers the visual-harness gap.)

```yaml
test_pattern: active
skipped: false
surfaces_audited: ["ServerRolesPage role permission list (existing component +1 row)", "AssignmentsPanel CTA (show/hide)"]
breakpoints: []   # live screenshot BLOCKED by chrome-absent; static diff audit used instead
diffs: []         # no canonicalized design to diff (design_gap_flag=false)
token_violations: []
fix_up_cycles: 0
findings: []      # token audit PASS by diff; visual harness gap = shared F23-T-5
```

## Exit
Token compliance PASS (zero new styles/tokens by diff); no canonicalized surface to diff; live visual-harness gap = shared infra (F23-T-5). → T-7.
