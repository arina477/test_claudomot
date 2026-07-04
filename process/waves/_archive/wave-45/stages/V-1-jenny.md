# V-1 — jenny (semantic-spec verifier) — wave-45

**Block:** V (Verify) · **Stage:** V-1 · **Role:** jenny (spec-INTENT match, drift-vs-gap) · **Mode:** automatic
**Wave:** 45 — M8 tech-debt HYGIENE (no product/UX/data surface). Deployed: https://web-production-bce1a8.up.railway.app (merge ae22380).
**Spec source of truth:** DB row `tasks.id = 67881a58-...` (multi-spec covering 67881a58 runner + 4e994e96 biome). Fetched live; DB row read directly, not the pointer copy.

## Verdict: **APPROVE**

Deployed behavior matches P-2 spec INTENT for both claimed tasks. No spec drift found. No spec gap that blocks. Two pre-existing test-honesty/coverage items (F1, F2) are correctly scoped OUT of wave-45 and routed to V-2 as debt — not wave-45 spec violations. Evidence below; every finding cites the spec AC and the observed behavior.

---

## Task 67881a58 — Playwright runner → bundled chromium

**AC1** — *"launches BUNDLED chromium by default across all three projects … no longer resolves the Google Chrome channel."*
MATCH. `apps/web/playwright.config.ts` sets `channel: undefined` on all three projects — setup (line 46), chromium-smoke (line 52), chromium-authed (line 62) — each overriding the `channel: 'chrome'` pinned by the `...devices['Desktop Chrome']` spread. The Chrome channel is neutralised on every project. No spread-then-forget: the `channel: undefined` override sits AFTER the spread in each `use` block, so it wins.

