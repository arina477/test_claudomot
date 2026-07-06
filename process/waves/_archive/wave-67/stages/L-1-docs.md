# L-1 — Docs (wave-67)

**Wave:** 67 — M11 (Growth: server discovery), first bundle. StudyHall invite-only → discoverable.
**Owner:** head-learn. **Mode:** automatic.

## Action 1 — CHANGELOG entry

Appended one **Added** bullet under `[Unreleased]` → `### Added` (CHANGELOG.md:88, cites #82):

> Discover public study communities: browse a searchable directory of study servers that owners have opted to make public, then join one in a single click, so joining a community no longer requires an invite link. Private servers stay invite-only and never appear in the directory. (#82)

**Classification: Added.** New feature from the wave spec contract (public server directory + browse UI + one-click public join). The `is_public`-gating and private-reject 403 are *preventive* security on a brand-new endpoint, so per L-1 Action 1 they belong in Added, not Security (Security is for shipped-vulnerability patches only). One bullet covers the whole feature surface; well under the ≤5-bullet cap, terse house style matching recent entries.

## Action 2 — Milestone delta

Touched milestone (via `tasks.milestone_id` on the 3 claimed tasks): **M11 — Growth: server discovery** (`8d88e691-5e39-492f-83a9-73a1a9440af3`, `in_progress`).

Post-done-mark task count under M11 (L-2 already flipped the 3 claimed rows to `done`):

| done_count | open_count | total |
|---|---|---|
| 3 | 1 | 4 |

`open_count = 1` → **M11 does NOT transition.** Mechanical hold, no milestone DB write, success metric NOT hand-edited.

**Delta narrative:** the discovery *read + join substrate* shipped this bundle — public-server schema (`is_public` opt-in / `description` / `topic` + migration 0024), `GET /servers/discover` (auth-gated, is_public-only, memberCount + search + pagination), the `/discover` browse page + ServerRail entry, and `POST /servers/:id/join-public` (private-reject 403). The one remaining OPEN M11 child is the **publish path**:

- `2bd37c4c-eca8-4eda-900b-0276fe46f1b3` (`todo`) — *Publish-to-directory*: the write-half that lets a server owner make their server public + the folded memberCount fix. **HIGH PRIORITY next bundle** — until it ships, the directory is empty and counts read wrong (nothing is publishable yet). This is the natural N-1/N-2 seed candidate.

Related M11 follow-up NOT touched this wave (correctly left `todo`, not under the claimed set):
- `dc4abee3-1e41-41aa-a76b-c65a6b38e457` (`todo`, `milestone_id NULL`) — default member-role assignment on public-join / invite (role_id RBAC follow-up, unassigned).

Future M11 bundles (moderation, ranking) not yet decomposed.

Since M11 did not transition, **no `product-decisions.md` append** (that append fires only on a milestone state transition per L-1 Action 2). Recorded in this deliverable only.

## Action 3 — README touchups

**Skipped.** No user-facing README surface changed — no new CLI command/flag, no new env var, no new install step, no breaking change. Discovery is an in-app feature; its user-facing description lives in the CHANGELOG. (Skip condition per L-1 Action 3.)

## Action 4 — Commit

FS-side touchup committed to `main` and pushed:
- `docs: L-1 wave-67 closeout (changelog)` — CHANGELOG.md:88 only.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:88 (#82, Added)"
  - "milestone M11 (8d88e691-5e39-492f-83a9-73a1a9440af3): no transition (open_count=1); no DB write"
  - "commit: docs: L-1 wave-67 closeout (changelog) -> main"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M11 — Growth: server discovery", before: "in_progress", after: "in_progress"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M11 held in_progress; publish-to-directory (2bd37c4c) is the HIGH-PRIORITY remaining open child and the next-bundle seed candidate — directory is empty/counts wrong until it ships. dc4abee3 (role_id RBAC) correctly left todo. No product-decisions append (no milestone transition)."

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every changed shipped surface is captured: the one user-facing feature (public discovery + join)
    is a single terse Added bullet citing #82, correctly classified Added (preventive endpoint security,
    not a patched shipped vuln). Milestone delta is mechanical and correct — M11 holds in_progress at
    open_count=1, no hand-edit of the success metric, publish-path flagged as the next-bundle seed.
    README skip is justified (no user-facing README surface changed). No blame, all deltas artifact-cited.
  next_action: PROCEED_TO_L-block-exit
```
