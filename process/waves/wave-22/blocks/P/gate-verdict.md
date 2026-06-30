# Wave 22 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-22/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-22 opens M5 academic tooling — the assignments spine (organizer posts title/desc/due/optional-attachment; members view due-sorted and mark a personal to-do/done; panel + card UI; tests). It ladders directly to the live founder bet ad1a3685 "Academic tools + offline-first win students from Discord" (its academic half — M4 closed the offline half), so it is not an orphan wave. The three load-bearing rule-1 premises all VERIFIED against ground-truth code: (a) RBAC is flag-based — `can(userId, serverId, permission)` with the fixed 4-flag union and owner-superuser path; NO static educator-role exists, so the seed's "organizer = owner OR a manage-flag" reframe is correct and reusing `manage_channels` this wave (vs a roles-system migration for a dedicated `manage_assignments` flag) is the right first-slice call; (b) the `attachments` table is message-coupled (`message_id` NOT NULL, cascade-from-message, "row-at-send" by design) so an assignment attachment genuinely needs the net-new `assignment_attachments` association the plan adds, NOT a free reuse; (c) `design/assignments-panel.html` exists and is adopted, so the D-block is correctly PARTIAL (extract the assignment-card primitive + token-fidelity, not a fresh brief/variants cycle). FilesService presign/confirm + the wave-19 server-validated size/type gate are reusable as claimed, and migration 0010 is the correct next number (max existing is 0009). ACs are falsifiable and cover the hard 20% — non-organizer 403 via `can()`, one-status-per-member UNIQUE(assignment_id,user_id) upsert + cross-member isolation, due-date ASC sort, soft-delete cascading status, server-validated attachment (≤10MB, allowlist), non-member list 403, and empty/tombstone UI states. Non-goals are named (reminders/cron/Resend deferred with no founder cred-ask; grading/rubrics/submissions/peer-review/calendar/recurring OUT) — no gold-plating for a T3 first slice. The mvp-thinner floor call is sound: attachment + edit/delete are valid thin-defers on merits but cutting either drops below the 2500 multi-spec floor, and the floor-exemption (wave-16/21) does not apply because this is genuine net-new feature LOC, so KEEP both — verdict holds at the firmed ~2800 LOC. The authz surface (organizer gates) is correctly flagged: the rule-4 non-organizer-403 negative-path test is carried as a B-6 Phase-2 requirement in the plan's B-block carries. The full spec contract is embedded as a YAML head in the primary task's DB description (verified). Proceed to Phase 2 (karen + jenny + Gemini).

## Premise-verification ledger (rule-1, load-bearing)
| Premise | Ground truth | Status |
|---|---|---|
| Authz flag-based, no static educator-role; organizer = owner OR manage-flag via `can()` | rbac.service.ts L29 (`Permission` = manage_server/roles/channels/members), L46-85 (`can()`), L58-60 (owner superuser) | VERIFIED |
| Reuse `manage_channels` this wave (vs new `manage_assignments` flag) is acceptable | dedicated flag needs `Permission` union + `roles` columns + create/update/roleToDto change → larger roles-system migration; reuse is sound first-slice, documented as follow-on | VERIFIED (sound) |
| Assignment attachment needs net-new schema (attachments table message-coupled) | attachments.ts L25-27 `message_id` NOT NULL cascade-from-message + L31-33 channel_id NOT NULL; "row-at-send" header | VERIFIED |
| `assignment_attachments` association (not nullable-message_id) is the right resolution | net-new table avoids weakening existing NOT NULL invariant | VERIFIED (sound) |
| panel.html adopted → D-block PARTIAL | design/assignments-panel.html present | VERIFIED |
| FilesService presign/confirm + server-validated size/type reusable | files.service.ts `presignAttachmentUpload`, `checkAttachmentSize` (10MB/413), `headAttachment` (server-derived size+type at send), `ATTACHMENT_ALLOWED_MIME` allowlist | VERIFIED |
| Migration 0010 is next | max existing migration is 0009_narrow_carnage.sql | VERIFIED |
| Maps to a live founder bet | founder_bets ad1a3685 "Academic tools + offline-first win students from Discord" status=live | VERIFIED |

