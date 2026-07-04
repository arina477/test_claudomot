# V-1 Karen — load-bearing-claim verification (wave-45, M8 tech-debt HYGIENE)

**Verdict: APPROVE**
**Reviewer:** Karen (load-bearing-claim verifier)
**Wave:** 45 — M8 tech-debt HYGIENE (2 V-2 follow-ups: Playwright bundled-chromium + biome hygiene)
**Merge commit:** `ae22380c7809f1625b26431752ead4afd9b8558b` (confirmed ancestor of `HEAD` on `main`; log shows `ae22380 test: default Playwright runner to bundled chromium + biome hygiene (wave-45) (#59)`)
**Scope:** claim-truth only. Spec conformance is jenny's lane; I verify the claims are REAL against the committed/deployed tree, not paraphrased.

Every concrete claim in the prompt was checked against the merge-commit tree (`git show ae22380:<path>`) and, where runnable, against live tooling. **Zero contradictions found.** This is a small hygiene wave and a clean verdict is the honest outcome — evidence below, not assumed.

---

## Findings — all CONFIRMED (no REJECT-class findings)

### Claim 1 — playwright.config.ts defaults to bundled chromium — CONFIRMED
- **Claim** (spec AC1 + prompt): `channel: undefined` on all 3 projects (setup, chromium-smoke, chromium-authed); config-level `PLAYWRIGHT_BROWSERS_PATH` override present; NO hardcoded versioned cache path; `channel: 'chrome'` not resolved into `use`.
- **Evidence** (`git show ae22380:apps/web/playwright.config.ts`):
  - Line 46 (`setup`), line 52 (`chromium-smoke`), line 62 (`chromium-authed`): each `use` spreads `...devices['Desktop Chrome']` then overrides `channel: undefined`. `grep -c "channel: undefined"` → **3**. The `undefined` override lands AFTER the `Desktop Chrome` spread, so the channel:'chrome' that the device pins is neutralised in every project.
  - Line 15: `process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(os.homedir(), '.cache', 'ms-playwright')` — config-level override present, set at module load (every invocation), base dir via `os.homedir()`.
  - `grep -nE 'chromium-12|chromium-1208|executablePath'` on the config → **NONE FOUND**. No hardcoded versioned path; a Playwright version bump re-resolves under the base dir. AC4-safe.

### Claim 2 — package.json e2e / test:e2e scripts, no inline bypass — CONFIRMED
- **Claim**: e2e / test:e2e scripts present, invoke `playwright test`, no inline executablePath / channel bypass.
- **Evidence** (`git show ae22380:apps/web/package.json`): line 13 `"e2e": "npx playwright test"`, line 14 `"test:e2e": "npm run e2e"`. Both resolve to `playwright test` with no `--executable-path`, no `PWCHROME`/channel env prefix (the earlier B-3-rework env-prefix was intentionally removed at the B-6 fix commit and the browsers-path moved into the config — corroborated by the merge commit body). Single source of browser binary = the config.

