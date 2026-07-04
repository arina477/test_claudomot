# Wave 43 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-43/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-43 (M8 class scheduling, slice 3) ladders to a live, founder-named milestone (M8 84e17739, in_progress, product-feature), ships end-to-end on the wave (educator authors sessions → members see them via a calendar view + detail), and holds a disciplined CRUD-only wedge. I gated all five stage-exit dimensions from concrete artifacts, and independently verified the load-bearing architectural claims the spec rests on. (1) Falsifiability/observability: each of the three spec blocks carries independently-verifiable ACs with the four non-happy states named — ends_at<=starts_at→400, weekly+recurrence_until<starts_at→400, non-organizer→403, unknown/soft-deleted→404, non-member→403, IDOR serverId-derived-from-row — plus empty/loading/error/not-found UI states. No happy-path-only gaps. (2) Spec↔plan coherence is clean: the P-3 self-consistency sweep maps every AC to a file-level step with a validated specialist (sql-pro/typescript-pro/node-specialist/react-specialist), the 5 API contracts are concrete with no TBD, and the recurrence read-model is a real, verifiable contract — a CLOSED enum {none,weekly}+recurrence_until, single-row storage, compute-on-read occurrence expansion within a bounded window hard-capped at ≤90 days — not an aspiration. (3) Scope discipline holds: no gold-plating (no reminders/RSVP/ICS/timezone-negotiation, no recurrence engine — ceo-reviewer confirmed "simple weekly" is the correct minimal recurrence, materialized per-occurrence rows explicitly rejected as a scheduling-engine rabbit hole), and the bundle IS the milestone's named "class scheduling" scope. (4) Security-scope: the wave touches an authz boundary (organizer-vs-member gates + IDOR derivation) but reuses the shipped assignments authz verbatim with NO new auth flow and NO new permission — RBAC stays a closed 5-flag set, verified below; server_id is always derived from the session row on :id routes. This surface is flagged for the T-8 security stage and the P-4 security-scope tightened gate downstream. (5) design_gap_flag=true is correct — the date-grouped class calendar/agenda view is a genuinely new member-facing surface with no mockup; the authoring modal and detail likely empty-audit as trivial mirrors, which D-1 confirms. All three P-0 reviewers (problem-framer, ceo-reviewer, mvp-thinner) returned PROCEED and are reconciled, not overridden. The only note is a non-blocking one carried from P-0: M8's `## Success metric` is `_TBD by founder_`; this bars formal mvp-thinning but is safe for a founder-directed core slice and was already surfaced non-blocking at wave-42 N-1 — it does not block this gate.

### Load-bearing claims independently verified (Phase-1 spot-check)
- `apps/api/src/assignments/assignments.service.ts:68` — `rbacService.can(userId, serverId, 'manage_assignments')` is the real organizer gate. VERIFIED. (Note: stale inline comments at :63/:293 say `manage_channels`; the executed code checks `manage_assignments` — spec correctly mirrors code, not comment. Non-blocking; flag to B-block to correct the comment.)
- `apps/api/src/rbac/rbac.service.ts:35` + `apps/api/src/db/schema/servers.ts:35-39` — RBAC is a CLOSED 5-boolean set {manage_server, manage_roles, manage_channels, manage_members, manage_assignments}. Reusing manage_assignments (no new scheduling flag) is correct. VERIFIED.
- `apps/api/src/assignments/assignments.controller.ts:43-46` — route shape (`servers/:serverId/...` create/list; `/assignments/:id` get/patch/delete with serverId derived from row) matches the mirror the spec/plan describe. VERIFIED.
- `apps/api/src/assignments/assignments.service.ts:382-388` — serverId derived from the row (IDOR-safe, never a client param) is the real prior-art pattern. VERIFIED.
- `apps/api/src/db/schema/assignments.ts:27-43` — schema shape (uuid pk, server_id uuid FK ON DELETE cascade, organizer_id text FK→users, title notNull, description nullable, is_deleted default false, timestamptz created/updated, INDEX(server_id, due_date)) matches the mirror the new scheduled_sessions table copies. VERIFIED.
- `apps/web/src/shell/AssignmentForm.tsx` — exists (the authoring-modal pattern SessionForm mirrors). VERIFIED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged)

**Karen (claim verification): APPROVE** — 6/6 load-bearing claims VERIFIED vs real code: assertOrganizer→can(manage_assignments) (stale manage_channels comments at service:63/293 + controller:53 confirmed cosmetic); assertMember (server_members); RBAC closed boolean set with manage_assignments + NO scheduling flag; assignments entity shape (id/server_id FK cascade/organizer_id FK/title/desc/timestamptz/is_deleted/index) + servers+users FKs resolve; controller server-prefixed create/list + :id get/patch/delete with serverId-derived-from-row + soft-delete; AssignmentForm.tsx + api.ts getMyPermissions→EffectivePermissions.manage_assignments. Antipatterns avoided (no authz rewrite, no new permission, no recurrence engine). Cosmetic note: RBAC is 6 flags not "5" (P-0/P-3 miscount — no decision impact).

**jenny (spec-drift): APPROVE** — 5/5 MATCHES: manage_assignments reuse consistent with wave-41 educator-role decision + closed-boolean RBAC (no prior scheduling-permission assumption); no-reminders/RSVP/timezone/ICS fence matches M8 scope + Path-B + the assignments-only reminder history (wave-30); scheduled_sessions distinct entity (no prior decision folded scheduling into assignments; journey has zero prior scheduling surface); bounded recurrence {none,weekly} narrower than any prior promise (no RRULE ever committed); journeys extend /servers/:id shell without contradiction.

**Gemini (cross-model): UNAVAILABLE** — helper exit=3, HTTP 429 rate-limit. Degradable → does NOT block; gate proceeds on Karen + jenny APPROVE.

## Gate result: PASS (Phase 1 APPROVED + Phase 2 Karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE-degraded)
Carry to B-block: stale manage_channels comments (assignments.service.ts:63/293 + controller:53) — already tracked in polish task 683fec9b; the scheduling module should not copy the stale comment.
→ design_gap_flag=true → D-block.
