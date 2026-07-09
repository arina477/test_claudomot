# Wave 84 — V-3 Verdict (Verify block exit gate)

**Reviewer:** head-verifier (fresh independent spawn)
**Reviewed against:** V-1 karen + jenny + summary, V-2 triage, cross-checked against spec (task 9535895f), BOARD record (board-wave-84-session-token-transport.md + product-decisions.md L907-911), T-9 + B-6 gate verdicts, C-2 deploy record, T-8 live security.
**Attempt:** 1 (first gate) · **Phase-2 fast-fix:** skipped (empty queue — 0 blocking findings)

## Verdict
APPROVED

## Rationale

Fresh review of the reviewer output and the primary evidence behind it. Both V-1 APPROVEs are earned, the whole wave arc was handled correctly, every AC is proven on the deployed binary (not just green tests), the load-bearing CSP risk is genuinely disproven, and the BOARD governance + migration trigger survived to the decision log. Detail below against the five judgment points.

### 1. karen + jenny APPROVEs are earned — sufficient depth, no rubber-stamp
The two reviews are at complementary, non-overlapping lanes (karen = truth-of-claims against merged `main` + live deploy; jenny = spec-conformance against deployed behavior), which is the correct V-1 split — neither substitutes for the other, and both independently landed on the live deploy.
- **karen** verified 7 load-bearing claims to file:line AND live: api `getTokenTransferMethod:()=>'header'` (supertokens.config.ts:123, correct v24 SDK shape — the callback, not a non-existent init option), web `tokenTransferMethod:'header'` (supertokens.ts:36), the `csp.ts` builder + throw-on-empty guard, the PR #104 Dockerfile hotfix (web VITE ARGs + api `--filter` scope), the live served CSP meta with all required origins via curl, api `/health` 200 off-stale, `csp.test.ts` 21 real `it()` blocks importing the REAL builder with no `.skip/.only`, and `accessTokenValidity` correctly ABSENT from SDK config (it is a CORE env, applied at C-2). The one nominal discrepancy (test fixture LiveKit host vs prod host) is correctly reasoned as correct-by-design — the builder is parameterized, the test proves threading, the live deploy supplies the real Railway env value.
- **jenny** verified 6 ACs on the deployed binary with the right *kind* of evidence each: header transport = live response headers + `access-control-expose-headers` + NO `Set-Cookie` (unambiguous bearer mode); 900s TTL = decoded live JWT `exp − iat = 900` exactly; refresh/auth path = `GET /me` + `/servers` 200 with bearer, 401 without; CSP = live meta with every origin including the Google-Fonts p4-phase2 correction; AC5 = 0 violations (T-8 cross-check) + own authed-fetch spot checks; AC6 = live `script-src 'self'` with no `unsafe-inline`. Crucially she cross-checked the deployed posture against the recorded BOARD decision (product-decisions L907-911 + line-73 items 6+10) and found NO drift.

Depth is sufficient. Both reached the live binary, both cited concrete evidence, and the nominal discrepancies each surfaced are correctly dispositioned rather than waved off. This is not a rubber stamp.

### 2. Whole wave arc handled correctly — YES, the compensating-controls bundle is genuinely realized
Each stage of the arc did its job and the evidence chains:
- **(a) P-0 → BOARD:** both reframe reviewers correctly ESCALATE'd (header mode is architecturally correct for a cross-SITE SPA on Public-Suffix `up.railway.app`; the real XSS fix is CSP, not a cookie switch that would trade MEDIUM XSS for HIGH auth-reliability risk). BOARD 7/7 Option B, Tier-3 6+/7 strict threshold cleared. The compensating controls were recorded as **ship-blocking BINDING conditions**, not follow-ups — the correct disposition.
- **(b) B-6:** head-builder caught the CSP work early and verified the emitted meta against the real built `dist/index.html`, confirming `script-src 'self'` doesn't break the SPA (only same-origin scripts, zero inline bodies) — the adversarial pre-merge check the BOARD demanded.
- **(c) C-2:** caught a shipped Docker build-arg defect (web CSP missing Tigris/LiveKit origins because the ARGs were never threaded; api image build aborting on the CSP loud-fail guard because it ran the full turbo build). Root-caused and fixed at source via PR #104 (`5cb5e789`), NOT hand-patched — Iron Law respected. The prior HOLD is fully resolved: api off stale wave-83, web CSP now carries all origins.
- **(d) T-8:** live-proved 0 CSP violations + header transport + 900s TTL + every origin reachable on the deployed binary.

