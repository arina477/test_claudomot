# Wave-67 L-block observations — candidate principles (C-block / head-ci-cd)

Captured at C-block exit for L-2 distill + karen vetting. Not yet promoted (promotion needs 2+ wave confirmation + karen approval + the per-file 1-rule cap).

## Candidate rules (CI-PRINCIPLES.md)

- Railway `serviceInstanceDeploy` without an explicit `commitSha` or `latestCommit:true` redeploys the service's pinned last-deployed commit, NOT the branch HEAD. In wave-67 this rebuilt api at a 6-wave-old commit (wave-61) and web at an older commit. Verify every triggered deployment's `meta.commitHash` equals the intended merge SHA before treating it as the deploy; pass `commitSha` explicitly.
  - Draft rule form: "Trigger a Railway deploy with an explicit commitSha and assert deployment meta.commitHash equals the merge SHA. / Why: A bare serviceInstanceDeploy redeploys the pinned old commit, shipping stale code as a false-green."
  - Cross-ref: extends existing rule 7 (stale-source redeploy) and rule 1 (deployment-state endpoint). Same failure class, sharper trigger.

- Confirms existing rule 9 in practice: after `drizzle-kit migrate`, assert the physical columns/index exist via information_schema, not just the migrate exit code — done this wave and worth keeping salient.

## Deploy-verification reasoning (this wave)

- api has no pre-deploy/release migrate command (`preDeployCommand: null`, Dockerfile CMD is the app start, no auto-migrate on boot). Migrations must be applied manually before cutover. The reachable path is the Postgres service's `DATABASE_PUBLIC_URL` TCP proxy (`*.proxy.rlwy.net`), since the app's `DATABASE_URL` is the private `postgres.railway.internal` host.
- The single strongest post-deploy signal for this wave was `GET /servers/discover` returning 401 (not 500, not 404): one probe that simultaneously proves the migration is live (no 500 on missing columns) and the new revision is serving (old revision had no such route → would 404).

## Rollback lesson

- Previous-good revisions stay redeployable in one action via `deploymentRedeploy(id)` / `deploymentRollback(id)`. The expand-only migration 0024 keeps a rollback to the prior api revision safe (old code ignores the new columns).

---

## Wave-67 retro observations (knowledge-synthesizer)

