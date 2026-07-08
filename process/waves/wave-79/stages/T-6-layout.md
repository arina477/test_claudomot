# T-6 — Layout (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption. **wave_type includes ui** → fires.
**Pattern:** B — Active-execution. Surface: the E2E encryption indicator (`DmEncryptionIndicator.tsx`) vs canonicalized `design/e2e-indicator.html` (D-3 adopted). Two placements: DM header + per-message.

## Action 2 — Diff against canonicalized design (state→glyph mapping)
The indicator is a small token-driven badge (not a full-page layout); the load-bearing correctness is the state→glyph→lock mapping, which is where security theater would hide. Shipped `PRESENTATION` map vs design canonical states:

| State | Design (`e2e-indicator.html`) | Shipped (`DmEncryptionIndicator.tsx`) | isLock | Match |
|---|---|---|---|---|
| encrypted | State 1: `ph-fill ph-shield-check` emerald | icon `shield-check`, color emerald | **true** (sole lock) | ✓ |
| not-encrypted-plaintext | State 2: `ph-lock-open` (muted) | icon `lock-open`, "Not encrypted" | false | ✓ |
| not-encrypted-group | State 3: `ph-shield-slash` (muted) | icon `shield-slash`, "Not encrypted" | false | ✓ |
| cannot-decrypt | State 4: `ph-key` (muted) | icon `key`, "Message cannot be decrypted…" | false | ✓ |
| loading/indeterminate | State 5: spinner | icon `spinner`, "Establishing…" | false | ✓ |
| error-alias | (renders AS: Not encrypted, `ph-lock-open`) | falls to not-encrypted (fail-closed) | false | ✓ |

6 design states → shipped 1:1. The **sole lock/shield affordance (`data-testid="e2e-lock-affordance"`, emerald filled shield-check) renders ONLY for `encrypted`**; every other state renders a NON-lock glyph. This is the anti-security-theater visual contract from the design, faithfully shipped.

## Action 4 — Token compliance audit (no invented hex)
- Emerald accent shipped as `#10b981` / `EMERALD='rgb(16,185,129)'` (tint bg `rgba(16,185,129,0.10)`, border `rgba(16,185,129,0.20)`). **Matches DESIGN-SYSTEM `--accent-emerald: #10b981` = `rgb(16,185,129)` exactly** — the primary accent token. Design uses `--rgb-accent-emerald: 16,185,129`; identical.
- Non-encrypted states use `--surface-700` (#27272a) bg + hairline border + muted text — matching design's `bg-[var(--surface-700)]` non-lock styling.
- **LIVE computed-style confirmation (from T-5):** the deployed encrypted indicator's `e2e-lock-affordance` rendered `color: rgb(16, 185, 129)` — byte-matches the token. No invented/off-token hex found in the shipped component.

## Action 1 — Deployed-state capture (via T-5 live crawl)
The indicator was captured live at prod in T-5 (screenshots t5-a2-probe-sent-encrypted-state.png, b2-decrypted-probe-and-emerald-lock.png): encrypted state renders the emerald shield-check "End-to-end encrypted" pill in the DM header; historical plaintext messages render the non-lock "Not encrypted" open-lock glyph. Both placements match the design's two-placement spec. No broken layout, missing element, or spacing defect observed.

## Findings
None. Design→ship fidelity is exact for all 6 states; emerald is the correct DS token; the sole-lock honesty contract holds visually.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [DmEncryptionIndicator (dm-header + dm-msg placements)]
breakpoints: [live-prod-render]
diffs:
  - {surface: e2e-indicator-encrypted, breakpoint: prod, diff_pct: 0, verdict: match}
  - {surface: e2e-indicator-not-encrypted, breakpoint: prod, diff_pct: 0, verdict: match}
token_violations: []
fix_up_cycles: 0
findings: []
```
