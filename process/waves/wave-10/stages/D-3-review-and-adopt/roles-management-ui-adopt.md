# D-3 Adopt — roles-management-ui (wave-10)

## Canonical path
`design/server-roles.html`  (git mv from `design/staging/roles-management-ui.html`)

This is the authoritative, spec-compliant roles-management surface for B-3. It **supersedes** the spec-violating permission-matrix Roles tab in `design/server-settings.html` (a supersession header was added to that file pointing B-3 here). The server-settings shell (left nav, header, skeleton, Overview/Members/Channels/Invites) in `server-settings.html` remains valid prior art; only its Roles tab is superseded.

## Reviewer verdicts (Phase 1, cycle 2 — final)
- **Reviewer A (design critique):** REVISE → sole blocker (modal Tab focus-trap) resolved directly + independently re-verified PASS.
- **Reviewer B (req/UX/token):** APPROVE (3 non-blocking carry-forwards → B-3).
- **Accessibility (mandatory):** FAIL → **PASS** after focus-trap + banner-contrast hardening (fresh re-audit, zero blocking violations).

## Gate verdict (Phase 2)
- **head-designer (fresh spawn, agentId a4f6652814a19bbd6): APPROVED.** No design-system fragmentation; zero off-system tokens; NO new tokens blessed. All spec constraints (anti-matrix / fixed-4-flag / single-role-select / owner-superuser + reactive last-owner-protection) hold; AA contrast + focus/keyboard pass; composes consistently with the existing shell + create-server modal chrome.
- `verdict_complete: true`, `rework_attempt_cap_remaining: 3`.

## Journey-map (Action 7)
**Skip.** Route `/servers/:id/settings` (page 13 "Server settings (roles / members / channels)", flow F8) already exists in `command-center/artifacts/user-journey-map.md`. The roles surface is the Roles tab WITHIN that existing route — no new route/screen introduced.

## DESIGN-SYSTEM token additions (Action 8)
**None.** Token-clean against the existing palette (only the 9 system hex values). Gate verdict blessed no new token.

## B-3 carry-forwards (non-blocking, must-fix at implementation)
1. Make the OFF visibility-toggle track visibly distinct (avoid `bg-transparent`-only track); keep Visible/Hidden text.
2. Add an explicit "Private" text marker on default-deny channels (in addition to the icon).
3. Add `prefers-reduced-motion` handling (DESIGN-SYSTEM §6); normalize `text-[13px]` off-scale usages to the DS type scale.
4. Preserve the modal Tab focus-trap pattern (now in the canonical file) when porting to React.
5. ALL gating is UI-only convenience — the SERVER enforces every permission via RbacService.can() regardless (spec carry-forward / binding condition #1).

---

```yaml
adoption_complete: true
canonical_path: design/server-roles.html
design_system_tokens_added: []
journey_map_updated: false
```
