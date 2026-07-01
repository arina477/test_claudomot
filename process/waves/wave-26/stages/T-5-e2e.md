# T-5 E2E — wave-26 presence dots on message-row author avatars (LIVE PRODUCTION)

**Target:** https://web-production-bce1a8.up.railway.app/ (live prod, Railway; deploy 036c9612, bundle `assets/index-DBlhKjLW.js` — confirmed live).
**Fixture:** `studyhall-e2e-fixture@example.com` / username `studyhallfixturea` (email-verified). Password read from `command-center/testing/test-accounts.md` (`e2e-fixture`), redacted as `***` throughout — never printed.
**Server / channel:** "Fixture Proof Server" (`ad62cd12`) → existing `#general` channel.
**Method:** Log in, open channel, post message(s), then inspect the rendered message DOM + accessibility markers. Each scenario run TWICE for flake detection. Cross-checked the shipped bundle source to establish root cause.

## Tooling note — Playwright MCP unavailable; bundled-Chromium fallback used (per promoted T-5 rule 1)
All 10 Playwright MCP instances (`mcp__playwright-1..10`) default to the **chrome channel** whose Linux path `/opt/google/chrome/chrome` does not exist in this env → launch fails. This is a session-wide infra defect, not a product fault. Per the standing rule, I drove the **validated bundled Chromium** (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) directly via the project's `playwright-core@1.61.1` module. Rendering path (React client `MessageRow` → `PresenceDot`) is identical to what the MCP would exercise; only the driver differs. No `browser_close` was issued against any MCP instance. `testers_spawned: 1` = one browser-driver harness, multiple sequential passes per scenario.

## PresenceDot signature (learned from live DOM + bundle)
The `PresenceDot` component (`N2` in the bundle) renders:
```html
<div class="absolute -bottom-0.5 -right-0.5 rounded-full ..." style="width:12px;height:12px;background-color:#121214">
  <span class="sr-only">Online|Offline</span>
  <div aria-hidden="true" class="rounded-full" data-testid="presence-dot-inner"
       style="width:6px;height:6px;background-color: var(--color-accent-emerald)|var(--color-surface-500)"></div>
</div>
```
Online → inner dot `rgb(16,185,129)` emerald. Offline → `rgb(82,82,91)` grey. Detection: `[data-testid="presence-dot-inner"]` + sibling `.sr-only` "Online"/"Offline".

## Scenario verdict table

| # | Criterion | Expected | Observed (both passes) | Verdict |
|---|-----------|----------|------------------------|---------|
| 1 | AC1/AC2 — online author dot on message row | Fixture's self-authored message row → author avatar shows a PresenceDot (online/emerald, since fixture is connected) | Author avatar column renders **NO PresenceDot at all** — no `presence-dot-inner`, no `sr-only`, no absolutely-positioned dot. Reproduced on 100% of 19 message rows and across every run. | **FAIL** |
| 2 | AC5 — member-panel dots (regression) | Member rows still show presence dots after refactor onto shared PresenceDot | Every member row renders a `presence-dot-inner` dot with `sr-only` label. Grey (offline) in these runs; emerald (online) observed in earlier runs when presence was live. Refactor did NOT break member-panel dots. | **PASS** |
| 3 | a11y (B-6 fix) — presence label reachable | "Online"/"Offline" accessible name exposed, not aria-hidden-suppressed | 3/3 sr-only presence labels reachable, `suppressed: 0`. The `aria-hidden` sits only on the decorative inner dot glyph; the `sr-only` text ancestor is NOT aria-hidden. | **PASS** |

## Scenario 1 — FAIL (author-avatar presence dot absent) — DOM + bundle evidence

