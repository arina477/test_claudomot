# Wave 75 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, gate reviewer — Phase 1)
**Reviewed against:** process/waves/wave-75/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The M9 mock-payment freemium wave is contract-locked, guard-composed, and fail-closed on every payments door I could reproduce from the tests — not just code-read. The tier-change path validates the body (400) → checks the server exists (404) → checks ownership on the opaque `getUserId()` (403) → and only THEN invokes the provider write; `billing.controller.spec.ts` asserts the non-owner case throws `ForbiddenException` AND that `startTierChange` is `not.toHaveBeenCalled()` (no write, no IDOR), and the same for 400/404. The educator-tools gate is proven end-to-end in `educator-tools.controller.spec.ts` with the REAL guard + REAL service: free → 403, server_pro → 403, school → 200, and no-`:serverId` → 403 (wiring fail-closed). All three billing endpoints compose `AuthGuard` (verification-REQUIRED); the only `SessionNoVerifyGuard` string in the diff is a comment explaining why it is deliberately NOT used — the P-4-caught hole is closed. The single Zod source in `@studyhall/shared` drives both the NestJS `safeParse` DTO and the web client; `entitlements` shape is identical across all layers and `maxServersPerOwner` is correctly kept internal. The wave-74 free-cap non-regression holds: `free.maxServersPerOwner` stays `100_000` and `entitlements.service.spec.ts` asserts a 646-server owner stays under the cap (`646 < 100_000`). Mock honesty is intact: `MockBillingProvider` takes no payment, returns `checkoutUrl: null` as the mock marker, and the UI carries a clear "test mode — no charge" label + disclosure. No schema change (correct — reuse of the wave-74 `subscriptions` upsert), no new deps, no offset pagination. Commit discipline is clean per-spec (a63264c→provider seam, 9b9ec24→TIER_CAPS/educator-tools, ddc9b14→web panel; docs commits separate). Over-engineering is LOW per code-quality-pragmatist: the BillingProvider seam and RequireEntitlement guard are both right-sized (the seam is spec-blessed for the named-next Stripe drop-in). Both carried flags are non-blocking (adjudicated below). This proceeds to Phase 2 `/review` and the Action-6 commit-discipline check.

## Adjudicated flags

### Flag 1 — act() warnings on 19 pre-existing server-overview-settings tests → ACCEPT (accepted-debt, NOT rework)
The `ServerPlanPanel` is mounted inside `ServerOverviewSettings` and fires its own async `getServerPlan()` load on mount. In the 19 parent (`server-overview-settings.test.tsx` / `shell-components.test.tsx`) tests, that async resolution settles AFTER the synchronous test bodies have already asserted — producing React `act()` warnings but **zero test failures**. This is test-hygiene noise in the PARENT tests, not a real setState-after-unmount risk: the panel's own `fetchPlan` carries a `cancelled` flag in its effect cleanup (`ServerPlanPanel.tsx:79-97`), so it never calls setState after unmount. Distinguishing this from the wave-72 act() FLAKE lesson: wave-72 was a flake (nondeterministic pass/fail); this is deterministic (always passes, always warns). The parent tests already stub `getServerPlan` with a resolved value, so the load completes cleanly. Accepting as documented debt with a cheap follow-up available (wrap the parent renders in `await screen.findBy...`/`await act()`), routable to T-block T-1/T-5 hygiene rather than blocking the gate. The panel's OWN test (`ServerPlanPanel.test.tsx`) awaits its load correctly.

### Flag 2 — T-4 gap: mock-billing upsert tested with a stubbed db, not real Postgres → ACCEPT deferral to T-4 (BUILD-9)
The `MockBillingProvider.startTierChange` upsert (`INSERT ... ON CONFLICT (server_id) DO UPDATE`) is unit-tested against a stubbed db, not a real Postgres. BUILD-9 wants a real-DB integration test for a new boundary. This is a legitimate T-4 (pg-harness) deliverable, NOT a B-6 blocker: (a) the upsert reuses the wave-74 `subscriptions` table + its already-migrated `UNIQUE(server_id)` constraint (no new schema, no new migration this wave), so the idempotency guarantee rests on an already-integration-tested constraint; (b) the B-block contract is "implemented + wired + unit-green + build-green," which is met (api 795 + web 679 green, build 3/3); (c) the gap is already explicitly logged in review-artifacts.md as a T-4 carry with a named owner (T-4 pg-harness). Deferring the real-Postgres upsert assertion to T-4 is the correct layer. It MUST land at T-4 before C-1 — carrying it forward, not dropping it.

## Non-blocking findings routed to Phase 2 / accepted-debt
- **Dead type alias** `TierChangeResponse = ServerPlan` in `packages/shared/src/entitlements.ts` with zero consumers (code-quality-pragmatist Issue 3). Low — safe same-branch deletion or accepted-debt; not gate-blocking.
- `TierChangeResult.status` / `checkoutUrl` are currently write-only (Stripe-shaping). Defensible as spec-blessed seam-shaping; recorded as a deliberate keep, guard against further speculative growth without a consumer.
- `storageGb` renders an unguarded float (`ServerPlanPanel.tsx:134`); clean for current caps (2/50/500 GB). Cosmetic; optional `Math.round`.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
