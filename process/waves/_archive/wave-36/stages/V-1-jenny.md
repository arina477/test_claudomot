# V-1 Semantic-Spec Verification (jenny) — wave-36 (M7 test-hardening)

**Verdict: APPROVE**

Authoritative spec: `tasks.description` of `622a7bf3-94ff-464b-ad14-b37bcedf290d` (3-block multi-spec).
Method: read the delivered tests + docs + source SUTs, confirmed the assertions fulfill the spec's INTENT (not mere file existence — that's Karen's lane), verified the integration tier provably executed against real Postgres in CI, and confirmed the live deploy renders the corrected date.

---

## Spec 1 — Regression tests (622a7bf3): APPROVE — all 5 ACs semantically fulfilled

Every AC maps to a test whose assertions match the stated intent, and each test exercises the **real SUT** (no mock-the-SUT).

**AC-1 (roster nobody-hiding, real-PG):** `apps/api/test/integration/privacy-visibility-authz.spec.ts`
- Imports `pg-harness` first (line 18), instantiates the **real** `ServersService` (line 32/56) and calls the real `listServerMembers` — which runs the actual filter at `apps/api/src/servers/servers.service.ts:253` (`r.profileVisibility !== 'nobody' || r.userId === userId`). Not a mocked db.
- `A='nobody'` → excluded from B's roster (`.not.toContain(USER_A_ID)`, `length===1`) while A still sees self (`toContain(USER_A_ID)`, `length===2`) — spec intent exactly (lines 97-116).
- Before/after delta test (lines 118-134): baseline B-roster length 2 → 1 after A sets nobody — the "provable real-DB delta" the P-0 BINDING demanded.
- `everyone` and `server-members` → A visible to B (lines 143-174). Matches AC.
- Sanity test asserts `countRows('server_members') >= 2` (lines 84-87) — guards the false-green/silent-skip failure mode named in AC-5.

**AC-2 (data-export IDOR self-scoping, real-PG):** `apps/api/test/integration/account-data-export-idor.spec.ts`
- Real `AccountDataService` against real PG. `getAccountData(A)`/`exportAccountData(A)` return only A's data; B (no memberships) never sees SERVER_A; distinct users resolve to disjoint responses (lines 93-190). Sanity `countRows('users') >= 2`.
- Note on intent-coverage: the integration test proves the **service** is userId-param-scoped; the *actual IDOR defense* (userId sourced from `req.session.getUserId()`, never from `?userId`) is proven at the controller layer — see AC-2's dedicated controller test below. Together they cover the spec intent ("supplying ?userId=<B> does NOT change the result … not stubbed in a way that bypasses the assertion"). This is the exact split the B-6 fixup (M2) added, and it is the correct division of labor. No gap.

**Controller session-scoping (the real IDOR defense):** `apps/api/src/privacy/privacy.controller.spec.ts:202-252`
- `getAccountData`/`exportAccountData` assert `toHaveBeenCalledWith('session-scoped-id-99')` — userId comes from session, and an attacker-supplied body/query id cannot substitute it. This is the honest defensive assertion, not a tautology.

**AC-3 (enum-400 controller contract):** `apps/api/src/privacy/privacy.controller.spec.ts:80-179`
- Invalid `profileVisibility='invalid-value'` / invalid `whoCanDm` / empty / null / partial bodies all → `BadRequestException` (400) **and** `expect(privacyService.updatePrivacy).not.toHaveBeenCalled()` — i.e. Zod `safeParse` rejects *before any DB write*, which is precisely the AC's "before any DB write" intent. Valid body → 200 + delegates with session userId. Matches AC.

**AC-4 (unit — toUiVisibility / updatePrivacy / scrubPii):**
- `toUiVisibility`: `apps/web/src/pages/SettingsPrivacyPage.test.tsx` — total over the enum: everyone→everyone, server-members→everyone, nobody→nobody; imports the **real** exported fn (`SettingsPrivacyPage.tsx:59`). Matches "honest-collapse" intent.
- `updatePrivacy` persists **both** columns: `apps/api/src/privacy/privacy.service.spec.ts:138-156` captures the `.set()` payload and asserts both `profile_visibility` AND `who_can_dm` present (+ `updated_at` a Date, +re-read semantics). Matches AC.
- `scrubPii`: `privacy.service.spec.ts:214-309` imports the **real** `scrubPii` from `apps/api/src/instrument.ts` (confirmed exported at instrument.ts:7; `beforeSend: scrubPii` at instrument.ts:50 — same function Sentry uses, no replica). Asserts deletion of `user.{email,username,ip_address}` + `request.{data,cookies}`, non-PII preserved, returns the same event ref. Matches AC. The B-6 M1 fixup (extract real `scrubPii`, stop testing a drift-prone copy) is the correct honest-test move.

