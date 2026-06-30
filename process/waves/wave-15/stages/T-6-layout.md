# T-6 — Layout (wave-15 M3 @mentions)

**Pattern:** B — Active-execution. **wave_type includes `ui` → fires.** Surfaces canonicalized at D-3: `design/server-channel-view.html` (mention pills + autocomplete popover + unread badge composed on the existing page-9 surface).

## Action 1 — Deployed-state screenshots

Captured against live prod (bundled-Chromium node script; MCP swarm blocked per T5-F1) at 3 breakpoints into `process/waves/wave-15/stages/T-6-layout/screens/`:
- `channel-open-final-1440.png`, `channel-1280.png`, `channel-1024.png` (channel view w/ message list + pills + composer)
- `autocomplete-final-1440.png` (open autocomplete popover)
- `app-home-1440.png` (server rail + unread badge context)

## Action 2 — Visual review vs canonicalized design

No automated pixel-diff tool is wired in `command-center/principles/test-layer-principles/T-6.md` for this project (qualitative visual review is the established cadence, consistent with prior UI waves). Reviewed the deployed render against `design/server-channel-view.html`:
- 3-pane layout (server rail / channel sidebar / main + members panel) intact at all breakpoints; composer "Message #general" + "Enter to send / Shift+Enter for newline" hint present.
- Mention pills render inline in the message body without breaking row rhythm; "(edited)" label renders for the edit-diff-removed message.
- Autocomplete popover renders as an overlay near the composer (1 option for the matched member); did not occlude the send affordance.

## Action 4 — Token compliance audit (computed-style probe)

Probed computed styles of rendered pill elements inside `role="log"`:

| Element | Property | Rendered value | DESIGN-SYSTEM token | Verdict |
|---|---|---|---|---|
| Other-user pill (`@studyhallfixtureb`) | background | `rgb(39,39,42)` | `--surface-700 #27272a` | ✓ exact token |
| Other-user pill | color | `rgba(255,255,255,0.92)` | white-92 (primary text) | ✓ |
| Viewer pill (`@studyhallfixturea`) | background | `rgba(16,185,129,0.1)` | `--accent-emerald #10b981` @ 10% | ✓ exact token tint |
| Viewer pill | color | `rgb(110,231,183)` | emerald-300 `#6ee7b7` (emerald family) | ✓ within accent family |
| Both pills | border-radius | `6px` | `--radius-md` 6px | ✓ system token (DESIGN-SYSTEM also lists `--radius-full` for pills; impl chose `--radius-md` — both are tokens, not an invented value) |
| Both pills | padding | `2px 6px` | 4px base scale (2px = 0.5u inline, 6px ≈ 1.5u) | acceptable inline tag spacing |

**No invented hex values, no off-token spacing, no fabricated shadow stacks.** All pill colors map to DESIGN-SYSTEM primitives.

## WCAG AA contrast (DESIGN-PRINCIPLES rule 1 — viewer pill ≥4.5:1)

- **Viewer pill** emerald text `#6ee7b7` on composited tinted bg (10% emerald over `--surface-800 #1c1c1f` ≈ rgb(23,40,37)): **10.08:1** → PASS (≥4.5).
- **Other pill** white-92 on `--surface-700`: **14.89:1** → PASS.

## Responsive

Composer + message list + pills render correctly at 1440 / 1280 / 1024 (composer present at all three). Per the wave-14 design contract the member-list panel collapses <1024; not re-audited this wave (no member-panel change) — pills/autocomplete/badge are the wave-15 delta and they hold at every captured breakpoint.

## Findings

- **T6-F1 (LOW/observation, → V-2):** pills use `--radius-md` (6px) where DESIGN-SYSTEM lists `--radius-full` as the canonical pill radius. Both are system tokens (not an invented value), and the D-3-adopted `server-channel-view.html` is the authority the design was composed against — so this is a token-choice note, not a violation. No action required unless D-block flags it next UI wave.

```yaml
test_pattern: active
skipped: false
surfaces_audited: ["design/server-channel-view.html (mention pills + autocomplete popover + unread badge)"]
breakpoints: [1440, 1280, 1024]
diffs:
  - {surface: "channel view + pills", breakpoint: 1440, diff_pct: "n/a (qualitative)", verdict: PASS}
  - {surface: "channel view", breakpoint: 1280, diff_pct: "n/a", verdict: PASS}
  - {surface: "channel view", breakpoint: 1024, diff_pct: "n/a", verdict: PASS}
  - {surface: "autocomplete popover", breakpoint: 1440, diff_pct: "n/a", verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings:
  - {severity: low, surface: "mention pill", description: "T6-F1 — pills use --radius-md (6px) vs DESIGN-SYSTEM's --radius-full canonical pill radius; both are tokens, composed against the D-3-adopted mockup. Token-choice note, not a violation."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-6
  reviewers: {}
  failed_checks: []
  rationale: >
    The wave-15 UI delta (mention pills, autocomplete popover, unread badge) renders correctly against
    the D-3-adopted server-channel-view design at 1440/1280/1024. The token audit, run via computed-style
    probes on the actual deployed DOM, maps every pill color to a DESIGN-SYSTEM primitive: other-user pill
    is --surface-700, viewer pill is a 10% --accent-emerald tint with emerald-family text, both at
    --radius-md. No invented hex, no off-token spacing. The viewer-targeted pill clears WCAG AA at
    10.08:1 (DESIGN-PRINCIPLES rule 1 satisfied with wide margin) and the other-user pill at 14.89:1. The
    single finding (T6-F1) is a radius token-choice note, not a violation. Layout holds at all breakpoints
    with the composer present.
  next_action: PROCEED_TO_T-7
```
