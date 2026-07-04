# Wave 47 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId arina-89ejyn)
**Reviewed against:** process/waves/wave-47/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Every layer proves a user-observable outcome and every load-bearing claim was spot-checked against ground truth (dm.service.ts, dm.controller.ts, dm.ts, dm.service.spec.ts, StartDmPicker.tsx) and found honest, not fabricated. The T-5 HEADLINE is genuinely proven through the ACTUAL picker UI — not an API shortcut, the exact wave-46 lesson: playwright-1 drove role=dialog → role=option (co-member B listed, S3) → chip → Open DM → dm-thread → message with author=fixtureA and "Unknown user" absent page-wide (S6/F7), across 2 runs with zero flake, plus the search-filter/empty-state (S7) and Esc focus-trap (S8). The picker source confirms the rewire (`api.getDmCandidates()` at mount, serverId gate removed) so the DOM assertions bind to the real data source, not a stale one. T-8's privacy-fence claims are backed by verified code: the service selects email+who_can_dm but the mapper returns only {userId,displayName,avatarUrl} (no-DTO-leak is real), the controller derives callerId strictly from req.session.getUserId() with no body/param/header path (IDOR callerId-spoof genuinely ignored), and @UseGuards(AuthGuard) enforces the 401. T-4 exercises the real WHERE clause (inArray(server_id, callerServerIds) + ne(user_id, callerId) + DISTINCT ON) against deployed Postgres with live A↔B symmetry — no mock-the-SUT. The two declared coverage limits (who_can_dm='nobody' exclusion and negative-isolation not live-proven, both caused by the 2-member proof-server fixture) are correctly classified low/info: the WHERE clause is proven ACTIVE by the positive results (only B visible, self excluded), the missing pieces are counter-example controls gated on a disjoint-3rd-user fixture, and the filter is present in source + exercised at the unit layer — a fixture gap, not a leak. The tester-swarm contention (playwright-2/3 blocked by the shared Chrome-profile lock) was handled correctly: no browser_close was issued (honoring the no-browser_close rule), the headline is a single-user start-a-DM flow that does not require two live browsers, and the B-side was closed at the T-4/T-8 integration layer where B's live GET /dm/candidates returned exactly [A] self-excluded — adequate coverage, not a gap. No layer's PASS is load-bearing-light. T-1's sole bypass is a biome-ignored test-only mock cast; T-3 exercises both 401 and 200-bare-array and both nullable-avatarUrl branches; T-6's render-confirmation honestly declares no diff-% baseline given byte-identical chrome; T-7's skip is legitimate for a small read-only endpoint with its no-pagination note carried forward. All findings are info/low and route cleanly to V-2; none is a hidden green.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