The bundle the BOARD mandated (header transport primary path → CSP as the XSS token-exfil compensating control → 900s core TTL shrinking the reuse window → default refresh rotation) is coherent, ship-blocking-treated, and live-verified end to end. Genuinely SHIPPED CORRECTLY. No residual delivery risk.

### 3. Acceptance-by-assertion check — CLEAN, every AC proven on the deployed binary
Not one AC rests on green tests alone:
- AC1 header transport → **live response headers** (st-access/st-refresh-token as headers, no Set-Cookie).
- AC2 900s TTL → **live JWT** exp−iat = 900 (decoded from the deployed binary's token).
- AC3 rotation + refresh → **live authed endpoints** 200-with-bearer / 401-without (SuperTokens default rotation is an SDK-behavior assertion appropriately documented, not codeable — B-6 confirmed no override disables it).
- AC4 CSP complete → **live served meta** with all origins (C-2 + karen curl + jenny curl, three independent fetches agree).
- AC5 (load-bearing) → **T-8 live: 0 CSP violations**, avatars render (Tigris img-src), all 4 Socket.IO namespaces + raw wss handshake, LiveKit wss reached.
- AC6 XSS shrunk → **live script-src 'self'** no unsafe-inline.
This is the acceptance-by-behavior standard V-block exists to enforce. Passed.

### 4. Load-bearing CSP risk — I CONCUR with head-tester; no residual CSP risk that should block
A CSP directive is a per-origin scheme+host allow/deny list; it does not branch on which application code path initiates the request. T-8 exercised each origin the app depends on against the LIVE policy and got a positive network result for every one — including the two `not_click_tested` flows' underlying origins: LiveKit wss reached the server (auth-rejected, NOT CSP-rejected) proves `connect-src` permits the voice origin, and the Tigris avatar/attachment chain 302→200 with naturalWidth>0 proves `img-src` permits the attachment origin. The untested surface is the app's own click-through (application logic this config+header wave did not touch), NOT the CSP allowance (proven). Were the CSP going to block voice or attachments, it would have to reject the LiveKit-wss or Tigris origin — and T-8 shows it rejects neither. That is a sound basis to pass. The residual is application-click coverage, correctly carried, not a CSP-config risk. Concur.

### 5. BOARD governance + config-drift/migration trigger — CONFIRMED PRESENT, not dropped
- BOARD record intact: `process/waves/wave-84/escalations/board-wave-84-session-token-transport.md` shows all 7 seats APPROVE B with per-seat rationale, Tier-3 6+/7 strict cleared, compensating controls recorded as ship-blocking BINDING conditions.
- Decision-log entry present: product-decisions.md L907-911 records the 7/7 Option B decision.
- **Migration trigger recorded (the specific governance check): product-decisions.md line 910** — "Before GA / first real external users, revisit httpOnly-via-custom-domain-or-reverse-proxy" plus the config-drift note (SDK doc assumes a shared parent domain `.studyhall.up.railway.app` NOT deployed). It matches BOARD BINDING condition 4 verbatim in intent. NOT dropped.

## V-2 triage concurrence
0 blocking findings. The PWA icon 404 (pre-existing, ticketed 024a1483) and the `delete-any-message.spec.ts` two-client realtime/auth flake (non-required check, shifting signature across reruns = flake fingerprint, causally unrelated to a Docker/CSP/auth-config change, and T-8 independently proved WS namespaces connect live) are correctly classified as noise/carried, not wave-84 blockers. No fast-fix queue, no B-block re-entry. Agree.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- fast_fix_cycles: 0
- phase2_skipped: true (empty fast-fix queue)
