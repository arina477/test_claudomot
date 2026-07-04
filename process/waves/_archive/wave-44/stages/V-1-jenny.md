# V-1 jenny — wave-44 semantic-spec verification (M8 polish/hardening)

**Role:** semantic INTENT verification of the LIVE deployment (NOT source-claim truth — that is Karen's remit).
**Deployed:** web `https://web-production-bce1a8.up.railway.app` bundle `index-CX7LuM3C.js` (confirmed live) · api `https://api-production-b93e.up.railway.app` (commit 4522101 / HEAD e106edb).
**Spec:** tasks.description of 8e54799a — 6-task multi-spec, design_gap_flag=false.
**Verdict: APPROVE** — 6/6 tasks meet the AC intent on the live surface (or, for non-user-visible ACs, the guarded behavior is live-verified). 0 defects. 2 findings labeled ENV-GAP (not code-wrong).

---

## Evidence by task

### 8e54799a — class-scheduling 1024 responsive + a11y polish (T6-F1 close) — MEETS INTENT
Spec ACs: 1024 detail no longer crushes agenda (overlay OR members-panel collapse); SessionForm Esc restores focus to trigger; detail re-syncs after edit; CTA copy reconciled to "Save".

- **1024 overlay (agenda-readable intent):** deployed bundle contains `narrow-session-overlay` + `aria-modal` + `Session Details` + `max-width: 1024px` markers (grep on live `index-CX7LuM3C.js`). Source `ClassCalendar.tsx:56` matchMedia `(max-width: 1024px)`, and the ≤1024 branch (`ClassCalendar.tsx:880-910`) renders a genuine `role="dialog" aria-modal="true" aria-labelledby` overlay (fixed inset-0, backdrop) with the agenda list `aria-hidden` while open — so the detail is a usable overlay dialog, not a 28px-crushed card. This is exactly the T6-F1 intent (agenda readable). **Confirmed via live bundle + T-5 live evidence (e106edb: "T6-F1 verified resolved live"). Live.**
- **Esc focus-restore to trigger (WCAG 2.4.3):** SessionForm Esc calls `onClose`; caller `ClassCalendar` restores focus to the invoking trigger with a body-fallback to `newSessionBtnRef` (`ClassCalendar.tsx:536-541`). SessionDetail's own delete-dialog restores focus to trigger via `requestAnimationFrame(() => triggerRef.current?.focus())` (`SessionDetail.tsx:113,160,195,232`). Intent met (focus does NOT drop to BODY).
- **Detail re-syncs after edit:** `handleFormSuccess` (`ClassCalendar.tsx:521-529`) forces SessionDetail to re-fetch by toggling `selectedSessionId` null→id, re-firing its `useEffect [sessionId]` fresh GET — the open panel shows the new title/time, not the pre-edit value. **Also confirmed at the API layer:** live PATCH of a probe session advanced `updatedAt` 05:44:03→05:44:14 while `createdAt` held, so the re-fetch surfaces genuinely-new data. Intent met.
- **CTA copy = "Save":** `SessionForm.tsx:630` primary CTA is `'Save'`, reconciled with design/class-scheduling.html. Met.

### 0308cdf1 — createdAt/updatedAt in scheduled-session DTO (wave-43 jenny projection gap) — MEETS INTENT, LIVE-VERIFIED
Spec AC: ScheduledSessionSchema + sessionRowToDto emit createdAt + updatedAt (ISO).

- **LIVE API probe (the definitive check):** created a session as fixture-A and `GET /scheduled-sessions/:id` returned:
  `"createdAt": "2026-07-04T05:44:03.291Z"`, `"updatedAt": "2026-07-04T05:44:03.291Z"` — both present, both ISO-8601. After a PATCH, `updatedAt` correctly advanced to `05:44:14.267Z` (> createdAt). The list endpoint (`GET /servers/:id/scheduled-sessions`, 47 rows) also carries both fields on every row.
- Source corroborates: `packages/shared/src/scheduling.ts:27-28` (`createdAt`/`updatedAt: z.string()`), `scheduling.service.ts:118-119` (`row.created_at.toISOString()` / `row.updated_at.toISOString()`).
- **This closes the wave-43 V-1-jenny projection gap in the live API response.** Confirmed live, not just source.

### 683fec9b — assignment-submissions polish + stale comment fix — MEETS INTENT
Spec ACs: return focus-ring alpha 0.4 (not 0.2); username fallback for empty displayName; stale `manage_channels` comment → `manage_assignments` (doc-only).

- **Focus-ring alpha 0.4:** `SubmissionsRoster.tsx:269-270` sets `rgba(16,185,129,0.4)` with an explicit `--glow-focus spec: alpha 0.4` comment. Live bundle contains `16,185,129,0.4`. Met (was 0.2).
- **Username fallback (no blank "Return to" slot):** `SubmissionsRoster.tsx:95` `resolvedName = studentName.trim() || studentUsername.trim() || 'student'`; the "Return to <name>" header (line 227) renders `firstName` derived from that. **Directly relevant live corroboration:** the live organizer identity returns `displayName: ""` + `username: "studyhallfixturea"` (seen in the scheduling probe's `organizer` block), i.e. the empty-displayName case the AC targets is a real live condition — and the roster fallback resolves it to the username rather than a blank slot. Intent met.
- **manage_channels → manage_assignments (doc-only, NOT user-visible):** live grep shows ZERO `manage_channels` in controller/service; all references are `manage_assignments` (controller.ts:53; service.ts:39,63,68,71,293). A single historical note at service.ts:41 documents the wave-23 swap intentionally. Met. As the AC itself states, behavior unchanged — correctly not user-visible.

### 8828484f — muted-member right-gutter padding — MEETS INTENT (source), live-unverified = ENV-GAP
Spec AC: amber muted indicator has a consistent DS right-gutter token at 1024/1280 (no longer tight against panel right edge).

- Source: `MemberListPanel.tsx:497-498` — the right slot (muted indicator + kebab) carries `pl-1 pr-2` with the comment "pr-2 matches DS §3 8px gutter (roster-row right edge)". The fix is present and uses a design-system gutter token.
- **Finding [ENV-GAP, not defect]:** I could not exercise this pixel-visually on the live surface — the live fixture roster has no member with a future `mutedUntil`, so the amber indicator is not currently rendered for a screenshot. This is an ENV limitation (no timed-out fixture member), exactly as the prompt anticipates; the deployed code change is confirmed and the spec did anticipate the behavior. NOT code-wrong.

### 8d971bc2 — assignment-submission unit tests + presign integration deferral — MEETS INTENT (coverage AC; no user surface)
Spec ACs: unit tests for submission service methods (idempotent/resubmit-clears-return, listSubmissions, cross-assignment guard); attachment-presign integration DEFERRED-IN-TASK (CI lacks Tigris/S3 creds).

- `apps/api/src/assignments/assignments.submissions.spec.ts` added (+598 lines, PR #58); commit narrates "16 unit tests covering submitAssignment idempotent upsert + resubmit-clears-return, listSubmissions organizer-gated 403/404, returnSubmission cross-assignment guard". Presign integration deferral is documented in-task per spec.
- No user-visible surface — pure coverage. INTENT (the submission flow still behaves as specified) is separately live-covered by the wave-42 flow being intact. Truth of the test suite (do they pass, over-mocked?) is Karen's remit; nothing here contradicts the deployed behavior.

### ca43eb12 — delete-any 2-client E2E + fixture-B re-provision — MEETS INTENT (conditional AC satisfied)
Spec ACs: re-provision fixture-B → 2-client delete-any E2E + non-mod-affordance-hidden; DEFER if fixture-B infeasible (backend proven wave-41).

- `apps/web/e2e/delete-any-message.spec.ts` added (+203 lines). Commit narrates a 2-context Playwright test with delete fan-out assertion; B-4/B-5 note "delete-any E2E PASS". The conditional AC path (E2E authored) is satisfied rather than deferred.
- No new user-visible surface introduced by the wave — this hardens an already-shipped moderation behavior. Test-suite honesty is Karen/head-tester's remit (T-9 gate already APPROVED, e106edb).

---

## Non-goal / no-regression check (spec: "NO new features; NO new UI surfaces") — CLEAN
- Live smoke, all green: web root `HTTP 200`; `GET /servers` `HTTP 200`; `GET /servers/:id/scheduled-sessions` returns 47 rows all carrying createdAt/updatedAt; create/PATCH/DELETE of a probe session all succeeded (201/200/204).
- The a11y/overlay changes introduce NO dead-end: the 1024 overlay is a dismissible modal (Esc + backdrop + close, focus-restore), the agenda remains the primary surface at 1280/1440 (`lg:hidden` on the narrow-only trigger, `ClassCalendar.tsx:629`). Scheduling / assignment / moderation flows unchanged in shape (additive DTO field, alpha tweak, padding token, comment text).
- design_gap_flag=false honored — no new UI surface shipped.

---

## Drift vs gap ledger
- **No spec-drift (code-wrong) found.** Every AC's deployed behavior matches the AC intent.
- **ENV-GAP #1 (8828484f):** muted-indicator right-gutter is source-confirmed but not live-pixel-verified — no timed-out fixture member exists to render the amber indicator. Prompt-anticipated; fix is in the diff. Not a defect.
- **ENV-GAP #2 (8d971bc2 presign):** attachment-presign integration DEFERRED-IN-TASK per spec (CI lacks Tigris/S3 creds). Spec-sanctioned deferral, not a defect.

---

## VERDICT: APPROVE
6/6 tasks meet AC intent on the live deployment; the two live-unverified items are spec-anticipated ENV gaps (fix present in the diff), not code-wrong defects; zero regressions in the scheduling/assignment/moderation journeys.
