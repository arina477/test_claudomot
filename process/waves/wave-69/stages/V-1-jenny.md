# V-1 Jenny — Semantic spec-conformance verification (wave-69)

**Role:** jenny — verify DEPLOYED prod behavior semantically satisfies the spec-contract INTENT (beyond the literal ACs T-block already asserted). NOT source-claim truth (that is Karen).
**Targets:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app
**Fixture A:** `studyhall-e2e-fixture@example.com` (owner of Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c`, userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`, holds `moderate_members`).
**Method:** authenticated live API exercise of the deployed revision (SuperTokens EmailPassword, header-bearer transfer mode) + targeted source read of the resolve dispatch path for the delete_message channel_id branch. Spec source: authoritative YAML head of tasks row `9f2bb017` (fetched from DB, not the P-2 pointer).
**Probe date:** 2026-07-07.

---

## VERDICT: APPROVE

Deployed behavior **semantically satisfies all three specs (A report substrate, B action loop, C UI)**. Every load-bearing intent — no-IDOR reporter derivation, server-side target_server_id resolution + spoof-resistance, target-existence validation across all 3 target types, reason bound, moderate_members gate, rank-guard via route-through, cross-server tamper guard, already-resolved 409, delete_message channel_id resolution — is confirmed live and correct. The two known T-block findings (F1 own-content affordance leak, T6-M1 mobile inbox off-screen) are real UI defects but do NOT break the core spec-intent; they are correctly V-2 triage material, not V-1 REJECT grounds (rationale below).

---

## Live semantic probes (what I independently verified on the deployed revision)

All probes run authenticated as Fixture A against the deployed API. Results are DEPLOYED behavior, not source claims.

| # | Spec intent probed | Spec ref | Deployed result | Verdict |
|---|---|---|---|---|
| 1 | Report a non-existent MESSAGE → validate exists | A edge "non-existent target → 400/404" | `404 Message ... not found` | PASS |
| 2 | Report a non-existent MEMBER → validate exists | A edge | `404 Target user is not a member of the specified server` (validates membership, stronger than mere user existence) | PASS |
| 3 | Report a non-existent SERVER → validate exists | A edge | `404 Server ... not found` | PASS |
| 4 | reason over bound → 400 | A edge "reason over the bound → 400 (Zod)" | `400 String must contain at most 1000 character(s)` | PASS |
| 5 | empty reason → rejected | C dialog "bounded reason" | `400` | PASS |
| 6 | target_server_id resolved SERVER-SIDE for a message (client sends none) | A AC2 "resolves+persists target_server_id; member/message → containing server" | persisted `target_server_id = ad62cd12` (the containing server), no client input | PASS |
| 7 | client SPOOFS target_server_id to a different server on a message report | A AC2 intent (server-authoritative routing) | spoofed `eefbe99b` IGNORED; persisted `ad62cd12` (true containing server) | PASS — anti-tamper intent holds end-to-end |
| 8 | resolve an already-resolved report | B edge "idempotent/no-op or 409 (define)" | first dismiss `200` (status flip open→dismissed, resolved_at + resolved_by set); second dismiss `409 already dismissed`; timeout on dismissed `409` | PASS (409 branch chosen, defined + consistent) |
| 9 | GET inbox `?status=open` scoping | B AC1 "WHERE target_server_id=serverId … status" | 6 rows, 0 wrong-server, 0 non-open — correctly scoped | PASS |
| 10 | `/me/permissions` UI gate source | C AC2 "gate on GET /servers/:serverId/me/permissions" | `200 {..., moderate_members:true}` for owner | PASS |

**Re-confirmed from T-8 (still live this session, not merely cited):** no-IDOR (spoofed reporter_id ignored, reporter_id = real session uid), moderate_members A200/B403, rank-guard self-branch 403 + no side effect, cross-server tamper 404 pre-mutation. These hold on the current deployed revision.

**Source-verified (delete_message branch — not exercised destructively per cleanup rule):** `apps/api/src/reports/reports.service.ts:325-349` — the `delete_message` action resolves `channel_id` from the `messages` row (`:332-336`), then routes through `MessagesService.deleteMessage(channel_id, message_id, callerUserId)` (`:344`) so the wave-41 delete rank guard applies UNCHANGED. The `timeout` action (`:311-324`) routes through `ModerationService.setMemberTimeout` for the same reason. No re-implemented permission system. Guard ordering in `resolveReport` (`:277-375`) is semantically correct: cross-server tamper (Step 2, `:293` — returns 404 to avoid leaking cross-server report existence) → moderate_members (Step 3, `:299`) → already-resolved 409 (Step 4, `:305`) → action dispatch (Step 5) → transactional row-locked status flip with belt-and-suspenders `status='open'` predicate (Step 6, `:359-372`). This matches Spec B's route-through + tamper-guard intent exactly.

---

## Findings

### F-J1 — [MINOR / spec-note, NOT drift] reason bound: server 1000 vs UI/D-3 300
- **Spec ref:** Spec A AC1 "reason(text bounded)"; A edge "reason over the bound → 400 (Zod)"; C dialog "bounded reason" (D-3 char counter "0 / 300").
- **Deployed:** server-side Zod rejects at **1000** chars (probe 4); the UI dialog caps input at **300** (T-5). The spec text says only "bounded" without a numeric value, so neither number contradicts the contract. The UI 300 is the stricter, user-facing bound; the server 1000 is a looser backstop. Both enforce a bound; no non-happy path is left open.
- **Tag:** spec-gap (spec never pinned a number — spec under-specified, not code wrong). Non-blocking. Note for V-2 only if the team wants the two numbers aligned; not required for spec-conformance.

