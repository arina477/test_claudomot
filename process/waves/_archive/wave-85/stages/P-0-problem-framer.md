verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Premise holds and is verified against source. AssignmentCard.handleToggle
  (apps/web/src/shell/AssignmentCard.tsx:652-664) reverts on error by computing
  newState === 'done' ? 'todo' : 'done' (the boolean opposite of the just-applied
  value) and only console.errors, with no user-facing surface — despite an onAnnounce
  a11y channel already in scope (line 650/619). The proposed fix — capture prior status
  before the optimistic flip, restore that snapshot on error, surface a toast — is the
  ROOT fix, not a symptom patch: the cause is state-reconstruction-by-assumption, and
  the fix replaces assumption with a captured value. No deeper state-management issue:
  status is provably BINARY (packages/shared/src/assignments.ts:41 — z.enum(['todo','done']),
  mirrored by AssignmentStatusInput), so the "assume opposite" bug can only diverge from
  the true prior under a rapid double-toggle race (opposite-of-newState ≠ actual-prior),
  never from a third state. Severity "Low / edge-case visual drift" is HONEST.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false

# Framing notes (for P-1/P-2 — non-verdict)

Most important framing point:
  Frame the fix as capture-and-restore-the-actual-prior-value, NOT "flip back the opposite."
  The cleanest capture already exists: `assignment.myStatus` holds the true prior at click
  time. Restore that exact value on error instead of reconstructing `!newState`. Because
  status is binary, opposite == prior in the single-toggle case (why it's visual-only in the
  common case); the only divergence is a double-toggle race. This makes the fix correct by
  construction rather than correct-by-coincidence-of-binary-ness.

Antipattern scan (all clear):
  - Symptom-vs-cause (mandatory check): PASS — fix targets the cause (assumed vs captured state).
  - Wrong-layer: no — the bug is squarely in the frontend component's optimistic-revert path;
    the API contract and status model are sound.
  - Demo-path tunnel vision: no — the fix specifically hardens the error/edge path.
  - Scope creep through coupling (#5): checked and NOT present. Grepped every other .tsx with
    an optimistic update + catch (MemberListPanel, StudyTimerWidget, FocusRoomPanel, BlockedUsersPanel,
    ServerPlanPanel, etc.). None share the assume-opposite pattern: MemberListPanel.handleMutedChange
    (line 854-856) applies optimistically only AFTER success and reverts via functional
    setState(prev => ...) or server re-poll; the others revert by capturing prior via prev or by
    refetch. AssignmentCard is the UNIQUE assume-opposite site. This is correctly a single-site
    frontend fix, NOT a class fix — no RESCOPE-AUTO-SPLIT trigger.

Toast vs a11y (antipattern #2 — right UX layer):
  Use BOTH, not toast-instead-of-announce. onAnnounce is the a11y live-region channel already
  wired into this component (announce = onAnnounce ?? noop, line 650) and should fire the failure
  message for AT users. The visual toast is the sighted-user surface. REUSE the existing toast
  pattern — do NOT invent one: shell/ReportDialog.tsx already implements a Toast component +
  addToast/removeToast with role="status"/aria-live="polite" (success) and role="alert"/
  aria-live="assertive" (error), auto-dismiss at 3500ms. P-2 should either lift that Toast into a
  shared module or follow its contract exactly. Note: if the shared toast host already carries
  aria-live, ensure the error message isn't double-announced through both toast and onAnnounce —
  P-2 decides one authoritative announce path.

Confirm-the-premise: HOLDS. Defect live at AssignmentCard.tsx:658-660; only console.error on the
  catch; onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done') is the assume-opposite
  revert. No later fix since last touch. Severity Low is honest given the binary status model.
