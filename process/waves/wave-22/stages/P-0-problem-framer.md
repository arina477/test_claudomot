verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause: this is a NEW-CAPABILITY wave, not a bug-fix, so there is no
  symptom/cause inversion to catch. The cause-layer question is "is assignments the
  right primitive to open M5 academic tooling now?" — yes: M1-M4 (real-time + offline
  conversational core) are LIVE+DONE, and post/view/personal-mark-done is the canonical
  smallest academic-tooling slice that delivers Discord-parity-plus (the M5 differentiator).
  The slice is coherent (CRUD spine + panel UI + tests = one post/view/mark-done feature),
  correctly right-sized, and the reminder/cron/Resend arc is cleanly DEFERRED to a later
  M5 bundle with no leakage into this wave. No gold-plating (no grading/rubrics/
  submissions/calendar-sync/recurring-assignments). No antipattern matched. The only
  corrections are premise-accuracy notes below (rule-1) that adjust HOW two terms are
  framed for P-1..P-3 — they do not change WHAT the wave builds, so disposition stays
  PROCEED rather than REFRAME.

premise_verification: |
  (PRODUCT-PRINCIPLES rule 1 — verify every seed claim about what exists/is absent in code)

  PREMISE 1 — design/assignments-panel.html EXISTS and is ADOPTED, not a stub. VERIFIED TRUE.
    Fully-realized, design-system-token-compliant dark-theme page (Geist font fix applied,
    surface/accent palette, easing tokens). Renders exactly the spec surface: assignment-card
    primitive with amber-due / red-overdue chips (lines 358-441), per-member "Mark as Done"
    toggle (status-toggle), sort-by-due-date ("Sorted by Due Date" header), organizer "New
    Assignment" button + create/view modal (lines 477-573), and an attachments block.
    => D-block is LIGHTER/PARTIAL: the adopted page already exists; D-block reduces to
       confirming token fidelity + extracting the assignment-card primitive, NOT a fresh
       brief/variants cycle. P-1 should set design_gap accordingly (page exists; gap is
       implementation-binding, not net-new design). NOTE for P-1/D-block.

  PREMISE 2 — an organizer-authz "educator-role" exists to REUSE. PARTIALLY FALSE — REFRAME the term.
    There is NO static "educator" role. RBAC (wave-10) is a FLAG-BASED custom-role system
    (apps/api/src/rbac/rbac.service.ts + db/schema/servers.ts):
      - server.owner_id is superuser (all permissions) — the `can()` owner short-circuit.
      - Permission enum: 'manage_server' | 'manage_roles' | 'manage_channels' | 'manage_members'.
      - can(userId, serverId, permission) is the reusable authz primitive; default-DENY.
    => "organizer" = server owner OR a member whose assigned custom role carries the chosen
       manage-flag. The seed's "educator-role" is NOT a real role and must be reframed at
       P-2 to the actual RBAC: gate assignment POST/edit/delete on can(..., <permission>)
       (owner auto-passes via superuser path). P-2 must PICK which permission flag governs
       assignment management — reuse 'manage_channels' (closest existing semantic: organizer
       manages workspace content) OR introduce a new 'manage_assignments' flag on the roles
       table. The latter is a real schema decision for P-1/P-2, NOT a framing error.
       This is a term-accuracy correction, not a problem-framing error => PROCEED with note.

  PREMISE 3 — wave-19 FilesService presign/confirm is reusable for the OPTIONAL attachment (no rebuild).
    PARTIALLY TRUE — presign helper reusable; persistence row is NOT.
      - presignAttachmentUpload(channelId, contentType) + headAttachment (10MB cap, MIME
        allowlist, presigned-PUT + confirm-time HEAD) EXIST and are reusable as the data-plane
        pattern (apps/api/src/files/files.service.ts).
      - BUT the `attachments` table (db/schema/attachments.ts) is HARD-COUPLED to messages:
        message_id NOT NULL, FK to messages ON DELETE CASCADE; the S3 key is channel-scoped
        (attachments/<channelId>/<uuid>.<ext>). It is NOT a generic attachment store.
    => An assignment attachment cannot reuse the `attachments` ROW without either (a) a new
       assignment-scoped attachment association/column, or (b) generalizing the key path.
       The presign + size-enforcement LOGIC is reusable; the persistence shape is not "no
       rebuild." Since this attachment is OPTIONAL and the seed DEFERS nothing here, the
       cleanest P-1/P-2 call is to DEFER the attachment to a later bundle OR scope it as a
       small explicit add (assignment_id column on a new attachment association) — do NOT
       assume a free reuse. NOTE for P-1/P-2 scope sizing.

proposed_reframe: |
  (Not a REFRAME disposition — these are premise-accuracy notes the spec MUST absorb at P-1..P-3;
   the wave's WHAT is unchanged.)
  1. P-1/D-block: assignments-panel.html is ADOPTED — treat D-block as partial (token-fidelity
     + assignment-card primitive extraction), not a fresh design cycle.
  2. P-2: replace "educator-role" with the real RBAC — organizer = owner (superuser) OR member
     with the governing manage-flag; gate assignment create/edit/delete via rbac.can(). Decide
     at P-1/P-2 whether to reuse 'manage_channels' or add a 'manage_assignments' role flag.
  3. P-1/P-2: the optional attachment is NOT a free FilesService reuse — presign LOGIC reuses,
     but the message-coupled attachments row does not. Either defer the attachment to a later
     bundle or scope an explicit assignment-attachment association; do not bundle it as "free."

escalation_reason: |
  n/a

sibling_visible: false
