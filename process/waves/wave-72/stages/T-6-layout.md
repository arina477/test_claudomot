# T-6 — Layout (Account Deletion Danger-Zone UI) — PRODUCTION RE-TEST

**Target:** `https://web-production-bce1a8.up.railway.app` (Railway prod)
**Surface:** Settings › Privacy → "Delete your account" (Danger Zone) card + confirm dialog
**Actor:** Fixture A (`studyhall-e2e-fixture@example.com`)
**Date:** 2026-07-07
**Breakpoints:** 1440×900, 1024×768

## Screenshots

| File | Breakpoint | Surface |
|------|-----------|---------|
| `screens/01-danger-zone-1440.png` | 1440 | Danger-zone card in Settings › Privacy |
| `screens/02-dialog-unchecked-disabled-1440.png` | 1440 | Confirm dialog, checkbox unchecked, destructive button disabled |
| `screens/03-dialog-checked-enabled-1440.png` | 1440 | Confirm dialog, checkbox checked, destructive button enabled |
| `screens/04-owner-block-409-1440.png` | 1440 | Owner-block 409 alert + owned-server list |
| `screens/05-danger-zone-1024.png` | 1024 | Danger-zone card |
| `screens/06-dialog-1024.png` | 1024 | Confirm dialog |

## Audit

**Danger-red accent:** PASS. Card heading + border + "Delete account" button all use danger-red `#b91c1c` (rgb(185,28,28)) — exact match to design ref. Dialog title, alert-icon, owner-block alert box, and enabled destructive button all danger-red; checkbox fills red-with-white-check when checked.

**Dark-theme contrast:** PASS. Dark background, white/light-grey body text, red accents all readable. Consequence list, checkbox label, and owner-block server names legible against the dark surface at both breakpoints.

**Dialog centered / legible / portaled:** PASS. Dialog is portaled above a dimmed backdrop, horizontally + vertically centered, not clipped. Footer buttons ("Keep my account" / "Delete my account") pinned and fully visible. Verified at 1440 and 1024.

**Checkbox + consequence list visible:** PASS. 4-item consequence list and the acknowledgment checkbox render inside the dialog at both breakpoints.

**No broken / overflowing layout:** PASS at both breakpoints for the core flow. One fixture-only observation: with Fixture A owning ~600 servers, the owner-block server list makes the dialog body tall; it scrolls internally and the footer stays pinned (no clipping / no page overflow). Real users owning a handful of servers won't see this.

## Diffs vs design ref (`design/settings-privacy.html` Panel 5)

- **D1 (cosmetic):** Section heading is "Delete your account" in prod vs "Danger Zone (Deletion)" in the design ref. Styling + placement + intent match; only the literal label differs.
- No token / color / spacing regressions observed. Danger-red token, dark surface, dialog structure, checkbox-gated destructive confirm all match the design intent.

## Findings

- **D1 (cosmetic / copy):** "Danger Zone" label absent — heading reads "Delete your account". Cross-referenced as F2 in T-5.
- **L1 (cosmetic / fixture-only):** 600-server owner-block list makes the dialog tall; internal scroll, footer pinned, no clip. No action for real users.

```yaml
test_pattern: active
surfaces_audited:
  - settings_privacy_danger_zone_card
  - delete_confirm_dialog_unchecked
  - delete_confirm_dialog_checked
  - owner_block_409_alert
breakpoints: [1440, 1024]
diffs:
  - id: D1
    severity: cosmetic
    text: "heading 'Delete your account' vs design-ref 'Danger Zone (Deletion)'"
token_violations: []
findings:
  - id: D1
    severity: cosmetic
    area: copy
    text: "no literal 'Danger Zone' label; styling + intent match"
  - id: L1
    severity: cosmetic
    area: layout-fixture-only
    text: "600-server owner-block list → tall dialog, internal scroll, footer pinned, no clip"
overall: PASS
```
