# Wave 19 stage completion

> Seeded by wave-18 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `20db0c16-f894-4c84-a441-0a52559d628c` — Implement attachment upload/storage data plane (object storage + ≤10MB).
> Bundled siblings: `7c39c9e3-b6e9-48bd-b61c-c8b53334d33a` (composer send: file picker, preview, upload progress), `cf1ae370-a7a1-4ee9-8f7c-a03fdc07276e` (message-row render: image preview + file chip).
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [20db0c16-f894-4c84-a441-0a52559d628c, 7c39c9e3-b6e9-48bd-b61c-c8b53334d33a, cf1ae370-a7a1-4ee9-8f7c-a03fdc07276e]
> Slice: file/image attachments — the LAST unshipped M3 success-metric feature ("...with reactions, threads, and attachments working"). Seed = upload/storage data plane (object-storage integration + upload endpoint + attachments persistence + ≤10MB validation + contract). Siblings = composer send UI + message-row render. After this ships, M3 has all success-metric features; closure also requires the 5 parked tech-debt seeds to be terminal (done or founder-cancelled).
> Ordering provenance: N-1 wave-18 — effective feature-seed count = 0 (the 5 open top-level tasks are parked tech-debt/polish, not feature seeds); wave-17 BOARD BINDING (`N-1-ordering-wave-17`, 7/7 feature-first) governs → attachments-first does NOT displace a feature, binding resolves cleanly, NO BOARD needed. N-2 picked the attachments seed over the bare oldest-created default (which would have been invite-rotation tech-debt d058283d).
>
> Pending ritual outcomes / heads-ups affecting P-0:
>   - **External-storage SDK + credential gate (rule-6 exception).** Attachments need an object-storage SDK (Railway Buckets / S3-compatible / similar). This LIKELY requires **account-issued storage credentials** — a founder/ceo cred-ask. The seed prose frames the storage approach + SDK selection as a **P-0 / SDK-research item** per `claudomat-brain/rules/external-sdk-integration-rules.md`. The cred-ask belongs at THIS wave's P-block (NOT earlier). Do NOT assume storage is pre-wired. Generate non-account secrets yourself (rule 6); request only the account-issued storage creds.
>   - **Likely a UI wave** (`P → D → B → C → T → V → L → N`): composer attachment affordance + message-row image preview / file chip are design surfaces on `design/server-channel-view.html`. P-0 should evaluate the D-block trigger.
>   - Parked M3 tech-debt seed candidates (todo, wave_id NULL — NOT cancelled): d058283d (invite_code rotation — BOARD advisory: re-seed as hard-gate at first pre-launch/external-user wave), 02fa8011 (real-PG integration test tier), 6a546c7b (presence perf — cheaply measurable), d23a0740 (presence code-debt), c18b8089 (mention parser parity — persist-path correctness item M4 inherits; fold in or verify soon).
>   - Unassigned queue (2): `67881a58` (reconfigure Playwright MCP to bundled chromium for live UI tests), `4e994e96` (clean up pre-existing biome lint warnings). P-0 walks the unassigned queue and assigns what it can.
>
> Standing recommendations carried from wave-18 L-2 (for founder / framework — NOT to implement in this wave):
>   - **obs-4 — CI-PRINCIPLES bypass guard (FRAMEWORK/BRAIN change, can't be a project principle).** head-ci-cd has added a CI-PRINCIPLES rule at the C-block 4 times (waves 9, 12, 17, 18), each reverted (L-2 owns principle promotion). L-2 recommends a STRUCTURAL guard: a check at C-block exit that fails if `git diff HEAD -- 'command-center/principles/*.md'` is non-empty. This is a brain/framework change and is already in the founder digest. Recorded here as a standing recommendation; do not implement as a project artifact.
>   - **Playwright MCP `--channel=chrome` persistently misconfigured** (live realtime was verified via socket.io wire probe as the workaround; see unassigned task 67881a58 to reconfigure to bundled chromium).

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate APPROVED

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt (APPROVED)

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge — PR #31 merged dbf6b25 (squash); 1 fix-up cycle cleared lint+test reds; all 7 CI jobs green; C-1 negative-path tests executed+passed
- [x] C-2 Deploy & verify — api 8ef2c228 + web 8d3e0c36 deployment-state SUCCESS (distinct from baselines); migration 0009 applied+verified; presign route serves 401; canary skipped (DAU 0 < 1000)

TEST:
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
