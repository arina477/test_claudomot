# L-1 — Docs — wave-74 (M9 Monetization entitlements substrate)

**Block:** L (Learn), stage L-1 (∥ L-2). **Mode:** automatic. **head-learn** gating.
**Wave summary:** M9 entitlements substrate shipped LIVE + verified (d79dd18). Free-cap regression caught + fixed within the wave (#92). Claimed tasks (all done): 53d18d7f, e34642ef, 2f61a317.

---

## Action 1 — CHANGELOG entry

Appended one **Added** bullet under `## [Unreleased] › ### Added` in `CHANGELOG.md` (after the #90 privacy-activity line, immediately before `### Changed`). Framed honestly as backend groundwork with no visible change and no charging:

> Internal groundwork for paid tiers: every study server now sits on a free plan by default, and the app quietly checks that plan when you create a server. There is no visible change and nothing is charged — real billing (Stripe, prices, checkout) is not turned on yet. The free plan's limits are set well above any current usage, so no existing account is affected. (#91, #92)

Cites #91 (substrate) + #92 (free-cap regression hotfix). Terse, one bullet, matches the house release-note style (not the verbose historical entries).

## Action 2 — Milestone delta

M9 — "Monetization: freemium tiers" (`3e507bc0-bce5-4f3b-b22a-d3c887fc0548`).

DB open-count check (Action 2 step 2):

```
open_count=1  done_count=3  total=4
```

- 3 done: 53d18d7f (data model), e34642ef (EntitlementsService), 2f61a317 (gate wiring) — the wave-74 substrate.
- 1 open: **db90252a** (`todo`) — "Move the createServer entitlement gate inside the transaction" (TOCTOU hardening).

`open_count = 1 ≠ 0` → **M9 stays `in_progress`. NOT closed.** Mechanical, unambiguous non-transition (M9 was already in_progress and remains so) → no BOARD escalation, no roadmap-lifecycle state-recording append required (there is no transition to record).

**Reconciliation note:** the L-1 brief anticipated 2 open M9 hardening tasks ("TOCTOU + one earlier"); the DB shows only **1** open row (db90252a). The "one earlier" hardening item is not present as an open `tasks` row (already resolved/cancelled or never materialized as a row). The real-charging Stripe slice is **founder-reserved** and tracked via `process/session/updates/founder-checkpoint-2026-07-07-m9.md` (a checkpoint, not an open task row) — it is correctly NOT counted in open_count.

**N-1 record:** M9 has 1 open child task (db90252a, TOCTOU hardening). open_count = 1 is below the `< 3` backlog-stockout fallback threshold — but do NOT blind-decompose: M9's remaining scope is deliberately partitioned. N-1 should survey whether the next M9 slice is **autonomous** (TOCTOU hardening db90252a / gate-at-more-gates / the "Your plan" display) or **founder-reserved** (the real-charging Stripe slice — needs founder-issued Stripe keys per rule 6 + founder-set prices, surfaced non-blocking at `process/session/updates/founder-checkpoint-2026-07-07-m9.md`). The autonomous items can seed the next wave without founder input.

## Action 2b — Stale doc-comment tidy (V-1 jenny/karen L-1 handoff)

`apps/api/src/servers/servers.service.ts:79` doc-comment claimed the free-tier placeholder was `maxServersPerOwner=100`, while the runtime value is `100_000` (`entitlements.service.ts:42`, `EntitlementsService.CAPS.free`). Corrected the comment to `100_000` and added a reference to its authoritative source. **Doc-comment only — the code value (`caps.maxServersPerOwner`) was already correct**; no runtime behavior changed.

Scope decision: the `.spec.ts` references (lines 136, 151) were **left unchanged** — line 151 is a test-stub value (its own permissive fixture, contract = "0 < cap"; any large value holds) and line 136's comment *accurately* describes that stub as `=100`. Rewriting them would be gratuitous fixture churn with no correctness gain. Only the production doc-comment that *misrepresented the free-tier placeholder* was stale.

## Action 3 — README touchups

**Skipped.** Reason: nothing user-facing shipped this wave — the entitlements substrate is backend-internal groundwork (Stripe/prices/checkout fenced; no new CLI command, flag, env var, install step, or breaking change). Per Action 3 skip condition.

## Action 4 — Commit

FS docs (CHANGELOG + servers.service.ts comment fix) committed and pushed to `wave-74-account-deletion`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:95 (Added bullet, #91/#92)"
  - "apps/api/src/servers/servers.service.ts:79-81 (doc-comment 100 → 100_000)"
  - "milestones row: M9 3e507bc0 UNCHANGED (in_progress; open_count=1, no transition)"
  - "commit SHA: <FILLED-AFTER-COMMIT>"
changelog_entry_added: true
roadmap_milestones_progressed: []          # M9 stays in_progress; no transition
roadmap_skip_reason: "M9 open_count=1 (db90252a TOCTOU); not terminal; no milestone close"
readme_sections_touched: []                # skipped — backend-internal groundwork, nothing user-facing
n1_note: "M9 has 1 open child task (db90252a TOCTOU). N-1: survey next slice — autonomous (TOCTOU / more-gates / 'Your plan' display) vs founder-reserved (Stripe real-charging, checkpoint 2026-07-07-m9). Do NOT blind-decompose despite <3 threshold — scope is deliberately partitioned."
note: "Free-cap regression (#92) is a candidate L-2 lesson — assessed at L-block gate (see gate section)."
```
