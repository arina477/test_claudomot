# Wave 42 — P-0 Frame

## Discover section
- **wave_db_id:** b1c463d3 (wave_number 42)
- **Prior-work citation:** wave-41 shipped the educator role + `manage_assignments`-gated authz + light moderation (M8 slice 1). Assignment CRUD + private todo/done self-toggle + attachment presign + reminders already ship (pre-M8). This wave adds the submission (collect/return) lifecycle on top.
- **Roadmap milestone:** M8 (84e17739), in_progress, H2, class=product-feature, T5. wave milestone_id backfilled.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (decomposer wrote prose Acceptance blocks, no fenced YAML head). Full P-1..P-3.
- **Product-decision resolutions:** none Tier-3 (reuses shipped attachment + RBAC; no money/security-regime/major-UX-tradeoff). **Carry:** M8 `## Success metric` still `_TBD by founder_` — surfaced non-blocking to founder at wave-41 N-1; safe for this founder-directed core slice (gates only the later discretionary M8 slices).

## Reframe section
- **Original framing:** M8 slice-2 collect/return — seed db8e082a (student submission) + siblings 1746f72a (educator roster) + b859984b (educator return action). NO grading (milestone scope).
- **problem-framer verdict:** PROCEED (file P-0-problem-framer.md). Right layer, reuses shipped authz/IDOR/attachment substrate, no grading taxonomy smuggled in, no scope creep. **THREE findings carried to P-2/P-3:**
  1. **[load-bearing] False-present reuse claim:** the seed AC says "reuse the shipped attachment presign," but `presignAttachmentUpload` (assignments.service.ts:472-493) HARD-GATES on `assertOrganizer` — a student/member CANNOT call it. `validateAndHeadAttachment` (server-scoped, IDOR-safe) IS reusable. **P-2 decision required:** add a member-gated presign path for submission attachments, OR scope submissions text-only for this slice. (Recommend P-2 resolves explicitly; a member-gated presign is a bounded add that honors the AC's "optional file attachment".)
  2. **Two-migration ordering:** seed CREATEs `assignment_submissions`; return-sibling ALTERs it (+returned_at, +comment). P-1 must sequence sibling-migration AFTER seed-migration (no parallel migrations); P-3 should consider authoring returned_at/comment as nullable columns in the INITIAL CREATE to avoid a same-wave same-table ALTER.
  3. Antipatterns #2/#4/#5 checked, NOT matched.
- **ceo-reviewer verdict:** PROCEED / HOLD-SCOPE (file P-0-ceo-review.md). Right thing (founder-anchored, dependency-ordered, completes a partially-built surface), right ambition (working submit→roster→return loop, not inert; "no grading" is a correct wedge-preserving ceiling), no gold-plating. Rejected a return-notification SELECTIVE-EXPANSION (student sees returned state via pull; defer push to a later M8 notifications/polish slice). Metric-TBD safe for this core slice.
- **mvp-thinner verdict:** OK / `flag_metric_undefined: true` (file P-0-mvp-thinner.md). Cannot thin against an undefined metric (contract-barred). Bundle already AC-thinned at authoring; the 3 tasks are one minimal coherent collect/return slice (roster = read-side of collect, not deferrable; return-comment/state intrinsic to return, not gold-plating).
- **Mediation outcome:** no ceo/mvp conflict (ceo HOLD-SCOPE, mvp OK). No re-spawn. All-PROCEED → P-1.
- **Sibling task IDs created:** none new (bundle authored by decomposer).
- **Disposition:** PROCEED (scope held; presign-gating + migration-ordering findings carried to P-2/P-3).

### Final framing (rest of P-block uses this)
**Wave-42 = M8 collect/return lifecycle: student assignment submission (text + optional attachment) + educator submissions roster + educator return-with-comment. NO grading. (multi-spec: seed db8e082a + siblings 1746f72a, b859984b)**
- P-2 must resolve the member-presign-vs-text-only attachment decision (problem-framer finding #1).
- P-1/P-3 must sequence the two migrations (seed CREATE → return ALTER), or fold returned_at/comment into the initial CREATE.
