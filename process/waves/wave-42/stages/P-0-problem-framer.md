verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): PASS. The milestone's named scope IS
  "assignment collect/return, no grading"; the bundle (student submission →
  educator roster → educator return-acknowledgement) is the root capability at
  the correct layer (new `assignment_submissions` table + endpoints + DTO field
  + UI), not a symptom-level patch. No deeper missing primitive: submission is
  the atomic artifact, roster reads it, return annotates it.

  Antipattern sweep clean. #2 (rewrite working authz): NOT matched — specs
  explicitly reuse `assertMember`/`assertOrganizer`/`validateAndHeadAttachment`
  and derive server_id from the assignment row; I verified all four exist and
  are IDOR-safe (server_id derived from DB row in getAssignment/updateAssignment/
  toggleStatus/softDeleteAssignment; attachment KEY_PATTERN anchored to the real
  server_id). #4 (invent taxonomy the model lacks): NOT matched — `returned_at` +
  optional comment is explicitly an acknowledgement, NOT a grade/score; the bundle
  correctly stays inside the milestone's no-grading boundary rather than smuggling
  in a scoring concept. #5 (scope creep): NOT matched — no grade field, no LMS, no
  notifications, no bulk ops; submit+view+return is one coherent minimal user loop.
  IDOR doors: specs already mandate server_id derived from the assignment row on
  all three new endpoints — matches shipped precedent, no gap.

  Two substrate corrections for P-1/P-2/P-3 (NOT framing errors, do not block):
  (1) The seed's reuse claim "reuse the shipped attachment presign" is only
  PARTIALLY drop-in. The head/validate path (`validateAndHeadAttachment`) is
  server-scoped and genuinely reusable by any actor. BUT the presign ENDPOINT
  (`presignAttachmentUpload`, assignments.service.ts:472-493) hard-gates on
  `assertOrganizer` — a student (member, non-organizer) cannot call it as shipped.
  For "student submission with optional attachment" to work, P-2 must either add a
  member-gated presign path or scope submissions text-only. This is a false-present
  reuse claim (PRODUCT-PRINCIPLES rule 1) that P-2 must resolve; the WHAT is right,
  the substrate isn't 100% reusable.
  (2) Two-migration same-table ordering: seed CREATEs `assignment_submissions`,
  return-sibling ALTERs it (returned_at + comment). Flag for P-1 to sequence the
  sibling AFTER the seed (parent_task_id dependency; migrations must not
  parallelize). P-3 should consider defining returned_at/comment as nullable
  columns in the initial CREATE so the return sibling only adds endpoint+UI —
  avoids a same-wave same-table ALTER entirely. Design choice, not a blocker.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
