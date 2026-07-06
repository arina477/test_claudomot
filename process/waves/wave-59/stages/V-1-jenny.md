# V-1 Review — jenny (wave-59, StudyHall)

**Verdict: APPROVE**
**Spec section:** task f8eb49c1 acceptance criteria (mirrored `process/waves/wave-59/stages/P-2-spec.md:10-18`)
**Scope:** deployed/merged behavior (merge `42c95bc` on `main`; web deploy SUCCESS). Verifying INTENT, not just green tests.

---

## What the spec demands
A table-driven unit test locking `buildTypingLabel`'s 5 buckets:
`0→'' ; 1→'<name> is typing' ; 2→'<a> and <b> are typing' ; 3→'<a>, <b> and <c> are typing' ; 4+→'Several people are typing'`. Table-driven so drift fails deterministically. Test-only; sole prod change is the `export` keyword. `design_gap_flag=false`.

## Verification results — all three checks PASS

### 1. Test satisfies the INTENT of every AC (all 5 buckets, verbatim names, true 4+ fallthrough)
`apps/web/src/shell/useTyping.test.ts:34-65` is a single `it.each(TABLE)` (line 72) over 6 rows:
- `0 typers → ''` (test line 37-38)
- `1 → 'Alice is typing'` (line 43) — verbatim name
- `2 → 'Alice and Bob are typing'` (line 48)
- `3 → 'Alice, Bob and Carol are typing'` (line 53)
- `4 → 'Several people are typing'` (line 58)
- `5 → 'Several people are typing'` (line 63) — the extra 5-typer row **proves 4+ is a true fallthrough**, not a hardcoded `length===4` branch. This is the strongest form of the AC's "drift fails deterministically" intent: a single `>3` boundary can't be faked to pass both the 4 and 5 rows unless the real function actually falls through.

Table-driven per spec: adding/removing a branch or changing a string forces a deterministic row failure. AC met.

### 2. `buildTypingLabel` actually produces those exact strings (no test that would pass against wrong output)
Traced the merged function at `apps/web/src/shell/useTyping.ts:65-84` against each expected string:
- `length===0 → ''` (line 67) ✓ matches expected `''`
- `length===1 → \`${a.displayName} is typing\`` (line 70) → `'Alice is typing'` ✓ byte-for-byte
- `length===2 → \`${a} and ${b} are typing\`` (line 75) → `'Alice and Bob are typing'` ✓
- `length===3 → \`${a}, ${b} and ${c} are typing\`` (line 81) → `'Alice, Bob and Carol are typing'` ✓ (note the Oxford-less "`, ` … ` and `" separator — the test's expected string reproduces this exactly)
- fallthrough `return 'Several people are typing'` (line 83) → covers both 4 and 5 ✓

The expected strings are not a re-implementation living in the test; they are literal string constants that would break if the real function's separators, word order, or spacing drifted. There is no branch the test asserts that the function does not actually take. Confirmed live: `pnpm --filter @studyhall/web exec vitest run useTyping` → **6 passed (6)**, 1 file.

### 3. Spec-gap awareness — test-only, no behavior change, does NOT close F-4
- **Prod change is exactly the `export` keyword and nothing else.** `git show 42c95bc -- apps/web/src/shell/useTyping.ts` = a 1-line diff: `function buildTypingLabel` → `export function buildTypingLabel`. Logic byte-identical. No user-visible behavior change. Merge stat: `useTyping.ts | 2 +-` (one line, `export` added). Matches the spec's "sole prod change is the export keyword."
- **F-4 (task 58633934) is a SEPARATE, still-open server-side fan-out defect UPSTREAM of the pure formatter.** `buildTypingLabel` is a pure function of the `typers` array it is handed; F-4 is about co-members receiving an *empty* typers array from the server broadcast — i.e. the input to this function, not the function. A green `useTyping.test.ts` cannot and does not resolve F-4.
- **Wave artifacts are correctly honest — no artifact implies F-4 is closed.** Verified across every wave-59 artifact that mentions it:
  - `process/waves/wave-59/blocks/P/gate-verdict.md:31` — "F-4 … is still OPEN — a green useTyping.test.ts must NOT be mistaken for F-4 being resolved."
  - `process/waves/wave-59/blocks/T/findings-aggregate.md:4-5` — "F-4 … is SEPARATE and still open; this test does NOT close F-4."
  - `process/waves/wave-59/blocks/T/gate-verdict.md:25-27` — test "neither closes nor falsely implies resolution of the still-open F-4 defect."
  - `process/waves/wave-59/stages/T-9-journey.md:5` — "honest about not closing F-4 (task 58633934, separate upstream fan-out defect)."
  No conflation anywhere. Flag not raised.

---

## Drift vs. gap
- **Spec drift (code wrong): NONE.** Code produces exactly the specified 5 outputs; test asserts exactly them; prod change is exactly the specified `export`. Zero divergence between spec intent and merged/deployed reality.
- **Spec gap (spec wrong): NONE.** The spec correctly framed this as test-only and pure-formatter-scoped, and correctly (per carry-forward) excluded F-4 from this wave. No mis-specification. The spec's own boundary (do not modify the function) is respected.

## Note (informational, not blocking)
The 4+ bucket is exercised with two rows (4 and 5). This exceeds the literal "one row per bucket" reading and is the correct choice — it is the only way a table test can distinguish a real `>3` fallthrough from a `===4` hardcode. Endorsed, not a defect.

**Final: APPROVE.** No drift, no gap, no F-4 conflation. Deployed behavior matches spec intent; test is mutation-genuine against the real function; 6/6 green.
