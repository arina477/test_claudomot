# V-1 Semantic-Spec Verification — wave-42 (assignment collect/return) — jenny

**Verdict: APPROVE**
**Findings: 3 (0 drift · 2 gap/env · 1 note)** — all deployed behavior matches the spec contract's INTENT.

Verifier: jenny (semantic INTENT, not literal ACs; source-claim truth is Karen's lane).
Deployed LIVE: api `api-production-b93e.up.railway.app` · web `web-production-bce1a8.up.railway.app`.
Probed as fixture A (`studyhall-e2e-fixture@example.com`), member+organizer everywhere.
Live probe assignment: `71abd01c-1454-4480-b061-8444e9ec3098` (server `ad62cd12…`).

---

## 1. AC semantics — every AC's intent verified live

### Seed db8e082a — student submission (collect)
- **Member submits text/attachment; 200 with submission** ✓ — `POST /assignments/:id/submit {text}` → 200, full `AssignmentSubmission` incl. `id`. Attachment path also verified end-to-end (see §3).
- **Idempotent upsert on (assignment_id,user_id)** ✓ — resubmit returned the *same* submission id (`99872656…`), text updated in place, roster count stayed 1 (no duplicate row). `submittedAt` advanced.
- **mySubmission on the DTO (null when absent)** ✓ — fresh assignment `GET /assignments/:id` → `mySubmission: null`; after submit, `mySubmission` populated with text/attachment/submittedAt/returnedAt/organizerComment. Also present on the *list* DTO (`GET /servers/:id/assignments`).
- **Member-gated presign, server-derived anti-spoof head** ✓ — `POST /servers/:serverId/assignments/submissions/presign` → 200 `{uploadUrl,key}` for member A. On submit-with-attachment the stored `sizeBytes: 27` reflects the *actual* uploaded bytes ("hello submission attachment" = 27 chars), NOT any client-claimed value → HeadObject anti-spoof is live.
- **No grade/score field anywhere** ✓ — submit DTO keys = `[assignmentId, attachment, id, organizerComment, returnedAt, submittedAt, text, userId]`. No grade/score/points/mark. (An earlier grep "grade" hit was a false positive from my own submission text "grade-scan probe".)

### Sibling 1746f72a — educator roster (collect view)
- **Organizer lists all submissions with submitter identity + submitted-at + text + resolved attachment URL + returned-state** ✓ — `GET /assignments/:id/submissions` → `{submissions:[…]}`, each row carries `submitter{userId, displayName, username, avatarUrl}`, `submittedAt`, `text`, `returnedAt`, and a resolved signed attachment `url` (or null). Ordering not disproven; single-row live data can't exercise DESC — covered by T-4 real-PG.
- **Zero submissions → 200 empty** ✓ — verified in T-4 (case 9); live assignments all had ≥1 submission.
- **UI visible only with manage_assignments** ✓ — roster ("Submissions Roster") renders inline in the educator panel for A; see §4.

### Sibling b859984b — educator return (no grading)
- **Organizer marks returned + optional comment; 200 with updated submission** ✓ — `POST /assignments/:id/submissions/:submissionId/return {comment}` → 200, `returnedAt` + `organizerComment` set.
- **Idempotent return** ✓ — returning an already-returned submission overwrote the comment ("first return note" → "OVERWRITTEN note") and kept returned state; `returnedAt` refreshed.
- **Member sees returned state on mySubmission** ✓ — after return, `GET /assignments/:id`.mySubmission showed `returnedAt` + comment.
- **submissionId must belong to path assignment** ✓ — cross-assignment return → 400 "Submission does not belong to this assignment" (spec allows 404/400).
- **No grade/score introduced** ✓ — return response + return UI carry only the acknowledgement comment. Return dialog has a single "Add an acknowledgement note (optional)" textarea, no numeric field.

---

## 2. Edge cases — all pass

| Edge | Expected | Deployed | Result |
|---|---|---|---|
| submit neither text nor attachment (`{}`) | 400 | 400 "A submission must include text or an attachment." | ✓ |
| submit `{text:null,attachment:null}` | 400 | 400 (same) | ✓ |
| submit `{text:""}` (empty string) | 400 | 400 (same) | ✓ |
| **resubmit after a return** | clears `returned_at`+`organizer_comment` → back to not-returned | returnedAt=None, comment=None after resubmit | ✓ (critical seed↔return cross-ref) |
| return again (already returned) | idempotent overwrite | comment overwritten, still returned | ✓ |
| return with `comment:null` | allowed | 200, comment=null, returned_at set | ✓ |
| cross-assignment return | reject | 400 | ✓ |
| unknown submissionId (valid uuid) | 404 | 404 "Submission not found" | ✓ |
| submit to unknown assignment | 404 | 404 "Assignment not found" | ✓ |
| roster on unknown assignment | 404 | 404 | ✓ |
| submit to **soft-deleted** assignment | 404 | 404 (create→DELETE→submit) | ✓ |
| roster on soft-deleted assignment | 404 | 404 | ✓ |
| malformed (non-uuid) assignment id | 400 (22P02 mapped) | 400 | ✓ |
| text > 5000 chars | 400 | 400 "at most 5000 character(s)" | ✓ |
| comment > 2000 chars | 400 | 400 "at most 2000 character(s)" | ✓ |

The resubmit-after-return clearing behavior — the wave's most semantically load-bearing edge (a stale return must surface as not-returned so the educator re-reviews) — is verified live and correct.

---

## 3. Contract conformance — probed live as A

- submit → 200 `{submission incl. id}` ✓
- `GET /assignments/:id` shows `mySubmission` ✓
- roster → `{submissions:[…]}` with submitter identity ✓
- return → 200 with `returnedAt` + `comment` ✓
- Error envelopes well-formed: NestJS `{message,error,statusCode}` on 404/400; Zod `{formErrors,fieldErrors}` on validation 400 ✓
- **NO grade/score field in any response** ✓ (submit / assignment DTO / roster row all scanned)
- **Full attachment lifecycle**: presign (member-gated) → PUT bytes (200) → submit-with-attachment → server-derived `sizeBytes:27` (anti-spoof) → roster resolves signed GET URL (Expires=3600). ✓

**Note (not a defect):** the submitted-attachment DTO is the *resolved* AttachmentRef `{id,filename,contentType,sizeBytes,url}`, not the raw submit-input `{key,filename,contentType}`. This is correct — spec asks the roster/DTO to carry a *resolved URL*; the raw shape is input-only. Consistent with the shipped AssignmentSchema attachment. **Label: conformant, note only.**

---

## 4. Journey continuity — no dead-ends

**Educator path (fully verified live via browser):** sign in → server rail → Assignments panel → per-assignment "Submissions Roster" (with count badge, submitter avatar, timestamp, text preview, status badge) → click "Return" → "Return to" dialog (acknowledgement-comment textarea only, no grade field) → "Mark Returned" → roster row flips to green **"RETURNED"** badge and count updates **0/1 → 1/1**; a sibling assignment's row stays **"Awaiting"** (0/1). Roster shows returned-vs-not per row exactly per spec AC. The UI return wrote through to the real backend (server-side roster confirmed `returnedAt` + `organizerComment:"UI return via jenny verify"`).

**Student "Your Work" submit form:** absent for A. **This is the intended `isOrganizer` gate, not a defect** — A is organizer on every server, and the roster AC explicitly gates the educator surface on `manage_assignments`; the same viewer is not simultaneously shown the student-submit form. The gate is intentional and spec-conformant. The student submit→own-card→edit flow itself is verified at the API layer (submit → mySubmission on DTO → resubmit-in-place) and in T-4/T-5.

No unhandled errors surfaced in the browser (console clean on the assignment panel).

---

## 5. Spec drift vs spec gap

- **No drift found.** Every deployed behavior matches spec INTENT. Zero code-wrong findings.
- **ENV gap (not a product defect):** fixture B is broken (WRONG_CREDENTIALS), so a true non-member / non-organizer live session is unavailable. The non-member-submit-403, plain-member-roster-403, and non-organizer-return-403 paths could NOT be repro'd via live probe. **Resolved by T-4 real-PG integration evidence** (`process/waves/wave-42/stages/T-4-integration.md`, CI run 28689560816 SUCCESS, NOT skipped): case 6 (non-member submit→403 IDOR-safe), case 8 (member roster→403), case 12 (non-organizer return→403). The authz gates are verified — just not by my live probe. **Label: env gap, covered.**
- **Spec-copy consistency:** the DB `tasks.description` (source of truth) and the `P-2-spec.md` convenience copy agree with observed behavior. No P-2 defect.

### Karen's-lane flag (source-claim, out of my scope — informational only)
The controller comment (`assignments.controller.ts:53`) says organizer authz gates on `can(userId, serverId, 'manage_channels')`, while the spec Context says the *code* gates on `manage_assignments` "despite a stale `manage_channels` comment." I cannot distinguish comment-staleness from real permission drift by black-box probing (A holds every permission as owner). **Deployed behavior is correct** for A. Recommend Karen confirm the *actual* `can(...)` permission string in the running service and whether the comment is merely stale — a real `manage_channels` gate would let channel-managers who lack `manage_assignments` see the roster. This does not block V-1 (behavior conforms for the tested identity).

---

**VERDICT: APPROVE** — deployed behavior matches the spec contract's intent across all three tasks (collect / roster / return); every semantic edge (idempotent upsert, resubmit-clears-return, cross-assignment guard, 404s, length bounds, anti-spoof head, no-grade) verified live; the only untestable paths (403 non-member/non-organizer) are an env gap fully covered by T-4 real-PG evidence. One source-claim ambiguity (roster permission string) routed to Karen, non-blocking.