**Live DOM of a posted self-message row** (`evidence/s1-pass1.png`, `s1-pass2.png`, `poll-final.png`, `msgrow-nodot-confirm.png`):
```html
<article data-testid="message-row-…" class="msg-row group relative flex gap-3.5 …">
  <div class="relative mt-0.5 shrink-0">
    <div class="… rounded-full …" aria-hidden="true" style="background-color:#3f3f46">21</div>
    <!-- NO PresenceDot element here -->
  </div>
  <div class="flex min-w-0 w-full flex-col">
    <span … >21984eb2-8029-4c1b-9e73-bc586a0be4d2</span>  <!-- author name = raw UUID -->
    …
```
Survey: **19/19 message-row author avatars had zero presence dots.** Polled a fresh self-authored message for 12 s — dot never appeared (`dot:null`, `sr:""` at every tick).

**Root cause (from shipped bundle `index-DBlhKjLW.js`, verbatim):**
The wiring IS present — the message row (`fR`) does mount the presence wrapper next to the avatar:
```js
l.jsxs("div",{className:"relative mt-0.5 shrink-0",children:[
  l.jsx("div",{className:"… rounded-full …","aria-hidden":"true",children:b}),
  l.jsx(dR,{authorId:n.authorId})            // presence wrapper, keyed by authorId
]})
```
The wrapper `dR` renders nothing unless the author is in the presence store:
```js
function dR({authorId:n}){
  const [a] = useState(()=> Xm(n) ? zd(n)==="online" : null);   // Xm(n)=Wu.has(n)
  …
  return a===null ? null : jsx(N2,{online:a});                  // null → NO dot
}
function Xm(n){return Wu.has(n)}          // is author in presence store Map?
function zd(n){return Wu.get(n)??"offline"}
```
So the dot is gated on `Wu.has(authorId)` (author present in the single `/presence` store). During every E2E session the fixture's own `authorId` (`21984eb2-…`) was **not** in `Wu` at message-render time → `dR` returned `null` → no dot. This is the intended "author unknown → NO dot" graceful-degrade branch firing for the author who *should* be online.

