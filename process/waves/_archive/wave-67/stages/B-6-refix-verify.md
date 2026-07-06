# B-6 Re-verify — wave-67 fix-up (commit `1b68663`)

Focused re-verification of the B-6 Phase-2 `/review` fix-up on M11 server discovery.
Branch `wave-67-server-discovery`. Phase-1 was APPROVED (attempt 2); Phase-2 `/review`
found correctness bugs; fixed in `1b68663`. Scope: confirm each finding is closed at
source, security gate untouched, tests lock the fixes.

## Verdict

**APPROVED**

All seven `/review` findings are closed at source, the `is_public` security gate is
untouched by the fix-up, and the test suite locks the behavioural fixes. Suites,
typecheck, and lint are green.

## Finding-by-finding

| # | Finding | Status | Evidence |
|---|---------|--------|----------|
| 1 | handleOpen cross-provider selection | CLOSED | `ServerDiscoverPage.tsx` handleOpen now `sessionStorage.setItem('sh:select-server', serverId)` BEFORE `navigate('/app')`; the separate `/app` ServerProvider consumes it on mount via `applyPendingSelect`. Dead `selectServer` destructure removed; only a comment reference remains (no dangling code). Test: "handleOpen sets sh:select-server ... before navigating to /app". |
| 2 | handleJoin auto-select survives refetch | CLOSED | Key set before `refetchServerList()`. `ServerContext.applyPendingSelect` is the SOLE consumer; `ServerDiscoverPage` never `removeItem`s the key (verified — grep negative). See caveat below. Test: "join sets sh:select-server ... survives stale refetch". |
| 3 | join-error classification | CLOSED | `isPrivateOrGone = msg.startsWith('403') || msg.startsWith('404')`; 400/409/other → generic "Couldn't join — please try again." The `startsWith('40')` over-match is gone. Tests: 403→private, 404→private, 400→generic, 409→generic (4 tests, each asserts the negative too). |
| 4 | duplicate `id="discover-results-count"` | CLOSED | sr-only div removed; the visible results `<p>` is the sole element with the id (single JSX `id=` site at line 716) and keeps `aria-live`/`role=status`; `aria-describedby` on the search input points to it. Test: "has no duplicate id ... expect(els.length).toBe(1)". |
| 5 | request-sequencing guard | CLOSED | Module-scoped monotonic `_fetchSeq`; each call captures `mySeq`; both the success and error branches `return` early when `mySeq !== _fetchSeq`, discarding out-of-order responses. |
| 6 | count copy honest | CLOSED | Renders "Showing {N} communities" (loaded count, not implied total). Test asserts "Showing 2 communities". |
| 7 | backend pagination determinism | CLOSED | ORDER BY now `desc(memberCountExpr), asc(servers.name), asc(servers.id)` — stable UUID tiebreak added. `memberCountExpr` bound once and referenced in both SELECT and ORDER BY (Postgres CSE on identical SQL text) — documented and acceptable at MVP scale. Cross-page member-count drift documented as an accepted limitation; cursor-keyset deferred. |

## No-regression checks

- **Security gate untouched.** `joinPublicServer` (404-missing → `NotFoundException`,
  403-private → `ForbiddenException`, idempotent INSERT reached only AFTER the
  `is_public` check, inside a txn) is unchanged by `1b68663`. `git log -L` on the
  join region shows its last-touching commit is the original feature commit `c34265e`,
  not the fix-up. The API diff touches only the `getDiscoverServers` ordering/count
  region.
- **No schema/migration change.** Fix-up touches no `schema`/`migration`/`.sql` files
  (frontend + discover-ordering only) — confirmed via `git diff --name-only`.
- **Suites green.** web 583/583 (was 576; +7 new tests for the fixes), api 752/752.
- **Typecheck clean** across `packages/shared`, `apps/api`, `apps/web`.
- **Lint clean** (`biome ci`) on all three touched files.
- **Tests assert the fixes** — sh:select-server set on Open + Join; 403/404 vs 400/409
  error copy; single results-count id.

## Caveat (non-blocking, does not gate)

Finding #2's stated rationale ("applyPendingSelect only removeItem's on a matching
list — a stale immediate refetch doesn't permanently drop the key; a later refetch
picks it up") does not precisely match the implementation: `applyPendingSelect`
(`ServerContext.tsx:116-121`) `removeItem`s **unconditionally** once `pendingId` is
present, BEFORE the list-membership check — so a genuinely stale refetch WOULD consume
and drop the key. The described "later refetch picks it up" defense-in-depth is not what
the code does. This is NOT a live defect because StudyHall runs a single Postgres with
no read replica (verified — no replica config in `apps/api/src/db` / `config`), so a
refetch issued AFTER the awaited, committed `joinPublicServer` write reads its own write
and always contains the joined server. The `/app` cross-provider flow (finding #1) fetches
on fresh-provider mount, strictly after navigation and after commit, so it also sees the
row. The stale-refetch scenario the rationale defends against does not occur under the
current single-node topology. Filed as a note for L-2 only if read-replica routing is
ever introduced (would need `applyPendingSelect` to move the `removeItem` inside the
match branch). Not a rework of this fix-up.

## Correctly-dispositioned (not re-flagged)

"No write path → empty directory" was dispositioned as a separate M11 follow-up
(task filed), not a rework of this code. Not re-flagged.

---
head_signoff:
  verdict: APPROVED
  stage: B-6 (re-verify, fix-up 1b68663)
  reviewers: { code-review-phase-2: findings-closed, karen: n/a-focused-reverify }
  failed_checks: []
  rationale: >
    All seven /review findings are closed at source and locked by tests (web 583/583
    incl. +7 new, api 752/752, typecheck + biome lint clean). The is_public security
    gate in joinPublicServer is provably untouched by the fix-up (git log -L confirms
    last-touching commit is the original feature commit, not 1b68663) and the diff adds
    no schema/migration change. One documentation-vs-code mismatch in finding #2's
    rationale was found but is non-blocking: it is not a live defect under StudyHall's
    single-Postgres read-after-write topology, and is noted for L-2 rather than reworked.
  next_action: PROCEED_TO_C-block
