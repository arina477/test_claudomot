# Wave 22 — P-0 Frame

## Discover
- **wave_db_id:** 7ad7878b-4441-4b2c-a747-0ed07f0de78c (wave_number 22)
- **Milestone:** M5 — Academic tooling: assignments (a5232e16), Tier T3, in_progress. Just ACTIVATED (M4 the offline wedge closed wave-21). M5 = the ACADEMIC half of the bet ("Academic tools + offline-first win students from Discord" — M4 was offline, M5 is academic). M5 = FIRST wave.
- **Spec-contract short-circuit:** no-prior-spec (decomposer prose) → full P-1..P-3.
- **Prior-work to reuse:** M2 RBAC (rbac.service.ts can(userId,serverId,permission), flag-based); wave-19 FilesService presign/confirm; the message-row/attachment patterns; design/assignments-panel.html (EXISTS + adopted).

## Reframe (trio)
- **problem-framer: PROCEED** — assignments (post/view/mark-done) is the canonical first academic-tooling primitive; coherent slice; reminder/Resend correctly deferred; no gold-plating (grading/rubrics/submissions OUT). **3 rule-1 premise corrections:**
  1. **assignments-panel.html EXISTS + ADOPTED** (token-compliant dark page: assignment-card amber-due/red-overdue chips, per-member toggle, due-sort, organizer create modal). → **D-block PARTIAL** (token-fidelity + assignment-card primitive extraction, NOT a fresh brief/variants cycle).
  2. **"educator-role" does NOT exist as a static role** — RBAC is FLAG-BASED (owner_id superuser + custom roles with manage_server|manage_roles|manage_channels|manage_members flags; can(userId,serverId,permission)). → **organizer = owner OR member with a manage-flag.** P-1/P-2 decide: reuse manage_channels OR add a manage_assignments flag. (Term-accuracy, not a framing error.)
  3. **The optional attachment is NOT a free reuse** — FilesService presign LOGIC is reusable, BUT the attachments table is message-coupled (message_id NOT NULL, channel-scoped key). → an assignment attachment needs net-new schema (assignment_attachments table OR nullable message_id) ~350-450 LOC. Keep or defer per mvp-thinner/floor.
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — M5 opens the academic half of the bet; assignments is the flagship M5 feature + the metric; per-member to-do/done + due-sort + amber/red chips + alongside-chat = the T3 differentiator FEEL (Discord structurally can't do per-student coursework state). grading/rubrics/submissions/peer-review/calendar/recurring correctly OUT; reminder/Resend correctly deferred. Coherent first slice.
- **mvp-thinner: OK (floor_constraint_active: true)** — the optional-attachment + organizer-edit/delete are valid THIN-defers ON MERITS (metric = post/view/mark-done works without them), BUT cutting either drops below the 2500 multi-spec floor (attachment-defer → ~2400; both → ~2050). The wave-16/21 floor-EXEMPTION does NOT apply (this is genuine net-new feature LOC, not infra-reuse/UX-completion). So KEEP attachment + edit/delete this wave to hold the floor. **Escalation note: if P-1 firms net-new LOC materially higher (attachment schema+upload heavy), the attachment-defer REOPENS as a clean THIN — re-run the residual floor check at P-1.**
- **Merge: PROCEED (all 3 tasks; no split).** design_gap PARTIAL-TRUE (assignments-panel.html adopted → D-block runs but light: assignment-card primitive extraction + token-fidelity, not a fresh brief).

## Carries to P-1/P-2/P-3
1. **Authz (rule-1):** organizer = owner OR a manage-flag via the existing can() — P-1/P-2 pick reuse-manage_channels vs add-manage_assignments. NO static educator-role.
2. **Attachment (rule-1 + floor):** the assignment attachment needs net-new schema (attachments table is message-coupled) — keep this wave (floor) BUT re-run the floor/attachment-defer check at P-1 if LOC firms higher.
3. **D-block PARTIAL:** design/assignments-panel.html adopted → D-1 brief light/skip; D-block = extract the assignment-card primitive + token-fidelity check (NOT fresh variants).
4. **Schema:** migration 0010 (assignments table + per-member assignment_status table [one-status-per-member unique] + the assignment_attachments association if kept).
5. **Reminder/Resend arc DEFERRED** to a later M5 bundle (no founder cred-ask THIS wave).
- **Final framing:** wave-22 opens M5 academic tooling: assignments CRUD (organizer post/edit/delete via owner-or-manage-flag authz; title/desc/due/optional-attachment) + per-member to-do/done status (toggle, one-per-member) + due-date-sorted list + assignments-panel page + assignment-card primitive (amber-due/red-overdue) + tests. claimed = [01fcefb8, 916ecff7, a5f25f9b].