**Why the store lookup missed:** live-prod presence is degraded/flaky this session. The member panel repeatedly reported `OFFLINE — 2` (fixture's own presence not registering as online), even after 20 s of polling. In the same conditions the message-row dot cannot appear. In earlier passes the member panel DID show the fixture emerald-online, yet the message-row dot still never rendered in any observed pass — so at minimum AC1/AC2 (self-authored → online dot) is **not demonstrable on live prod**, and the observed behavior is a bare avatar with no dot.

## Scenario 2 — PASS (member-panel dots, regression) — evidence
`evidence/member-panel-pass1.png`, `member-panel-pass2.png`, `server-open.png`. Both passes: every member row carries a `data-testid="presence-dot-inner"` dot + `sr-only` label. States seen: emerald `rgb(16,185,129)` (online, earlier runs) and grey `rgb(82,82,91)` (offline, later runs) — both are valid PresenceDot states. The self-profile chip (bottom-left) also shows an emerald dot on the "ST" avatar. Refactor onto the shared PresenceDot did not regress member-panel dots.

## Scenario 3 — PASS (a11y label reachable, B-6 fix) — evidence
Both passes: `{ total: 3, suppressed: 0, reachable: 3 }`. Every "Online"/"Offline" `sr-only` label is exposed in the accessibility tree — none has an `aria-hidden="true"` ancestor (`srAriaHiddenAncestor: false`). `aria-hidden="true"` sits only on the decorative inner dot `<div data-testid="presence-dot-inner">`, which is correct (the visual glyph is decorative; the `sr-only` text is the accessible name). The B-6 fix (moving aria-hidden off the label's ancestor) holds on live prod.

## Plain-language summary
- **Online presence dots on message-row author avatars: NOT working on live prod.** The code is correctly wired, but the small colored status dot never appears on any message author's avatar — including the tester's own messages, which should show an "online" dot. The dot only appears if the author is currently tracked as present, and during testing the presence system reported the tester as offline (presence on live prod is currently flaky), so the dot stayed hidden. Net effect for a user: message avatars look identical whether the author is online or offline — the wave's headline feature is not observable.
- **Member-list dots: still working** (unchanged by the refactor).
- **Screen-reader labels: correct** — "Online"/"Offline" are announced.

## Note for triage (not a tester fix — Iron Law)
Two candidate defects behind the FAIL, for classification: (1) live-prod presence itself is degraded (fixture's own online state not registering in the `/presence` store — a realtime/WS presence issue), and/or (2) an authorId-vs-presence-key mismatch (message rows key the store by raw `authorId` UUID; member panel keyed the same rows online in earlier passes, so verify the two surfaces use the same key). Either way, on live prod today the AC1/AC2 online-author-dot is unverifiable and the observed behavior is "no dot," which fails the acceptance criterion.

## T-5 re-verification (fix-up cycle 1)

**Re-verified:** 2026-07-01 on LIVE PRODUCTION.
**Target:** https://web-production-bce1a8.up.railway.app/ — **NEW deploy confirmed live**, bundle `assets/index-BAcJ6YNx.js` (both api + web redeployed with the fix). API base `https://api-production-b93e.up.railway.app`.
**Fixture:** `studyhall-e2e-fixture@example.com` / `studyhallfixturea`, password read from `command-center/testing/test-accounts.md` (redacted `***`). Server "Fixture Proof Server" `ad62cd12` → `#general` channel.
**Method:** bundled Chromium (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) via project `playwright-core@1.61.1` (Playwright MCP still fails — chrome channel `/opt/google/chrome/chrome` absent). Login → open server → open channel → post a self-message → DOM-inspect the author avatar of that message row for the PresenceDot. **Key scenario run ×2**; member-panel + a11y checked each run. No shared MCP browser was closed (the `browser.close()` in the driver targets only our own launched Chromium, not an MCP instance).

### The fix is confirmed DEPLOYED (root-cause remediation, both runs)
`GET /profile` now returns the viewer's own `userId`: `{userId, displayName, username, avatarUrl, accentColor}` → `userId = 21984eb2-8029-4c1b-9e73-bc586a0be4d2`. In the prior cycle `ProfileResponse` did not expose `userId`, so the client could not seed the viewer's own presence and `dR({authorId})` returned `null` for self-authored rows. With `userId` present, `seedSelfPresence` puts the viewer into the presence store as ONLINE at session load, so `Wu.has(self)` is now true at message-render time and `dR` renders `N2` (the emerald PresenceDot).

### Re-verification verdict table

| # | Criterion | Prior | Run 1 | Run 2 | Verdict |
|---|-----------|-------|-------|-------|---------|
| 1 | AC1/AC2 — self-author ONLINE dot on message-row author avatar | **FAIL** | author avatar HAS `presence-dot-inner`, inner bg `rgb(16,185,129)` emerald, `sr-only "Online"`; 23/24 rows dotted | same: dot present, `rgb(16,185,129)`, `sr-only "Online"`; 24/25 rows dotted | **PASS** (fix worked) |
| 2 | AC5 — member-panel dots (regression) | PASS | 25 `presence-dot-inner` dots, all emerald `rgb(16,185,129)` | 26 dots, all emerald | **PASS** (unregressed) |
| 3 | a11y — presence label reachable | PASS | 26 `sr-only` "Online" labels, `suppressed: 0`, reachable 26 | 27 labels, `suppressed: 0`, reachable 27 | **PASS** (unregressed) |

### Scenario 1 — PASS — DOM evidence (the fix under test)
Author-avatar column of the fixture's own just-posted message row (`reverify-s1-r1.png`, `reverify-s1-r2.png`), verbatim from live DOM:
```html
<div class="relative mt-0.5 shrink-0">
  <div class="flex h-10 w-10 items-center justify-center rounded-full ..." aria-hidden="true"
       style="background-color: rgb(63, 63, 70); ...">21</div>
  <div class="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center pointer-events-none"
       style="width:12px;height:12px;background-color:rgb(18,18,20);">
    <span class="sr-only">Online</span>
    <div aria-hidden="true" class="rounded-full" data-testid="presence-dot-inner"
         style="width:6px;height:6px;background-color: var(--color-accent-emerald);"></div>
  </div>
</div>
```
Computed inner-dot `background-color = rgb(16, 185, 129)` (emerald / ONLINE) in BOTH runs. The PresenceDot element now EXISTS on the author avatar and is in the ONLINE state — the exact element that was absent in the prior cycle. `matchedOwnMsg: true` both runs (the inspected row is the fixture's own freshly-posted message). Consistent across 2/2 runs — no flake.

### Scenario 2 + a11y — PASS (unregressed)
`reverify-s2-r1.png`, `reverify-s2-r2.png`. Member/presence dots: 25 (run 1) / 26 (run 2), every one emerald `rgb(16,185,129)`. `sr-only` "Online" labels: 26 / 27, `suppressed: 0` → all presence labels reachable in the accessibility tree; `aria-hidden="true"` sits only on the decorative inner-dot glyph. No regression from the self-presence-seed fix.

### Plain-language re-verification summary
- **The self-author online dot NOW renders on live prod — the fix worked.** After logging in and posting a message, the tester's own message avatar shows a small emerald "online" dot, and screen readers announce "Online". This is exactly what failed before and is now working, reproduced on both runs.
- **Member-list dots and screen-reader labels are unchanged** — still working, no regression introduced by the fix.
- Net: the wave's headline feature (presence dots on message-author avatars) is now observable on live production.

```yaml
test_pattern: active
skipped: false
testers_spawned: 1
fix_up_cycles: 1
reverification:
  cycle: 1
  date: 2026-07-01
  target: https://web-production-bce1a8.up.railway.app/
  bundle: assets/index-BAcJ6YNx.js
  fix_confirmed_deployed: true
  fix_evidence: "GET /profile now returns userId (21984eb2-...); seedSelfPresence marks viewer ONLINE in presence store at session load; dR(authorId) now renders emerald PresenceDot on self-authored rows"
  runs: 2
  scenarios:
    - {id: 1, criterion_ref: AC1-AC2-online-author-dot, prior_verdict: FAIL, verdict: PASS, run1: PASS, run2: PASS, evidence_path: process/waves/wave-26/stages/evidence/reverify-s1-r1.png, dom: "author-avatar presence-dot-inner bg rgb(16,185,129) emerald + sr-only Online, matchedOwnMsg true, both runs"}
    - {id: 2, criterion_ref: AC5-member-panel-dots-regression, prior_verdict: PASS, verdict: PASS, run1: PASS, run2: PASS, evidence_path: process/waves/wave-26/stages/evidence/reverify-s2-r1.png}
    - {id: 3, criterion_ref: a11y-label-reachable, prior_verdict: PASS, verdict: PASS, run1: PASS, run2: PASS, evidence_path: process/waves/wave-26/stages/evidence/reverify-s2-r1.png}
  flakes_observed: []
scenarios:
  - {id: 1, criterion_ref: AC1-AC2-online-author-dot, verdict: PASS, evidence_path: process/waves/wave-26/stages/evidence/reverify-s1-r1.png}
  - {id: 2, criterion_ref: AC5-member-panel-dots-regression, verdict: PASS, evidence_path: process/waves/wave-26/stages/evidence/reverify-s2-r1.png}
  - {id: 3, criterion_ref: a11y-label-reachable, verdict: PASS, evidence_path: process/waves/wave-26/stages/evidence/reverify-s2-r1.png}
findings:
  - {id: F1, severity: major, criterion: AC1-AC2, status: RESOLVED, resolved_cycle: 1, summary: "PRIOR: message-row author avatar rendered NO PresenceDot (dR returned null — viewer's own userId not in presence store because ProfileResponse omitted userId). FIX: ProfileResponse now returns userId + client seedSelfPresence marks viewer ONLINE at session load. RE-VERIFIED live prod (bundle index-BAcJ6YNx.js), 2/2 runs: self-authored message-row author avatar now shows emerald (rgb(16,185,129)) PresenceDot + sr-only Online. AC1/AC2 satisfied on live prod."}
```
