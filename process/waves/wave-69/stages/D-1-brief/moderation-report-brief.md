# D-1 Brief — moderation report surfaces (report dialog + owner inbox)

## §1 What we need
Two cohesive surfaces for the M14 report→action loop: (a) a student REPORT DIALOG to report a public server / a member / a message (reason + submit); (b) an owner/moderator REPORT INBOX listing open reports for a server with per-report actions (timeout member / delete message / dismiss).

## §2 Where it lives
- Report dialog: a modal opened from a "Report" control on a public discovery listing (/discover card), a member (member list/context), and a message (message hover actions). apps/web/src/shell.
- Owner inbox: a moderator-only view for a server (opened from server settings / moderation entry; gated on moderate_members). apps/web/src/shell.

## §3 Audience + states
- Dialog: any logged-in student. States: default (reason field empty), submitting, success (confirmation + close), error (non-destructive), too-long-reason (validation).
- Inbox: server owner/moderator (moderate_members). States: loading, list (open reports), empty ("No open reports"), per-row actioning (spinner), resolved (row removed), error.

## §4 DESIGN-SYSTEM.md references (≥6 primitives)
- Surfaces: `--surface-900` (modal/inbox panel), `--surface-800` (rows), `--surface-700` (row hover/border).
- Text: `--text-primary` (report target/reason), `--text-secondary` (metadata/reporter/time), `--text-muted` (placeholder/empty).
- Accent: `--accent-emerald` (`--primary`, submit/resolve primary button, dark-on-emerald text per §8); `--danger` (destructive actions: delete message / timeout — danger fill; `--danger-text` on tint).
- Border: `--border-hairline` (row/card), `--border-hover`.
- Components: **Modal/Dialog** (§8 — surface-900, radius-lg, scrim, focus-trap, role=dialog, Esc-close) for the report dialog; **Input/Textarea** (§8 — reason field, bounded, char-count) ; **Button** variants (primary emerald submit; destructive danger for timeout/delete; ghost/secondary for dismiss/cancel); list-row pattern.
- Icons: Phosphor — flag/warning (report), trash (delete message), clock (timeout), x/check (dismiss/resolve).

## §5 Responsive contract
- Dialog: centered modal, max-width ~480px desktop; full-width sheet on mobile (<640px).
- Inbox: full-panel list desktop; single-column rows mobile; action buttons wrap/stack on narrow.

## §6 Interaction patterns
- Report: click Report → dialog opens (focus reason) → type reason (char-count, bounded) → Submit (primary) → success toast + close; Cancel/Esc closes. Double-submit disabled on submit.
- Inbox: each row shows target (server/member/message + name) + reason + reporter + time; actions: Timeout (danger, member reports), Delete message (danger, message reports), Dismiss (ghost). Confirm destructive actions inline; on success the row leaves the open list.

## §7 Data shape
Report = {id, target_type: server|member|message, target names/ids, reporter, reason, status, created_at}. ResolveAction = timeout|delete_message|dismiss.

## §8 Prior art (match visual language)
- `design/member-moderation.html` — the moderation action UX (timeout/action patterns, danger styling).
- `design/notifications-center.html` — the list/inbox surface (rows + metadata).
- `design/create-server.html` / `design/invite-join.html` — modal + input/field styling for the report dialog.

## §9 Success criteria (≥5)
- [ ] Report dialog: a modal with a bounded reason field + primary Submit + Cancel, dark-theme, matching create-server modal chrome; success + error + validation states.
- [ ] Report control (flag icon) appears on a server card, a member, and a message — consistent affordance.
- [ ] Owner inbox: a list of open reports (target + reason + reporter + time), each with the right actions (timeout/delete/dismiss); empty + loading states.
- [ ] Destructive actions (timeout/delete) use `--danger`; primary submit/resolve uses `--accent-emerald` with §8 dark-on-emerald text; dismiss is ghost/secondary.
- [ ] Moderator-only inbox visually distinct + only shown to moderate_members holders (design shows the gated entry).
- [ ] All colors/type/spacing/icons from DESIGN-SYSTEM.md (no invented hex; Phosphor only); WCAG AA contrast (incl. dark-on-emerald + danger-on-tint).

## §10 Non-goals
Full review-queue filtering/triage/sort, appeals flow, user-to-user block UI, platform-admin takedown console, auto-detection surfaces, report analytics — all deferred to later M14 bundles. Light mode.

## §11 Reviewer briefing
Judge against: report dialog matches create-server modal chrome; inbox matches notifications-center/member-moderation list+action rhythm; danger vs emerald button semantics correct (destructive = danger, submit/resolve = emerald dark-on-emerald); Phosphor + token discipline; AA contrast; the report affordance is a consistent flag control across the 3 surfaces. Report analytics / filtering / block UI are out of scope.

```yaml
mask_mode_signoff: PASS
signoff_note: "All template fields filled; §4 cites 6+ primitives; §8 names 3 prior-art mockups; §9 has 6 checkboxes."
```