### Claim 3 — useTyping.ts buildTypingLabel: 0 non-null assertions, casts used, byte-identical — CONFIRMED
- **Claim** (spec AC for 4e994e96 + prompt): the 6 `typers[N]!.displayName` non-null assertions replaced with element-type casts (`typers[N] as Typer`), byte-identical output, no `?.`.
- **Evidence**:
  - Old (`git show ae22380^1:...useTyping.ts`) had exactly 6 `!` sites: `typers[0]!` / `typers[1]!` / `typers[2]!` across the 1/2/3 branches.
  - New (`git show ae22380:...useTyping.ts`, lines 65-84): `type Typer = (typeof typers)[number]` declared; each index bound as `const a = typers[0] as Typer` etc. `grep -cE '!\.'` on the whole file → **0**. `grep -cE '\?\.'` → **0** (no optional chaining introduced — so no "undefined" text regression, matching the spec's explicit "Do NOT use `?.`" constraint).
  - **Byte-identical output proof** (`git diff ae22380^1 ae22380 -- useTyping.ts`): template literals, guard order (`=== 0/1/2/3`), and return strings are unchanged for all 5 buckets — `'' / '<a> is typing' / '<a> and <b> are typing' / '<a>, <b> and <c> are typing' / 'Several people are typing'`. Only the access mechanism changed (`!` → cast + local binding). This is a behavior-preserving lint refactor exactly as claimed, not a functional change.
  - **biome ci** (`npx @biomejs/biome ci apps/web/src/shell/useTyping.ts apps/web/src/shell/ServerRolesPage.tsx`, run from repo root — the repo's own `lint` script is `biome ci .`) → **"Checked 2 files in 24ms. No fixes applied."** = **0 warnings, 0 errors** on both files. The 6 noNonNullAssertion warnings are gone.
  - Note: the prompt's suggested `pnpm --filter @studyhall/web exec biome ci apps/web/...` command double-resolves the path (cwd=`apps/web`) and fails with `os error 2` — that is a command-construction artifact, NOT a code problem; running biome from repo root against the same two files is clean. Flagging so the failing command is not mistaken for a real warning.

### Claim 4 — ServerRolesPage.tsx 4 suppressions retained + LIVE — CONFIRMED
- **Claim**: the 4 `biome-ignore lint/a11y/useKeyWithClickEvents` suppressions are still present (retained) and biome reports 0 warnings for the file (they are live, not dead).
- **Evidence**: `grep -nE 'biome-ignore lint/a11y/useKeyWithClickEvents' apps/web/src/shell/ServerRolesPage.tsx` → **4 hits** at lines 215, 354, 517, 628 (working tree == merge tree; file is NOT in the wave diff). The biome ci run above reports **0 warnings** for the file *while the 4 suppressions remain in place* — biome 1.9 flags unused suppressions, so a clean file that still contains them proves each suppression is live/justified (removing any would re-surface a real useKeyWithClickEvents warning). The stale "x3 unused" origin claim is correctly overridden; suppressions retained per spec.

### Claim 5 — .mcp.json untouched, still `--browser chromium` — CONFIRMED
- **Claim**: `.mcp.json` NOT in the wave diff; still carries `--browser chromium` from wave-42.
- **Evidence**: `git show ae22380 --stat` file list (13 files) does **not** include `.mcp.json` — confirmed via `grep '\.mcp\.json'` on the stat → NOT in diff. `git log -1 --oneline -- .mcp.json` → last touched by `ef09b86 verify(wave-42) ... V-1 Karen+jenny APPROVE` (wave-42, not this wave). Current file: all 10 `playwright-N` servers pass `["--browser", "chromium"]`. Untouched and correct.

### Claim 6 — deploy hash serves merge commit; C-2 internally consistent — CONFIRMED
- **Claim**: web service serves merge commit ae22380 (verified at C-2; cross-check the deliverable is internally consistent — no need to re-hit Railway).
- **Evidence** (`process/waves/wave-45/stages/C-2-deploy-and-verify.md`): deployment `47453bab-2420-4db0-98b7-f1378c9806c7`, `status: SUCCESS` (not SKIPPED), `meta.commitHash: ae22380c7809...` == merge commit (line 21). Health `/` and `/health` both HTTP 200 (lines 25-26). Footer `ci_stage_verdict: PASS`, `verdict_source: railway`, `deploy_targets[0].commit == ae22380...`, `state: SUCCESS` — internally consistent, no field contradicts another. Rollback target (a406cb58 / 4522101f) captured before cutover. Only web deployed (only `apps/web` changed) — consistent with the merge stat (all source changes under `apps/web/`). Not independently re-hit per prompt instruction.

---

## Antipattern sweep (claimed-but-fake / decorative / deferred-but-undocumented)
- **claimed-but-fake:** none. Every claimed change is present in the committed tree and produces the claimed effect (channel neutralised ×3, browsers-path override present, 6 assertions gone, biome clean). No stubbed/mocked "done" markers.
- **decorative:** none. No dead config, no no-op suppressions (the 4 retained suppressions are proven live), no leftover executablePath scaffolding (the B-3 env-prefix was removed at B-6 and superseded by the config-level path — corroborated by the merge body).
- **deferred-but-undocumented:** none. Scope was hygiene-only; nothing silently punted. The one forward-looking item (wave-46 must not be a 3rd consecutive debt-only wave) is explicitly documented in the spec provenance, not hidden.

## Verdict
**APPROVE.** All six enumerated claims are TRUE against the merge-commit tree and live tooling, each backed by file:content or command-output evidence above. No claimed-but-fake, decorative, or undocumented-deferral findings. A clean verdict on a change this small is the correct outcome and is evidence-backed, not assumed.