**AC-5 (integration tier PROVABLY executed against real Postgres — not skipped/no-op):** VERIFIED IN CI
- CI workflow provisions `postgres:16` service + `DATABASE_URL_TEST` (`.github/workflows/*.yml:35-53`); `pnpm test:ci` runs `vitest run --config vitest.integration.config.ts` after the unit pass.
- PR CI run **28611692591** (branch `wave-36-privacy-tests`, success): both new specs executed with real per-test timings (45-68ms), NOT skipped — e.g. `privacy-visibility-authz.spec.ts … 'nobody': A is excluded … 68ms`, `account-data-export-idor.spec.ts … IDOR structural proof … 45ms`. Integration tier reported `Test Files 30 passed / Tests 507 passed`. Sanity row-count assertions (`>=2`) ran green, proving real rows, not an empty-roster vacuous pass. This directly satisfies the wave-17/wave-24 "green is not enough — the tier must have run" bar. Re-verified on `main` at C-block (run 28612286928) and T-block (28612547810).

Contracts honored: no endpoint/schema/type changes (reuses `PrivacySettingsResponse`; tests target existing routes; seeds via pg-harness fixtures).

---

## Spec 2 — states-AC re-scope docs (73e96a9d): APPROVE

- Product-decisions entry recorded: `command-center/product/product-decisions.md:447-450` explicitly re-scopes the DESIGN-SYSTEM §113 empty/error/loading-states requirement OFF the non-existent notifications surface, names the 4 in-scope surfaces that exist (channel feed, assignments, profile, study-rooms), cites the basis (wave-35 V-1 jenny spec-gap F1 + T-9 honest N/A), and sets a forward trigger (apply §113 when a notifications UI is actually built). Matches AC intent (spec-hygiene DOCS change, no code).
- Consistent with the journey map: `command-center/artifacts/user-journey-map.md` has no notifications *route/screen* — notifications shipped backend-only (cron+email, wave-30, line 243); the wave-35 T-9 entry (line 21) and routes summary (line 319) both record "notifications-panel surface does not exist → states AC N/A." No contradiction. No code changed (confirmed — this block of the PR is docs-only).

---

## Spec 3 — stub-date fix (b7feab30): APPROVE (verified on the LIVE deploy)

- Source: `apps/web/src/pages/PrivacyPage.tsx:40` and `TermsPage.tsx:40` both render `Last updated: 2026`.
- LIVE deploy: fetched the deployed SPA bundle `https://web-production-bce1a8.up.railway.app/assets/index-BDKrrUxG.js` — contains exactly **2× `Last updated: 2026`** (one per page) and **zero** `Last updated: 2024`. Spec intent ("render the current year 2026, not 2024") is met on the deployed artifact.
- Method note: the pages are client-rendered; MCP Playwright chrome is absent in this environment (same condition the T-5 note records), so I verified the exact rendered string from the deployed JS bundle rather than a headless render. The string is a literal in the bundle, so this is a faithful check of what the live page shows.

---

## Boundary regression check (spec intent: wave shouldn't change enforcement): APPROVE

- This is a test-hardening + docs + cosmetic wave; the only apps/web/apps/api *behavior* touched is the two 1-line date strings. The privacy-enforcement SUTs (`servers.service.ts:253` filter, `AccountDataService`, `PrivacyController` session-scoping, `scrubPii`) are unchanged — the new tests exercise them as-shipped in wave-35. The regression suite now *locks in* the wave-35 boundary (profile-visibility enforced server-side, export self-scoped, enum→400-before-write, PII scrub), which is the wave's stated purpose. No enforcement drift.

---

## Drift vs Gap

- **Spec-drift (delivered work wrong): NONE found.** Every AC's test asserts the spec's intent against the real SUT; docs entry matches; live date corrected.
- **Spec-gap (spec wrong / unanticipated): NONE material.** One benign observation: AC-2 phrases the IDOR proof as "supplying ?userId=<B> does NOT change the result," but the real route has no `?userId` param at all — so the honest proof is *structural* (userId is session-only, there is nothing to override). The delivery correctly proves this structurally at the controller layer (`privacy.controller.spec.ts`) plus service self-scoping at the integration layer. The spec's phrasing anticipated a param that doesn't exist; the tests fulfill the underlying intent (no cross-account leakage) more honestly than a literal `?userId` toggle would. Not a defect — noting for the record.

**APPROVE.**
