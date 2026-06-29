# D-2 Variants — roles-management-ui (wave-10)

**Gap:** roles-management-ui (single gap)
**Staging file:** `design/staging/roles-management-ui.html` (committed)
**Generator:** `/aidesigner` (aidesigner.ai REST, Recipe 1 + 2 refines)

## Generation approach

The brief drives a CORRECTED replacement for the existing, spec-violating Roles tab in `design/server-settings.html` (which used a forbidden permission×channel matrix). The variant composes into the existing settings shell (left nav, header, skeleton loader, `panel-refraction`, `.matrix-toggle`) and reuses the create-server modal language. The single meaningful design decision encoded: **separate the two RBAC concerns** — (a) a role's *capabilities* expressed as the 4 fixed permission FLAGS (toggle switches), and (b) a role's *channel visibility* expressed as a per-channel `can_view` list — instead of conflating them into one matrix. This is the structural choice that makes the surface spec-compliant and scannable.

Layout: role-list rail (left) → selected-role editor (right: role name/color + 4 flag toggles + channel-visibility list + Save/Discard footer) → member→role single-select assignment section below.

## States covered

A staging state-switcher (Loaded / Loading / Empty / Saving / Error) toggles the main content so reviewers see every state:
- **loaded** — populated roles + editor (default).
- **loading** — skeleton rows (surface-700 shimmer).
- **empty** — "No custom roles yet — only the default Member role" + Create-role primary CTA.
- **saving** — footer Save shows spinner + aria-busy, controls dimmed.
- **error** — danger block "Couldn't load roles" + Retry.
- **Toast** — success (`role="status"`) + error (`role="alert"`, set assertively in JS) for save-rejected / last-owner-protection.

## Spec-compliance verification (static)

- Permission flags = EXACTLY 4 fixed toggles: Manage Server / Roles / Channels / Members. No matrix, no custom-builder, no per-channel permission rows. ✓
- Per-channel visibility = separate `can_view` toggle list; private channels marked default-deny. ✓
- Member→role = single-role `<select>` per member (3 selects), not multi-assign. ✓
- Owner shown read-only superuser (ph-crown / ph-lock-key); last-owner amber safeguard + danger-on-attempt. ✓
- Gated controls + "permissions always enforced on the server" note + "Requires Manage Roles" disabled-tooltip example. ✓
- Token-clean: only 9 system hex values (`#0a0a0b #121214 #1c1c1f #27272a #3f3f46 #52525b #10b981 #f59e0b #ef4444`); off-palette `#3b82f6` / `#8b5cf6` / `#ffffff` removed in refine 1. ✓
- 25 focus-ring usages; keyboard-operable; modal focus-trap + Esc. ✓
- Phosphor icons (real component names). ✓

## /aidesigner warnings

None (HTTP 200 on all three calls). Browser render-verification deferred to D-3 reviewers + accessibility-tester (local Chromium not installed in this env).
