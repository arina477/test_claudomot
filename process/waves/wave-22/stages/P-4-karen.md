# P-4 Karen — Phase-2 load-bearing-claim verification (wave-22, M5 assignments)

**VERDICT: APPROVE**

All 5 rule-1 premises + the spine + the can()-authz reuse are grounded in real code. The three load-bearing claims (flag-authz-reuse, attachment-needs-new-table, can()-403) are verified against the actual codebase. No bullshit detected; scope is honest and falsifiable.

---

## Per-claim verification

### Premise 1 — organizer authz = owner OR manage_channels flag via can() — **VERIFIED**
`apps/api/src/rbac/rbac.service.ts:29` — `Permission = 'manage_server' | 'manage_roles' | 'manage_channels' | 'manage_members'`. Exactly the 4 flags claimed; **NO static "educator" role exists** (correct).
`rbac.service.ts:46-85` — `can(userId, serverId, permission)`: owner superuser path (`:58-60` `server.owner_id === userId → true`), then member→role_id→`role[permission] === true` (`:84`), default-DENY otherwise.
**Reuse of `manage_channels` is sound:** owner always passes (superuser short-circuit before any flag check); a member with a `manage_channels=true` role = organizer. No migration needed this wave. The plan's documented deferral of a dedicated `manage_assignments` flag to a follow-on (P-3-plan.md:14) is the right call — no gold-plating. The B-1 "decide perm" note is acceptable latitude; default (reuse manage_channels) is stated.

### Premise 2 — assignment attachment needs a NEW table (attachments is message-coupled) — **VERIFIED**
`apps/api/src/db/schema/attachments.ts:25-27` — `message_id` is `.notNull().references(messages.id, cascade)`. Header comment `:8` confirms "message_id is NOT NULL ... never as an orphan (P-4 row-at-send decision)". An assignment has no message_id → the existing `attachments` table genuinely **cannot** be reused without a nullable-ification. The plan's net-new `assignment_attachments` table (P-3-plan.md:9) is correct and is the cleaner of the two options the spec offers. Confirmed `apps/api/src/db/schema/assignments.ts` does NOT yet exist (net-new, not a claimed-but-missing reuse).

### Premise 3 — FilesService reusable for the assignment attachment — **VERIFIED**
`apps/api/src/files/files.service.ts` — all named helpers present and reusable:
- `presignAttachmentUpload` (`:217`), `checkAttachmentSize` (`:281`, 10 MB cap `:43`), `headAttachment` (`:327`), `ATTACHMENT_ALLOWED_MIME` (`:33`, exported), `resolveAttachmentUrl` (`:356`, presigned-GET for private buckets).
- **wave-19 anti-spoof confirmed:** `headAttachment` (`:308-344`) server-derives authoritative size + content-type; comment `:314-319` documents that client-supplied size/type are IGNORED ("closes the size-bypass and type-spoof vectors"). The plan's claim to reuse the wave-19 send-time HeadObject validation (P-3-plan.md:40) is real, not aspirational.
- **One caveat (NOT blocking):** the known-debt at `:244-254` — presigned-PUT cannot carry ContentLengthRange, so the binding size gate is at *attach/send time* via `headAttachment`, not at PUT. The assignment attach path MUST replicate this (call `headAttachment` before INSERT, reject >10 MB), exactly as `MessagesService` does. The spec's edge-case "server-validated like wave-19" (spec edge-cases) + plan B-block carry (P-3-plan.md:40 "incl the send-time HeadObject validation") cover this. Flag for B-3 to not regress to checkAttachmentSize-only.

### Premise 4 — design/assignments-panel.html genuinely adopted → D-block PARTIAL — **VERIFIED**
File exists, 674 lines, real markup (not a stub). Adopted primitives present:
- assignment-card (`.glass-panel` article rows, `:358 :391 :444`), per-member `.status-toggle` checkbox (`:98-119`, `Mark as Done`, `:377 :404 :455`), `.card-done` done-state styling (`:159-163`).
- **Two distinct chips confirmed:** red overdue uses `--danger: #ef4444` (`:30`, chip `:364`); amber due-soon uses `--accent-amber: #f59e0b` (`:29`, chip `:394`). The plan's "amber due-soon + red overdue" (P-3-plan.md:19) maps to real tokens. D-block PARTIAL (extract card primitive + token-fidelity, not fresh variants) is the correct disposition; design_gap_flag: true is honest.

