# L-1 — Docs (wave-7, M2 servers/channels first bundle)

## CHANGELOG

Appended one line under `## [Unreleased] → ### Added` (CHANGELOG.md:25), citing (#17):

> Create a study server: it starts with a General category and a #general channel and makes you its owner. Your servers appear in the server rail and their channels in the sidebar. (#17)

Terse, present-tense, user-facing. New feature from the spec contract → **Added**.

## Milestone delta

Claimed tasks all belong to **M2 — Servers, channels & membership** (`41e61975-c92e-49b1-9ae5-45498dd04925`, `in_progress`).

Child-task summary after L-2 marked the bundle done: `done_count=4, open_count=0, total=4` (before the L-2 follow-up inserts below).

**Decision: M2 stays `in_progress`. No milestone-close. No `milestones` write.**

`open_count=0` reflects only that the **first decomposed bundle** is exhausted — NOT that the milestone theme is delivered. M2's `## Scope` prose explicitly enumerates server CRUD, channels + categories, membership (join/leave/kick/ban), two-tier invites, RBAC (roles + channel permission overrides + owner-lockout safeguard), and pages create-server / invite-join / server-settings. Wave-7 delivered only the create-server → owner-membership + default General category + #general channel + app-shell-surfacing slice. The remaining scope is mechanically, unambiguously unbuilt — so closing M2 here would be a premature milestone close. Because the incompleteness is mechanical (readable directly from the milestone Scope prose), no BOARD/ceo judgment routing was required (L-1 Action 2: "Mechanical milestone progress with no ambiguity runs under any mode without escalation"). This is also consistent with the founder's wave-6-resume decision to promote M2 as the active multi-bundle milestone.

**Flag for N-1 (head-next):** M2's first bundle is fully done and `open_count` was 0 at L-1 entry → next-claimable engineering seed under M2 is null until the next bundle is decomposed. N-1 Action 7 should fire `milestone-decomposition-ritual` for M2's NEXT bundle (likely invites/join, channel-management, or member-roles/RBAC). Reason tag: `backlog-stockout` / decomposition-pending. (Three flat follow-up/tech-debt tasks were queued under M2 at L-2 — see L-2 deliverable — but those are NOT a decomposed bundle seed and should not be mistaken for the next feature bundle.)

No `command-center/product/product-decisions.md` append: no milestone transition occurred.

## README

Surgical touchup (README.md:16, "Live" section): extended the accounts-live sentence to note that users can now create a study server (starts with #general) and see it in the server rail with channels in the sidebar. Detail stays in CHANGELOG.

## Commit

Batched FS commit: `docs: L wave-7 closeout (changelog, observations, distill — promote zero)` (shared with L-2 FS artifacts), pushed to `main`.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:25 (Added, #17)"
  - "milestones row: M2 41e61975 NO write — stays in_progress (scope incomplete; premature-close avoided)"
  - "README.md:16 (Live section, servers/channels note)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M2 (41e61975)", before: in_progress, after: in_progress}]
roadmap_skip_reason: ""
readme_sections_touched: ["Live"]
note: "M2 first bundle done; open_count=0 is bundle-exhaustion not milestone-completion. Flagged N-1 for next-bundle decomposition (backlog-stockout / decomposition-pending)."
```
