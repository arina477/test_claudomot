# Wave 25 — B-5 Verify

**Stage:** B-5 (Local verification before B-6 review gate).
**Branch:** wave-25-mention-parity @ `53162de`.

## Action 1 — Lint with auto-fix
`biome check --write` applied by specialists during B-4/B-5 defect fixes. Repo-root `pnpm lint` (= `biome ci .`): **0 errors, 7 warnings, exit 0**. The 7 warnings (noNonNullAssertion in useTyping.ts / multiPageCatchup.test.ts) are pre-existing and identical to main's last green CI — not this wave's. No further auto-fixes needed; nothing to commit.

## Action 2 — Unit tests
- **API** (`pnpm --filter @studyhall/api test`): **395 passed / 395**. mentions.spec editMessage describe (transaction mock) green. Integration tier (rollback spec) is CI-gated (no local DATABASE_URL_TEST) — correctly excluded from the unit run, exercised at T-4/C-1.
- **WEB** (`pnpm --filter @studyhall/web test`): **233 passed** after flake resolution (was 216 baseline + 5 wave-25 MessageList mention tests + 12 mention-slug-parity contract cases). 
  - **Flake documented (Iron Law: not this wave's defect).** First full run showed `1 failed / 233`: `server-roles.test.tsx:233 "shows 409 conflict error on save rejection"` (RBAC role-editor, 2523ms, timing-sensitive). NOT in this wave's diff (`git diff --name-only origin/main..HEAD` — absent); last touched wave-23 (`489c86a`). Re-run protocol: run 1 = 1 failed, run 2 = 24/24 clean → confirmed pre-existing intermittent flake. Documented, proceeding per B-5 Action 2. → L-1 observation candidate (flaky RBAC role-editor test).

## Action 3 — Build
`pnpm -w turbo run build --force`: **3/3 packages successful** (@studyhall/shared, @studyhall/api, @studyhall/web).
- **Build defect found + resolved (B-3 re-entry).** Initial B-5 build FAILED: vite/rollup could not resolve the runtime value `extractMentionSlug` from the CJS-only `@studyhall/shared` (`dist/index.js`; cjs-module-lexer misses the `Object.defineProperty` re-export getter). Typecheck/vitest passed (they resolve source .ts / handle CJS) — only the production bundler hit it.
  - **Classification:** `build` tag → B-3 defect. Root cause: the web bundle cannot import runtime VALUES from the CJS shared package; the codebase has a documented **"CJS avoidance pattern"** (messagingSocket.ts:32-40) — web imports types only, mirrors runtime constants locally. B-3 violated it by importing a shared function.
  - **Iron Law routing:** re-entered B-3 via `typescript-pro` (owns contracts/shared-types/tsconfig; authored B-1). Fix (commit `53162de`): web-local mirror `apps/web/src/shell/mentionSlug.ts` (+ header comment naming the pattern), MessageList.tsx imports the local module, and a **parity contract test** `mention-slug-parity.test.ts` (12 cases) importing BOTH the shared + local `extractMentionSlug`/`MENTION_TOKEN_SLUG_SRC` and asserting identity — so single-source-of-truth is enforced by a RED test on any drift. `@studyhall/shared` build/package.json left unchanged (protects the NestJS api's CJS consumption). apps/api keeps importing the shared value directly (CJS→CJS works).
  - **Approach deviation from P-3 plan** (web planned to import shared directly): recorded here + in the typescript-pro report; the wave's anti-drift intent is preserved via the contract test rather than a physical single import. Surfaces to B-6 / V gate for blessing.

## Action 4 — Dev-server smoke
Headless equivalent (pure token-parser + txn change; no new route/UI surface — the MentionPill component is unchanged, only which token resolves to it): coverage is the component tests. `messaging.test.tsx` renders MessageList with resolved/unresolved mentions (AC2 pill+`.dev` trailing; AC3 no false pill, mentionMap-gated) — all green. editMessage transaction path has unit coverage (mentions.spec editMessage describe) + a real-PG rollback integration spec (CI-gated). No browser smoke warranted for this surface.

## Verify footer
```yaml
lint_passed: true                     # biome ci: 0 errors, 7 pre-existing warnings
unit_tests_passed: true               # api 395/395; web 233/233 (post-flake-rerun)
build_passed: true                    # turbo build 3/3 (after B-3 re-entry, 53162de)
dev_smoke_passed: true                # component-test equivalent (no new route/UI surface)
flakes_documented:
  - file: apps/web/src/shell/server-roles.test.tsx
    test: "shows 409 conflict error on save rejection"
    note: pre-existing (wave-23 489c86a), timing flake, passes on re-run, not in wave-25 diff → L-1 candidate
defects_resolved:
  - stage: B-2
    kind: organizeImports lint-gate failure
    commit: 2a1f2dd
  - stage: B-3
    kind: vite build fails on CJS runtime-value import from @studyhall/shared
    resolution: web-local mirror + parity contract test (CJS-avoidance convention)
    commit: 53162de
last_commit_sha: 53162de
```

## Exit
Lint green, api+web unit green (one unrelated pre-existing flake documented), build green, smoke covered. Two B-block defects caught here + at B-4, both routed to specialists and resolved (Iron Law), pushed. → B-6 Review (head-builder gate + /review).