### F-J2 — [assessment of T-block F1] own-content Report-affordance leak = spec-drift, but UI-only, non-security
- **Spec ref:** Spec C AC1 "report a member … on a member (member list/context)" — the un-invited-actor intent is reporting *others*; B-3 required message report "non-own only" and member affordance on "a member other than yourself."
- **Deployed:** Fixture A sees a Report control on her OWN messages and OWN member row (T-5 F1). Root cause: `apps/web/src/shell/MainColumn.tsx:343` passes `currentUserId={profile?.username}` (username string) while `MessageList.tsx` compares against `msg.authorId` (UUID) → `isOwn` always false.
- **My independent read:** this IS **spec-drift** against the "report someone other than yourself" intent — the code shows the affordance where the spec says it should not. HOWEVER it is UI-only and non-security: the backend stamps `reporter_id` from the session, so a self-report is merely inert data (I confirmed self-target reports are created as normal `open` rows and dismiss cleanly). The core spec-intent — "every publicly-listed listing MUST be reportable" (M14 leg 1) — is fully met; the defect is an *over-exposure* of the affordance, not a *missing* one, and creates no auth/data-integrity hole. Correctly a **V-2 triage item (MAJOR, route to react-specialist)**, not a V-1 REJECT.

### F-J3 — [assessment of T-block T6-M1] mobile inbox off-screen = real CRITICAL UI defect, but does not break the spec's core intent
- **Spec ref:** Spec C AC2 "Owner/moderator report INBOX … listing open reports … action buttons"; C design "per D-3 … DESIGN-SYSTEM tokens."
- **Deployed:** at 375px the ReportInbox `fixed inset-0` overlay is trapped inside the ChannelSidebar drawer's `translateX(-260px)` transformed ancestor (the transform makes the ancestor the containing block for `fixed`), parking the inbox off-screen (x=-188). Desktop 1440 PASS. (T-6 T6-M1.)
- **My independent read:** this is a genuine CRITICAL *layout* defect on mobile, but the inbox is fully functional and spec-conformant on desktop (its primary owner/mod surface), and every inbox *behavior* the spec mandates (GET scoping, per-row actions, resolve→removes-from-queue, moderate_members gate) is proven live at the API and desktop UI. The defect blocks the mobile *presentation* of an existing, working surface — it does not violate any spec AC's functional requirement. Per the V-1 latitude ("a MAJOR/CRITICAL UI defect that doesn't break the core spec-intent need not be a REJECT"), I do NOT reject on this. It IS a must-fix **V-2 CRITICAL** (portal the overlay to `document.body`; route to react-specialist).

### No NEW semantic divergence found
Beyond the two known T-block findings, my live probes surfaced **no new** semantic gap. Every spec edge-case (non-existent target ×3 types, reason bound, target_server_id resolution + spoof, already-resolved, cross-server, rank-guard, non-mod gate) behaves as the spec intends on the deployed revision.

---

## Spec-by-spec conformance summary

- **Spec A (report substrate + unlist):** CONFORMS. reports table shape reflected in live responses (all columns present: id/reporter_id/target_type/target_server_id/target_user_id/target_message_id/reason/status/created_at/resolved_at/resolved_by). POST /reports derives reporter_id from session (no-IDOR, T-8 re-confirmed), validates target exists across all 3 types (probes 1-3), resolves + persists target_server_id server-side and ignores client spoof (probes 6-7). Owner-unlist reuses wave-68 PATCH is_public=false (owner-gated) — not re-probed live this session but T-8/T-5 chain + spec-reuse idiom is intact; the report half (the launch-gate primitive) is fully proven.
- **Spec B (action loop):** CONFORMS. GET inbox moderate_members-gated + status/server scoped (probes 9-10, T-8 A200/B403). resolve routes timeout→ModerationService / delete_message→MessagesService (channel_id from message row) / dismiss; rank guard via route-through (T-8 + source `:311-349`); cross-server tamper 404 (T-8 + source `:293`); already-resolved 409 (probe 8); status flip + resolved_at + resolved_by set (probe 8, probe 6-row).
- **Spec C (UI):** CONFORMS on the happy path + gating; two UI defects (F-J2 own-content leak = spec-drift UI-only; F-J3 mobile inbox off-screen = CRITICAL layout) are V-2 triage, not spec-intent breaks. Report affordance on message/member proven live (T-5); server affordance code-present but un-exercised (cold-start empty /discover — F2, not a defect). Success/error/double-submit states proven (T-5). moderate_members UI gate source live (probe 10).

---

## Cleanup (prod-clean — satisfied)

Reports I created during probing, all **dismissed** (non-destructive), queue restored to **0 open**:
- `98282a8d-3abe-40e1-a3a5-b6bce875c186` (probe 6, message, tsid-resolution) → dismissed
- `6c43f02b-5162-456c-8aad-aae187225c17` (probe 7, message, tsid-spoof) → dismissed
- Probes 1-5 returned 4xx (no report row created).
- Also dismissed the 5 T-5-left-open reports (`305f4b95`, `cd0a2d04`, `ca337bbe`, `75ec1fb4`, `ae76e5ea`) to clear the queue.

**No message deleted, no member timed out.** All dispositions were `dismiss`. Final `GET reports?status=open` → 0.
