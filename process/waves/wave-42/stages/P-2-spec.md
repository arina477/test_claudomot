# Wave 42 — P-2 Spec (pointer)

**Source of truth:** the seed task `tasks.description` (id db8e082a-5ab3-4dc4-8aed-b9553c6b0a27) — YAML head + `---` + prose. This file is a convenience copy.

**wave_type:** multi-spec · **claimed_task_ids:** [db8e082a (submission), 1746f72a (roster), b859984b (return)] · **design_gap_flag:** true

## Acceptance criteria (copy)
### Seed db8e082a — student submission
- Member submits work (text and/or single optional attachment); POST 200 with submission.
- Idempotent upsert on UNIQUE(assignment_id,user_id); resubmit updates in place.
- Non-member 403; server_id derived from assignment row (IDOR-safe).
- Own submission on Assignment DTO as `mySubmission` (null if not submitted).
- Attachment via NEW member-gated presign (assertMember), reuses anti-spoof head.
- No grade/score field anywhere.
### Sibling 1746f72a — educator roster
- Organizer lists all submissions (submitter + submitted-at + text + attachment URL + returned-state), submitted_at DESC.
- Non-organizer 403; zero-submissions → 200 empty; UI visible only with manage_assignments.
### Sibling b859984b — educator return
- Organizer marks returned + optional comment; idempotent; member sees returned+comment; roster shows returned vs not.
- submissionId must belong to the path assignment; non-organizer 403; NO grade/score.

Key P-0 resolutions baked in: member-gated submission presign (finding #1); returned_at/organizer_comment folded into the seed's initial CREATE (finding #2 — single migration).
