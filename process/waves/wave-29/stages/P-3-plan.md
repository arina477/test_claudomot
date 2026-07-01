# Wave 29 — P-3 Plan (single-spec: presence/members code-debt)

## Approach section

### Architecture deltas
- **Part 1 (backend correctness):** the displayName fallback chain at two read sites resolves an empty local-part to `''` because `??` doesn't catch falsy-but-defined. Swap the middle `??`→`||` so `''` falls through to userId. No boundary/transaction/permission change — a 2-char operator fix per site. **Alternative:** an explicit `=== '' ? undefined : x` ternary — REJECTED (verbose; `||` is the idiomatic falsy-fallthrough and also incidentally guards a stored-empty display_name, which the ternary would miss unless applied to both operands). **Failure domain:** none (display-string only; never used as a key).
- **Part 2 (shared-contract cleanup):** DELETE the unused `ServerMembersResponseSchema` `{ members: [...] }` wrapper + its inferred type + barrel re-export. The wire is a bare `ServerMember[]` (unchanged). **Alternative:** align the wrapper to `z.array(ServerMemberSchema)` — REJECTED (problem-framer: aligning dead code leaves a redundant unused alias; deletion removes the latent trap at lower cost). **Failure domain:** none if truly unused (B verifies zero source consumers before deleting; typecheck is the safety net).

### Data model
No schema/migration. No DB change.

### API contracts / deps
None changed. GET /servers/:id/members already returns bare `ServerMember[]`; only a dead shared schema is removed. No new dep, no SDK.

### SDK pre-build
N/A.

## Plan section

### File-level steps by B-stage

**B-0 Branch & schema:** branch `wave-29-presence-members-debt` from main. No schema/migration.

**B-1 Contracts (FIRES this wave — shared-package mutation):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 1 | packages/shared/src/servers.ts | modify | grep-verify zero source consumers of `ServerMembersResponseSchema` + `ServerMembersResponse` (apps/ packages/ excluding dist/); DELETE the schema (:66-68) + type (:69) | typescript-pro |
| 2 | packages/shared/src/index.ts | modify | DELETE **BOTH** barrel re-exports — the schema value export (`:23 ServerMembersResponseSchema,`) AND the type re-export (`:34 ServerMembersResponse,`). Leaving `:34` dangling breaks B-4 typecheck (P-4 REWORK catch). | typescript-pro |
| 3 | (verify) | run | `pnpm --filter @studyhall/shared typecheck` green in isolation | typescript-pro |

**B-2 Backend (part 1):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 4 | apps/api/src/servers/servers.service.ts | modify | line 249: LOCKED form (P-4 REWORK) — replace BOTH `??` with `||`: `displayName: r.displayName || r.email.split('@')[0] || r.userId`. (NOT "swap the middle ??" — `A ?? B \|\| C` is a JS/TS SyntaxError; and `A ?? (B \|\| C)` fails AC1's stored-empty-display_name guard. The full `\|\|` chain is the only legal + AC1-satisfying form.) | node-specialist |
| 5 | apps/api/src/presence/presence.gateway.ts | modify | line 125: same LOCKED form — `const displayName = userRow?.display_name || userRow?.email?.split('@')[0] || userId;` (both `??`→`||`) | node-specialist |
| 6 | apps/api/src/servers/servers.service.spec.ts (+ presence gateway spec if one exists) | modify | unit: email `@x.com`/empty + null display_name → displayName === userId (not ''); normal email → local-part; non-null display_name → that value | node-specialist |

**B-3 Frontend:** SKIP (design_gap_flag=false; no UI — part 1 is server-side resolution, part 2 is a shared-type delete with no client consumer).

**B-4 Wiring:** repo typecheck (catches any missed consumer of the deleted schema) + `biome check` (BUILD rule 7/8) + build.

**B-5 Verify:** api+shared+web tests + build. **B-6 Review:** head-builder gate + /review. Commit cites `Refs: d23a0740`.

### Specialist routing (validated against AGENTS.md)
- `typescript-pro` — shared-package Zod schema deletion + isolated typecheck (contract surface). In AGENTS.md.
- `node-specialist` — NestJS backend fallback-operator fix + unit tests. In AGENTS.md (used w28).

### Parallelization
B-1 (typescript-pro, packages/shared) → then B-2 (node-specialist, apps/api) — B-2 doesn't depend on B-1's output (disjoint files, no shared type consumed by part 1) but B-1 is the contract-lock stage so runs first per block sequence. Effectively serial (2 specialists, tiny scope). B-4 repo typecheck is the cross-cutting safety net for the deletion.

### Action 8 — self-consistency sweep (re-run post-REWORK against locked forms)
- AC1 (empty local-part AND empty stored display_name both fall through to userId) → the LOCKED full-`||`-chain form at steps 4+5 (`displayName || localpart || userId`) — the `?? (…||…)` alternative is rejected (fails the stored-empty-display_name guard). AC2 (normal email → local-part) + AC3 (non-null display_name → that value) → same locked form (`||` short-circuits on the first truthy). Unit step 6 asserts all three + the empty-display_name case.
- AC4 (schema deleted, typecheck green) → steps 1 (schema+type in servers.ts) + 2 (**both** barrel re-exports index.ts:23 **and** :34) + 3 isolated typecheck + B-4 repo typecheck (catches any missed consumer). AC5 (wire unchanged) → no API/controller step (bare `ServerMember[]` untouched).
- Every AC maps to a step; every step has a specialist; no file in two batches; design_gap_flag=false referenced; contracts concrete (exact lines + locked operator form); no new deps/SDK. Clean.

## Exit
Single-spec plan: part 1 `??`→`||` × 2 sites (node-specialist, B-2) + part 2 DELETE dead ServerMembersResponseSchema (typescript-pro, B-1). design_gap_flag=false → skip D. B-1 fires. → P-4 Gate (carry M5 park-or-key + M6 escalation).