## Stage-exit checklist
**P-0 Frame** — root-cause (canonical first academic primitive, not symptom) ✓; single live bet ad1a3685 cited ✓; falsifiable ACs (observable 403/UNIQUE/sort/cascade signals) ✓; problem-framer PROCEED + ceo-reviewer PROCEED/HOLD-SCOPE reconciled (3 rule-1 corrections applied, not overridden) ✓.
**P-1 Decompose** — one seed (CRUD+status spine) + two must-ship siblings (UI consumes the spine; tests gate the authz/UNIQUE claims) ✓; floor call sound (keep attachment + edit/delete; floor-exemption correctly N/A on net-new LOC) ✓; no bundle task depends on an unbuilt out-of-bundle task ✓.
**P-2 Spec** — ACs enumerated + independently verifiable ✓; empty/loading/error states for the panel + tombstone-hidden specified ✓; non-goals named (reminders/grading/rubrics/submissions) ✓; authz surface flagged for the security-scope tightened gate ✓; full spec contract embedded as YAML head in tasks.description of 01fcefb8 ✓.
**P-3 Plan** — reuses locked architecture (rbac `can()`, FilesService presign/confirm + send-time HeadObject, adopted design) — no parallel path ✓; no unneeded infra (no Redis/replica/billing; reminders/Resend correctly deferred) ✓; every AC → file step with observable artifact ✓.
**Security-scope** — wave touches authz (organizer gates) → rule-4 non-organizer-403 negative paths required at B-6; plan carries this in B-block carries ✓. Phase 2 security-tightened second-iteration rule will apply if Phase 2 returns BLOCK with >2 medium+ findings.

---

## Phase 2 — Gemini CONCERN triage (head-product)

**Reviewers reconciled:** karen APPROVE, jenny APPROVE, Gemini CONCERN (1, below). Phase 1 verdict APPROVED holds.

### Concern (verbatim, condensed)
Reusing `manage_channels` to gate assignment-organizer routes conflates channel-editing with assignment-management, risks over-granting (least-privilege), and accrues role-management debt. SUGGESTION: introduce a dedicated `manage_assignments` permission now; pay the one-time roles-migration cost rather than the long-term cost of a wrong permission model.

### Verdict: NOT-MATERIAL

### Triage (4-point)
1. **Real?** YES, structurally. `manage_channels` conflates channel-editing with assignment-management; a future non-owner role granted `manage_channels` to act as organizer would over-grant channel-edit rights. The least-privilege point is sound on its own terms.
2. **Fires now?** NO. Self-use-MVP — the owner is the sole organizer and passes via the rbac owner-superuser short-circuit (rbac.service.ts L58-60) regardless of any flag. ZERO non-owner `manage_channels` roles exist (premise VERIFIED Phase 1), so there is nothing to over-grant and no one to confuse. The flag choice is moot for the only user today.
3. **Fix small or scope-add?** SCOPE-ADD, and genuinely larger than the typical Gemini annotation (factored as instructed). The dedicated flag is a roles-system migration on the SEPARATE M2 RBAC surface: the fixed 4-flag Permission union (manage_server|manage_roles|manage_channels|manage_members) → 5, the `roles` table column(s), the create/update DTOs, and `roleToDto`. The wave-22 plan deliberately bounded this out; pulling it in expands scope into a system this wave does not otherwise touch.
4. **Now-cost vs later-cost.** Later wins, decisively. The migration is purely ADDITIVE and low-risk to defer precisely BECAUSE no `manage_channels`-as-organizer roles exist yet — there are zero role rows to backfill or migrate, no destructive change. The authz gate is a SINGLE `can()` call site; swapping `'manage_channels'` → `'manage_assignments'` later is a one-line change plus the additive flag migration. The only "do it now" risk — a window where non-owner `manage_channels`-organizer roles get created and later need migrating — does NOT open this wave: organizer is owner-only today, and granting a non-owner that role is itself future work that would carry the swap. Doing the roles migration now to serve a sole owner-superuser user is gold-plating the M2 RBAC surface for scale that does not exist — the exact self-use-MVP anti-pattern this gate guards against.

