# D-block Gate Verdict — wave-8 (M2 invites/join)

**Gate:** D-3 Review & adopt · **Reviewer:** head-designer (fresh) · **Date:** 2026-06-29

## Verdict: APPROVED

Both design gaps resolved and canonicalized. Delta wave: one surface refined in place, one composed from locked primitives. No design-system token additions.

## Surfaces

| Surface | Disposition | Adopted file | A11y | States |
|---|---|---|---|---|
| Invite-join page | REFINE (delta) | `design/invite-join.html` | PASS (0 blockers) | loading / valid / unauthed / unverified / already-member / joining / joined / invalid-or-expired (8) |
| Invite-create/share modal | COMPOSE-ONLY | `design/invite-share.html` | FAIL→FIXED→clear (1 blocker resolved) | default / copied / loading / error (4) |

## Stage-exit checklist (both surfaces)
- [x] Exactly one variant adopted per surface, with written rationale tied to the brief's job (see `*-adopt.md`).
- [x] accessibility-tester audit run; every blocking finding resolved before adoption (share-modal error-input contrast fix).
- [x] No new token introduced — off-system hex scan returns only the 9 DESIGN-SYSTEM tokens; no Inter; no bouncy/back easing; `prefers-reduced-motion` honored.
- [x] Adopted variants reachable + consistent with adjacent chrome (server rail/sidebar, create-server modal pattern, joined→server redirect).
- [x] Verdict issued by a fresh head-designer reviewer reading the accessibility-tester output, not self-authored by the orchestrator/builder.

## Security-relevant design call (load-bearing)
The invite-join preview is constrained to **server name + member count only** — the prior concept's channel list / presence avatars / online count / description were removed to match the public minimum-summary endpoint AC. The design now cannot surface data the public `GET /invites/:code` must not return. T-8 should still probe the endpoint itself; the design no longer invites a leak.

## Note on reviewer protocol (delta)
Per the orchestrator's DELTA directive for this efficiency wave, the D-3 dual-reviewer matrix (`/plan-design-review` + `/ui-ux-pro-max`) was collapsed to: head-designer self-review of token/hierarchy/state-coverage + a mandatory independent accessibility-tester audit (the contrast/focus/keyboard/ARIA gate). The accessibility audit — the highest-risk dark-theme dimension — was run by a fresh specialist and its blocker resolved before adoption. Substitution recorded here for auditability.

```yaml
head_signoff:
  verdict: APPROVED
  stage: D-3
  reviewers:
    accessibility-tester: { invite-join: PASS, invite-share: PASS-after-fix }
  failed_checks: []
  rationale: >
    Both gaps resolved without fragmenting the system. Invite-join refined to enforce the
    security minimum-summary preview and add the two missing in-scope states (already-member,
    unverified); invite-share composed verbatim from the create-server modal + Toast/Button/Input
    primitives. Zero new tokens. The one accessibility blocker (share-modal error-input contrast)
    was fixed and re-verified before adoption. Both adopted files are token-clean, WCAG-AA on dark,
    keyboard-reachable, and coherent with existing chrome.
  next_action: PROCEED_TO_B

design_block_status:    complete
gaps_resolved:          [invite-join-page, invite-create-share-modal]
gaps_deferred:          []
design_system_updates:  []
canonicalized_at:       2026-06-29T18:06:00Z
```

## Handoff to B-3 (frontend)
- `design/invite-join.html` — implement `/invite/:code` page; 8 states; preview consumes ONLY `{server:{id,name,memberCount}}`; join → POST → redirect into server; unauthed→login-then-resume, unverified→verify gate.
- `design/invite-share.html` — implement "Invite people" modal; full `/invite/:code` URL read-only + copy→Toast; runtime MUST implement the documented focus-trap + Esc + focus-restore (static mockup documents intent only); no role/permission UI.
