n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 1c728847-2ca7-4c88-8c2c-ffd08832fd3d"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 1c728847-2ca7-4c88-8c2c-ffd08832fd3d
seed_task_title: "[bug-api] Server endpoints: PATCH /servers/:id 500s on malformed body + no server-delete route"
bundled_sibling_ids: []
claimed_task_ids:
  - 1c728847-2ca7-4c88-8c2c-ffd08832fd3d
active_milestone_id: null
queue_exhausted: false
validation_failed: false
premise_check:
  verdict: HOLDS
  source_of_task: "wave-86 T-8 live pen-test (control-server probe); created 2026-07-09 18:36 (freshest seedable candidate)"
  sub_premise_1_patch_500:
    claim: "PATCH /servers/:id 500s on malformed input (should be 400)"
    finding: >
      HOLDS via the un-piped :id param. The request-BODY layer already self-hardened —
      servers.controller.ts:105-118 @Patch(':id') runs UpdateServerSchema.safeParse(body) and
      throws BadRequestException (400) on parse failure, so a malformed body-shape is ALREADY 400.
      BUT the live-500 door remains open through :id: @Param('id') id: string has NO ParseUUIDPipe
      (grep: ParseUUIDPipe never appears in the controller). servers.service.ts:475 does
      eq(servers.id, serverId); db/schema/servers.ts:23 is id: uuid('id') (Postgres uuid column).
      A non-UUID :id reaches the uuid column -> Postgres 22P02 invalid-input-syntax -> unhandled -> 500.
      This is the "same class as the ParseUUID/DTO-validation family" the T-8 finding names. NOT fully
      evaporated — the 500 is real via :id. wave-87 P-2 must scope the fix to the :id param door,
      NOT re-litigate the already-correct body-shape 400.
  sub_premise_2_no_delete:
    claim: "No working server-delete route; owner cannot delete a server they created"
    finding: >
      HOLDS FIRMLY. grep for @Delete / deleteServer / removeServer across apps/api/src/servers/
      returns NOTHING (exit 1). Controller carries @Post/@Get/@Patch route decorators only.
      A server owner genuinely cannot delete a server. Real unaddressed product gap. Net-new
      affordance — needs owner-only auth guard + hard-vs-soft-delete + cascade decision;
      T-8 Security applies at P-4 (auth/ownership surface).
  files_inspected:
    - apps/api/src/servers/servers.controller.ts
    - apps/api/src/servers/servers.service.ts
    - apps/api/src/db/schema/servers.ts
    - packages/shared/src/servers.ts (UpdateServerSchema — non-strict z.object; known-field validation only)
rationale: >
  Highest-value, well-scoped, freshest candidate. A real 500 an owner/attacker can trigger AND a
  genuine missing product affordance (can't delete your own server), self-contained backend work.
  Chosen over: ee6421a7 mention-tokenizer (LOW spec-gap), f51ace12 AA-buttons (design polish),
  fd2dc5a7 transient-401 (LOW/MED polish on already-shipped+correct code), 024a1483 PWA icon,
  ed34c749 hydration race (LOW/monitoring, "not a functional defect" per its own text),
  3b878f96 optimistic-error, 4905dc3a reminder-retry. b84f7be9 userB-fixture already status=cancelled
  (self-healed drop at wave-85) — correctly skipped. Single-spec, zero siblings: one cohesive
  servers-module backend surface; splitting the 500-fix from the delete-route would be artificial
  (both servers-module route hardening, both touchable in one B-block pass, neither depends on an
  unbuilt sibling). No bundle bloat.
p2_spec_author_notes:
  - "Scope the 500-fix to the :id param door (ParseUUIDPipe/validate before the query), NOT the already-correct body-shape 400. Same un-piped :id pattern also appears on sibling routes (@Get(':id') line 92, :id/members line 129, :id/join-public line 150, etc.) — spec author decides explicitly whether to harden servers-wide this wave or scope strictly to @Patch/delete; either defensible, must be a deliberate spec decision."
  - "Delete-route is a net-new affordance, not a bug-patch: needs owner-only authorization guard (owner_id check) + hard-delete-vs-soft-delete + cascade decision for dependent rows (members, invites). Pin as ACs. Touches auth/ownership -> T-8 Security applies at P-4."
  - "Bug-fix-phase wave off a null milestone (milestone_id=NULL, roadmap parked per wave-81..85 chain). P-0 framer must NOT treat the null milestone as a decomposition trigger — it is the standing deferred posture."
note: >
  head-next (agentId a9938e0788d4f549f) gate verdict APPROVED for N-2. Both sub-premises independently
  re-verified against current code. Bundle validated in DB: seed status=todo, wave_id=NULL,
  milestone_id=NULL, parent_task_id=NULL; 0 siblings.
