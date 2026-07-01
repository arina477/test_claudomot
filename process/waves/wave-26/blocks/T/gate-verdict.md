# Wave 26 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-w26-t9)
**Reviewed against:** process/waves/wave-26/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The T-block is honest and all five ACs are met on live production. I independently read every deliverable (not just the manifest summaries), the deployed self-presence source (`presenceSocket.ts:191`, `ProfileContext.tsx:65`), the regression test in full, and the on-disk evidence artifacts — including md5-hashing the T-5 captures.

**The T-5 catch-and-fix is the load-bearing story, and it was handled correctly.** Live E2E on prod caught a genuine, user-observable bug — author-avatar presence dots never rendered on any message row, including the fixture's own online message (bare avatar, no `presence-dot-inner`). Critically, this was a bug the T-2 unit suite MASKED: the pre-fix unit tests mocked the presence store WITH the author key already present, so the "self excluded from snapshot" condition was never exercised. This is a textbook mock-the-system-under-test / single-client masking failure that only a real two-surface live probe surfaces — exactly what T-5 is for. The tester correctly resisted a tester-side fix (Iron Law), routed for root cause, and the root cause was identified precisely: the `/presence` store's `getCoMemberUserIds` snapshot filters the connecting user's OWN userId, so `dR(authorId)` returned `null` for self-authored rows — NOT the authorId-vs-key mismatch that was the tempting alternate hypothesis. The fix (`ProfileResponse.userId` + `seedSelfPresence` marking the viewer ONLINE at session load) is a genuine root-cause remediation and was RE-VERIFIED live ×2 (bundle `index-BAcJ6YNx.js`): self-authored message-row author avatar now carries `presence-dot-inner` at computed `rgb(16,185,129)` emerald + `sr-only "Online"`, `matchedOwnMsg: true`, with distinct DOM row counts across the two runs (23/24 vs 24/25 dotted; 25 vs 26 member dots) — evidencing two real posts/renders, not one replayed pass.

**Evidence honesty — one caveat, not a defect.** The T-5 re-verify PNGs (`reverify-s1/s2-r{1,2}.png`) are byte-identical to each other (md5 `5f60…`), and the original fail-cycle PNGs are byte-identical to each other (md5 `555e…`). This is because full-viewport screenshots do not visually resolve a 6px corner dot — the PNGs are corroborating context, NOT the decisive artifact. The decisive evidence is the verbatim live-DOM extraction (element presence, computed emerald color, sr-only text, matchedOwnMsg flag, per-run row counts), which IS the correct load-bearing signal for a 6px dot. The fail-cycle hash (`555e…`) is genuinely DISTINCT from the fixed-cycle hash (`5f60…`), confirming a real re-capture between broken and fixed states. I note the caveat so the verifier does not treat the PNGs as the proof; the DOM extraction is.

**The added regression test is real and would catch the bug next time.** `presence-dots.test.tsx` "self-author: shows online dot after seedSelfPresence seeds the viewer own userId (T-5 regression)" reproduces the exact prod condition (`_store.has(SELF_ID) === false` before seed), renders the viewer's own message row, asserts the dot is ABSENT pre-seed (`queryByText('Online')` null), then asserts it appears post-seed (`getByText('Online')`) — a user-observable state transition on the precise failing path, not a mock-call-count assertion. A sibling idempotency test guards the plausible over-fix (seed clobbering a real prior event). The mock's `seedSelfPresence` mirrors the real function's semantics exactly (`if !has → set 'online'`), which I confirmed against `presenceSocket.ts:191`. Honest limitation: the unit test exercises the wiring via a mirrored mock rather than importing the real function body — acceptable, because the wiring was the bug surface and T-5 live-verified the real function end-to-end.

**All 5 ACs genuinely met on live prod.** AC1/AC2 (live author dot): PASS, emerald on self-authored row, live ×2. AC2 (single shared PresenceDot + shared emerald token): on-token via `var(--color-accent-emerald)`, member-panel inline-hex duplication removed (T-6). AC3 (unknown author → no dot): preserved — the fix seeds ONLY the viewer's own userId; all other authorIds still resolve via normal snapshot/event, source-confirmed and unit-covered by the unknown→no-dot cases. AC4 (single /presence socket): unit-asserted. AC5 (member-panel refactor no regression): PASS live, 25-26 emerald dots, a11y labels reachable, unregressed by the self-presence-seed fix.

**Skips are all legitimate.** T-3 (no contract surface — PresenceDot is web-local, hasPresence a web accessor; B-1 skipped). T-4 (no schema/service — presence infra pre-exists; B-2 skipped). T-7 (not heavy; the P2 per-row presence-subscription is a valid future perf-lift and is correctly CARRIED as a V-2 non-blocking watch item, not buried). T-8 (non-auth — the added `ProfileResponse.userId` is a session-derived id the client already held; authz on the profile endpoint is unchanged and session-gated, no new auth/CSRF/secret surface; secret-grep 0 matches). No skip hides an untested surface the wave actually touched.

No coverage theater, no single-client realtime false-green (the live probe is the corrective), no flaky-retry masking (the FAIL was root-caused, not retried), no scope-creep. Suite is honest.

## Phase 2 note (orchestrator's)

Phase 2 journey regen is REQUIRED per Action 2 (wave_type includes `ui`, B-3 Frontend ran). However the wave adds NO new route or screen — presence dots attach to existing message-row author avatars and the existing member panel. Expect an annotation-only journey-map update (note the new PresenceDot primitive on the existing channel-view + member-panel surfaces), zero `routes_added`, zero `routes_removed`. Cross-wave regression check should confirm the existing channel-view journey still renders (T-5 already live-verified message post + render). Scenario smoke runs if `user-scenarios/` exists.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
