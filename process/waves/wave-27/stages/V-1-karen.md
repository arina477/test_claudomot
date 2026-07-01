# V-1 Karen — Reality Check (StudyHall wave-27, multi-spec presence perf)

**Agent:** karen (Project Reality Manager) · **Stage:** V-1 Review · **Scope:** source-claim verification (LOAD-BEARING claims TRUE in merged tree + deployed state — NOT spec conformance, that's jenny).

**Merge under review:** 87b6ef7 (PR#40) on `main`. **Deployed:** api `855f1ea1` (index applied, migration 0012), web `328b1ae9` (bundle `index-Dr2UkTXH.js`). HEAD at review: `b85f8f0`.

**Overall verdict: APPROVE.** All 7 load-bearing claims VERIFIED at source. Zero WRONG, zero UNVERIFIED. Antipattern scan clean — no claimed-but-fake. One LOW documentation-quality nit on a test doc-comment (non-blocking, does not affect functional reality). Special-attention claim 5 (CARRY-B, the P-4 binding carry) is CONFIRMED real.

---

## Per-claim findings

### Spec A — server index (task 6a546c7b)

**Claim 1 — Index in schema + migration — VERIFIED.**
- `apps/api/src/db/schema/servers.ts:59` — `index('server_members_user_id_idx').on(table.user_id)` present on `server_members` (alongside the existing in-file `cpo_channel_id_idx` pattern at :104; not a novel construct).
- `apps/api/drizzle/migrations/0012_flashy_spacker_dave.sql` — `CREATE INDEX "server_members_user_id_idx" ON "server_members" USING btree ("user_id");` — exact match. Journaled (meta `0012_snapshot.json` + `_journal.json` idx 12 in the merge diff). Migration confirmed applied to prod at C-2.

**Claim 2 — presence.service unchanged (index-only, no rewrite) — VERIFIED.**
- `git diff 87b6ef7^ 87b6ef7 -- apps/api/src/presence/presence.service.ts` → **EMPTY** (exit 0, no hunks). The file is not in the merge stat at all.
- `getServerIdsForUser` (`presence.service.ts:106`) and `getCoMemberUserIds` (:119) both present and unmodified. Optimization is a pure planner win with identical semantics. Confirmed.

**Claim 3 — EXPLAIN proof test is a genuine proof (not decorative) — VERIFIED.**
- `apps/api/test/integration/presence-index-scan.spec.ts` runs `EXPLAIN (FORMAT TEXT) SELECT server_id FROM server_members WHERE user_id = $1` — the exact `getServerIdsForUser` query — via `harnessExplainWithSeqscanOff`, then asserts three independent conditions: plan contains `Index Scan`, contains `server_members_user_id_idx`, and does NOT contain `Seq Scan on server_members`. Plus an AC3 behavior-preserving test across a 3-user/2-server topology (co-member excluded, empty set for no-membership user).
- `harnessExplainWithSeqscanOff` (`pg-harness.ts:300-318`) is real: acquires a **dedicated** PoolClient (not `pool.query`, so `SET LOCAL` binds to the same connection as the EXPLAIN), runs `BEGIN → SET LOCAL enable_seqscan = off → <sql> → ROLLBACK`, releases unconditionally, rolls back on error. Forcing index *eligibility* via `enable_seqscan=off` is the correct deterministic invariant for a migration proof — removes tiny-table plan-flake while failing hard if the index is missing/unusable (mutation-sane: drop 0012 → Seq Scan → assertion fails).
- CF-2 honored: `import './pg-harness'` is the FIRST import (side-effect binds `DATABASE_URL=DATABASE_URL_TEST` before the SUT import). `describe.skipIf(SKIP)` with `SKIP = !process.env.DATABASE_URL_TEST` fails **loud** (explicit `it.skip('SKIPPED: DATABASE_URL_TEST is not set…')`, not a silent green). CI provisions `postgres:16` + `DATABASE_URL_TEST` (per T/gate-verdict evidence), so `SKIP=false` and the proof genuinely EXECUTES; PR#40 test job SUCCESS.

### Spec B — client subscription lift (task 07361daf)

**Claim 4 — Single list-level subscription; per-row subscribe removed — VERIFIED.**
- OLD (`87b6ef7^`): `AuthorPresenceDot` was a stateful component containing its OWN `subscribePresence` in a `useEffect` (per-row → O(N) subscriptions).
- NEW: the sole live `subscribePresence` is a single list-level `useEffect` in `MessageList` (`MessageList.tsx:1515-1520`) driving a `presenceTick` state. `AuthorPresenceDot` (`:962-966`) is now `memo()`'d, receives a scalar `status` prop, and contains **no subscribe** (the 3 `subscribePresence` text hits in the new file = import + doc-comment + the one live call). Per-row subscribe confirmed removed. Subscriber budget O(N)→O(1).

**Claim 5 — CARRY-B per-author render-scoping PRESERVED (P-4 binding carry) — VERIFIED.**
- Wiring is real, not a naive whole-list re-render: `SentRow` derives the author's tri-state scalar at render (`authorPresenceStatus: boolean|null` from `hasPresence`/`getPresenceStatus`, `MessageList.tsx:1006-1008`) and passes it to `AuthorPresenceDot`, which is `React.memo`'d on that scalar `status` prop (`:962`). A presence event for author-B increments the shared `presenceTick` (re-rendering every `SentRow`), but author-A's memoized dot bails out because A's derived scalar is unchanged. This is genuine per-author render-scoping, NOT a whole-list re-render — would have been a WRONG, but it is correct.
- The CARRY-B test exists and is behavioral, not decorative (`presence-dots.test.tsx`, test `(CARRY-B) presence event for author-B does not change author-A dot output`): seeds carry-a + carry-b online → asserts 2 "Online" → flips carry-b offline in `act()` → asserts exactly 1 "Online" + 1 "Offline". A regression to whole-list re-render would still pass this DOM-output assertion, but the memo+scalar wiring (verified above at source) is what actually delivers the render-scoping. Both are present and real.
- **LOW nit (non-blocking, doc-quality only):** the CARRY-B test's doc-comment (`presence-dots.test.tsx:459`) claims "React.memo with a custom `areEqual`" — the implementation uses **plain** `React.memo` with the default shallow prop comparison over the scalar `status` (no custom comparator). Functionally equivalent for a scalar prop; the comment overstates the mechanism. Cosmetic — does not affect the verdict.

**Claim 6 — Behavior-preserving (tri-state / AC4 single socket / self-seed) — VERIFIED.**
- Tri-state intact: `AuthorPresenceDot` returns `null` on `status === null` (unknown → no dot), `<PresenceDot online={status}/>` otherwise (`:963-965`); `hasPresence` gate preserved. `presenceSocket.ts` exports `getPresenceStatus` (:148), `hasPresence` (:158), `seedSelfPresence` (:191), `subscribePresence` (:206) — read path untouched.
- AC4 single socket: the lift changes subscription topology (N→1), not the module-singleton socket; the `(AC1/wave-27) subscribePresence is called exactly ONCE for a multi-message list` test asserts `subscribePresenceCallCount === 1` for a 2-message list (was O(N) in wave-26).
- Optimistic PendingRow/FailedRow render no dot (CARRY-2 degrade tests present at `:346`, `:360`). Self-seed idempotency test present (`:328`). Live T-5 regression (member panel per-user ONLINE/OFFLINE on bundle `index-Dr2UkTXH.js`) corroborates.

### Cross-cutting

**Claim 7 — Commit-per-spec (no cross-spec commit) — VERIFIED.**
- PR#40 squashed the branch commits; the squash body preserves the constituent per-spec commits: Spec-A commits (`feat(presence)` index + `fix(presence)` EXPLAIN-eligibility) cite `Refs: 6a546c7b` ONLY and touch `apps/api/*`; the Spec-B commit (`perf(presence)` MessageList lift) cites `Refs: 07361daf` ONLY and touches `apps/web/*`. The two roll-up commits that cite both refs are build/gate bookkeeping, not logic — no single logic commit crosses both apps. B/gate-verdict independently records the same (ff4126b api-only/6a546c7b, bd18a08 web-only/07361daf). No cross-spec logic commit. Confirmed.

---

## Antipattern scan

- **Under-floor override-ship (6th) legit? — LEGIT.** The "6th consecutive under-floor M5-debt wave" is founded on a real, consistently-recorded wave chain (w16 origin → w23 → w24 [BOARD 6/7] → w25 → w26 → w27), cited identically in `product-decisions.md`, `P-0-ceo-reviewer.md`, `P-1-decompose.md`, and both P-4 gates. `floor_constraint_active: false` in `P-0-mvp-thinner.md` (OK emitted on merit, not a floor block). The 6th application follows the wave-24 BOARD's explicit standing instruction — not a skipped gate. Not fabricated.
- **Sibling 07361daf re-homed (M5, parent 6a546c7b)? — CONFIRMED.** DB: task `07361daf` has `parent_task_id = 6a546c7b`, same `milestone_id = a5232e16` and `wave_id = 246e65b9`. Structurally correct re-home per the P-0 SELECTIVE-EXPANSION bundle decision. (Both rows still `in_progress` — expected pre-N-block close; not a defect.)
- **Any claimed-but-fake? — NONE.** Every load-bearing claim is TRUE at source. The only discrepancy is a cosmetic test doc-comment overstatement (claim 5 LOW nit) — the code behind it is real.
- **Stale-local-dist note (informational):** local `apps/web/dist/assets/index-Dwj8AAF6.js` differs from the deployed `index-Dr2UkTXH.js` — this is a stale local build artifact (web is built in CI at deploy). NOT load-bearing for source-claim verification; the deployed bundle hash matches C-2/T-5 evidence.

---

## Reality assessment

Functional state matches the claims exactly. This is an honest, correctly-scoped, behavior-preserving multi-spec perf wave: an additive index (planner-only win, service logic untouched, real EXPLAIN proof) + a genuine O(N)→O(1) subscription lift that **preserves** the wave-26 CARRY-B render-scoping via memo+scalar-prop wiring. No over-engineering, no under-baked proof, no unguarded door, no cross-spec commit bleed. The single LOW finding is a stale test comment with zero functional impact.

**KAREN VERDICT: APPROVE.**
