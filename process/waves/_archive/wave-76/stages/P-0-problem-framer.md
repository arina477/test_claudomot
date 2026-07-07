# P-0 Problem Framer — wave-76 (M13 first autonomous slice: educator admin console + analytics)

**Agent:** problem-framer (fresh context) · **Mode:** automatic · **Read-only, no code**
**Milestone:** M13 (`b7400254`) — Institution partnerships & portable identity · Class `product-feature` · Horizon H3
**Bundle:** seed `682e0912` (educator admin API foundation) + 3 siblings — `ecf79f4a` (owner/member authz check), `80505bb1` (analytics aggregates API), `d81e266d` (Educator Admin Console web UI)

---

## VERDICT: PROCEED (with two spec-precision notes carried to P-2)

The bundle frames the RIGHT problem at the RIGHT layer for M13's first slice. It is cause-level, not symptom-level; it does not skip a more foundational M13 need; it does not cross the FENCED B2B2C/metric boundary; and it is not gold-plating. Two seed-claim imprecisions (one load-bearing) must be tightened at P-2 Spec but neither warrants REFRAME/RESCOPE.

---

## Symptom-vs-cause check (MANDATORY)

**Presenting need:** M13 wants an educator admin console + analytics. The naive symptom-level move would be "build the console UI over the existing boolean stub endpoint" — i.e. paint a dashboard on top of `GET /servers/:serverId/educator-tools/status`.

**The bundle correctly identifies the CAUSE, not the symptom.** The root reason a real console cannot be built today is not "there's no UI" — it's that **the shipped M9 substrate has no safe data-exposure boundary.** Verified in code:

- `apps/api/src/billing/educator-tools.controller.ts` (lines 21-31): the only educator-tools endpoint gates on `AuthGuard + EntitlementGuard(@RequireEntitlement educatorAdminTools)` and returns a hardcoded `{ enabled: true }`. No server-scoped data, no owner/member check.
- `apps/api/src/billing/entitlement.guard.ts` (lines 41-43, doc comment): *"It does NOT perform an owner/member check — it gates purely on the server's resolved tier entitlements. Compose with an owner/member check separately when the endpoint requires one."*

So **any authenticated user can currently read the boolean tier-status of any school-tier server** — harmless while the payload is a constant boolean, but a hard blocker the moment real server data is exposed. The seed's Approach — "replace the boolean stub with a real access-controlled API composing AuthGuard + EntitlementGuard + a per-server owner/educator check" — attacks exactly this cause. Building the authz foundation FIRST, then analytics data, then UI, is correct layering: the console is the *last* thing built, over a proven-safe API, not the first.

**Conclusion: cause-level, right layer. No symptom-framing.**

---

## Antipattern red-team (against PRODUCT-PRINCIPLES § Rules)

**Rule 1 — verify every seed claim about what exists/is absent.** Checked each against code:

| Seed claim | Verified? | Evidence |
|---|---|---|
| M9 shipped `educatorAdminTools` flag + `EntitlementGuard` | TRUE | `entitlement.guard.ts`, `entitlements.service.ts` present |
| Stub gates on tier ONLY, no owner/member check | TRUE | `educator-tools.controller.ts` L24-25; guard L41-43 |
| Guard doc-comment says "compose an owner/member check when exposing data" | TRUE | `entitlement.guard.ts` L41-43 verbatim |
| owner-check idiom in `servers.service.ts updateServer` (`owner_id !== userId → Forbidden`) | TRUE | `servers.service.ts` L471-483 |
| analytics source data already shipped (servers, roles, members, messages, assignments+submissions, scheduling) | TRUE | all tables exist in `apps/api/src/db/schema/` |
| `EntitlementsService.resolveForServer` reusable | TRUE | called at `entitlement.guard.ts` L74 |
| shipped settings-panel patterns (`ServerPlanPanel.tsx`, `ServerOverviewSettings.tsx`, `ServerRolesPage.tsx`) + DS icons | TRUE | files present under `apps/web/src/shell/` |

**Rule 2 — verify the seed's named entity is the real target, not merely that it exists.** One imprecision found (see NOTE-1). The stub endpoint IS the real target (correct). But the "Educator/Facilitator RBAC role" the seed proposes to reuse is **not a first-class entity.**

**NOTE-1 (LOAD-BEARING — carry to P-2):** The seed and `682e0912` say the owner/educator gate reuses "the shipped Educator/Facilitator RBAC role." **No such named role exists.** The `roles` table (`apps/api/src/db/schema/servers.ts` L41-56) is *capability-based* RBAC: per-server, user-defined rows with boolean permission columns (`manage_server`, `manage_roles`, `manage_channels`, `manage_members`, `manage_assignments`, `moderate_members`, `is_default`). "Educator/Facilitator" appears only as descriptive UI copy in `ServerRolesPage.tsx` L96 (describing what `moderate_members` grants) — not a queryable role. Membership is `server_members.role_id → roles.id`. **This is a spec-precision gap, not a REFRAME trigger:** the "educator" predicate simply must be *defined* at P-2 as `owner OR member holding capability flag X` (candidate: `manage_assignments` and/or `moderate_members`), computed from `server_members` joined to `roles`. The authz layer is buildable and the cause is real; P-2 must pin the exact capability predicate rather than assume a named role.

