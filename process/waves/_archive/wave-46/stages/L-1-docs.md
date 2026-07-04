# Wave 46 — L-1 Docs

**Block:** L (Learn), stage L-1 (∥ L-2). Owner: head-learn. Mode: `automatic`.
**Wave:** DM feature slice 1 (M8). Shipped LIVE (merge 2a738f7b + fast-fix re-deploys; api+web LIVE; migration 0021). V-block APPROVED (Karen + jenny, post-fix).

## Action 1 — CHANGELOG entry

**One bullet added under `### Added` (Unreleased)** — `CHANGELOG.md:80` (#60).

**Honesty disposition (deliberate).** The DM feature ships LIVE but is currently **UNSTARTABLE through the UI** — the Start-DM picker's candidate source is broken and "who's DM-able" is a pending founder product decision (F-A CRITICAL, BOARD-approved deferral → #1 M8 follow-up bundle 10967558). A user cannot start a DM yet, so a plain `Added: Direct messages` headline claiming a working user feature would be **misleading** against keep-a-changelog honesty.

Chosen path: a single **truthful groundwork bullet** that (a) records the shipped engine (private 1:1 conversations, real-time two-party delivery, offline-tolerant send, permission checks), and (b) states plainly that the start-a-DM entry point is not switchable on yet and "who you can message" is still being finalized — i.e. not a usable feature for people quite yet, with a follow-up to turn on the entry point. This matches existing house precedent for scoped-groundwork lines (voice study rooms #44 "This is the foundation… turning on live audio still needs…"; rotate-invite #41 "no client button yet").

Not a **Fixed** line: the in-wave fast-fixes (cursor pagination, sender double-render, UUID-as-name) were on code that never shipped to users in a prior release — they are corrections within the same never-yet-usable slice, folded into the groundwork bullet's "live end-to-end" claim, not separate user-observable bug fixes. No **Security** line: DM authz (who_can_dm enforcement, IDOR-safety, idempotency) is preventive security on a new surface → belongs in Added, not the shipped-vuln-patched Security section.

Length: 1 bullet, within the headline + ≤5-bullet cap.

## Action 2 — Milestone delta

Touched milestone: **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`, `in_progress`).

The 4 wave-46 claimed tasks (a48f1910 seed + 32f5d29e / 1ceffdc9 / d8264800 children) are marked `done` **by L-2** (parallel stage). L-1 evaluates the milestone-level progression on the post-L-2 state.

Child-status counts:
- **At L-1 read:** done=16, open=10, cancelled=0, total=26.
- **Projected after L-2 marks the 4 wave-46 tasks done:** done=20, open=6.

The 6 remaining open children are all `wave_id=NULL` seedable follow-ups:
- `10967558` (SEED, todo) — DM Start-picker: make DMs startable (DM-candidate source + entry point) — **the #1 F-A DM-entry bundle**
- `379978a4` (child of 10967558, todo) — DM optimistic-row author resolution (wave-46 F7)
- `39fc1c5e` (SEED, todo) — DM route: remove redundant empty channel-sidebar column
- `5bcbd27f` (SEED, todo) — DM off-token surface substitutions
- `a1dda389` (SEED, todo) — Harden delete-any-message E2E (2-client fan-out determinism)
- `f8eb49c1` (SEED, todo) — Unit-test buildTypingLabel transition table

**Verdict: M8 stays `in_progress`.** Projected `open_count = 6 > 0` → mechanical no-op branch of Action 2. No milestone transition, no `milestones` UPDATE, no `product-decisions.md` append. Under `automatic` mode this is unambiguous (open children remain, incl. the deferred DM UI entry point) → **no BOARD** (no judgment call). DMs slice 1 shipped-with-known-gap; study-groups + search + the DM UI-entry follow-up remain in M8 scope. **Do NOT close M8.**

`roadmap_skip_reason`: not skipped — milestone progressed (4 children done), evaluated, held `in_progress` on the mechanical branch.

## Action 3 — README touchups

**SKIPPED.** DM slice 1 introduces no new env var, CLI command/flag, install step, or breaking change to the README surface. Migration 0021 is applied automatically by the deploy pipeline; no README quick-start delta. Detailed change record lives in the CHANGELOG bullet + PR #60. Recorded skip.

## Action 4 — Commit

Single batched FS commit: `docs: L-1 wave-46 closeout` → pushed to `main`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:80 (Added, groundwork bullet, #60)"
  - "milestones 84e17739: no UPDATE (open_count=6>0 post-L-2 -> stays in_progress; mechanical no-op branch)"
  - "README.md: skipped (no env/command/install/breaking change)"
  - "commit: docs: L-1 wave-46 closeout -> pushed to main"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 (84e17739)", before: in_progress, after: in_progress}
roadmap_skip_reason: ""
readme_sections_touched: []
note: "DM slice 1 shipped LIVE but UNSTARTABLE through the UI (F-A CRITICAL, BOARD-approved deferral -> #1 M8 follow-up bundle 10967558). CHANGELOG scoped truthfully as groundwork per keep-a-changelog honesty; no user-facing 'Direct messages' headline claiming a working feature. M8 held in_progress; 6 seedable follow-ups (incl. F-A DM-entry bundle) carried to N-1."
```

<!--
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}   # L-1 has no in-stage reviewer matrix; head-learn gates directly
  failed_checks: []
  rationale: >
    Every active block's observation-capture is L-2's concern (parallel stage); L-1's own exit checklist
    is satisfied. CHANGELOG carries one truthful groundwork bullet that names the shipped artifact (DM
    engine + migration 0021) without claiming a reachable user feature, honoring the honesty constraint
    on an UNSTARTABLE-through-UI slice. Milestone delta is mechanical (projected open_count=6>0 -> M8 stays
    in_progress) with no ambiguity, so no BOARD under automatic mode; no milestones UPDATE, no
    product-decisions append. README skip is correct (no env/command/install/breaking surface). Doc delta
    covers the one shipped surface that changed for users. No blame, no war story, no principles-file edit
    (that is L-2's gate). Commit pushed to main.
  next_action: PROCEED_TO_L-2   # L-1 ∥ L-2; block exits once both exit -> N-block
-->
