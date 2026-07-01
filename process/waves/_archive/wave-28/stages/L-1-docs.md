# L-1 — Docs (wave-28)

**Block:** L (Learn) · **Stage:** L-1 (∥ L-2) · **Mode:** automatic · **Owner:** head-learn

Wave-28 shipped LIVE: `POST /servers/:id/invite-code/rotate` — owner-gated regeneration of a server's
permanent invite link (CSPRNG code regenerated; old link dies immediately; owner-only; 403 for non-owner).
PR #41 (8996230), api deployed LIVE, verified end-to-end. No schema change. No client UI (owner-tooling).

## Action 1 — CHANGELOG entry

- **Added** (CHANGELOG.md:51): "Rotate a study server's permanent invite link: the owner can regenerate
  the link so a leaked one stops working immediately, closing the gap where the default permanent link
  could never be revoked. Owner-only; no client button yet. (#41)"
- **Section rationale — Added, not Security:** this is a NEW owner-gated capability/endpoint, not a patch
  to previously-shipped vulnerable code. Per L-1 Action 1, "Security" is reserved for a vulnerability that
  DID ship to users in a prior wave and is patched here. The irrevocable-permanent-link gap was flagged
  wave-9, but no vulnerable code shipped that this "patches" — it adds a missing capability. Consistent
  with the #19 revoke/rotate entries, which also landed under Added. Preventive / owner-tooling security → Added.
- **Style:** 1 bullet, declarative present-tense, honest about "no client button yet" (backend endpoint).
  Terse house style matched (not the verbose historical entries).

## Action 2 — Milestone delta (RECORD-only; no UPDATE)

DB census (live query, verified — not trusted from brief):

| Milestone | id | status | done | open | total |
|---|---|---|---|---|---|
| M5 — Academic tooling: assignments | a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d | in_progress | 11 | 7 | 18 |

- Claimed task **d058283d** (owner-gated invite_code rotation, wave_id 02c97a51) confirmed `status='done'`
  in the DB (L-2 marked it). Milestone delta gated on this — verified present.
- `open_count = 7 ≠ 0` → **NO `UPDATE milestones`.** M5 stays `in_progress`. Mechanical non-close, no
  judgment ambiguity → no BOARD escalation under automatic mode.
- Delta: **10 done → 11 done** (in_progress → in_progress).
- 7 open (all `todo`): reminders arc [Resend-key-blocked, sole M5-close blocker] + deferred DM/hover
  sibling fdb444fc + presence/members code-debt d23a0740 + assignments-hardening siblings
  (226c7e42, 3ad35a42, 4b397de0, 6f257c82, 72cb6ebb). No task silently closed — full census walked.
- 7 open ≥ 3 → **no backlog-stockout flag** for N-1.
- **M5 park-or-key fork remains founder-pending** (record-only carry; NOT a pause trigger).

## Action 3 — README (SKIP)

Skipped. No new env var / CLI command / flag / install step / breaking change. Backend endpoint with no
client surface — nothing user-facing to document in README. Consistent with the wave-13→27 cut.

## Action 4 — Commit

- `docs: L-1 wave-28 closeout (changelog)` — CHANGELOG.md only (surgical; pre-existing unrelated
  working-tree changes to VERSION / onboarding / founder-digest left unstaged).
- Pushed to `main`. SHA **60a3d5bd87560551f1fb795730dcfd0abc5b1cdf**.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:51 (### Added — invite-link rotation, #41)"
  - "milestones a5232e16 census verified via live DB: 11 done / 7 open — NO UPDATE (open_count!=0)"
  - "tasks.d058283d verified status='done' in DB (claimed task, L-2 done-marked)"
  - "commit 60a3d5bd87560551f1fb795730dcfd0abc5b1cdf pushed to main"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M5 (a5232e16)", before: "10 done / in_progress", after: "11 done / in_progress"}
roadmap_skip_reason: ""      # Action 2 fired (record-only, no transition)
readme_sections_touched: []  # README skipped — no client surface / env / CLI / install / breaking change
note: "M5 stays in_progress (open=7, done=11). Reminders arc [Resend-key-blocked] remains sole M5-close blocker. 7 open >= 3 -> no backlog-stockout for N-1. M5 park-or-key fork = record-only founder-pending carry (not a pause trigger). PRINCIPLES files untouched (L-2 lane). Mode automatic; no pause trigger (b/d/e/f) firing; loop continues."

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}   # L-1 has no reviewer matrix; observation/doc-capture stage
  failed_checks: []
  rationale: >
    Every L-1 exit criterion met. CHANGELOG entry appended (1 bullet, Added, correctly not-Security per
    the shipped-vuln test, terse house style, #41 cited). Milestone delta is record-only and mechanically
    correct — live DB confirms M5 open_count=7 so no transition; claimed task d058283d verified done; no
    task silently closed. README skip is justified (no client/env/CLI/install/breaking surface). Commit
    pushed to main, surgical (CHANGELOG only). No founder judgment required (mechanical non-close). No
    principles touched — that is the L-2 lane. M5 park-or-key fork correctly carried as record-only, not
    escalated as a pause.
  next_action: PROCEED_TO_L-block-exit
```
