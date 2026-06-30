# D-3 — Adopt (message-lifecycle)

**Wave:** 13 · **Gap:** message-row edit / delete-tombstone / reaction-pill primitives

## Canonical path

`design/server-channel-view.html` (the wave-13 delta overwrites the wave-12 canonical in place — same surface, extended message-row).

## Reviewer verdicts

| Reviewer | Iteration 1 | Iteration 2 (post contrast-fix) |
|---|---|---|
| A — plan-design-review (ui-designer) | APPROVE | (n/a — fixes only strengthened) |
| B — ui-ux-pro-max (accessibility-tester) | REVISE (1 critical contrast) | **APPROVE** |
| Matrix | APPROVE \| REVISE → refine | **APPROVE \| APPROVE → gate** |

## Phase 2 gate

head-designer (fresh spawn) → **APPROVED**. Blocking tombstone contrast confirmed resolved in the file before adoption. Zero DESIGN-SYSTEM.md tokens blessed (helpers compose existing `--shadow-pop` + `--accent-emerald` + study/accent surfaces; render the §8 MessageRow / ReactionPill / EditedTag sub-elements already named in the system).

## Build notes for B-3 (frontend implementer)

- **Add-reaction popover** must ship `absolute`-positioned with a rightward clip guard at narrow breakpoints; the static mockup renders it in-flow purely for reviewer evaluation.
- Row-actions reveal via `.msg-row:focus-within` (keyboard) + `:hover` — preserve both; never make actions hover-only.
- Inline-edit: Enter saves, Shift+Enter newline, Esc cancels; `aria-pressed` on reaction pills reflects `reactedByMe`; emoji popover closes on Esc + outside-click.
- Tombstone: NO content, NO reactions, NO row-actions; text-conveyed ("This message was deleted") not color alone.
- Edit shown only on own messages; delete on own OR (moderator) others' — affordance gated by permission, but authz is enforced SERVER-SIDE (design only shows the affordance).

```yaml
adoption_complete: true
canonical_path: design/server-channel-view.html
design_system_tokens_added: []
journey_map_updated: false   # in-place delta, no new route/screen
```