### Required guardrails (so the concern is not lost)
- **G1 — product-decision logged.** Append an entry to `command-center/product/product-decisions.md`: "Assignment-organizer authz reuses `manage_channels` for the M5 first wave (owner-only MVP, sole user passes via owner-superuser; no non-owner roles exist to over-grant). A dedicated `manage_assignments` flag is deferred to a follow-on; revisit BEFORE the first non-owner organizer role is created." Records the least-privilege trade-off + the trigger that flips it material.
- **G2 — explicit follow-on backlog task.** Carry a backlog task "Introduce dedicated `manage_assignments` permission (Permission union 4→5, roles columns, create/update DTOs, roleToDto, swap the assignment-route `can()` call site)" so the deferral is tracked, not dropped.
- **G3 — P-3 single-call-site note.** Annotate the plan: the assignment-organizer authz is a SINGLE `can(userId, serverId, 'manage_channels')` call site; the future swap to `'manage_assignments'` is a one-line change at that site plus the additive flag migration — no data migration, no behavior change for the owner.

### Reconciliation
No silent override: Gemini's principle is acknowledged as correct and preserved via G1-G3, not dismissed. It is judged NOT-MATERIAL for THIS wave because it does not fire at sole-user MVP and its fix is a bounded-out roles-system migration that is strictly cheaper (and risk-free) to do later. design_gap_flag handoff unchanged (D-block PARTIAL per Phase 1). No spec or P-3 scope change beyond the G3 annotation; bundle, ACs, and ~2800 LOC estimate hold.

## Footer
- verdict_complete: true
- phase_2_verdict: APPROVED (Gemini concern triaged NOT-MATERIAL + 3 guardrails)
- rework_attempt_cap_remaining: 2

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE — 5 rule-1 premises + spine + can()-authz-reuse VERIFIED. B-notes: (1) headAttachment-before-INSERT reject >10MB; (2) CORRECTION soft-delete HIDES status (not CASCADE — cascade is hard-delete only); tests assert hidden-not-removed. |
| jenny | APPROVE — 8/8 MATCHES M5 ## Scope; reminder-deferral clean in-milestone split (metric reachable across 2 bundles); authz+attachment reframes = implementation not drift; grading/rubrics OUT; amber/red chips verbatim; M5 not over-claimed. |
| Gemini | CONCERN (reuse manage_channels least-privilege) → head-product NOT-MATERIAL (doesn't fire sole-user MVP; dedicated-flag = roles-migration scope-add, risk-free later) + 3 guardrails (G1 product-decision, G2 follow-on task, G3 single-call-site note). Gate APPROVED. |

## Gate result: PASSED → D-block (design_gap_flag TRUE-PARTIAL → assignments-panel.html ADOPTED, light D-block)
- B-block carries: (1) organizer authz = can(manage_channels) single call site (G3; manage_assignments follow-on); (2) headAttachment-before-INSERT ≤10MB (karen 1); (3) soft-delete HIDES status not cascade — tests assert hidden-not-removed (karen 2); (4) rule-4 non-organizer-403 negative-path test at B-6; (5) UNIQUE(assignment_id,user_id) ON CONFLICT upsert + status isolation; (6) migration 0010 (assignments + assignment_status + assignment_attachments); (7) reuse FilesService + rbac can(); (8) OUT reminders/Resend (deferred, no cred-ask) + grading/rubrics.
- design_gap TRUE-PARTIAL → D-block LIGHT (extract assignment-card primitive + token-fidelity vs ADOPTED design/assignments-panel.html — not fresh variants). Next: D-1 (light).
