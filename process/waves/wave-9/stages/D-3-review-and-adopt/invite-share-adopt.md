# D-3 Adopt — invite-share (wave-9 delta)

**Canonical path:** `design/invite-share.html` (overwrote the wave-8 version; the modal route/screen is unchanged — only the modal contents gained the permanent-default labeling + revoke list).

## Reviewer verdicts (Phase 1, fresh context)

- **Reviewer A (/plan-design-review subst: ui-designer):** APPROVE — all 6 dimensions 9–10; permanent-default (8b) and revoke flow both clean; strict token discipline.
- **Reviewer B (/ui-ux-pro-max subst: accessibility-tester):** APPROVE (after iteration 1) — 10/10 success criteria; all text pairs meet WCAG AA dark-theme contrast (revoked label fix confirmed); zero invented tokens; full keyboard + screen-reader coverage.

## Reviewer substitution note

`/ui-ux-pro-max` is not installed in this project. Per `design/review-gate.md` § Reviewer substitution, the dual-reviewer contract was honored with the closest catalog agents: Reviewer A = `ui-designer` (per-dimension design critique), Reviewer B = `accessibility-tester` (requirement + token + WCAG AA dark-theme audit — the highest-value substitution for this delta given the contrast-failure risk). Both ran fresh, with no shared context, and reached APPROVE/APPROVE.

## Phase 2 gate verdict

Fresh head-designer spawn (agentId ab16cebfcde8c1d5b): **APPROVED**. Independently verified the contrast fix is real in the HTML (revoked label `t-primary`, not `text-danger`), no new token, chrome-consistency, both deltas satisfied, all 8 in-scope states present, non-goals excluded. See `process/waves/wave-9/blocks/D/gate-verdict.md`.

## What B-3 consumes

- Default state shows the PERMANENT `servers.invite_code` link (labeled "Permanent") + Copy → Copied morph + emerald Toast.
- "Generate a limited invite" is a secondary, owner/creator-only action (minimal this wave is acceptable per brief §10).
- Limited-invites list (owner/creator): per-row `ph-trash` revoke → inline `role="alert"` two-step confirm ("It will stop working immediately. People who already joined stay.") → honest revoked row (`ph-prohibit` + strikethrough + dimming + white "Revoked — this link no longer works." label) + Toast.
- States: default-permanent / copied / loading / error / limited-list-populated / limited-list-empty / revoke-confirm / revoked.
- Out of scope (do NOT build): RBAC/role UI, rotate-permanent-code button, full max-uses/expiry picker form, kick/ban.

---

```yaml
adoption_complete: true
canonical_path: design/invite-share.html
design_system_tokens_added: []
journey_map_updated: false
```
