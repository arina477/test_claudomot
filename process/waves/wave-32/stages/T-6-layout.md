# T-6 — Layout (prod visual + token audit)

**Wave:** 32 (M6 voice occupancy indicator)
**Pattern:** active-execution
**Target:** DEPLOYED PROD web `https://web-production-bce1a8.up.railway.app` (merge 45b08c3 live)
**Design canon:** `design/voice-occupancy-indicator.html` (D-3 adopted) — 4 states: Loading, Populated, Empty, Error.
**Driver:** `@playwright/test` chromium `--no-sandbox` (see T-5 for the sandbox-blocked-MCP note). Screenshots under
`process/waves/wave-32/stages/T-6-layout/screens/`.

## Live-verifiable state boundary

Of the design's 4 indicator states, only the **Error / fail-soft** state is reachable live (occupancy endpoint 503s,
creds unset → the hook's `.catch` → `status:'error'`). **Loading** is transient (first-poll, sub-second) and **Empty /
Populated** require a 200 from a real LiveKit room (creds unset → not reachable). This matches the documented
credential-independent boundary — the Error state is the one that matters for this wave's fail-soft AC, and it is
verified live. Empty/Populated visual verification is deferred to founder-supplies-keys (design-canon parity for those
states was validated at D-3 against the mockup).

## Screenshots captured

| Surface | Breakpoints | File(s) |
|---------|-------------|---------|
| Voice pre-join (fail-soft occupancy state) | 1440 / 1280 / 1024 | `voice-prejoin-failsoft-{1440,1280,1024}.png` |
| Occupancy indicator region (element-scoped) | 1440 | `voice-study-room-region-1440.png` |
| Post-Join graceful-degrade (Error state 5) | 1440 | `voice-after-join-degrade-1440.png` |
| Landing (context) | 1440 | `00-landing-1440.png` |

## Diff vs canonicalized design

The rendered **Error / fail-soft** state matches `design/voice-occupancy-indicator.html` State 4 (Error / Fail-Soft):
- Occupancy chip: warning-circle icon + "Occupancy data currently unavailable" in muted text, inside a subtle pill
  (`bg-study-900/40`, hairline border, `rounded-md`) — matches the mockup's State-4 sub-panel exactly.
- The chip sits on a `border-t border-border-hairline` divider above the CTA, per the design's shared entry-panel layout.
- **Join CTA** below (emerald, "Join voice"), reachable — matches the mockup's "Join Room Anyway" fail-soft placement
  (design keeps the primary action live when occupancy fails).
- Post-Join Error state (State 5 from `voice-study-room.html`): danger icon in a tinted circle + message + "Try again" —
  renders per design; no layout break.

No layout break, overflow, or font drift at any of 1440 / 1280 / 1024. App shell (server rail, channel sidebar, main
column, member panel) stays intact and correctly proportioned at the narrower breakpoint. Calm/academic dark-only vibe
preserved.

## Token compliance audit (Action 4)

Computed styles probed live via `getComputedStyle` on the deployed surface, compared to `design/DESIGN-SYSTEM.md` /
the mockup's Tailwind token config:

| Element | Property | Rendered | Design token | Verdict |
|---------|----------|----------|--------------|---------|
| `voice-study-room` container | background-color | `rgb(28,28,31)` = `#1c1c1f` | `study-800` (`#1c1c1f`) | MATCH |
| Join button | background-color | `rgb(16,185,129)` = `#10b981` | `accent-emerald` (`#10b981`) | MATCH |
| Join button | border-radius | `6px` | `rounded-md` (radius-md `6px`) | MATCH |
| Join button | color (text) | `rgb(10,10,11)` = `#0a0a0b` | `study-950` on emerald (dark-on-accent) | MATCH |

No invented hex values, off-token spacing, fabricated shadows, or non-system radii detected on the audited surface.
The fail-soft chip's muted text + hairline border read as system `text-muted` + `border-hairline` in the screenshot
(the automated `getComputedStyle` selector for the chip resolved to a parent wrapper and is not cited as evidence —
the visual screenshot is authoritative for the chip; no violation observed).

## Findings

None. No critical, significant, or cosmetic layout/token defect on the live-verifiable surface.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [voice-study-room-prejoin, voice-study-room-error-state]
breakpoints: [1440, 1280, 1024]
live_verifiable_states: [error_failsoft, connect_error]     # loading transient; empty/populated need creds (deferred)
diffs:
  - {surface: voice-prejoin-failsoft, breakpoint: 1440, diff: match, verdict: PASS}
  - {surface: voice-prejoin-failsoft, breakpoint: 1280, diff: match, verdict: PASS}
  - {surface: voice-prejoin-failsoft, breakpoint: 1024, diff: match, verdict: PASS}
  - {surface: voice-after-join-degrade, breakpoint: 1440, diff: match-design-state-5, verdict: PASS}
token_violations: []
token_audit:
  - {element: voice-study-room, prop: backgroundColor, rendered: "#1c1c1f", token: study-800, match: true}
  - {element: join-button, prop: backgroundColor, rendered: "#10b981", token: accent-emerald, match: true}
  - {element: join-button, prop: borderRadius, rendered: "6px", token: radius-md, match: true}
fix_up_cycles: 0
findings: []
```
