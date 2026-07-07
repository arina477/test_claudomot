# L-1 — Docs (wave-72: account self-deletion / right-to-erasure)

**Block:** L (Learn), stage L-1 (∥ L-2). Owner: head-learn (gate) + orchestrator.
**Wave:** 72 — M10 first slice (account self-deletion / right-to-erasure). Shipped LIVE + verified (feature #88 / e5bfba1; P0 fix #89 / 69ad79b).
**Mode:** automatic.

## Action 1 — CHANGELOG entry

Appended to `CHANGELOG.md` under `## [Unreleased]`.

- **Added** (line 93) — account self-deletion. New feature from the P-2 spec contract → Added.
- **Fixed** (line 128) — prod white-screen from the CJS/ESM shared-package bundling regression, fixed same-wave (#89).

Both claims verified against shipped code before writing (honesty gate):
- Feature commit e5bfba1 (#88): `users.deleted_at` soft-delete marker (migration 0027, reversible — no hard SuperTokens `deleteUser`); PII scrub of display_name/username/email/avatar_url/avatar_key; leave-all-servers; revoke-all-sessions (sign out); re-auth block on BOTH doors (signIn → WRONG_CREDENTIALS + getSession/refreshSession → UNAUTHORISED when `deleted_at IS NOT NULL`) → blocks re-login; owner-block 409 (must transfer/delete owned servers first); Settings › Privacy Danger Zone confirm UI.
- P0 fix commit 69ad79b (#89): namespace-import workaround defeated `@rollup/plugin-commonjs` transpilation of the CJS `@studyhall/shared` barrel → raw `require()` shipped to the browser bundle → `ReferenceError: require is not defined` → SPA white-screen on every route. Root fix: `@studyhall/shared` emits real ESM (`type:module` + `tsconfig module:NodeNext`); `api.ts` reverted to named imports. Verified same-wave.

Length: 1 headline bullet per section, within the ≤5-bullet cap. User-facing plain language; internal mechanism (soft-delete, CJS/ESM) abstracted per house style.

## Action 2 — Milestone delta

Milestone touched: **M10 — Compliance & data rights** (`97d65b49-2585-47f8-aacc-510469fdc58a`).

DB state (queried this stage):
- M10 status: `in_progress`.
- Child-task queue: `done_count=3, open_count=0, total=3`. All three claimed tasks terminal:
  - `9658fb0b` (erasure API) — done
  - `e11f8746` (DeleteAccount DTO) — done
  - `898490b1` (Danger-Zone UI) — done

**Decision: M10 stays `in_progress`. Milestone row status NOT edited.**

Rationale (judgment call — "structurally complete queue" ≠ "milestone done"): the Action 2 mechanical rule (`open_count=0` → transition to `done`) does NOT apply here because M10's *scope* is broader than its current child-task bundle. M10 = "Privacy-rights UI, consent flows, data export/delete, audit log, FERPA/COPPA posture." Only data-delete (this wave) + data-export (already shipped) are covered. Remaining legs — consent flows, audit log, FERPA/COPPA legal posture — are unshipped. Transitioning to `done` on an empty *child queue* alone would prematurely close a milestone with live remaining scope.

**Empty-queue flag for N-1:** M10's child-task queue is now 0 open (below the <3 fallback threshold; reason `backlog-stockout`). N-1 (next-block survey) should either:
1. Decompose the next M10 bundle (consent flows / audit log / FERPA-COPPA posture) via the milestone-decomposition-ritual, OR
2. Seek a milestone-disposition.

**Founder-reserved caution for N-1:** several remaining M10 legs (consent flows, FERPA/COPPA legal/compliance posture) may be founder-reserved product/compliance-regime decisions (always-on rule 17) — not silently decomposable. N-1 should route the disposition accordingly rather than auto-decomposing legal-posture scope.

**Standing founder-facing gap:** M10 "Success metric" is still "_TBD by founder_" — an open founder input on this milestone, surfaced here for N-1 visibility.

## Action 3 — README touchups

**Skipped.** No user-facing README change: no new CLI command/flag, no new env var, no new install step, no breaking change. Account-deletion is a runtime UI feature with no README-surface impact.

## Action 4 — Commit

FS docs committed + pushed to `main` (automatic mode allows direct doc commits):
`docs: L-1 wave-72 closeout (changelog)` — commit SHA recorded in footer.

## L-block gate (head-learn)

- **L-2 task-done bookkeeping — CORRECT.** All 3 claimed tasks marked `done`; M10 open_count=0 confirmed in DB. No task left mis-stated.
- **Milestone judgment — HELD.** M10 kept `in_progress`; premature-close avoided. Empty-queue + founder-reserved + Success-metric-TBD flags handed to N-1 cleanly.
- **Observation pass / promotion bar** — L-2 (knowledge-synthesizer) owns observation authoring; head-learn holds the ≤1-promotion-per-file bar. Most waves promote zero. Wave-72 is a well-worn pattern (soft-delete + re-auth guard on both doors + owner-block + PII scrub) already covered by existing BUILD/PRODUCT principles; nothing in this wave is new+recurring+costly+binary+contract-formatted enough to clear the bar from L-1's vantage. Promotion verdict is L-2's to record; L-1 gate flags no promotion candidate.

## Deliverable footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:93 (Added — account self-deletion)"
  - "CHANGELOG.md:128 (Fixed — prod white-screen CJS/ESM regression)"
  - "milestones 97d65b49 (M10): NOT transitioned — stays in_progress (broader scope unshipped)"
  - "README.md: not touched (no user-facing README surface)"
changelog_entry_added: true
roadmap_milestones_progressed: []          # M10 stays in_progress
roadmap_skip_reason: >
  M10 child-queue structurally empty (open_count=0) but milestone scope broader
  (consent flows / audit log / FERPA-COPPA posture unshipped). Not transitioned to
  done. Empty-queue flagged for N-1 (backlog-stockout): decompose next M10 bundle OR
  seek milestone-disposition; several remaining legs may be founder-reserved
  (compliance-regime, rule 17). M10 Success metric still "_TBD by founder_".
readme_sections_touched: []
note: "L-block gate: L-2 task-done bookkeeping correct (3/3 done); milestone premature-close avoided; 0 promotion candidates from L-1 vantage."
```
