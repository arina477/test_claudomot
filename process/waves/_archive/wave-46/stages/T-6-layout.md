# T-6 — Layout (wave-46 M8 direct messages slice 1)

**Pattern:** B — Active-execution. Live DM surface (`https://web-production-bce1a8.up.railway.app/app` → DM home) captured at 1440/1280/1024 and compared vs canonical `design/direct-messages.html` + token-audited vs `design/DESIGN-SYSTEM.md` (dark-mode only). Tester agentId ac5f937e.

## Action 1/2 — Deployed-state capture + design diff

| Breakpoint | Verdict | Observations |
|---|---|---|
| **1440×900** | **PASS** | Conversation-list rail, thread pane, composer all present + correctly arranged (rail left, thread right, composer pinned bottom); panes full viewport height; no horizontal scroll (`scrollWidth==innerWidth`); active conversation highlighted (surface-700 fill + emerald edge + emerald name). |
| **1280×832** | **PASS (cleanest)** | Four columns crisp: server rail → channel column → DM list (active row highlighted) → thread (header + grouped message rows + timestamps) → composer ("Enter to send · Shift+Enter for newline"). No crush/overflow. Faithful to canonical thread + composer. |
| **1024×768** | **PASS** | All panes present; composer pinned bottom; column math 72+260+320+372=1024, no overflow. Thread compressed to 372px (empty channel sidebar kept), long UUID names + placeholder wrap to 2 lines — graceful, no clipping. Tight but functional. |

**Start-picker modal (1280):** PASS — centered X+Y, within viewport, not clipped; dark-themed (card `rgb(28,28,31)`, emerald focus ring, scrim `rgba(0,0,0,0.7)`); empty-results state renders cleanly.

**Structural note:** canonical DM is 3-panel; live app-shell renders 4 columns on the DM route (adds a redundant empty "Select a server" channel sidebar). All canonical DM panes present + correctly ordered; the 4th column is additive, not a substitution. → F9 MINOR.

## Action 4 — Token compliance audit (getComputedStyle @1280)

| Element | Computed | Expected token | Match |
|---|---|---|---|
| App frame / body bg | `rgb(10,10,11)` | `--surface-950` #0a0a0b | Y |
| Conversation-list rail bg | `rgb(18,18,20)` | `--surface-900` #121214 | Y |
| Thread / main pane bg | `rgb(28,28,31)` | `--surface-800` #1c1c1f | Y |
| Primary text | `rgba(255,255,255,0.92)` | `--text-primary` | Y |
| Active-conversation fill | `rgb(39,39,42)` | `--surface-700` #27272a | Y |
| Active edge bar / name | `rgb(16,185,129)` | `--accent-emerald` #10b981 | Y |
| DM rail icon (active) | `rgb(16,185,129)` | `--accent-emerald` | Y |
| Server rail bg | `rgb(10,10,11)` | DS §1 says `--surface-900` | **N** (surface-950 — F10) |
| Modal card bg | `rgb(28,28,31)` | canonical modal `--surface-900` | **N** (surface-800 — F10) |
| Disabled send btn | `rgb(39,39,42)` / 30% icon | canonical emerald@50% | **N** (surface-700 — F10) |

**No invented / off-palette hex.** The three N rows are 1-step-adjacent surface substitutions (all on the dark palette), not foreign colors.

## Action 5 — Triage

All findings MINOR / off-token / cosmetic. None is a broken layout, missing element, or invented color → none critical, no B-3 re-entry, no fix-up cycle. Surface to V-2 (bug-design candidates) + note the off-token substitutions for D-block re-eval at the next UI wave.

## Findings

- **F9 (MINOR):** redundant empty channel-sidebar column on the DM route (canonical DM = 3-panel; live = 4-column). Narrows thread at 1024. Cosmetic.
- **F10 (LOW, off-token):** adjacent surface substitutions — server rail surface-950 vs canonical 900; modal card surface-800 vs 900; disabled-send surface-700 vs canonical emerald-50%. On-palette; no invented hex.
- **F3c (MINOR):** long UUID display names wrap at 1024 (= T-3 F1 server displayName fallback; real names would be short + truncate).

## Console
- 1 network log: `401 GET /auth/session/refresh` — benign background refresh probe; DM surface fully functional. 0 uncaught JS errors.

---
```yaml
test_pattern: active
skipped: false
surfaces_audited:
  - "DM home (conversation-list rail + thread + composer)"
  - "StartDmPicker modal"
breakpoints: [1440, 1280, 1024]
diffs:
  - {surface: "DM home", breakpoint: 1440, diff_pct: "structural-faithful", verdict: PASS}
  - {surface: "DM home", breakpoint: 1280, diff_pct: "structural-faithful", verdict: PASS}
  - {surface: "DM home", breakpoint: 1024, diff_pct: "structural-faithful (tight)", verdict: PASS}
  - {surface: "StartDmPicker modal", breakpoint: 1280, diff_pct: "faithful", verdict: PASS}
token_violations:
  - "server rail surface-950 vs DS-§1 surface-900 (adjacent, on-palette)"
  - "modal card surface-800 vs canonical surface-900 (adjacent)"
  - "disabled-send surface-700 vs canonical emerald-50% (adjacent)"
fix_up_cycles: 0
findings:
  - {severity: MINOR, surface: "DM route shell", description: "redundant empty channel-sidebar column; narrows thread at 1024"}
  - {severity: LOW, surface: "rail/modal/disabled-send", description: "adjacent off-token surface substitutions, no invented hex"}
  - {severity: MINOR, surface: "DM names", description: "long UUID names wrap at 1024 (= T-3 F1 displayName gap)"}
head_signoff:
  verdict: APPROVED
  stage: T-6
  failed_checks: []
  rationale: >
    Clean layout PASS at 1440 / 1280 / 1024. The DM surface is structurally faithful to
    design/direct-messages.html — conversation-list rail, thread/message-log, composer (pinned
    bottom), and start-picker modal all present, correctly arranged, full-height, with no crush,
    overflow, horizontal scroll, or clipping. Dark-theme tokens are genuinely consumed
    (surface-950 frame, surface-900 rails, surface-800 thread, text-primary body, emerald on
    active states) — no invented hex. All findings are MINOR/off-token (redundant empty column,
    adjacent surface substitutions, UUID-name wrap) — surfaced to V-2 as bug-design candidates,
    none blocking. No CRITICAL or MAJOR layout defect.
  next_action: PROCEED_TO_T-7
```
