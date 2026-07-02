# T-6 — Layout (wave-34, M6 → screen-share tile + audio-only banner)

**Wave:** 34 · **Block:** T · **Stage:** T-6 · **Mode:** automatic
**Prod web:** `https://web-production-bce1a8.up.railway.app` (web `e211f14d`)
**Surfaces canonicalized at D-3:** `design/screen-share-tile.html`, `design/audio-only-state.html`
**Token reference:** `design/DESIGN-SYSTEM.md` (zinc/emerald/amber, `--surface-950 #0a0a0b`, `--surface-800 #1c1c1f`, `--accent-amber #f59e0b`, `--radius-lg 8-10px`).
**Capture harness:** live prod, 2-participant voice room `w34-voice-e2e`, A sharing a screen → B viewing. Breakpoints 1440 / 1280 / 1024. Screens under `T-6-layout/screens/`.

Note: both design files are multi-state STAGING documents (each stacks 4 component states vertically), so they are component-state references, not whole-page pixel baselines. T-6 therefore diffs STRUCTURE + TOKENS against the canonicalized states rather than a naive full-page pixelmatch (which would false-positive on the staging chrome). Threshold intent per T-6 default: structural/token divergence is a finding; sub-5%-area cosmetic AA is suppressed.

---

## Action 1–2 — Deployed screen-share tile vs `design/screen-share-tile.html` "Sharing Active" state

