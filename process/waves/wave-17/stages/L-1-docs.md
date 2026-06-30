# L-1 — Docs (wave-17)

> Block: L (Learn). Stage L-1 runs concurrently with L-2 Distill.
> Wave-17 shipped: real-Postgres create-server rollback integration test + reusable real-PG test harness. Closes the wave-7 carry — createServer's atomic transaction (server→role→member→category→channel) had its ROLLBACK path unproven (the prior unit test mocked `db.transaction`). The new test forces a mid-txn failure (pool-query fault injection) and asserts no orphan rows (server/category/channel/membership) persist. 3/3 green in CI vs the real Postgres service. NO product code, schema, or dependency. Claimed task: 25523fb0 (L-2 set done). PR #29 / merge dfb65ca.

## Action 1 — CHANGELOG entry → documented SKIP

**Disposition: SKIP (test-only, no user-facing change).**

Rationale: wave-17 is pure test-infra. The shipped artifact is a real-Postgres mid-transaction-failure rollback integration test plus a reusable real-PG harness. No product code, schema, dependency, route, endpoint, env-var, CLI, or user-perceivable behavior changed — the test only *proves* the rollback semantics of the already-shipped create-server flow (logged in CHANGELOG #17). Per keep-a-changelog, a test-coverage / verification addition is developer-facing, not a product Added / Changed / Fixed entry.

House-style check (`git log -p CHANGELOG.md | head -80`): the `[Unreleased]` section is a strict user-facing product release-note — every one of its ~30 bullets is a user-perceivable feature, and there is no Internal/Dev/Tests section. Waves 14, 15, and 16 each logged only user-facing features and explicitly skipped non-user-facing work; wave-16 (the immediately prior pure-test-infra wave — authed create-server browser E2E) took the documented SKIP. Introducing a one-off Internal section for a single test-infra bullet would dilute the user-facing-only release-note discipline this file maintains. Judgment per the stage rule (terse internal note OR documented SKIP — head's call): **SKIP**, recorded here, consistent with the wave-16 precedent. File-level detail lives in PR #29 (dfb65ca) and the T-9 journey-map regen (create-server seeding now real-PG-rollback-integration-tested, commit 0150b9a), not the product changelog.

CHANGELOG.md unchanged: head still at line 7 `## [Unreleased]`, last Added bullet `(#27)`, file 44 lines.

## Action 2 — Milestone delta → M3 stays in_progress (mechanical, no UPDATE)

- Milestone touched: **M3 — Real-time messaging** (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`), status `in_progress`.
- Census (post-L-2 close of 25523fb0): **15 done / 6 open** (verified live: `SELECT … done_count / open_count FROM tasks WHERE milestone_id=…`).
- `open_count = 6 > 0` → milestone is NOT structurally complete. **M3 stays `in_progress`. No `UPDATE milestones` issued.** Mechanical non-close, no judgment ambiguity, no escalation (per stage Action 2 mode-aware routing — only fires on a "really done vs structurally complete" judgment call, which does not arise when open_count>0).
- The 6 open = parked tech-debt + remaining wave V-2 non-blocking + deferred dots + unshipped M3 feature scope (thread replies `thread_parent_id`, file/image attachments).
- M3 feature scope (threads / attachments) still unshipped; Success-metric prose already final (no TBD), no edit.
- N-1 flag: M3 has 6 open child tasks + unshipped threads/attachments scope → next-wave decomposition/triage candidate (N-1 reason `backlog`); threads/attachments feature decomposition fires once M3 top-level seedable-todo count reaches 0. Per checklist seed-note, STALE-CLAIM cleanup candidates (02fa8011, 6a546c7b, d23a0740, c18b8089) carry closed-wave wave_ids — P-0/N-1 to re-parent/re-decompose. The new real-PG harness this wave *partially mitigates* 02fa8011 (Real-PG integration test tier) per V-2 triage.
- L-2 ownership boundary respected: L-1 did NOT touch tasks-table status (L-2 closed 25523fb0) and did NOT touch `*-PRINCIPLES.md` (L-2 owns).

## Action 3 — README touchups → SKIP

No user-facing setup / env / CLI / quick-start / breaking change. The harness uses a `DATABASE_URL_TEST` CI secret (GitHub Actions env, passed through Turbo to the api test:ci task) — a CI-internal value, never committed, not a user-facing README setup step. README unchanged.

## Action 4 — Commit

FS touchups (this deliverable) committed and pushed to `main`: `docs: L-1 wave-17 closeout`. See footer for SHA.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: documented SKIP (test-only, no user-facing change) — file unchanged, head [Unreleased] line 7, 44 lines"
  - "milestones row NO-UPDATE: M3 6198650e-f4e0-44dc-9b0a-6550f01f9f82 stays in_progress (open_count=6>0)"
  - "README.md: SKIP (no user-facing setup/env/CLI; DATABASE_URL_TEST is a CI secret)"
changelog_entry_added: false
changelog_disposition: "SKIP — test-infra, developer-facing not user-facing; documented per stage Action 1 head judgment, consistent with wave-16 precedent"
roadmap_milestones_progressed: []
roadmap_milestone_delta: [{milestone: "M3 (6198650e)", status: "in_progress", census: "15 done / 6 open", action: "no UPDATE — open_count>0, mechanical non-close"}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "Pure test-infra wave (real-PG create-server rollback integration test + reusable harness; PR #29 dfb65ca; 3/3 CI green). L-1 did not touch tasks-table status (L-2 owns) or *-PRINCIPLES.md (L-2 owns). N-1 flag: M3 6 open + threads/attachments unshipped; new harness partially mitigates 02fa8011."

head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  rationale: >
    Single active wave block (claimed task 25523fb0) captured with a concrete cited
    artifact (PR #29 dfb65ca, 3/3 real-PG CI). The change is pure test-infra with zero
    user-facing surface, so CHANGELOG is a documented SKIP rather than a diluting
    Internal-section bullet — consistent with the file's user-facing-only release-note
    discipline and the wave-16 precedent (the immediately prior pure-test-infra wave).
    Milestone delta is mechanical: M3 open_count=6>0 (verified live) → stays in_progress,
    no UPDATE, no judgment escalation. README skip is correct — DATABASE_URL_TEST is a
    CI secret, not a user-facing setup step. L-2 ownership boundary respected: no
    tasks-table or principles-file writes from L-1.
  next_action: PROCEED_TO_L-block-exit
```
