# L-1 — Docs (wave-80)

Wave-80 = M13 leg-3b presence privacy toggle (`showPresence`). V-block APPROVED, LIVE on 4795638. Mode: `automatic`.

## Action 1 — CHANGELOG

Appended one **Added** entry under `[Unreleased]`, `CHANGELOG.md:100-104` (headline + 3 sub-bullets), citing (#99):

- Appear-offline toggle in Settings › Privacy — hide online status / appear offline.
- Takes effect immediately for peers (no reconnect / tab-close / sign-out).
- Honored server-side (can't be seen through).
- Honest scope note: governs the online-status dot only, NOT activity like voice/focus study rooms.

Length: within cap (headline + ≤5 bullets). House style matched against wave-77/78/79 entries.

## Action 2 — Milestone delta

Claimed task: `3038a4bc` (presence toggle), set `done` by L-2. Milestone = **M13 `b7400254`** (portable-identity leg family).

M13 child-task state after L-2: **open=1, done=14, seed_candidates=1.**

- `open_count = 1` → **M13 does NOT reach `open=0` → stays `in_progress` mechanically.** No `UPDATE milestones`, no product-decisions append, no BOARD at L-1.
- The 1 open child = task `12f6135e` "Build message read-receipts, then a `sendReadReceipts` privacy toggle" — the read-receipt subsystem **DEFERRED at wave-80 P-0**.

This is a mechanical, unambiguous delta at L-1. No judgment-call routing fires here.

### STRATEGIC FLAG for N-1 (BOARD disposition under `automatic`) — do NOT resolve at L-1

Read-receipts (`12f6135e`) was deferred at wave-80 P-0 by **all 3 reviewers as DEMAND-GATED**. ceo-reviewer verdict: *"too ambitious for a settings leg, defer to a future standalone bundle IF the bet surfaces demand; Discord-parity not the wedge, no demand evidence."*

Consequences N-1 must weigh:

- **`todo` milestone queue = 0** (empty) — no other authored milestone to pick up next.
- Autonomously building read-receipts next (wave-81) would **contradict** the P-0 demand-gated deferral by all 3 reviewers.
- M13's substantive scope has **already shipped**: educator console + portable academic identity + E2E DM encryption + presence (incl. this appear-offline toggle). The lone remaining child is the deferred, demand-gated read-receipt bundle.

**N-1 judgment call (routes to BOARD under `automatic`):** either (a) build read-receipts next, OR (b) re-classify `12f6135e` to the unassigned backlog (`milestone_id = NULL`) and reach a founder-disposition on M13 (mark shipped / re-scope), so M13 isn't held `in_progress` solely by a demand-gated item nobody has evidence to build. This is a milestone-disposition + scope judgment call — surfaced here per L-1 Action 2, resolved at N-1, not L-1.

## Action 3 — README

**Skipped.** No user-facing surface in README requires an edit: no new CLI command/flag, no new env var, no new install step, no breaking change. The README "Live" section describes features at a coarse grain and already covers profile/privacy customization generically without enumerating each privacy control; adding one toggle line is not warranted. Detailed release note lives in CHANGELOG.

## Action 4 — Commit

FS docs committed + pushed to `main`: `docs: L-1 wave-80 closeout (changelog, presence toggle)`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:100-104"
  - "milestone M13 b7400254: no transition (open_count=1, stays in_progress)"
changelog_entry_added: true
roadmap_milestones_progressed: []       # M13 stays in_progress; no transition
roadmap_skip_reason: "M13 open_count=1 (deferred read-receipts child 12f6135e); mechanical no-transition, no BOARD at L-1"
readme_sections_touched: []             # README skipped — no CLI/env/install/breaking-change surface
strategic_flag_for_n1: "read-receipts 12f6135e demand-gated (deferred by all 3 P-0 reviewers); todo queue=0; M13 substantive scope shipped. N-1 BOARD disposition: build read-receipts next OR re-classify 12f6135e to unassigned + founder-disposition on M13."
note: "Mechanical milestone delta, no judgment resolved at L-1. Strategic milestone-disposition flag recorded for N-1 (BOARD under automatic mode)."
```
