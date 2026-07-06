# P-3 — Plan (wave-54)

## Approach section

### Architecture deltas
Minimal, test-dominant. Two pieces:

1. **(C) Canonical generic error-string constant.** Introduce one shared constant (e.g. `WS_GENERIC_ERROR = 'Something went wrong'` or similar) in a shared apps/api location (proposed: `apps/api/src/common/ws-errors.ts`; head-builder may relocate to an existing common util). Swap the ad-hoc catch literals — study-timer.gateway.ts (`'Internal error checking membership'` @~189), messaging.gateway.ts (`'Internal error checking channel access'` @~133), and study-room.gateway.ts's per-verb generic fallbacks — to reference the shared constant on the malformed-payload / unknown-error rejection path. This gives ONE definition of the generic message (folds in the wave-53 V-2 spec-gap). Keep the distinct authz-denial messages ("Forbidden: not a member...") as-is — only the UNKNOWN/cast-failure generic path is standardized.
   - *Alternative considered:* keep per-gateway literals. Rejected — the V-2 spec-gap asked for one canonical string; a single constant prevents drift and is the durable artifact.
   - *Scope guard:* do NOT change which errors are genericized vs forwarded (the literal catches already prevent leak); only centralize the string. No behavior change beyond the message text being sourced from one place.

2. **(A) Regression-lock tests.** Add negative tests to each gateway spec proving a malformed non-UUID client id → the generic (canonical) message with leak-tokens asserted ABSENT (invalid input syntax / table+column names / raw query / userId) AND still-denied. These LOCK the info-disclosure class closed: a future refactor changing a catch to forward `err.message` would fail these tests.

**Explicitly NOT in scope (dropped/excluded at P-0):** isUuid guards on timer/messaging parsers (B, dropped — catch already prevents leak); a shared WS-transport error filter (guards nothing — no gateway leaks); any REST controller change (global SupertokensExceptionFilter already covers 22P02).

### Data model / API / deps
NONE. No schema, no migration, no new endpoint/verb, no new dep (one string constant only).

## Plan section

### File-level steps (by B-stage)

**B-2 Backend** (the small production change)
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| `apps/api/src/common/ws-errors.ts` | create | canonical `WS_GENERIC_ERROR` constant (+ export) | websocket-engineer | first |
| `apps/api/src/study-timer/study-timer.gateway.ts` | modify | swap the unknown/cast-failure catch literal(s) to `WS_GENERIC_ERROR` | websocket-engineer | after constant |
| `apps/api/src/messaging/messaging.gateway.ts` | modify | swap the unknown-error catch literal to `WS_GENERIC_ERROR` | websocket-engineer | after constant |
| `apps/api/src/study-room/study-room.gateway.ts` | modify | align its generic fallback(s) to `WS_GENERIC_ERROR` (consistency; keep the parse-layer isUuid guard + safeErrorMessage from wave-53) | websocket-engineer | after constant |

**B-5 Verify** (the core deliverable — tests)
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| `apps/api/src/study-timer/study-timer.gateway.spec.ts` | modify | regression: malformed non-UUID serverId → canonical generic message, leak-tokens absent, denied, member-flow regression | websocket-engineer | after backend |
| `apps/api/src/messaging/messaging.gateway.spec.ts` | modify | regression: malformed non-UUID channelId → canonical generic, no leak, denied | websocket-engineer | after backend |
| `apps/api/src/presence/presence.gateway.spec.ts` | modify | regression: malformed non-UUID id → Zod-rejected generic, no leak, denied (already-safe, now TESTED) | websocket-engineer | after backend |
| (typecheck + Biome + full test suite) | run | B-5 runs exact CI commands, full lint + full suite (BUILD rule-10) | websocket-engineer | last |

### Specialist routing (validated)
- **websocket-engineer** (AGENTS.md:85) — owns all 4 Socket.IO gateways + their specs. Single specialist, cohesive, small. Exists ✓.

### Parallelization
Single serial chain: `ws-errors.ts` constant → 3 gateway edits → 3 spec regression additions → full lint+test. No parallel batches.

### Self-consistency sweep
1. Every AC → step: AC1/2/3 → the 3 gateway spec regressions; AC4 (leak-token-absence + denied) → the spec assertions; AC5 (canonical constant) → ws-errors.ts + 3 gateway swaps; AC6 (no regression) → full suite + member-flow assertions. ✓
2. Every step has a specialist (websocket-engineer). ✓
3. No file in multiple parallel batches (none). ✓
4. design_gap_flag false referenced. ✓
5. Alternatives named. ✓ 6. No schema/API (none). ✓ 7. No deps. ✓ 8. No SDK. ✓
Sweep clean → P-4.
