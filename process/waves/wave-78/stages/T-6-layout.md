# T-6 — Layout (wave-78)

**Pattern:** B — Active-execution. Live computed-style probe of the MemberProfileCard states against `design/member-profile-card.html` (D-3 adopted wave-77) + `design/DESIGN-SYSTEM.md` tokens. Probed on the open playwright-1 context, fixture A, prod (855e811).

## Surfaces audited
- MemberProfileCard: LOADED, HIDDEN (unchanged from wave-77), and the wave-78 NEW **ERROR (retryable)** state.
- Editor empty-option (`/settings/profile` academic-role select) — rendered + functional (T-5 S1).

## Design-file reconciliation
`design/member-profile-card.html` (adopted wave-77) canonicalizes 4 states: LOADED, PARTIAL, LOADING, HIDDEN. It contains **no 5th "error/retry" state** — expected: the retryable error state is a wave-78 addition specified as a copy/affordance variant that **reuses the hidden container + DS tokens, adding no new design surface** (P-2 spec; B-3/B-6). So there is no `design/*.html` region to pixel-diff the 5th state against; T-6 verifies it against DESIGN-SYSTEM tokens directly (Action 4 token audit), and confirms the HIDDEN + LOADED states still match the adopted design.

## Action 4 — Token compliance (live computed styles)
`DESIGN-SYSTEM.md`: `--accent-amber = #f59e0b` = "warnings / reconnecting state"; the "message failed — will retry" pattern uses amber; secondary button = surface-700 fill + hairline border, radius-md.

ERROR-state computed styles (live, member row da74148e):
| Element | Property | Live value | DS token | Verdict |
|---|---|---|---|---|
| Amber warning-icon wrapper | backgroundColor | `rgba(245,158,11,0.12)` | `--accent-amber` @12% | ✓ DS amber |
| | borderColor (1px) | `rgba(245,158,11,0.25)` | `--accent-amber` @25% | ✓ DS amber |
| | color / SVG stroke | `rgb(245,158,11)` = `#f59e0b` | `--accent-amber` | ✓ DS amber |
| | borderRadius | `9999px` | radius-full | ✓ |
| "Try again" button | backgroundColor | `rgb(39,39,42)` = `#27272a` | `--surface-700` | ✓ DS |
| | borderColor (1px) | `rgba(255,255,255,0.10)` | hairline | ✓ DS |
| | color | `rgba(255,255,255,0.92)` | text-primary | ✓ DS |
| | borderRadius | `6px` | radius-md | ✓ DS |
| | height | `32px` | sm | ✓ DS |

**No invented hex, no off-token spacing, no fabricated shadow.** The amber warning accent and the secondary "Try again" button both consume documented DESIGN-SYSTEM primitives.

## State-render audit
- **HIDDEN (unchanged):** verbatim `Profile Unavailable` / `This member's academic identity is hidden due to visibility settings.` — matches the adopted design copy. Byte-identical across forced-404 and forced-403 (Probe C/D). Reuses the hidden container.
- **LOADED (unchanged):** identity stack renders (name + ACADEMIC ROLE / Educator). Matches adopted design.
- **ERROR (new):** amber icon + `Couldn't load profile` + retry `<button>` with focus-visible ring; distinct from hidden, same container geometry (min-h-[220px] centered).
- **Editor empty option:** the select renders "Not specified" as the empty option and clears on save (T-5 S1).

## Triage
No diffs, no token violations. Nothing to route.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [MemberProfileCard(LOADED/HIDDEN/ERROR), profile-editor academic-role select]
breakpoints: [live-desktop]   # floating fixed-width (320px) card; not breakpoint-sensitive; probed at default viewport
diffs: []
token_violations: []
fix_up_cycles: 0
findings: []
```