Inputs read: process/waves/wave-67/blocks/{B,T,V}/gate-verdict.md, blocks/{B,T,V}/review-artifacts.md,
blocks/B/stages/B-6-review.md, blocks/T/findings-aggregate.md, blocks/V/gate-verdict.md.
Prior archives consulted: process/waves/_archive/wave-{62,63,64,65,66}/blocks/L/observations.md
(5-wave window; recurrence checks for all three candidates A/B/C and all standing HOLDs).
Principles files read: BUILD-PRINCIPLES.md (11 rules), VERIFY-PRINCIPLES.md (4 rules),
CI-PRINCIPLES.md (10 rules + head-ci-cd's draft rule above), PRODUCT-PRINCIPLES.md (5 rules),
T-2.md (1 rule), T-5.md (3 rules).
Waves 17 and 24 are outside the archived window and outside the 5-wave recurrence check scope;
no observations.md files for those waves are reachable; noted where relevant.

---

- **[obs-1 — FIRST INSTANCE (warning): a correlated-subquery aggregation that is mocked in the
  unit suite can ship with 752 passing unit tests while the live SQL returns a wrong value on
  every row; the gap is exposed only by a live-DB probe or real-integration test]**

  `discoverServers` in `servers.service.ts` computes `memberCount` as a correlated scalar subquery.
  The B-2 unit suite (752 tests, all PASS at B-5 and CI) mocks the Drizzle DB layer; the mock
  returns a configured `memberCount` value rather than executing the real SQL. The actual subquery
  had a binding/correlation defect that caused it to return 0 for every server regardless of actual
  membership. The defect was invisible to the entire unit suite and was caught only by the T-5
  live E2E probe (F67-T5-1) and subsequently confirmed by Karen's live DB cross-check at V-1
  (raw `SELECT count(*) FROM server_members` returned 1 and 2 at the exact instants the deployed
  `GET /servers/discover` returned 0).

  The adjacent canon: BUILD rule 9 states "Author an integration spec exercising every new service
  or DB boundary in the B-block, before the C-1 merge." The rule's scope is whether an integration
  spec EXISTS; it does not prescribe that the integration spec use a real DB rather than a mock.
  This wave's discoverServers had a B-block unit spec that exercises the DB boundary — but with a
  mocked DB that cannot catch SQL binding errors, correlated-subquery scope errors, or any defect
  that exists only in the executed SQL. The gap is narrower than what rule 9 addresses: rule 9
  guards against a missing spec; this class guards against a spec that mocks the DB and cannot
  exercise the query planner, subquery correlation, or aggregation SQL. VERIFY rule 4 (positive
  control) and T-2 rule 1 (fan-out routing topology) are not near-dups. T-5.md has no aggregation
  rule. No existing promoted rule prescribes that a new SQL aggregation or correlated subquery
  require at least one real-DB (non-mocked) integration test.

  Archive recurrence check (waves 62-66, 5-wave window): no prior L-2 observation on "mocked
  unit suite passes while real-DB SQL aggregation is wrong." The class requires an endpoint that
  returns a computed aggregation (count, sum, average) where the unit test mocks the return value
  rather than executing real SQL. This is the first explicit L-2 observation on this class in the
  available archive window. Waves 17 and 24 are not reachable; if either contained an observation
  on mocked aggregation hiding SQL defects, that would affect the recurrence count but cannot be
  verified from the current archive.

  The V-3 gate verdict explicitly names the L-2 obligation: "The fix, when authored, MUST include
  a live-DB test that exercises the real correlated subquery (not a mocked memberCount) — this is
  the coverage gap that let the bug ship green; carry it as an L-2 observation candidate."

  Pre-shaped candidate rule (for karen reference, NOT a nomination — 1st instance only):
    "12. For any new SQL aggregation or correlated subquery, author one test that runs against a
        real (non-mocked) DB."
    Rule line = 88 chars. PASS (<=120).
    "    Why: A mocked return satisfies the test while a SQL binding or correlation defect
        returns wrong results on every live row."
    Why line with 4-space indent = 93 chars. PASS (<=100).
    No forbidden tokens. Not a near-dup of BUILD rules 1-11 (rule 9 covers spec existence;
    this covers mock-vs-real execution for aggregation classes). PASS.

  Source artifacts:
  - process/waves/wave-67/blocks/T/findings-aggregate.md (F67-T5-1: "memberCount:0 for EVERY
    server; mocked unit tests (752) passed because they mock the DB; live probe caught real SQL")
  - process/waves/wave-67/blocks/T/gate-verdict.md (§Findings: "memberCount:0 for every server;
    observed 0 with 1 AND 2 members; raw DB count correct")
  - process/waves/wave-67/blocks/V/gate-verdict.md (§Karen's APPROVE: "raw SELECT count(*) FROM
    server_members returned 1 then 2 at the same instants deployed GET /servers/discover returned 0";
    §Disposition: "The fix MUST include a live-DB test")

  Severity: warning (real correctness bug shipped green through CI; caught only by live probe;
    no current user impact due to empty directory, but the class is generalizable to any
    aggregation endpoint where unit tests mock the DB layer).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 12 candidate).
  Recurrence verdict: FIRST INSTANCE in the 5-wave window. Waves 17 and 24 not reachable for
    recurrence check. HOLD.
  Promotion flag: HOLD — 1st instance in available archive. Watch for a second wave where a
    mocked unit suite passes while a real-DB aggregation or correlated subquery is wrong.

---

- **[obs-2 — NEAR-DUP ASSESSMENT: Railway serviceInstanceDeploy redeploys the pinned commit, not
  branch HEAD — head-ci-cd captured this as extending CI rule 7; assessment is REINFORCE rule 7,
  not a new independent rule]**

  The CI rule candidate captured by head-ci-cd above documents: a bare `serviceInstanceDeploy`
  MCP call rebuilds from the service's pinned last-deployed commit, not from the current branch
  HEAD or the merge SHA, meaning the deployed artifact can be 6+ waves old while deployment state
  shows SUCCESS. The fix is to pass `commitSha` explicitly and assert `meta.commitHash` equals
  the intended merge SHA.

  CI-PRINCIPLES rule 7 currently reads: "For a non-git-connected Railway service, assert a
  change-unique marker appears in the served bundle after deploy. Why: A redeploy rebuilds the
  same source to a new digest, so digest-diff passes on stale code." Rule 7 already encodes the
  class — stale source under a non-git-connected Railway service presenting as a successful deploy.
  The wave-67 finding sharpens the mechanism: the stale source is not just "the same source" in
  general, it is specifically the service's pinned last-deployed commit, not an arbitrary stale
  state. The wave-67 finding also adds the specific triggering condition (`commitSha` omission)
  and the specific verification step (`meta.commitHash` vs merge SHA) that rule 7's current form
  does not enumerate. These are sharpening details within rule 7's domain — the same failure
  class, same platform, same consequence — not a new independent class.

  head-ci-cd's draft rule ("Trigger a Railway deploy with an explicit commitSha and assert
  deployment meta.commitHash equals the merge SHA") is a precise, actionable sharpening of rule
  7's How. It encodes the correct triggering posture (pass `commitSha`, not `latestCommit:true`
  only as a workaround) rather than just the verification step (change-unique marker). Whether
  this sharpening warrants a separate rule 11 or an amendment to rule 7's rule and why lines is
  a karen/head-ci-cd call at promotion. From a recurrence standpoint: the underlying class
  (stale-source deploy presenting as SUCCESS on Railway) is rule 7's existing domain; the
  `commitSha` trigger is a wave-67-specific mechanism observation within that class; no prior
  wave's L-2 observations in the 5-wave window document the pinned-commit variant specifically.

  Source artifacts:
  - process/waves/wave-67/blocks/L/observations.md (head-ci-cd section, lines 1-9:
    serviceInstanceDeploy pinned-commit redeploy + draft rule form)
  - command-center/principles/CI-PRINCIPLES.md rule 7 (stale-source non-git-connected Railway)

  Severity: informational (the deploy issue was caught and corrected this wave; no user-visible
    defect resulted; rule 7 already encodes the parent class; this wave adds the pinned-commit
    mechanism detail).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (reinforcement of rule 7,
    possibly sharpened to rule 11 if the commitSha trigger adds non-overlapping value).
  Recurrence verdict: NEAR-DUP of CI rule 7. Same failure class; wave-67 adds a mechanistic
    detail (pinned commit vs generic stale). Not a new independent observation class.
  Promotion flag: REINFORCE — head-ci-cd's draft rule sharpens rule 7's trigger; karen and
    head-ci-cd to assess whether rule 7's text should be amended in place or a new rule 11 added
    that captures the commitSha-specific posture. This does NOT introduce a new independent
    observation class. No standalone promotion.

---

- **[obs-3 — FIRST INSTANCE (informational): a React route mounted outside its required Context
  Provider renders the component against the default no-op context, making all context-dependent
  calls silent no-ops at runtime while unit tests render the component in isolation and pass]**

  The `/discover` route initially mounted `<ServerDiscoverPage />` bare in `router.tsx`, outside
  `ServerProvider`. `ServerContext` has a default context value (the no-op stubs used in isolated
  unit tests). On the live route, the Join flow's `refetch()` and `selectServer()` resolved
  against those stubs rather than the real provider, silently doing nothing. The B-5 unit suite
  (574/574) stayed green because the page tests render `ServerDiscoverPage` under `MemoryRouter`
  in isolation — by definition outside any provider tree, hitting exactly the same default stubs
  that the broken live route hit. The gap was caught at B-6 gate (attempt 1 REWORK verdict).

  The structural pattern: a new route or a new component added to a route must be wrapped in
  every Context Provider it depends on; rendering the component in isolation for unit tests
  masks this absence because isolation ALSO omits the provider, making both broken-live and
  green-test hit the same default stubs. The regression guard is a dedicated test that renders
  the full route composition (not the bare page) and asserts provider-dependent behavior fires.
  The rework introduced `DiscoverShell` wrapping `<ServerProvider>`, and two new tests asserted
  provider-gated behavior (`getByTestId('discover-rail-button')` with `aria-current="page"`).

  Archive recurrence check (waves 62-66, 5-wave window): no prior L-2 observation on "route
  mounted outside required Context Provider; unit tests pass because isolation hits same stubs."
  The previous waves in this window are predominantly backend-cache, offline-sync, or copy-only
  changes with no new top-level React routes. This is the first explicit L-2 observation on
  this class.

  Near-dup check: BUILD rules 1-11 — none address React Context Provider wrapping at the route
  level. BUILD rule 5 (reconnect-triggered async loop coalescing) and rule 4 (negative path
  reproduction at B-6 Phase 2) are in the same BUILD layer but different classes. Not a
  near-dup.

  Source artifacts:
  - process/waves/wave-67/blocks/B/gate-verdict.md (Attempt 1 §Spec B REWORK: "/discover route
    mounts ServerDiscoverPage bare ... ServerRail is mounted ONLY inside AppShell ... the user has
    no in-app path back to their servers"; "discoverActive ... logic is dead code that can never
    fire on this route"; §Heuristic fired: H-B-11 adopted-design drift)
  - process/waves/wave-67/blocks/B/gate-verdict.md (Attempt 2 §1: "Join flow's refetch()/
    selectServer()/sh:select-server are LIVE against the real context, not the default no-op stub";
    §3: "Two new tests ... assert (a) server-rail present and (b) discover-rail-button carries
    aria-current='page' — exactly the previously-dead discoverActive path, now live and asserted")

  Severity: informational (caught at B-6 before merge; no user-visible defect shipped; the wave
    ended with the correct fix and a regression test; one instance is not enough to promote).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 12 candidate).
  Recurrence verdict: FIRST INSTANCE. No prior L-2 observation in the 5-wave archive window.
    HOLD.
  Promotion flag: HOLD — 1st instance. Watch for a second wave where a new React route or
    component is mounted outside a required Provider (whether caught at gate or shipped broken).
    NOTE: obs-1 above is also a BUILD rule 12 candidate; if both eventually promote, sequential
    renumbering applies.

---

- **[obs-4 — HOLD STATUS UPDATE: all standing held observations from wave-66; wave-67 confirming
  checks]**

  | origin | class | wave-67 status |
  |--------|-------|----------------|
  | wave-65 obs-3 / wave-66 obs-2 | B-6 /review catches async-effect race / non-atomic DB write that Phase-1 APPROVE missed | NOT CONFIRMED. Wave-67 frontend rework was a layout composition fix (DiscoverShell + RailShell); no new async effects or DB write sequences introduced. The B-6 Phase-2 /review ran and found 18 findings (high/medium/low), but none were async-effect races or non-atomic DB writes — they were route-logic, pagination ordering, aria duplication, and error copy. Not a confirming instance of obs-3's specific async/temporal class. HOLD maintained. |
  | wave-64 obs-1 | createObjectURL for a cached Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-67 introduces no Blob, no createObjectURL, no useCachedAttachmentImage usage. Not a confirming instance. HOLD maintained. |
  | wave-58 obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No existing soft-check was converted to a gating assertion this wave. Not a confirming instance. HOLD maintained. |
  | wave-58 obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI ran green and T-5 ran as a live post-deploy probe per pattern. Classification not stress-tested. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter with a single it.each table covering every output bucket | NOT CONFIRMED. Wave-67 tests are security assertions, E2E browse+join flows, and component render assertions. No multi-branch pure-function formatter introduced. HOLD maintained. |
  | wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist | NOT CONFIRMED. The §8 dark-on-emerald Join button this wave uses Tailwind class `bg-emerald-500` with `text-[#0a0a0b]` (one hardcoded dark hex for AA contrast). The change is a single targeted AA fix per the DESIGN-SYSTEM §8 spec, not a palette drift. Not a confirming instance of the pattern-of-45-files antipattern. STRONG HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. Wave-67 added the Discover rail entry to ServerRail with correct active-state logic and navigation. Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3(a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen DB-cross-checked memberCount:0 as a false claim (measured raw DB vs deployed API simultaneously). Jenny independently live-probed 401/403/200 paths and traced the correlated subquery drift. Head-verifier independently probed both reviewers' claims without cross-endorsement. Three independent verification layers. Behavior continues correctly. Still HOLD for VERIFY rule 5 candidacy. |
  | wave-52 obs-3(b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | PARTIAL FIRE. The /discover B-3 implementation self-adjudicated a "full-canvas" deviation from the D-3 adopted design on a false premise (the design DOES include the rail). B-6 caught this as H-B-11 adopted-design drift and issued a REWORK. This is structurally related (implementation diverged from D-3 adopted design) but the trigger was a layout-composition omission, not a breakpoint mismatch. The breakpoint-specific class (responsive layout tested vs D-3 breakpoint spec) is not the exact class that fired here. Not a direct confirming instance; related pattern. HOLD maintained for the breakpoint-specific sub-class. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed by
    application with another strong three-layer instance).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Mocked-DB unit suite passes while real-DB correlated-subquery aggregation returns wrong value; live probe caught memberCount:0 bug | warning | FIRST INSTANCE in 5-wave archive window (waves 17/24 not reachable) | BUILD-PRINCIPLES rule 12 candidate | HOLD — 1st instance |
| obs-2 | Railway serviceInstanceDeploy redeploys pinned commit not HEAD; near-dup of CI rule 7; commitSha-trigger detail is a sharpening, not a new class | informational | NEAR-DUP of CI rule 7 (same failure class, sharper mechanism detail) | CI-PRINCIPLES (reinforce rule 7 or new rule 11) | REINFORCE — head-ci-cd + karen to assess rule 7 amendment vs rule 11 addition; no standalone promotion |
| obs-3 | React route mounted outside required Context Provider; unit tests pass in isolation using same default stubs as broken live route; caught at B-6 gate | informational | FIRST INSTANCE in 5-wave archive window | BUILD-PRINCIPLES rule 12 candidate (see numbering note in obs-3) | HOLD — 1st instance |
| obs-4 | Status check on all standing prior observations | informational | wave-52 obs-3(a) confirmed by application; wave-49 obs-C partial-related fire; all other HOLDs maintained | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 4 (obs-1 through obs-4)**
**Severities: 1 warning (obs-1), 3 informational (obs-2 through obs-4)**
**Promotion-eligible this wave from knowledge-synthesizer observations: NONE**
**Nominations for karen vetting: NONE from this section — obs-1 and obs-3 are 1st-instance HOLDs;
  obs-2 is a reinforce/near-dup call routed to head-ci-cd + karen for rule 7 amendment decision**

### Explicit verdicts on candidates A / B / C

| candidate | verdict | one-sentence reason |
|-----------|---------|---------------------|
| A (mocked-DB misses real-query bugs) | HOLD-1ST-INSTANCE | First L-2 observation of mocked aggregation hiding a real-DB SQL defect in the reachable archive; BUILD rule 9 is close (integration spec existence) but does not cover mock-vs-real-DB execution for aggregations; waves 17/24 not reachable for prior check. |
| B (serviceInstanceDeploy redeploys pinned commit) | REINFORCE-EXISTING-RULE-7 | Same failure class as CI rule 7 (stale-source Railway deploy presenting as SUCCESS); the commitSha mechanism is a sharpening detail within rule 7's domain, not a new independent class; head-ci-cd correctly flagged it as "extends CI rule 7." |
| C (route mounted outside Provider) | HOLD-1ST-INSTANCE | First instance of this provider-wrapping omission class in the reachable archive; B-6 caught it before merge and the rework adds a regression guard; one wave is one datapoint. |