**NOTE-2 (minor — carry to P-2):** `682e0912` AC says "Boolean status endpoint contract preserved OR superseded by a richer console-context response." The "OR superseded" fork risks a silent breaking change to an endpoint that shipped in wave-75 and has passing contract tests (`educator-tools.controller.spec.ts`). P-2 should decide explicitly (preserve vs supersede) and, if superseding, migrate/replace the wave-75 tests deliberately — not leave it as an implementer coin-flip.

**Wrong-layer fix?** No. Authz composed at the guard/service layer (not sprinkled per-handler), analytics as read-only aggregate queries over shipped schema, UI reusing shipped settings-panel patterns. Each concern sits at its correct layer.

**Demo-path tunnel vision?** No. `682e0912` AC enumerates the full auth matrix (401 unauth, 403 wrong-tier, 403 right-tier-non-member, 200 owner, 200 educator-member) — negatives-first, not a happy-path demo. `80505bb1` and `d81e266d` both require the same gate + forbidden-state tests.

**Scope-creep-through-coupling?** The 4-task bundle is coherent, not bloated. Dependency chain: `ecf79f4a`+`682e0912` (authz foundation) → `80505bb1` (data, reuses the gate — "no new auth path") → `d81e266d` (UI, consumes the analytics endpoint). The parenting is correct (all 3 siblings under seed `682e0912`). Nothing here is a second milestone smuggled in — it is one vertical slice (API foundation → data → UI) of M13's Approach-item-(1). Note `ecf79f4a` was reparented from an M9 follow-up; that is legitimate — it IS the access-control foundation the real tools require, and M9 explicitly fenced "the educator-admin-tools feature build-out" to a later slice, which is exactly this.

**FENCED-boundary leak check.** The FENCED items are (a) the B2B2C institution-partnerships go-to-market — a *business/sales motion* (contracts, pilots) — and (b) the M13 success metric (_TBD by founder_). **Nothing in the bundle touches either.** No task authors a metric, sets pricing, models partnerships, or provisions cross-institution identity. The bundle is pure autonomous engineering over already-shipped data, mirroring how M9 shipped its substrate before real billing — consistent with the milestone's ## Approach and the 2026-07-07 standing delegation. `school`-tier is the pre-existing M9 entitlement gate, not a new commercial commitment.

---

## Answers to the five framing questions

- **(a) Cause-level first slice, or skips portable identity?** Educator admin console+analytics is a legitimate cause-level first slice. M13's own ## Approach explicitly orders it FIRST: "(1) educator admin console + analytics, (2) cross-server portable academic identity, (3) privacy/E2E." Portable identity is Approach-item-(2), sequenced deliberately after — not skipped. Console-first is defensible: it lights up the shipped M9 `school`-tier entitlement (which otherwise gates a stub), delivering visible value on existing data before the larger identity-portability build.
- **(b) Real API over the stub — real cause or premature?** Real cause. The stub *provably cannot* expose data safely (any authed user reads any school server's status; guard explicitly defers the owner check). Building the composed gate is the prerequisite, not premature — it is the exact "load-bearing prerequisite" `ecf79f4a` was authored for.
- **(c) Analytics — real value or gold-plating?** Real value, not gold-plating. All source tables are shipped; aggregates are counts/rollups only (no raw content, no PII beyond what an owner/educator already sees in-product); it needs zero founder input. It is the substantive *reason* an educator opens the console. Watch scope at P-3: keep it to count/group aggregates over existing tables — no new event-tracking pipeline, no time-series store, no charting library beyond DS primitives.
- **(d) Wrong-layer / demo-path / coupling risk in bundling API+gate+analytics+UI?** No. Correct layering, negatives-first ACs, coherent single vertical slice with correct parent/child dependency ordering. This is a UI wave → D-block design gap for the console panel is expected (flagged in `d81e266d`).
- **(e) Any FENCED B2B2C/metric work sneaking in?** No. Verified clean (see FENCED-boundary leak check).

---

## Carry-forward to P-1 / P-2 / P-3

1. **P-2 (load-bearing):** Define the "educator" authz predicate concretely — `owner_id === caller OR caller's server_members.role has capability flag X` — since no named "Educator/Facilitator" role exists; pick the exact capability flag(s) (`manage_assignments` / `moderate_members`) from `roles`. [NOTE-1]
2. **P-2:** Resolve the `/status` "preserve OR supersede" fork explicitly; if superseding, deliberately migrate the wave-75 contract tests. [NOTE-2]
3. **P-3:** Fence analytics to count/group aggregates over shipped tables only — no telemetry pipeline, no time-series/charting infra. [Rule: avoid (c) creep]
4. **D-block:** console-panel layout is a genuine design gap (settings-panel variant) — do not skip D.

**Security-scope note:** wave touches authz on a data-exposing endpoint → T-8 Security stage + P-4 security-scope-tightened gate apply.
