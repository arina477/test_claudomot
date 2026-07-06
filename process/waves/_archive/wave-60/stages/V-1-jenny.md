# V-1 jenny — wave-60 (StudyHall)

**Verdict: APPROVE**
**Method: LIVE getComputedStyle probe on the deployed web** (not bundle-only fallback).
**Drift vs gap: NO drift, NO gap.** All 3 ACs render the canonical DESIGN-SYSTEM tokens as specified.

Task: 5bcbd27f · merge 7a1af6f (#75) · deploy target `web-production-bce1a8.up.railway.app` (HTTP 200).

---

## What was verified

Signed in on the deployed web as fixture A (persisted session already authenticated as `studyhall-e2e-fixture` / fixture-a), resized to desktop (1440×900), opened the DM home and the start-DM picker, and ran `getComputedStyle` probes against all three F10 surfaces plus the `:root` token table. This is the strongest verification (the live probe Karen/jenny flagged at T/V) — done, not deferred to bundle evidence.

### Deployed `:root` tokens resolve (proves tokens survive into the live bundle)
- `--color-surface-900` → `#121214` ✓
- `--color-accent-emerald` → `#10b981` ✓

### Surface 1 — Server rail (AC1)
- `getComputedStyle(nav[aria-label="Server rail"]).backgroundColor` = **`rgb(18, 18, 20)`** = `#121214` = surface-900. ✓ (spec expected rgb(18,18,20).)
- Source: `apps/web/src/shell/ServerRail.tsx:111` → `backgroundColor: 'var(--color-surface-900)'` (was `#0a0a0b`/surface-950). Consumption via `var()`, not re-hardcoded. ✓

### Surface 2 — DM start-picker modal card (AC2)
- `getComputedStyle([data-testid="start-dm-picker"]).backgroundColor` = **`rgb(18, 18, 20)`** = `#121214` = surface-900. ✓
- Source: `apps/web/src/shell/StartDmPicker.tsx:176` → `backgroundColor: 'var(--color-surface-900)'` (was `#1c1c1f`/surface-800). Correct picker MODAL card (not the DM list rows). ✓

### Surface 3 — Disabled confirm button (AC3)
- `[data-testid="dm-picker-confirm"]` before selecting a recipient: `disabled === true`.
- `getComputedStyle(...).backgroundColor` = **`color(srgb 0.0627451 0.72549 0.505882 / 0.4)`** → 0.0627451·255=16, 0.72549·255=185, 0.505882·255=129 = **rgb(16,185,129) = #10b981 = accent-emerald, at 0.4 alpha = emerald @40%**. ✓
- Source: `StartDmPicker.tsx:432-434` → disabled branch `color-mix(in srgb, var(--color-accent-emerald) 40%, transparent)`; enabled branch `var(--color-accent-emerald)` (full opacity). The disabled fill is a translucent/dim emerald, distinct from the enabled full emerald exactly as spec requires. `var()` consumption. ✓
- Note on framing: spec/prompt says "disabled confirm/send button #27272a". The implemented AC3 targets the DM picker's disabled-primary CTA (`dm-picker-confirm`), which is the disabled-primary control the plan (P-3:14-15) names as "disabled send button → disabled-primary = accent-emerald @40%". This is the intended surface, not drift.

---

## Token match against DESIGN-SYSTEM (no drift)
- surface-900 `#121214` for rail + modal card matches DESIGN-SYSTEM.md line 16 (`--surface-900 #121214` = sidebars) and the Modal/Card primitives (lines 101/103). ✓
- disabled-primary = accent-emerald `#10b981` @40% opacity matches the Button primitive's disabled state "40% opacity" (line 97) applied to the primary emerald fill (line 33). ✓
- Text-color contrast unchanged on the two dark surfaces (text tokens untouched); disabled control is contrast-exempt per spec, and disabled label uses `rgba(255,255,255,0.30)` on the dim-emerald fill — acceptable for a disabled/non-interactive control. Dark palette + AA on live text intact. ✓

## Behavior / scope checks
- **Cosmetic only, no behavior change:** all three edits are `backgroundColor` value swaps (inline hex → `var()`); no render-path, state, data, or API change. Confirmed against source and the live DM flow (picker opens, rows render, confirm gates on selection — unchanged). ✓
- **design_gap_flag=false correct:** pure token-hygiene on 3 existing surfaces; no new page/flow/component/icon introduced. false is correct. ✓
- **Surgical deferral, NOT a conflicting half-migration:** the off-token hex (`#0a0a0b`/`#1c1c1f`/`#27272a`) still appears across ~10+ web files (AuthLayout, AppShell, FocusRoomPanel, DmConversationList, MentionAutocomplete, and the non-F10 elements *within* ServerRail/StartDmPicker themselves). Only the 3 wave-46 T-6 F10 surfaces were converted, matching the P-3 SURGICAL-SCOPE guard (P-3:6-15). The broad inline-hex→var() migration is a deliberate carry-forward wave, not silently half-done here. No conflicting state: the converted surfaces are self-consistent and the deferred ones are unchanged. ✓

---

## Findings summary
| AC | Surface | Expected token | Live computed | Result |
|----|---------|----------------|---------------|--------|
| AC1 | Server rail bg | surface-900 rgb(18,18,20) | rgb(18,18,20) | PASS |
| AC2 | Picker modal card bg | surface-900 rgb(18,18,20) | rgb(18,18,20) | PASS |
| AC3 | Disabled confirm bg | emerald@40% (16,185,129/0.4) | color(srgb …/0.4) = rgb(16,185,129)@0.4 | PASS |
| AC4 | var() consumption (not re-hardcode) | var(--color-*) all 3 | confirmed in source | PASS |
| AC5 | dark palette + AA intact | unchanged text tokens | intact | PASS |

No Critical / High / Medium / Low issues. No clarifications needed.

**APPROVE — deployed behavior matches spec-contract intent, verified by live getComputedStyle probe. No drift, no gap.**
