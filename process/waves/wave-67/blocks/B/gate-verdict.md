# Wave 67 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-wave67)
**Reviewed against:** process/waves/wave-67/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
REWORK

## Rationale

Judged per spec block against the diff (7cdf2c0 schema, c34265e backend, a4a938f frontend).

**Spec A (schema + discover API) — PASS.** Opt-in visibility is correct: `is_public boolean DEFAULT false NOT NULL` (servers.ts:30, migration 0024). Migration 0024 is purely additive — three `ADD COLUMN` + one `CREATE INDEX`, zero backfill/UPDATE, so no existing server is exposed (servers.service leak-vector closed at the DB layer). `discoverServers` (servers.service.ts:527-581) filters `eq(servers.is_public, true)` as the base WHERE, AND-composed with the optional ILIKE search — private servers never leak, even under a search term. memberCount is a correct correlated scalar subquery (returns 0 for zero-member servers, verified by test servers.service.spec.ts:1467). Limit is defensively capped at 50 in the service AND bounded by Zod `.max(50)`; offset passed through; empty → `{servers: []}`. GET /servers (`findMyServers`) is untouched. DTO derives from the single shared Zod source (`DiscoverServerSchema` in packages/shared/src/servers.ts).

**Spec C (public join) — PASS. The load-bearing security gate holds.** `joinPublicServer` (servers.service.ts:599-621) opens a transaction, reads the server row, and rejects BEFORE any membership insert: `!server` → 404 (line 604-606), `!server.is_public` → 403 (line 609-611). The idempotent `onConflictDoNothing` insert is reached only past that gate. The private-reject is explicitly tested with insert-never-reached: servers.service.spec.ts:1557-1566 asserts `ForbiddenException` AND `expect(txMock.insert).not.toHaveBeenCalled()`. The invite path (`joinViaInvite`, line 623-706) is a separate, unchanged method — not weakened. Idempotent re-join tested (spec:1535). This is the wave's key risk and it is closed server-side.

**Spec B (discover UI) — REWORK.** The shared `DiscoverServer` DTO is consumed correctly; Join wiring is correct (api.joinPublicServer → refetchServerList → sessionStorage `sh:select-server` pending-select → Open→selectServer→/app, ServerDiscoverPage.tsx:372-406); the cold-start empty state is honest (`empty-cold`, "No public communities yet", not error-worded, line 600); §8 dark-on-emerald Join present. **But the standalone-route deviation is a real layout defect, not a sound adaptation.** The B-3 rationale ("matches design's full-canvas directory layout") is factually wrong: the adopted canonical `design/server-discover.html` renders `<nav aria-label="Server Rail">` (line 209) as a sibling of `<main class="flex-1">` (line 262) inside `<body class="flex h-screen">` — the directory has the rail present. The implementation's `/discover` route (router.tsx:86-93) mounts `<ServerDiscoverPage />` bare, and ServerRail is mounted ONLY inside AppShell (AppShell.tsx:52), which is rendered ONLY by AppHome on `/app`. Consequence: on `/discover` the ServerRail does not render at all, the `discoverActive`/`useLocation` glow logic added to ServerRail (ServerRail.tsx:107, 256-304) is dead code that can never fire on this route, and the user has no in-product navigation back to their servers (only Join→Open or browser Back). ServerDiscoverPage's root is `flex flex-col flex-1` — a flex-child authored to sit beside the rail — but it has no flex parent or rail sibling on this route. The B-5 suite stayed green (574/574, re-verified) because the page tests render ServerDiscoverPage in isolation under MemoryRouter and never assert rail presence; the layout gap is invisible to the current tests, which is exactly how it reached the gate.

**Cross-cutting — PASS.** No scale gold-plating (no ranking/moderation/Redis creep — correctly absent). Commit-per-spec discipline holds: three commits, one per spec block, each citing its task. No contract drift between shared Zod, NestJS DTO, and the frontend consumer.

Everything passes except the Spec B layout coherence. Because the defect is contained to the frontend route/layout and the contract + security gate are sound, this is a bounded B-3 REWORK, not an ESCALATE.

## Rework instructions  (only if REWORK)

### Stages requiring rework
- B-3: /discover must render within the canonical rail+main layout so the ServerRail is present and in-app back-navigation works.

### Per stage

