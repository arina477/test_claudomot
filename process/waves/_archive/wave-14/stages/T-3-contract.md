# T-3 — Contract (wave-14)

**Block:** T · **Stage:** T-3 · **Layer:** API/SDK/shared-schema contract · **Pattern:** A (CI-verified, after gap-fill) · **Mode:** automatic

## Action 1 — Pattern
B-1 authored project-internal Zod contracts in `packages/shared/src/presence.ts` (no external SDK contracts). → **Pattern A.** WS event names + member-list view-model are internal. No third-party probe needed.

## Action 2 — CI evidence + GAP found
The presence Zod contracts shipped UNVERIFIED at merge: `packages/shared` had ZERO test files (no `*.spec.ts`), so CI's `test` job exercised none of the presence schemas. The schemas define the WS wire contract (server emits → client parses) — the most expensive drift class.

**GAP (F-2, severity HIGH→closed in-stage):** No contract test for any presence Zod schema. Closed by adding `packages/shared/src/presence.spec.ts` (37 tests), wiring `packages/shared` into the vitest/turbo pipeline (added vitest.config.ts + test/test:ci scripts) so CI now runs them.

## Action 3/4 — Coverage trace (100% schema coverage; valid + meaningful-invalid each)
| Contract (B-1) | Valid | Invalid (asserts issue path/code, not bare throw) |
|---|---|---|
| PresenceStatusSchema | online/offline | "away" → invalid_enum_value |
| PresenceStateSchema | round-trip | non-uuid userId (path:userId), missing status (path:status), "away" |
| PresenceSnapshotSchema | multi + empty | member non-uuid userId (path:[members,userId]), missing members |
| PresenceOnlinePayloadSchema | round-trip | non-uuid userId, missing userId |
| PresenceOfflinePayloadSchema | round-trip | non-uuid userId, missing userId |
| TypingStartSchema | round-trip | non-uuid channelId, missing channelId |
| TypingStopSchema | round-trip | non-uuid channelId, missing channelId |
| TypingActiveSchema | multi + empty | non-uuid channelId, typer missing displayName (path:[typers,displayName]), typer non-uuid userId, missing typers |
| PRESENCE_EVENTS const | all 6 wire strings asserted exactly + key-count locked | n/a (value-equality is the contract) |

Every schema has a parse-valid AND parse-invalid case (T-3 gate rule). Invalid cases assert on `issue.path`/`issue.code` (typed contract), per test-writing-principles §12 (types are contracts, messages are copy).

Build-safety note: spec file initially broke `@studyhall/shared:build` (tsc compiled it under `noUncheckedIndexedAccess`). Fixed correctly — excluded `*.spec.ts` from the build tsconfig (specs never ship in lib dist) + made assertions null-safe with optional chaining (NO `@ts-ignore`/`as any` bypasses). Verified: `pnpm test:ci` full repo GREEN (shared 37 / api 251 / web 131); `packages/shared/dist` contains 0 spec artifacts.

## Note: GET /servers/:id/members response shape
The members endpoint returns `ServerMember[] {userId, displayName, avatarUrl}` (servers.service listServerMembers). Its HTTP contract (member-gate 401/403) is covered at T-4 (controller-level) + T-8 (live prod probe). The view-model `MemberListEntry` composes ServerMember + PresenceState client-side — its presence-state half is the Zod-tested PresenceState.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [PresenceStatusSchema, PresenceStateSchema, PresenceSnapshotSchema, PresenceOnlinePayloadSchema, PresenceOfflinePayloadSchema, TypingStartSchema, TypingStopSchema, TypingActiveSchema, PRESENCE_EVENTS]
ci_evidence:
  - "Added packages/shared/src/presence.spec.ts (37 tests); wired into turbo test:ci pipeline"
  - "pnpm test:ci full repo GREEN: shared 37, api 251, web 131"
active_probe_results: []
infrastructure_gap_recorded: true   # shared package had no test infra; wired this stage
findings:
  - {severity: HIGH-CLOSED, contract: presence.ts all schemas, description: "Zod contracts shipped with zero contract tests; closed by adding 37 valid+invalid parse tests asserting issue path/code; 100% schema coverage"}
head_signoff:
  verdict: APPROVED
  stage: T-3
  failed_checks: []
  rationale: "100% presence-schema contract coverage achieved (valid + meaningful-invalid per schema, asserting issue path/code); wire event-names locked; full repo green; spec build-safety fixed without bypasses."
  next_action: PROCEED_TO_T-5
```
