# L-1 — Docs (wave-88)

> Block L (Learn), stage L-1 ∥ L-2. head-learn owns the block.
> Wave topic: server-side DM `senderKeyRef` validation on the encrypted-send path
> (defense-in-depth; reject mismatch, fail-open when sender has no registered key).
> Shipped live at api deployment `d0646058` (PR #109). V-block APPROVED (Karen + jenny + head-verifier).

## Action 1 — CHANGELOG entry

Appended ONE line under `## [Unreleased]` → `### Changed` (CHANGELOG.md:128), after the #107
default-role entry, before `### Fixed`.

**Classification: Changed, NOT Security.** The Security section is reserved for a vulnerability that
DID ship to users in a prior wave and is patched after the fact. Here the recipient client already
failed closed against a key mismatch; this wave adds server-side defense-in-depth on a new-ish surface.
No shipped-to-users vuln was patched → **Changed** per L-1 Action 1 ("Preventive security in the same
wave goes in Added/Changed").

Line added (user-facing, rule 16):

> - Private direct messages now get an extra server-side check that the sender is using their own
>   registered encryption key, so a mismatched key is refused before the message is stored. No change
>   to how you send a message. (#109)

## Action 2 — Milestone delta — SKIPPED

The wave's only claimed task (`1f48f4db`) has `milestone_id IS NULL` — a bug-fix / hardening item off
the unassigned queue, not attached to any milestone. No milestone progressed. Skip recorded per Action 2
("Skip when no milestone progressed … came off the unassigned queue without a milestone assignment").
No `milestones` row UPDATE. No judgment-call escalation required.

## Action 3 — README touchups — SKIPPED

Nothing user-facing in README changed: no new CLI command/flag, no new env var, no new install step, no
breaking change. The change is a server-side write-path validation, invisible in README surface. Skip
recorded per Action 3.

## Action 4 — Commit

FS-side change is CHANGELOG.md only. Per task directive, do NOT commit at L-1 (orchestrator batches the
L-block commit downstream). No milestone DB write to commit (Action 2 skipped).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:128 (### Changed, one line, cite #109)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "sole claimed task 1f48f4db has milestone_id IS NULL (unassigned-queue bug-fix); no milestone progressed"
readme_sections_touched: []
note: "Security wave, but Changed (not Security) — no shipped-to-users vuln; recipient client already failed closed, this is server-side defense-in-depth. Uncommitted per L-block batching directive."
```