### Premise 5 — migration 0010 next; FK target tables exist — **VERIFIED**
`apps/api/drizzle/migrations/` max is `0009_narrow_carnage.sql` → **0010 is next** (confirmed; the 0003/duplicate-0004 gap is historical and irrelevant to next-number). FK targets all exported: `servers` (`servers.ts:14`), `roles` (`:28`), `server_members` (`:43`), `channels` (`:68`), `users` (`users.ts:5`), all re-exported via `schema/index.ts`. The plan's FKs (server_id→servers, organizer_id→users, assignment_id→assignments-self) all resolve.

---

## Spine realism — VERIFIED

- **Per-member UNIQUE + ON CONFLICT upsert:** `UNIQUE(assignment_id, user_id)` + ON CONFLICT toggle (plan :8, :13). **Upsert precedent is real** — `rbac.service.ts:478` `onConflictDoUpdate` on `UNIQUE(channel_id, role_id)` is the exact pattern (insert-or-update on a composite unique); `messages.service.ts` uses `onConflictDoNothing` widely. Drizzle `onConflictDoUpdate` is proven in this codebase. PASS.
- **Status isolation** (A's toggle ≠ B's): enforced by the `(assignment_id, user_id)` composite key + per-user upsert. Testable, falsifiable. PASS.
- **Due-sort ASC:** plan requires `due_date NOT NULL` (P-3-plan.md:7) which removes the nulls-ordering ambiguity cleanly. PASS.
- **Soft-delete cascade:** `is_deleted` flag + `assignment_status.assignment_id ... ON DELETE CASCADE` — but note: soft-delete (is_deleted=true) does NOT trigger FK CASCADE (that only fires on a real DELETE row removal). The AC says "Delete cascades the per-member status rows" — with soft-delete this is satisfied by the LEFT JOIN excluding is_deleted rows from listing, NOT by FK cascade. **Minor spec/plan tension** (plan :13 "softDeleteAssignment (organizer; CASCADE handles status)" — CASCADE does NOT handle status on a soft-delete). Not blocking the gate, but **B-3 must clarify**: soft-deleted assignments simply stop surfacing their status rows; if a hard-delete path is ever added, THEN cascade fires. Test (task 3) should assert soft-deleted assignment + its status rows are both hidden, not physically removed. Flag for B-3/B-6.
- **can()-gate at controller:** organizer routes gated on `can(userId, serverId, <perm>)`, member routes on server-membership (plan :14). Matches the existing RBAC controller-guard pattern. PASS.

## Antipattern scan — CLEAN
- **ACs falsifiable:** yes — each has a concrete observable (403 on non-organizer, due-ASC order, UNIQUE upsert count, isolation, >10 MB reject). PASS.
- **non-organizer-403 testable (rule-4 B-6):** yes — task 3 ACs explicitly require the non-organizer post/edit/delete → 403 negatives + non-member list 403. This is the load-bearing can()-403 and it is a named test requirement. PASS.
- **Gold-plating:** correctly deferred — reminders/cron/Resend OUT (no founder cred-ask), grading/rubrics/submissions/peer-review/calendar OUT (milestone). No premature abstraction. PASS.
- **No new dep:** Drizzle + @aws-sdk + React 19 all existing. PASS.

---

## Carry-forward flags for the B-block (non-blocking; do NOT regress)
1. **Attachment size gate (premise 3 caveat):** the assignment attach path MUST call `headAttachment` (server-authoritative size+type) before INSERT and reject >10 MB — replicate the wave-19 send-time pattern, NOT checkAttachmentSize-at-confirm-only. The presigned-PUT cannot block oversize at PUT (`files.service.ts:244-254`).
2. **Soft-delete vs CASCADE semantics:** plan :13 says "CASCADE handles status" on softDelete — incorrect; FK CASCADE only fires on hard row-DELETE. Status rows are hidden via the is_deleted-excluding LEFT JOIN, not cascade. Tests must assert hidden-not-removed.

Neither flag invalidates a premise or the spine; both are B-3 implementation precision notes.

---

## Agent collaboration
- @jenny — confirm the AC→spec→requirement mapping (M5 "post/view/mark-done assignments spine") at V-1; the per-member status arc is the load-bearing user-facing behavior.
- @code-quality-pragmatist — at B-6, confirm `assignment_attachments` 0-1-per-assignment doesn't get over-modeled into a generic polymorphic attachment system (the spec offers "OR generalize attachments" — the net-new narrow table is the simpler, correct choice; resist generalization gold-plating).
- @head-tester — T-2/T-3 must cover the can()-403 negatives + UNIQUE-upsert idempotency + status isolation + soft-delete-hides-status.