Screenshots (B viewing A's live screen-share):
- `screens/screen-share-tile-B-1440.png`
- `screens/screen-share-tile-B-1280.png`
- `screens/screen-share-tile-B-1024.png`
- `screens/screen-share-own-A-1440.png` (A's own-share view)
- `screens/DESIGN-screen-share-tile-1440.png` (design staging reference)

**Structural match against design state 02 "Sharing Active (Viewing) — Avatars demote to strip, prominent tile takes focus":**
| Design element | Deployed (B view) | Verdict |
|---|---|---|
| Prominent share tile, centered, dominant | tile dominates main column, `max-w-[1000px] mx-auto`, video letterboxed with preserved aspect ratio (no stretch) | MATCH |
| "LIVE SHARE" indicator | emerald "LIVE SHARE" pill, top-left of tile | MATCH |
| Presenter/context label | "Presenting" label bottom-left | MATCH |
| Avatars demoted to strip below | avatar chips (`S(`, `?`) demoted below the tile | MATCH (see finding F1 on chip label) |
| Members panel co-presence | "ONLINE — 2", both fixtures, emerald presence dots | MATCH |
| Control cluster (mic / screen-share / leave) | `[mic, screen-share, Leave(destructive red)]` centered | MATCH |
| Three-pane shell preserved | server rail / channel sidebar / main / members intact at all 3 widths | MATCH — no break |

No layout break, overflow, or shift observed at 1440 / 1280 / 1024. At 1024 the tile letterboxes cleanly (aspect-ratio preserved, not cropped/stretched) — correct video behavior.

## Action 4 — Token compliance audit (new components)

Probed computed styles on the live prominent share tile (`[aria-label*="creen shared"]`) and the room container:

| Property | Live value | DESIGN-SYSTEM token | Verdict |
|---|---|---|---|
| tile `background-color` | `rgb(10,10,11)` = `#0a0a0b` | `--surface-950 / bg-study-950` | ON-TOKEN |
| tile `color` | `rgba(255,255,255,0.92)` | `text.primary` | ON-TOKEN |
| tile `border-radius` | `8px` | `--radius-lg` (8-10px band) | ON-TOKEN |
| tile `box-shadow` | `rgba(0,0,0,0.4) 0 1px 2px` | `shadow.sm = 0 1px 2px rgba(0,0,0,0.4)` | ON-TOKEN |
| tile `max-width` | `1000px` | design `max-w-[1000px]` | ON-TOKEN |
| room container `background` | `rgb(28,28,31)` = `#1c1c1f` | `--surface-800` | ON-TOKEN |

No invented hex, no off-token spacing, no fabricated shadow stack, no non-system radius. Dark theme consistent (design ships `class="dark"` only; no light variant). `token_violations: []`.

Note: design outer wrapper uses `rounded-lg` (10px in the staging file) vs the live tile's 8px — both fall inside the `--radius-lg` 8-10px band, so compliant (not a violation).

## Audio-only banner surface — reference-only (not reachable live)

`design/audio-only-state.html` baseline rendered to `screens/DESIGN-audio-only-state-1440.png` (amber `#f59e0b` auto state, neutral manual state, mic-active reassurance, restore affordance — all on-token). The deployed `AudioOnlyBanner` component matches this design in source (amber/wifi-low auto, neutral/video-slash manual, `role=status aria-live=polite`, restore button) and is covered by component tests, but it CANNOT be rendered in the live DOM this wave — `audioOnlyMode` is only set by the auto ConnectionQuality→Poor path (non-headless) or `enterManual()` (no UI button wired; see T-5 finding S3). **Live layout diff of the audio-only banner is therefore DEFERRED-TO-MANUAL** (cross-references the T-5 high finding). Its layout compliance is asserted at component/source level only, not against a live capture.

---

## Findings

| Sev | Surface | Description | Route |
|---|---|---|---|
| low | screen-share avatar strip / tile | demoted avatar chip renders `S(` and the tile aria-label `"Screen shared by "` has an empty name — LiveKit participant `.name` unset on mint; initials/label lack the identity/`Someone` fallback. Cosmetic; tile prominence + demotion correct. | V-2 (cross-ref T-5 low finding — same root cause) |
| info | audio-only banner | live layout diff deferred — banner unreachable in prod build (unwired trigger). Component-level compliance only. | V-2 (cross-ref T-5 high finding S3) |

No critical/significant layout diffs. No token violations.

---

```yaml
test_pattern: active
skipped: false
surfaces_audited: [screen-share-tile, audio-only-banner]
breakpoints: [1440, 1280, 1024]
diffs:
  - {surface: screen-share-tile, breakpoint: 1440, diff_pct: structural-match, verdict: PASS}
  - {surface: screen-share-tile, breakpoint: 1280, diff_pct: structural-match, verdict: PASS}
  - {surface: screen-share-tile, breakpoint: 1024, diff_pct: structural-match, verdict: PASS}
  - {surface: audio-only-banner, breakpoint: 1440, diff_pct: deferred-not-reachable-live, verdict: DEFERRED}
token_violations: []
fix_up_cycles: 0
findings:
  - {severity: low, surface: screen-share-tile, description: "empty participant name in avatar chip + tile aria-label (LiveKit .name unset; no identity/Someone fallback); cross-ref T-5 low finding"}
  - {severity: info, surface: audio-only-banner, description: "live layout diff deferred — banner unreachable in prod build (unwired trigger); component-level compliance only; cross-ref T-5 S3"}
```

## head-tester sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-6
  reviewers: {}
  failed_checks: []
  rationale: >
    The screen-share tile is diffed structurally and by token against design/screen-share-tile.html's
    "Sharing Active" state across 1440/1280/1024 with no layout break: prominent centered tile
    (max-w-[1000px], aspect-preserved letterbox), LIVE-SHARE pill, Presenting label, avatars demoted to
    a strip, members co-presence, and the mic/screen-share/leave control cluster all present and
    dark-themed. Token audit on the live tile is fully on-token — surface-950 bg, text.primary,
    radius-lg 8px, shadow.sm, and the surface-800 room container all trace to DESIGN-SYSTEM primitives
    with zero invented values; token_violations empty. The audio-only banner's live layout diff is
    honestly deferred (the banner cannot be reached in the deployed build for the same reason T-5 S3 is
    deferred — no wired trigger) rather than faked; its compliance is asserted at component/source level
    and the design baseline is captured for the eventual live diff once the toggle is wired. The two
    open findings are low/info and cross-reference the T-5 findings (same empty-name root cause; same
    unreachable-banner gap). No critical diff, no token violation. No measured pause trigger fired.
  next_action: PROCEED_TO_T_7
```
