# Wave 25 — B-3 Frontend

**Specialists:** react-specialist (`d7074a6`), typescript-pro (`53162de` — B-5 build-defect re-entry). **Scope:** client mention tokenizer parity.

## Delivered
1. **MessageList.tsx tokenizer parity.** `renderBodyWithMentions` (~:559-577): the `@`-part branch now extracts the slug via `extractMentionSlug(part)`, looks THAT up in `mentionMap`, and renders `<span><MentionPill/>{trailing}</span>` (pill + literal remainder). Replaces the old buggy `part.slice(1).replace(/[.,!?;:)]+$/,'')` whole-run lookup.
   - **AC2:** `@bob.dev` (bob resolved) → `bob` pill + literal `.dev` text.
   - **AC3:** unresolved handle → plain text, NO false pill; pill-vs-plain stays entirely `mentionMap`-gated. MentionPill props (`username`, `isSelf`) unchanged (no redesign).
2. **5 MessageList mention tests** added to `messaging.test.tsx`: `@bob.dev`→pill+`.dev`; `@alice`→pill only; `@nobody`→plain no pill; `@bob.dev` w/ bob unresolved→plain; two resolved mentions→two pills.

## Defect resolved (found at B-5 — build-breaking)
Vite/rollup could not resolve the runtime value `extractMentionSlug` from the CJS-only `@studyhall/shared` (cjs-module-lexer misses the `Object.defineProperty` re-export getter). Codebase has a documented **CJS-avoidance convention** (messagingSocket.ts:32-40) — web imports types only, mirrors runtime constants locally.
- **Fix (`53162de`, typescript-pro):** web-local mirror `apps/web/src/shell/mentionSlug.ts` (`extractMentionSlug` + `MENTION_TOKEN_SLUG_SRC`, header comment naming the pattern); MessageList imports `./mentionSlug`; **parity contract test** `mention-slug-parity.test.ts` (12 cases) imports BOTH shared + local and asserts identity → drift = RED test. `@studyhall/shared` build/package.json unchanged (protects the NestJS api CJS consumption). apps/api keeps the direct shared import (CJS→CJS works).

## Approach deviation from P-3 plan
P-3 assumed web imports `extractMentionSlug` directly from `@studyhall/shared`. The CJS-avoidance convention forces a web-local mirror instead. Single-source-of-truth INTENT preserved by the contract test (loud drift), not a single physical import. Surfaced to the B-6 gate for blessing.

## Exit
Client parity delivered (AC2/AC3), build green, parity enforced by contract test. → B-4/B-5 (re-verified).
