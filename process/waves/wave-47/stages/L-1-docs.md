# Wave 47 — L-1 Docs

Wave-47 = M8 DM entry-point completion. Shipped LIVE (merge `4db10675` = PR #61; api+web; NO migration). V-block APPROVED (Karen + jenny both APPROVE). jenny confirmed live via the real picker UI end-to-end. Resolves wave-46 F-A (DMs shipped-but-unstartable) + F7 ("Unknown user" author).

## Action 1 — CHANGELOG entry

Replaced the stale wave-46 "groundwork / not usable yet" bullet at `CHANGELOG.md:80` (under `### Added`) with a truthful now-usable entry. Rationale: wave-46 deliberately did NOT claim DMs as a working feature (unstartable). Wave-47 makes DMs genuinely startable + verified usable end-to-end, so the honest move is to UPGRADE the groundwork bullet — leaving both a "now usable" and a "not usable yet" bullet standing would be a contradiction in the release notes. New bullet (single line, keep-a-changelog `Added`, user-facing, cites #60+#61):

> Direct messages are here: start a private 1:1 conversation with anyone you share a study server with — open your direct messages, pick a person, and start talking, with messages arriving in real time and sending reliably even when your connection drops. You can only reach people in your servers (no directory to browse), and each person's messaging preference is respected. (#60, #61)

- Section: `Added` (feature now genuinely usable). In-wave fixes (F-A entry point, F7 author) folded into the feature bullet, not separate `Fixed` lines — the broken behavior never shipped as a working user feature (wave-46 groundwork was explicitly not-usable), so there is nothing user-observable to "fix."
- Candidate-privacy fence (co-members only, no directory leak) is preventive-in-same-wave → stays in `Added`, not `Security`.

## Action 2 — Milestone delta

Distinct milestone touched via `tasks.milestone_id` on claimed tasks `[10967558, 379978a4]`: **M8** (`84e17739-af5e-4396-beb9-b6f3d6836fc4` — "Educator tools & deeper academics", `in_progress`).

DB counts (queried at L-1):
- At L-1 read: `done=20, open=9, cancelled=0`.
- L-2 done-marks the 2 wave-47 tasks (`10967558` + `379978a4`) → projected `done=22, open=7`.
- `open_count=7 > 0` → milestone NOT terminal → **M8 stays `in_progress`**. Mechanical no-op branch (no ambiguity) → no BOARD escalation under `automatic` mode. No `milestones` UPDATE, no `product-decisions.md` append.

The 7 remaining open tasks are all `wave_id=NULL` seedable follow-ups (5 DM-polish + 2 wave-45 stragglers):
- `c5051444` — DM: add LIMIT/pagination to getDmCandidates for large servers (scale)
- `03ccf636` — DM: live-prove who_can_dm=nobody exclusion + candidate negative-isolation test
- `5bcbd27f` — DM off-token surface substitutions (server rail / picker modal restriction UI)
- `874bd233` — DM: reconcile /dm/candidates throttle policy + message-poll (throttle/429)
- `39fc1c5e` — DM route: remove redundant empty channel-sidebar column (4-col cleanup)
- `a1dda389` — Harden delete-any-message E2E (wave-45 debt straggler)
- `f8eb49c1` — Unit-test buildTypingLabel transition table (wave-45 debt straggler)

M8 scope not fully shipped: study-groups + message-search decomposition + DM-polish follow-ups remain. Milestone stays `in_progress` correctly.

## Action 3 — README touchups

**SKIP.** No new CLI command/flag, no new env var, no new install step, no breaking change. The wave shipped a new HTTP endpoint (`GET /dm/candidates`) + client rewiring — an internal surface, not a README quick-start/env/usage surface. All user-facing detail lives in the CHANGELOG bullet.

## Action 4 — Commit

FS-side touchup = CHANGELOG.md (1 line). Milestone progression = no-op (no DB write). One batched commit `docs: L-1 wave-47 closeout`, pushed to `main`. SHA recorded in footer below.

## N-block flags (for head-next)

1. **M8 has seedable follow-ups → NOT a stockout.** 7 open `wave_id=NULL` tasks (5 DM-polish + 2 wave-45 stragglers). N-1 can seed the next bundle from these without decomposition.
2. **DM feature is now "usable enough" — scope-direction question for N-1 (flag, do NOT decide here).** The founder-chosen DM feature is now real + verified usable end-to-end. Remaining M8 work splits into two buckets: (a) more DM polish (throttle/429, negative-isolation test, LIMIT-for-scale, picker restriction UI `5bcbd27f`); (b) NEW founder-facing M8 scope not yet decomposed — study-groups + message-search. Whether the NEXT M8 slice should be (b) new scope vs (a) more polish is a scope-priority call for N-1/next-P-0, not L-1's. Surfacing so head-next weighs "the core DM feature is done; is further DM polish higher-value than opening study-groups/search?"
3. **NOT a debt-only-wave concern.** Wave-47 was a feature-completion wave (DMs made real). Follow-ups are feature-polish + new scope, not accumulating hygiene debt.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:80 (Added — wave-46 groundwork bullet upgraded to now-usable DM feature entry)"
  - "milestone M8 (84e17739): no UPDATE — open_count=7>0 after L-2 done-mark, stays in_progress (mechanical no-op)"
  - "commit: <SHA>"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M8 stays in_progress — open_count=7>0 after L-2 done-marks 2 wave-47 tasks (done 20->22); no milestone transition; mechanical no-op, no BOARD"
readme_sections_touched: []
note: "README skipped (no CLI/env/install/breaking change). DM feature now genuinely usable end-to-end (jenny-confirmed live). CHANGELOG groundwork bullet upgraded rather than duplicated to avoid a now-usable / not-usable-yet contradiction. head_signoff: APPROVED (all L-1 exit checks ticked)."
```
