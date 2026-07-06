# L-1 — Docs (wave-68)

## CHANGELOG
Appended 2 bullets to the unreleased section of `CHANGELOG.md`, both citing PR #83, under the ≤5-bullet cap:
- **Added** (after the #82 discovery line): "Publish your study server to the public directory: from server settings, an owner can now switch their server between private and public and add a short description and topic, so the community shows up in discovery with a clear summary — and can be pulled back to private at any time. (#83)"
- **Fixed** (end of Fixed section): "Discovery cards now show each community's real member count instead of always reading zero, so you can tell how active a study server is before joining. (#83)"

Classification: publish-write-half = new feature from the spec contract → **Added**. The memberCount:0 defect was a bug in wave-67's already-SHIPPED discovery directory (cards read 0 for every community) → **Fixed**. Owner-gate (non-owner PATCH→403) is preventive endpoint security on a new/modified endpoint, not a patched shipped vuln → not **Security**.

## Milestone delta — M11 CLOSED (in_progress → done)
Touched milestone: M11 — Growth: server discovery (`8d88e691`). After L-2 marked the wave's claimed task `2bd37c4c` done, M11 child counts: **done_count=4 / open_count=0** — every child terminal → mechanical close condition met.

This was a milestone-disposition JUDGMENT (is M11 "really done" or only structurally complete, given the strategic moderation/ranking carry). Under `automatic` mode, L-1 Action 2 routes judgment-required deltas to the **BOARD** (decision-slug `L-1-roadmap-delta-wave-68`).

**BOARD verdict: 7/7 APPROVE, 0 REJECT, 0 ABSTAIN, 0 HARD-STOP** (clean; well above the 4+/7 default bar). Disposition applied: **M11 → done**; moderation (report/block/takedown of public servers) + ranking/categories/trending recorded as a FUTURE separate milestone/bundle, NOT retro-scoped into M11 (its success metric — browse/search a public directory, see community info, one-click join — is fully reachable and was never scoped to include moderation; hand-editing the metric is forbidden). founder-proxy confirmed this is the delegated-mechanical-close class (analogous to the same-session M12 Option-A close), not a founder-reserved ambiguity like wave-59 M12.

**Unanimous BOARD carry (all 7 dissent-notes agree):** moderation MUST be authored as a real queued `status='todo'` milestone/bundle (not prose-only) AND MUST gate any actual PUBLIC LAUNCH of the discoverable directory. Closing M11 does NOT trigger a public launch (publishing is owner opt-in; product stays self-use-MVP). realist flag: closure certifies the feature is reachable/functional, not that discovery drives Discord-switching (untested; only self-seeded "2 members" test data). Recorded in `command-center/product/product-decisions.md` (new [2026-07-06] wave-68 L-1 entry) and `process/session/updates/board-digest-2026-07-06.md` § Clean decisions.

**Roadmap follow-up for N-1:** with M11 now done and no `todo` moderation/ranking milestone yet existing, the moderation-before-public-launch carry needs a milestone home — surface to N-1 (roadmap-planning candidate) so the launch-gate does not degrade into a dropped obligation.

## README
Skipped. In-app feature; no CLI command/flag, env var, install step, or breaking change. Per Action 3 skip condition.

## Commits (FS)
CHANGELOG + product-decisions + board-digest batched: `docs: L-1 wave-68 closeout (changelog)`. Pushed to main. (Milestone progression written to the DB inside Action 2 — no git commit for that.)

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: +1 Added bullet (publish-to-directory, #83) + +1 Fixed bullet (memberCount real count, #83)"
  - "milestones row UPDATE: 8d88e691 in_progress -> done (BOARD 7/7 APPROVE, slug L-1-roadmap-delta-wave-68)"
  - "product-decisions.md: [2026-07-06] wave-68 L-1 M11 CLOSED entry appended"
  - "board-digest-2026-07-06.md: Clean decisions L-1-roadmap-delta-wave-68 appended"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M11 — Growth: server discovery (8d88e691)", before: in_progress, after: done}
roadmap_skip_reason: ""
readme_sections_touched: []
board_decision:
  slug: L-1-roadmap-delta-wave-68
  vote: "7 APPROVE / 0 REJECT / 0 ABSTAIN / 0 HARD-STOP"
  outcome: "M11 -> done; moderation + ranking to a future milestone (not retro-scoped)"
  carry: "moderation must be a real queued milestone + must gate any actual public launch; surface to N-1"
note: "Milestone-disposition judgment resolved via BOARD per automatic-mode routing. Moderation/ranking future-milestone carry handed to N-1."
```
