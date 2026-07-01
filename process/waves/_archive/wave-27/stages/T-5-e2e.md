# T-5 E2E — wave-27 presence-dot REGRESSION check (subscription lift + server index) — LIVE PRODUCTION

**Wave-27 is a behavior-preserving perf refactor.** The message-list presence subscription was lifted from one-per-row to a single list-level subscription; a `server_members` DB index was added server-side. This T-5 is a REGRESSION check only: confirm the wave-26 author-avatar presence dots STILL render identically after the refactor + new deploy — no behavior change.

**Target:** https://web-production-bce1a8.up.railway.app/ — **NEW deploy confirmed live**, shipped bundle `assets/index-Dr2UkTXH.js` (Spec B subscription-lift bundle, matches the deploy under test 328b1ae9). Verified on the live page's `<script src>` at session start, all runs.
**Fixture:** `studyhall-e2e-fixture@example.com` / username `studyhallfixturea` (email-verified). Password read from `command-center/testing/test-accounts.md` (`e2e-fixture`), passed via env, redacted as `***` throughout — never printed.
**Server / channel:** "Fixture Proof Server" (`ad62cd12`) → `#general` channel.
**Method:** Log in → open FP server → open `#general` → post a self-message → DOM-inspect the author-avatar column of the fixture's own message row for the `PresenceDot`. Member panel + a11y inspected each pass. Key scenario run ×2; the whole flow was executed 3 times total (2 formal passes per run, run repeated to confirm no flake). No `browser.close()` was issued against any MCP instance — the driver's `browser.close()` targets only our own launched Chromium.

## Tooling note — Playwright MCP unavailable; bundled-Chromium fallback (per promoted T-5 rule 1)
All 10 Playwright MCP instances (`mcp__playwright-1..10`) default to the **chrome channel** whose Linux path `/opt/google/chrome/chrome` is absent in this env → launch fails. Session-wide infra defect, not a product fault. Per the standing rule I drove the **validated bundled Chromium** (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) directly via the project's `playwright-core@1.61.1`. The rendering path (React client `MessageRow` → `PresenceDot`) is identical to what the MCP would exercise; only the driver differs. Driver: `process/waves/wave-27/stages/evidence/driver.mjs`. `testers_spawned: 1` = one browser-driver harness, multiple sequential passes.

## PresenceDot signature (unchanged from wave-26)
Online → inner dot `rgb(16,185,129)` emerald + sibling `<span class="sr-only">Online</span>`. Offline → inner `rgb(82,82,91)` grey + "Offline". Detection: `[data-testid="presence-dot-inner"]` + sibling `.sr-only`.

## Scenario verdict table (both formal passes, repeated 3× total — fully consistent, no flake)

| # | Criterion | Expected (behavior-preserving) | Observed | Verdict |
|---|-----------|-------------------------------|----------|---------|
| 1 | self-author-online-dot-regression | Fixture's own just-posted message-row author avatar shows an ONLINE (emerald) PresenceDot + `sr-only "Online"` — identical to the wave-26 confirmed-fixed behavior | Own message-row avatar HAS `presence-dot-inner`, computed inner bg `rgb(16,185,129)` emerald, `sr-only "Online"`; `ownRowDot.present:true` on EVERY pass; 25–28 of 25–28 message rows dotted (100%) across all runs | **PASS** |
| 2 | member-panel + a11y unregressed | Member-panel dots still render online/offline; presence labels a11y-reachable; live state reflected | 27–30 `presence-dot-inner` dots page-wide, split 26–29 emerald `rgb(16,185,129)` (online) + exactly 1 grey `rgb(82,82,91)` (offline = fixture-b). Member panel shows `ONLINE — 1 studyhall-e2e-fixture` (emerald) / `OFFLINE — 1 fixture-b` (grey) — live presence state correctly reflected. a11y: 28–31 presence labels, `suppressed: 0`, all reachable. | **PASS** |

## Scenario 1 — PASS — DOM evidence (the exact element wave-26 fixed, still present after the lift)
Author-avatar column of the fixture's own freshly-posted message row, verbatim from live DOM (`ownRowDot`, `matchedOwnMsg: true`, all runs):
```html
<div class="relative mt-0.5 shrink-0">
  <div class="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
       aria-hidden="true" style="background-color: rgb(63, 63, 70); color: rgba(255,255,255,0.92);">21</div>
  <div class="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center pointer-events-none"
       style="width:12px;height:12px;background-color:rgb(18,18,20);">
    <span class="sr-only">Online</span>
    <div aria-hidden="true" class="rounded-full" data-testid="presence-dot-inner"
         style="width:6px;height:6px;background-color: var(--color-accent-emerald);"></div>
  </div>
</div>
```
Computed inner-dot `background-color = rgb(16,185,129)` (emerald / ONLINE) on all passes. Element-level screenshot of the dotted row: `evidence/msgrow-dot-pass1.png` (emerald dot on the "21" avatar). The presence subscription lift (one list-level subscription replacing per-row) did **not** change the rendered output — the dot renders identically to the wave-26 confirmed-fixed state.

## Scenario 2 — PASS — member-panel + a11y (unregressed)
`evidence/channel-open.png` shows the member panel: `ONLINE — 1` (studyhall-e2e-fixture, emerald dot) and `OFFLINE — 1` (fixture-b, grey dot) — live presence state correctly distinguished (online emerald vs offline grey observed simultaneously, so dots reflect real per-user state, not a static render). a11y: every `sr-only` "Online"/"Offline" label is reachable in the accessibility tree (`suppressed: 0` on all passes); `aria-hidden="true"` sits only on the decorative inner-dot glyph. The self-profile chip (bottom-left "ST") also shows an emerald online dot. No regression from the subscription lift or the server-side index.

## Console note (not a regression)
One benign console error observed on every run: `Failed to load resource: 401` — an initial pre-auth resource fetch before the session cookie is established (identical to wave-26; not introduced by wave-27). No functional impact; not a finding.

## Plain-language summary
- **The online presence dots are UNREGRESSED on live production after the wave-27 refactor.** After logging in and posting a message, the tester's own message avatar still shows the small emerald "online" dot, and screen readers still announce "Online" — exactly as before the change. Reproduced identically across 3 runs, no flakiness.
- **Member-list dots still work** — one member shown online (green), one offline (grey), correctly distinguished.
- **Screen-reader labels still correct** — "Online"/"Offline" announced, none suppressed.
- Net: the behavior-preserving perf change (single list-level presence subscription + new server index) shipped without breaking the presence-dot feature. No regression.

## Evidence files (absolute paths)
- `/home/claudomat/project/process/waves/wave-27/stages/evidence/driver.mjs` — the browser-driver harness
- `/home/claudomat/project/process/waves/wave-27/stages/evidence/msgrow-dot-pass1.png` — message-row author avatar with emerald online dot (Scenario 1 visual)
- `/home/claudomat/project/process/waves/wave-27/stages/evidence/channel-open.png` — member panel: ONLINE emerald / OFFLINE grey (Scenario 2 visual)
- `/home/claudomat/project/process/waves/wave-27/stages/evidence/inspect-pass1.png`, `inspect-pass2.png` — channel + composer state

```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios:
  - {id: 1, criterion_ref: self-author-online-dot-regression, verdict: PASS, evidence_path: process/waves/wave-27/stages/evidence/msgrow-dot-pass1.png}
  - {id: 2, criterion_ref: member-panel+a11y-unregressed, verdict: PASS, evidence_path: process/waves/wave-27/stages/evidence/channel-open.png}
flakes_observed: []
fix_up_cycles: 0
findings: []
```
