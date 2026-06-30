# B-6 Phase-2 Review — wave-22 M5 Assignments

Branch: `wave-22-m5-assignments` vs `main` | READ-ONLY | adversarial authz + per-member integrity pass

Diff: 33 files, +5458. Core surface reviewed line-by-line: controller, service, FilesService, migration 0010, schema, shared contracts, rbac `can()`, frontend card/panel/form, specs.

**B-6 verdict: REWORK — 1 High (attachment cross-server key swap). No Critical found.** The authz spine (organizer/member gates, IDOR row-derivation, per-member status isolation, soft-delete read filters) is correctly built. The single High is an attachment-key scope gap that deviates from the established messaging precedent.

---

## Critical
None.

The load-bearing checks all PASS:
- **Organizer authz / IDOR (THE check) — PASS.** `assertOrganizer` (service L59-66) gates create/update/delete/presign on `can(userId, serverId, 'manage_channels')`; `can()` (rbac.service.ts L46) is default-deny (server-missing → false, non-member → false, null-role → false, owner → superuser). For every `/assignments/:id` route the `serverId` is derived from the fetched row (`existing.server_id` / `row.server_id`), never a client param — update L301, delete L365, get L274, toggle L400. Controller passes only `id` + session `userId` to these routes (controller L130, L147, L165, L183). A member of server A cannot create/edit/delete in server B: the row's own `server_id` drives the `can()` check, so a cross-server `id` resolves to its true server and the attacker fails the organizer gate there. Confirmed cross-server IDOR closed.
- **Member-read authz really enforced (not just AuthGuard) — PASS.** `listAssignments` calls `assertMember` (L246) before returning; `getAssignment` derives `server_id` from the row then `assertMember` (L274). `assertMember` (L73-83) is a real `server_members` lookup → 403 for non-members. A non-member of a server cannot LIST or GET its assignments.
- **Per-member status integrity — PASS.** `toggleStatus` (L385-417) always inserts `user_id: userId` (the session id from controller L196's `req.session.getUserId()`) — never a client-supplied user_id (the body schema `AssignmentStatusSchema` carries only `state`). Member A cannot set member B's status. UNIQUE(assignment_id, user_id) (migration L18) + `onConflictDoUpdate` on that target (L411-414) enforces one row per member. Spec `status isolation` test (spec L475) asserts the inserted row carries `MEMBER_ID`.
- **Non-member status toggle — closed in code.** `toggleStatus` derives `server_id` from the row and calls `assertMember` (L400) → 403 for non-members. (Test gap noted in Medium.)
- **Soft-delete read filters — PASS on all paths.** `is_deleted=false` is applied on list (L251), get (L268), update (L295), delete (L359), AND toggle (L394). You cannot GET or toggle a soft-deleted assignment (both 404). Status rows are intentionally preserved on soft-delete (L367-374, not cascaded) — CASCADE FK fires only on a hard row delete.
- **Migration 0010 — PASS.** Additive (3 CREATE TABLE only). FK cascades correct: assignment→status CASCADE (L34), assignment→attachments CASCADE (L33), server→assignments CASCADE (L36); user FKs `no action` (correct — users not deleted on this path). UNIQUE(assignment_id, user_id) present (L18). Index(server_id, due_date) for the sorted list (L40).
- **Due-sort + myStatus — PASS.** `due_date` is `NOT NULL` (schema L36 / migration L27) so `orderBy(asc(due_date))` (L252) is deterministic. `myStatus` defaults to `'todo'` when no status row (rowToDto L145) — every member sees every assignment with their own status. (Minor perf note in Low: rowToDto is N+1, not a correctness issue.)

---

## High

### H1 — Attachment key has NO server-scope validation → cross-server / cross-assignment attachment swap
**Files:** `apps/api/src/assignments/assignments.service.ts:94-116` (`validateAndHeadAttachment`), `:201-209` (create), `:330-337` (update); `packages/shared/src/assignments.ts:33-39, 55-63` (`key: z.string()`).

`validateAndHeadAttachment(key)` validates ONLY size + content-type via `headAttachment`. It does **not** validate that the key is scoped to the target assignment's server. The shared schema accepts `key` as a bare `z.string()`. The attachment INSERT (create L226-232, update L331-337) persists the client-supplied `object_key` verbatim.

This is a direct deviation from the messaging precedent this code claims to mirror. `messaging/messages.service.ts:366-383` builds `const KEY_PATTERN = new RegExp(\`^attachments/${escapedChannelId}/[A-Za-z0-9._-]+$\`)` and rejects (400) any descriptor whose key fails the anchored channel-scope regex — its comment block (L320-345) names this guard "closes IDOR / cross-channel key swap". The assignments path has no equivalent.

**Impact.** Presign generates `attachments/<serverId>/<uuid>.<ext>` (FilesService L242, scope key = serverId). An organizer of server A, on create/update of an assignment in server A, can submit a hand-crafted `key` of the form `attachments/<serverB-id>/<existing-uuid>.<ext>` pointing at an object that lives under server B's prefix. The server head-checks size/type and accepts it; the assignment in A then renders a presigned-GET (rowToDto L156, `resolveAttachmentUrl`) for an object scoped to server B. Because there is no per-object ownership table, any S3 object an attacker can name (e.g. one they previously uploaded under a server they belong to, or any guessable/leaked key) can be referenced from an unrelated assignment. The bucket is private and served only via presigned GET, so this is not a public-internet leak, but it IS a cross-server/cross-assignment object-reference swap — exactly the IDOR class the messaging guard exists to close. Severity is High (organizer-gated, private-bucket) rather than Critical (not a no-auth cross-member data breach).

**Fix:** before INSERT in create AND update, enforce the anchored scope regex against the assignment's own `serverId` (the create param, or `existing.server_id` on update) — mirror `messages.service.ts:366-379` exactly:
```
^attachments/<serverId>/[A-Za-z0-9._-]+$
```
Reject with `BadRequestException` on mismatch. Tighten the shared `key` schema to a bounded pattern as defense-in-depth.

### H2 — Forged / non-existent attachment key throws an unmapped 5xx (no NoSuchKey → 400 mapping)
**File:** `apps/api/src/assignments/assignments.service.ts:97` (`headAttachment` call inside `validateAndHeadAttachment`).

The messaging send path maps S3 `NoSuchKey` to `BadRequestException` (messages.service.ts comment L325-326 and its catch). Assignments calls `this.filesService.headAttachment(key)` (L97) with no try/catch — a forged or stale key (no object at that key) makes the AWS SDK throw, which surfaces as an uncaught 500 instead of a clean 400. Low-direct-impact (organizer-only, no data exposure) but it is a missing negative-path on the attachment validator and a DoS-via-500 nicety. Wrap and map `NoSuchKey`/`NotFound` → `BadRequestException`. Pairs with H1's regex fix.

---

## Medium

### M1 — Missing negative-path tests for `toggleStatus` (non-member 403 + soft-deleted 404)
**File:** `apps/api/src/assignments/assignments.service.spec.ts:442-528`.

The code correctly enforces `assertMember` (service L400) and `is_deleted=false` (L394) in `toggleStatus`, but there is NO test for a non-member toggling (403) nor for toggling a soft-deleted assignment (404). Given per-member status is the load-bearing integrity surface for this feature, both negative paths must be pinned so a future refactor cannot silently drop the member gate or the soft-delete filter. Add both.

### M2 — Missing cross-server / attachment-key-swap test
**File:** `apps/api/src/assignments/assignments.service.spec.ts`.

No test asserts that a cross-server `/assignments/:id` access fails (organizer-of-A editing an assignment whose row belongs to B → 403 via row-derived serverId), and no test for the attachment key-scope rejection (currently because the rejection doesn't exist — see H1). After H1 is fixed, add a test that a non-server-scoped key is rejected with 400, mirroring the messaging cross-channel-key test.

### M3 — `getAssignment` route exists with no controller-spec coverage of the IDOR derivation
**File:** `apps/api/src/assignments/assignments.controller.spec.ts`.

The controller spec covers create/list/update/delete/status/presign happy + 403 paths, but the IDOR-critical property (that `/assignments/:id` never reads a client serverId) is only implicitly tested. Add an explicit assertion that the GET/PATCH/DELETE/PUT-status controllers pass only `id` + session userId to the service (no serverId param threaded from the request). Low-cost regression fence around the core IDOR-safety property.

---

## Low

### L1 — Client organizer gate is owner-only, but server gate is `manage_channels` (UX under-grant)
**File:** `apps/web/src/shell/AssignmentsPanel.tsx:92-97`.

`isOrganizer = myUserId === ownerId` (owner-only) is a documented client-UX-only convenience gate; the server correctly enforces `can(..., 'manage_channels')` which is broader (includes non-owner organizers holding the permission). Confirmed: this is client-UX-only, server enforces — no security hole. The deviation direction is safe (under-grant: a legitimate non-owner organizer won't see the create/edit UI but the server would accept their request). Note for the eventual `/me/roles` follow-up so non-owner organizers get the UI. Not a blocker.

### L2 — `rowToDto` is N+1 (per-row status + attachment selects)
**File:** `apps/api/src/assignments/assignments.service.ts:122-177`, called per-row from `listAssignments` (L254).

Each assignment in a list triggers 2 extra queries (status, attachment) plus a presign. Correctness is fine; at scale this is a per-list query amplification. Consider a LEFT JOIN for status + a single attachment fetch keyed by assignment_id IN (...). The schema comment (L7) describes "LEFT JOIN semantics" but the implementation is per-row subqueries. Perf-only; not a B-6 blocker.

### L3 — Optimistic-revert relies on opposite-of-attempted-state (correct but fragile)
**File:** `apps/web/src/shell/AssignmentCard.tsx:158-173`.

On PUT failure the revert flips back to `newState === 'done' ? 'todo' : 'done'`. This is correct because the revert is the inverse of the just-attempted state, and `handleStatusChange` (Panel L131-132) is a pure functional setState keyed by id — it cannot corrupt another member's row (status is per-member server-side regardless). The fragility is that the revert assumes the pre-toggle state was the opposite of `newState`; if a double-click queued two toggles the revert could land on a stale value. Low (visual-only, self-corrects on next list refetch). Consider snapshotting the prior `myStatus` and restoring it explicitly.

### L4 — Build/CJS: clean
No `require(`/`module.exports`/`__dirname` in the new frontend files (AssignmentForm/Card/Panel). Keyframes scoped inline (Form L588-595). No CJS trap. Repo reported green (typecheck/build/lint, api 379 + web 215).

---

## Summary
| Severity | Count | Items |
|---|---|---|
| Critical | 0 | — |
| High | 2 | H1 attachment key cross-server swap (no scope regex — deviates from messaging precedent); H2 NoSuchKey → unmapped 5xx |
| Medium | 3 | M1 toggleStatus negative-path tests; M2 cross-server / key-swap test; M3 controller IDOR-derivation assertion |
| Low | 4 | L1 client owner-gate vs server manage_channels (safe under-grant); L2 rowToDto N+1; L3 optimistic-revert fragility; L4 build clean |

**Re-entry required (Critical/High present): YES.** Primary blocker is H1 — port the messaging anchored key-scope regex into `validateAndHeadAttachment` (validate against the assignment's row-derived serverId on create AND update), plus H2's NoSuchKey→400 mapping. Add M1/M2 negative-path tests alongside the fix. The rest of the authz spine — organizer/member gates, row-derived IDOR safety, per-member status isolation, soft-delete read filters, migration shape — is correctly built and needs no rework.

---

# B-6 Phase-2 RE-REVIEW (iteration 2) — wave-22 M5 Assignments

Branch: `wave-22-m5-assignments` @ `5e79456` (fix commit: "B-6 server-scope + validate attachment key (close cross-server swap) + NoSuchKey->400") | READ-ONLY | re-verify H1/H2 cleared + no new Critical/High.

**B-6 RE-REVIEW verdict: APPROVED. Both prior High (H1, H2) verified cleared. Zero new Critical/High introduced by the fix. Carried Medium/Low accepted as non-blocking debt.**

## Critical
None.

## High
None. Both prior Highs cleared — verified line-by-line:

### H1 (cross-server attachment key swap) — CLEARED ✓
`validateAndHeadAttachment(key, serverId)` now takes `serverId` as a second param (service L109-112) and enforces an anchored scope regex BEFORE `headAttachment` and BEFORE any INSERT:
- **Anchored regex (L117-118):** `new RegExp(\`^attachments/${escapedServerId}/[A-Za-z0-9._-]+$\`)`. `^...$` anchors both ends; the character class `[A-Za-z0-9._-]` excludes `/`, so a cross-server key (`attachments/<otherServerId>/...` — the extra `/` after a different id fails the single-segment class) and a path-traversal key (`attachments/<serverId>/../../etc/passwd` — the `/` in `../../` breaks the class) both fail `.test()` → `BadRequestException` 400 (L120-124). Verified by tests: `CROSS_SERVER_KEY` → 400 and `PATH_TRAVERSAL_KEY` → 400, each asserting `headAttachment` NOT called AND `mockInsert` NOT called (spec L659-688).
- **serverId is row/route-derived, NEVER client:** create passes the route param `serverId` (service L241-244, the same value gated by `assertOrganizer` at L231); update passes `existing.server_id` — the DB row fetched at L334-338, NOT a client field (service L373-376, comment L372 confirms intent). The `dto.attachment.key` is the only client-controlled input and it is the thing being validated against the trusted serverId. No client value reaches the serverId side of the regex.
- **Fires BEFORE headAttachment + INSERT:** in `validateAndHeadAttachment` the regex test (L120) precedes the `headAttachment` call (L130); the caller runs `validateAndHeadAttachment` before the assignment INSERT (create L241 before L253; update L373 before L377). Order verified by the cross-server tests asserting both `headAttachment` and `mockInsert` are untouched on rejection.
- **Regex matches the ACTUAL presign format:** `FilesService.presignAttachmentUpload` builds `attachments/${channelId}/${randomUUID()}.${ext}` (files.service.ts L242); the assignments path calls it with `serverId` in the `channelId` slot (service L486-490), so the real key is `attachments/<serverId>/<uuid>.<ext>`. A v4 UUID is `[A-Za-z0-9-]` and `.<ext>` adds `.` + `[a-z]` — all inside `[A-Za-z0-9._-]+`. The valid-same-server happy path is pinned: `ATTACHMENT_KEY = attachments/server-001/uuid.png` passes the guard and `headAttachment` IS called (spec L690-714). No false-negative on legitimate keys.
- **Escaping correct:** `serverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` (L117) is the identical escape used by the messaging precedent (messages.service.ts L365). UUID serverIds contain no regex metacharacters, so escaping is belt-and-suspenders; it is nonetheless correct and cannot widen the pattern.

### H2 (forged key → unmapped 5xx) — CLEARED ✓
`headAttachment` is now wrapped in try/catch (service L129-136): `err instanceof NoSuchKey || err instanceof NotFound` → `BadRequestException` 400 (L132-133); every other error re-throws unchanged (L135) → genuine infra surfaces as 5xx. `NoSuchKey` / `NotFound` are imported from `@aws-sdk/client-s3` (L1) — real SDK error classes, so `instanceof` is sound. `ServiceUnavailableException` (storage-not-configured) is thrown by `headAttachment` BEFORE the `client.send` (files.service.ts L329-336), so it propagates as 5xx correctly (not swallowed into 400) — desired behaviour. Verified by tests: NoSuchKey → 400, NotFound → 400, generic `Error` → re-thrown verbatim as 5xx (`rejects.toBe(internalErr)`, spec L753-796).

### New tests — genuine, not theater ✓
All 8 new/required tests assert the actual block, not just an exception type:
- cross-server key → 400 + `headAttachment` NOT called + `mockInsert` NOT called (L659-674)
- path-traversal key → 400 + `headAttachment` NOT called + `mockInsert` NOT called (L676-688)
- valid same-server key → `headAttachment` called WITH the exact key (L690-714)
- updateAssignment cross-server key → 400 + `headAttachment` NOT called, with `existing.server_id` driving the scope (L716-733)
- NoSuchKey → 400 + no INSERT (L753-768); NotFound → 400 + no INSERT (L770-782); generic error → re-thrown identity (L784-796)
- M1 toggleStatus non-member → 403 + no upsert INSERT (L816-830); M2 toggleStatus soft-deleted → 404 + no INSERT (L850-860)

## Verification evidence
- `apps/api` full suite: **388 passed (21 files)** — matches the claimed count.
- `assignments.service.spec.ts`: **28 passed** (was 20 pre-fix; +8 new H1/H2/M1/M2 tests).
- Fix mirrors the messaging precedent exactly (identical regex construction + escape at messages.service.ts L365-366).

## No new Critical/High from the fix
- Regex escaping correct (identical to vetted messaging path); cannot widen or break on UUID serverIds.
- Valid happy path preserved (pinned by the same-server test; `headAttachment` still reached for legitimate keys).
- `updateAssignment` uses `existing.server_id` (the DB row), NOT a client param — IDOR-safe, confirmed L373-376.
- New `serverId` param is required (no optional/default), so no call site can accidentally skip the scope check — both call sites (L241-244, L373-376) pass it.

## Carried Medium/Low — ACCEPTED as non-blocking debt
- **M3** — `getAssignment`/controller IDOR-derivation assertion not explicitly spec-covered (the property holds in code; controller threads only `id` + session `userId`). Regression-fence nicety. Non-blocking.
- **L1** — client organizer gate is owner-only vs server `manage_channels` (safe under-grant; server enforces). Non-blocking; note for `/me/roles` follow-up.
- **L2** — `rowToDto` N+1 (per-row status + attachment selects). Perf-only at scale; correctness fine. Non-blocking.
- **L3** — optimistic-revert assumes opposite-of-attempted state (visual-only, self-corrects on refetch). Non-blocking.
- **L4** — build/CJS clean; repo green (typecheck/build/lint, api 388 + web 215). Non-blocking.

(M1, M2 from iteration-1 are now CLOSED by the new tests; only M3 carries.)

## Summary (iteration 2)
| Severity | Count | Items |
|---|---|---|
| Critical | 0 | — |
| High | 0 | H1 + H2 both verified cleared |
| Medium | 1 | M3 controller IDOR-derivation assertion (carried, non-blocking) |
| Low | 4 | L1 owner-gate under-grant; L2 rowToDto N+1; L3 optimistic-revert; L4 build clean |

**Re-entry required (Critical/High present): NO.** B-6 PASS. The attachment key-scope spine is now closed exactly per the messaging precedent (anchored, row/route-derived serverId, fires before head+INSERT), forged keys map to clean 400s, genuine infra still 5xx, and the authz spine reviewed in iteration-1 (organizer/member gates, row-derived IDOR safety, per-member status isolation, soft-delete read filters, migration shape) remains correct. Carried M3 + L1-L4 are accepted non-blocking debt. Final B-6 review pass — APPROVED.