#### B-3
- **What's wrong:** The `/discover` route renders `<ServerDiscoverPage />` bare (router.tsx:86-93). ServerRail is mounted only inside AppShell (AppShell.tsx:52 / AppHome on /app), so it is absent on /discover. The canonical design (design/server-discover.html:209 + :262) is rail + main; the implemented page is main-only. The Discover-active nav glow wired into ServerRail (ServerRail.tsx:107, 256-304) is unreachable on this route, and the user has no in-app path back to their servers.
- **Heuristic fired:** H-B-11 (adopted-design drift) — frontend route diverges from the D-3-adopted canonical layout; the deviation was self-adjudicated "accept" on a false premise (design is NOT full-canvas; it carries the rail).
- **What "good" looks like:** Navigating to /discover renders the 72px ServerRail (with the Discover entry showing its active emerald indicator) beside the full-height directory `<main>`, matching design/server-discover.html. The rail's server icons, DM-home, and create buttons work from /discover; clicking a server icon or Home leaves /discover for /app. A test asserts `getByTestId('server-rail')` (and `getByTestId('discover-rail-button')` with `aria-current="page"`) is present on the /discover render. Either: (a) mount ServerDiscoverPage inside the existing AppShell/shell composition so the rail is shared, OR (b) wrap the /discover route element in a lightweight shell that renders `<ServerRail>` + `<ServerDiscoverPage>` inside a `flex h-screen` container. Prefer reusing the existing rail composition over duplicating it.
- **Re-do instructions:**
  1. Route the fix through **react-specialist** (per command-center/AGENTS.md frontend tag) — orchestrator does not fix directly (Iron Law).
  2. react-specialist: choose the shared-shell approach — render `/discover` inside a flex `h-screen` layout that includes `<ServerRail>` (reuse AppShell's rail composition and ServerContext; do NOT duplicate the rail markup) with `ServerDiscoverPage` as the `flex-1` main. Ensure ServerContext is in scope so the rail's server list + selectServer + Discover-active state resolve.
  3. Confirm rail interactions from /discover: server-icon click → selectServer + navigate('/app'); Home → /app; the Discover button shows `aria-current="page"` + emerald glow.
  4. Add a ServerDiscoverPage (or new shell) test asserting the rail renders on /discover (`server-rail` testid present) and the Discover button carries `aria-current="page"`. This is the regression guard the current isolated-page tests lack.
  5. Keep the page's search/grid/5-states/join wiring unchanged — only the outer layout composition changes.

### Cascade

B-block cascade rules (apply where the rework stage is the trigger):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-3 frontend | B-4 (route registration), B-5 |

- **Stages that must re-run after the above:** B-4 (repo-wide typecheck + route registration re-verify), B-5 (full suite — lint, typecheck, web unit incl. the new rail-presence test, build, smoke).
- **Stages that stay untouched:** B-0 (schema), B-1 (contracts), B-2 (backend) — all PASS; no re-run. On re-entry to Action 0, spawn a fresh head-builder for attempt 2 gating the updated frontend.

## Escalation  (only if ESCALATE)
- n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 67 — B-6 Verdict (ATTEMPT 2, post-rework)

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-wave67-attempt2)
**Reviewed against:** the Spec-B rework fix, commit aac1b8b (`fix: B-6 rework — mount ServerRail + ServerProvider on /discover`)
**Attempt:** 2  (post-rework; Phase 1 focused re-gate of the one REWORK defect)
**Scope note:** Attempt-1 PASS specs (A schema+discover API, C public join) NOT re-litigated — the fix touches frontend only; `git diff a4a938f..aac1b8b -- apps/api packages/shared` is empty, so the schema, migration 0024, discoverServers filter, and the joinPublicServer is_public security gate are byte-identical to the attempt-1 PASS state.

## Verdict
APPROVED

## Rationale

The single attempt-1 defect — `/discover` mounting `<ServerDiscoverPage />` bare, with no ServerRail and OUTSIDE ServerProvider (rendering the rail's Discover-glow logic dead and the Join flow's `ServerContext.refetch()`/`selectServer` into default-context no-ops) — is closed. Judged per the four attempt-2 criteria:

**1. Rail present AND inside ServerProvider — FIXED.** `router.tsx` `/discover` now mounts `<DiscoverShell />` (not the bare page). `DiscoverShell.tsx` composes `<ServerProvider>` → `<RailShell>` → `<ServerDiscoverPage />`, structurally mirroring `AppHome` (ServerProvider wrapping AppShell). Because ServerProvider is now an ancestor of ServerDiscoverPage on this route, the Join flow's `refetch()`/`selectServer`/`sh:select-server` are LIVE against the real context, not the default no-op stub. `RailShell.tsx` renders `<ServerRail />` in a 72px pane beside a `flex-1` main pane — the user has in-app navigation back to their servers. Layout matches canonical `design/server-discover.html` (rail sibling of main).

**2. Reuse clean — CONFIRMED.** `ServerRail` remains the single shared component; grep shows exactly two consumers — `AppShell.tsx:52` (4-column /app shell, passes optional props) and `RailShell.tsx:24` (2-column /discover shell, bare `<ServerRail />`). Zero rail markup duplication. AppShell is untouched — the explicitly-allowed out-of-scope deviation (not refactoring AppShell onto RailShell). RailShell's bare `<ServerRail />` typechecks because AppShell's props (`addServerBtnRef`, `dmActive`, `onDmHome`) are all optional; the Discover-active state derives from `useLocation()` internally (ServerRail.tsx:107), not from props, so the glow works without prop wiring.

**3. Regression tests lock it — CONFIRMED.** Two new tests in `ServerDiscoverPage.test.tsx` (describe block "RailShell layout on /discover — regression (B-6 wave-67)") render RailShell under `MemoryRouter initialEntries={['/discover']}` and assert (a) `getByTestId('server-rail')` is in the document, and (b) `getByTestId('discover-rail-button')` carries `aria-current="page"`. This is exactly the previously-dead `discoverActive` path (ServerRail.tsx:107 → aria-current line 267 + emerald glow line 257-262), now live and asserted — the regression guard the isolated-page tests lacked. Both pass (ServerDiscoverPage suite 11/11).

**4. No regression / no scope creep — CONFIRMED.** Fix diff is 4 files, +112 lines, frontend-only: 2 new shell files (DiscoverShell, RailShell), a 5-line router swap, +2 tests. No new page behavior, no search/grid/5-states/join-wiring changes, no scale infra. Spec A + Spec C untouched (diff empty). Full web suite green: **576/576** (up from 574 by the 2 new tests). `web typecheck` clean (tsc --noEmit, zero errors). `web build` succeeds (PWA generateSW, precache emitted). No new door, no contract drift, no migration touched.

The rework was surgical and correct; the offline-first contract and the is_public security gate are intact. Proceed to Phase 2 (/review).

## Rework instructions  (only if REWORK)
- n/a — APPROVED

## Escalation  (only if ESCALATE)
- n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1
- attempt: 2
- next_action: PROCEED_TO_PHASE_2_REVIEW
