# T-5 E2E — Tester-2 (RE-RUN): F-1 slim-bar fix + duration-config a11y carries

**Verdict: ALL PASS (S1–S4, 2 runs each). The wave-49 F-1 slim-bar bug is FIXED.**
**Wave:** 50 · **Layer:** T-5 E2E · **Tester:** tester-2 (re-run — overwrites prior BLOCKED report)
**Target (LIVE prod):** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Server:** Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c`
**Client:** A = `studyhall-e2e-fixture@example.com` (studyhallfixturea) — fixture creds only.
**Harness:** installed `playwright` node package driven DIRECTLY (own headless Chromium, own isolated `browserContext`). **No MCP `playwright-*` tools used; no existing browser process touched/killed.** This is exactly the approach the successful sibling tester-1 used. The prior BLOCKED (shared MCP Chrome-profile lock) is resolved by not touching MCP at all.
**Evidence dir:** `/home/claudomat/shots/` · scripts: `t5-tester2.mjs`, `t5-break.mjs`.
**Date/window:** 2026-07-05, ~17:38 UTC.

---

## HEADLINE ANSWER

**Is the F-1 slim-bar 2px phase border now rendering at <1024 (the wave-49 bug fixed)? — YES.**

At **800×900** viewport, the study-timer widget root (`[data-testid="study-timer-widget"]`) computed border-left in WORK phase is:

```
borderLeftWidth = 2px
borderLeftColor = rgb(16, 185, 129)   ← emerald #10b981 (Work)
borderLeftStyle = solid
className       = "... rounded-lg timer-phase-work"
```

This is **NOT** the wave-49 defect (1px grey `rgba(255,255,255,0.06)`). The width is exactly 2px and the color is exactly emerald. Break phase confirmed amber:

```
borderLeftWidth = 2px
borderLeftColor = rgb(245, 158, 11)   ← amber #f59e0b (Break)
className       = "... rounded-lg timer-phase-break"
```

Idle state correctly shows **0px** border-left (no phase → no accent bar), so the phase color is genuinely phase-driven, not a static border.

---

## VERDICT SUMMARY

| Scenario | Run 1 | Run 2 | Result |
|---|---|---|---|
| **S1** F-1 slim-bar 2px phase LEFT border @ <1024 (headline fix) | PASS | PASS | **PASS** |
| **S2** Config affordance @ <1024 is compact INLINE reveal (not modal), no hero overlap | PASS | PASS | **PASS** |
| **S3** Config states @ desktop ≥1024 (idle-editable / locked+hint / validation) | PASS | PASS | **PASS** |
| **S4** A11y carries (aria-labels, non-color-only error, disabled-Apply reason) | PASS | PASS | **PASS** |
| Cleanup | — | — | **DONE — idle, 25/5** |

**Console/network:** No 5xx. Only one benign `401` on the pre-login resource probe (before auth). No app-level console errors during any scenario.

---

## S1 — F-1 slim-bar 2px phase border at <1024 — PASS (2/2)

Method: viewport 800×900; reset to idle; capture computed `border-left` via `getComputedStyle(widget)`; then click Start to enter WORK; re-capture; reset. Repeated ×2. Break phase driven separately by configuring a 1-minute work length, starting, and polling for the server-authoritative work→break transition.

| Run | State | `borderLeftWidth` | `borderLeftColor` | class | Verdict |
|---|---|---|---|---|---|
| 1 | idle | `0px` | (n/a — no phase) | `rounded-lg` (no phase class) | correct: no bar when idle |
| 1 | WORK | **`2px`** | **`rgb(16,185,129)`** emerald | `timer-phase-work` | **PASS** |
| 2 | idle | `0px` | — | (no phase class) | correct |
| 2 | WORK | **`2px`** | **`rgb(16,185,129)`** emerald | `timer-phase-work` | **PASS** |
| — | BREAK | **`2px`** | **`rgb(245,158,11)`** amber | `timer-phase-break` | **PASS** |

The wave-49 bug (1px grey `rgba(255,255,255,0.06)` — inline `border` shorthand clobbering the phase `border-left`) is gone. The B-3/B-6 fix (decomposing the inline shorthand into `borderTop/Right/Bottom` only, letting the `.timer-phase-work`/`.timer-phase-break` CSS class own `border-left`) works live at <1024px. The phase class is applied on the widget root and the CSS wins (2px, phase color), exactly as designed.

Evidence: `s1-run1-work-800.png`, `s1-run2-work-800.png` (800px WORK, emerald left bar), `break-phase-800.png` (amber left bar, BREAK pill, 00:58).

---

## S2 — Config affordance @ <1024 is a compact INLINE reveal — PASS (2/2)

Method: 800×900, idle. Inspect the config toggle (`button[aria-label="Toggle timer settings"]`), click to reveal, verify the revealed row (`[data-testid="slim-config-row"]`) is INLINE inside the widget (not a portal/modal) and does not overlap the hero countdown.

Observed:
- **Toggle is a real button** — `aria-expanded` flips `false → true`, `aria-controls="slim-config-row-…"`. Before click, slim row is NOT in the DOM (collapsed).
- After click: **`slimRowVisible = true`, `slimRowInsideWidget = true`** — the reveal is rendered INSIDE the widget subtree (inline), NOT a portalled dialog.
- **`openDialogCount = 0`** — no `role="dialog"` / modal / settings-panel is opened.
- **`overlapsHero = false`** — the slim row (top≈244, height 76, width 695) sits BELOW the hero countdown; no geometric overlap with `[data-testid="timer-display"]`.

This is a compact inline toggle-expand, exactly per spec — not a modal, not a settings panel, no hero overlap.

Evidence: `s2-inline-reveal-800.png`.

---

## S3 — Config states @ desktop ≥1024 — PASS (2/2)

Method: viewport 1440×900. Read the desktop config form (`desktop…` idPrefix).

**3a idle-editable:** work input `disabled = false`, break input `disabled = false` — inputs editable when idle. PASS.

**3b locked while running:** Start the timer, then inspect:
- Work input `disabled = true`, Break input `disabled = true` — locked. PASS.
- **Lock hint VISIBLE on desktop:** `[data-testid$="-lock-hint"]` exists, text = **"Reset timer to change lengths"**, `visible = true`, rect 160×15px, **NOT sr-only**. Rendered where the Apply button was. PASS.

**3c validation-error (out-of-range):** idle, enter Work `200` (max 120):
- `aria-invalid = "true"`, inline error text = **"Must be 1-120"**, Apply button `disabled = true`. No bad value committed. PASS.

Evidence: `s3-idle-editable-1440.png`, `s3-locked-running-1440.png`, `s3-validation-1440.png`.

---

## S4 — A11y carries (D-3) — PASS (2/2)

Read directly from the live DOM (attribute values, not appearance):

| A11y requirement | Observed | Verdict |
|---|---|---|
| Work input aria-label | `aria-label="Work duration minutes"` | PASS |
| Break input aria-label | `aria-label="Break duration minutes"` | PASS |
| Real inputs | `type="number"`, Work `min=1 max=120`, Break `min=1 max=60` | PASS |
| Validation error NOT color-only | error `<span>` has an **icon (`<svg>` WarningCircle) + text "Must be 1-120"** | PASS |
| `aria-invalid` on error | input `aria-invalid="true"` | PASS |
| `aria-describedby` wired to error | input `aria-describedby="…-work-err"` (points at the error region) | PASS |
| `aria-live` on error region | error region `aria-live="polite"` | PASS |
| Disabled Apply has aria-describedby reason | Apply `disabled=true`, `aria-describedby="…-apply-hint"`, hint text = **"Change a value to enable Apply"** (sr-only, screen-reader-announced) | PASS |

All four a11y carries from D-3 are present in the live shipped DOM, on both the <1024 slim form and the ≥1024 desktop form.

Evidence: `s4-validation-error-800.png` (800px inline error with icon+text), `s3-validation-1440.png` (desktop).

Note: the disabled-Apply hint is intentionally `sr-only` (visually hidden, screen-reader-exposed via `aria-describedby`) — this satisfies the "disabled Apply has aria-describedby reason" requirement (the reason is programmatically associated for AT users), distinct from the locked-while-running hint which is a *visible* on-screen hint.

---

## Cleanup — DONE

Timer left **idle, durations Work 25 / Break 5, display 25:00**, border-left 0px (idle, no phase bar). Verified on both the 800px and 1440px passes. Clean for subsequent testers.

```
cleanup: work=25 break=5 display=25:00 (idle) borderLeftWidth=0px
finalTimer: display=25:00 hasStart=true hasPause=false hasReset=false
```

Evidence: `final-idle-1440.png`.

---

## Errors / diagnostics

- **5xx:** none.
- **Console errors:** only `Failed to load resource: 401` on the initial pre-login probe (before auth). None during scenarios. No React/runtime errors.
- **Flake:** none — both runs of every scenario deterministic; phase border read identically (2px emerald / 2px amber) each time.

## Iron-Law note

No FAILs → no triage needed. **No production code was modified** by this tester (task: FAIL/BLOCKED → evidence only). The prior BLOCKED was tooling contention on the shared MCP Chrome profile; using the `playwright` node package directly (own isolated context) fully resolved it and confirmed the F-1 fix ships correctly live.