**AC2** — *"running the repo E2E command launches + executes WITHOUT 'executable doesn't exist / channel not found' AND without any per-spec/inline executablePath override / manual bypass."*
MATCH — proved by T-5, re-verified here. T-5 ran the canonical fixed runner (`pnpm --filter @studyhall/web e2e`, both smoke-only and full-authed) directly against the live deploy WITH the broken ambient `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` present: exit 0, 5/5 green, no channel/executable-not-found error, no bypass. This exercises exactly what AC1/AC2 require — the config-resolution path (`pnpm e2e` / `playwright test`), NOT the separate `.mcp.json --browser chromium` path (which AC's edge-case note explicitly excludes from this task). The runner-fix acceptance is the load-bearing claim and T-5's proof is faithful to it: it invokes the runner under test, observes the launch, and runs real specs against prod. Independent re-check: `grep -rn executablePath apps/web` → **0 non-node_modules matches** (confirmed this session). No inline bypass anywhere.

**AC3** — *"no committed E2E spec under apps/web/e2e/ requires an inline executablePath or channel workaround; config is the single source of the browser binary."*
MATCH. The three specs (`auth.setup.ts`, `create-server.spec.ts`, `delete-any-message.spec.ts`) + `smoke.spec.ts` contain zero `executablePath` and zero Playwright `channel` overrides. (The `channel` grep hits inside the specs are all prose references to StudyHall's product concept of a "channel sidebar" / message channel — not Playwright browser-channel config. Verified by reading each hit: e.g. `create-server.spec.ts:58 getByTestId('channel-sidebar')`.) Config is the single binary source.

**AC4** — *"does NOT hardcode a versioned cache path (chromium-1208); uses managed resolution so a Playwright bump re-resolves."*
MATCH. `playwright.config.ts:14` sets `PLAYWRIGHT_BROWSERS_PATH = path.join(os.homedir(), '.cache', 'ms-playwright')` — the versionless managed cache ROOT, not a `chromium-1208`/`chromium-1228` versioned subdir. Playwright resolves the version-specific build under that root itself, so a Playwright bump re-resolves without a config edit. This matches the P-3 rejected-alternative rationale (hardcoded `executablePath` to versioned path REJECTED for pin-staleness). No versioned path is hardcoded anywhere in the config.

**Intent note (not a defect):** the spec's stated fix was "drop the channel pin so managed bundled chromium is used." The as-shipped implementation does that (`channel: undefined` x3) AND additionally pins the browsers-path ROOT at config load to neutralise a broken ambient `PLAYWRIGHT_BROWSERS_PATH`. This is a strict superset of the spec intent, not a drift: AC2 explicitly requires the command to work "WITHOUT a channel/executable error" — and the broken ambient var was the real-world blocker every UI wave hit. The added line serves AC2's intent (runner must actually launch) and honours AC4 (versionless root). No divergence from spec intent; the config header comment (lines 5-14, 16-30) documents the reasoning accurately.

---

## Task 4e994e96 — biome hygiene (behavior-preserving)

**AC1** — *"biome ci on useTyping.ts + ServerRolesPage.tsx reports 0 warnings (was 6 noNonNullAssertion)."*
MATCH. Ran `biome ci` on both files this session → **"Checked 2 files … No fixes applied"**, exit clean, 0 warnings. `grep '!\.'` in `useTyping.ts` → no `!.` sites remain. The 6 non-null assertions are gone.

**AC2 + edge-cases** — *"6 non-null assertions replaced with behavior-PRESERVING safe access; output byte-identical for 0/1/2/3/4+; do NOT use `?.`."*
MATCH. Read `buildTypingLabel` (`useTyping.ts:65-84`). The `!` sites were replaced with `const a = typers[0] as Typer` (typed casts), NOT optional chaining — verified no `?.` in the function. Traced every branch against the spec's enumerated strings (semantic byte-identity):
- length 0 → `return ''` — spec `''` ✓
- length 1 → `` `${a.displayName} is typing` `` — spec `'<a> is typing'` ✓
- length 2 → `` `${a.displayName} and ${b.displayName} are typing` `` — spec `'<a> and <b> are typing'` ✓
- length 3 → `` `${a.displayName}, ${b.displayName} and ${c.displayName} are typing` `` — spec `'<a>, <b> and <c> are typing'` ✓ (note the comma-then-"and" Oxford-less join matches exactly)
- length 4+ → `return 'Several people are typing'` — spec `'Several people are typing'` ✓

Each cast sits inside its `typers.length === N` guard exactly as the pre-change `!` did, so the accessed index is always present — the cast is a lint-clean assertion of a truth the guard already establishes. Output is byte-identical across all five branches. The `?.` anti-approach (which would emit literal 'undefined' text on a genuinely-absent index) was correctly avoided. A source read is sufficient here (byte-identical intended output, pure render-string builder); no live typing spot-check needed to establish spec-match, though Fixture-A remains available.

**AC3** — *"the 4 useKeyWithClickEvents suppressions in ServerRolesPage are VERIFIED live; original 'x3 unused' claim is STALE; remove only if biome confirms unused."*
MATCH. `grep` confirms all 4 `biome-ignore lint/a11y/useKeyWithClickEvents` suppressions retained (lines 215, 354, 517, 628), each with a real justification (backdrop click-to-close progressive enhancement; aria-hidden presentation div mirroring a hidden input). `biome ci` on the file reports 0 warnings WITH them present → they are LIVE (removing one would reintroduce the warning). None removed, correctly — matches the spec's "retain live/justified suppressions" directive and confirms the original "x3 unused" claim was stale as the spec reframed.

**AC4** — *"no new biome warnings/errors introduced anywhere; biome ci on changed files stays clean."*
MATCH. `biome ci` on both changed files clean (0 warnings, this session).

---

## Journey continuity (T-9 / user-journey-map)

MATCH — no drift introduced. T-9 correctly skipped journey-regen (`journey_regen_skipped: true`): wave ships no route/screen/DOM change; the only code delta is a byte-identical hook refactor + test-infra config (not in the shipped bundle). The map got an annotation-only bump (0.31 → 0.32) recording the runner fix RESOLVED + biome cleanup. This is a hygiene wave with no user-facing surface delta, and the journey map still reflects as-shipped. Confirmed no spec-intent drift leaked into the journey inventory.

---

## Findings (enumerated; drift vs gap)

- **F1 (low — spec GAP, non-blocking, correctly deferred):** the spec's edge-case enumeration for `buildTypingLabel` (0/1/2/3/4+) has no dedicated unit/table test asserting the five strings. This is a coverage gap the spec did not require as an AC (byte-identity is asserted, not test-pinned). T-9 routed it to V-2 as debt. NOT a wave-45 spec violation — the shipped output matches spec intent exactly by source trace; the gap is only in regression pinning. No drift.
- **F2 (medium — pre-existing wave-44 debt, OUT of wave-45 scope):** `delete-any-message.spec.ts` two-client fan-out is a soft-check (logged NOT_DELIVERED_IN_WINDOW, passes regardless). This spec is NOT part of either wave-45 claimed task (runner config + biome); it is pre-existing wave-44 code that T-5 ran as incidental coverage. Its RBAC/IDOR assertions are hard and green. Correctly scoped out and routed to V-2. Not a wave-45 spec-match issue.

No **spec drift** (code doing something different from spec) found on either task. Both F1/F2 are gaps/debt outside the wave-45 spec contract.

---

## Pointer-copy divergence check
The convenience pointer `process/waves/wave-45/stages/P-2-spec.md` was not treated as authoritative; verification ran against the DB row. No divergence to flag (DB row read directly). No P-2 defect.

```yaml
v1_reviewer: jenny
verdict: APPROVE
tasks_verified: [67881a58-aceb-4ccb-95e7-772e8f306dd4, 4e994e96-7935-4ebf-95ad-1551a087b6c6]
acs_matched: [67881a58/AC1, 67881a58/AC2, 67881a58/AC3, 67881a58/AC4, 4e994e96/AC1, 4e994e96/AC2, 4e994e96/AC3, 4e994e96/AC4]
spec_drift: []
spec_gaps:
  - {id: F1, severity: low, kind: gap, disposition: "V-2 debt (byte-identity holds by source trace; no test pin)"}
  - {id: F2, severity: medium, kind: out-of-scope-debt, disposition: "V-2 debt (pre-existing wave-44, not a wave-45 claimed task)"}
byte_identity_verified: true
biome_clean: true
executablePath_in_repo: 0
channel_undefined_projects: 3
versioned_path_hardcoded: false
pointer_copy_divergence: none
live_spotcheck_performed: false
live_spotcheck_reason: "byte-identical intended output + pure render-string builder; source read of buildTypingLabel sufficient per prompt guidance"
```
