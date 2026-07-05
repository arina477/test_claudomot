# Wave 51 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-51/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The crux — the DM canonical 3-panel fix — is genuinely verified live, not asserted by vibes: T-5-tester-1 measured the `dm-thread` bounding-box at **632px @1024 / 888px @1280** across 2 identical runs each on LIVE prod (web-production-bce1a8, merge 01399a5), with the `channel-sidebar` DOM node confirmed **absent** on the DM surface and **present at 260px** in server view (S1/S2/S3). This resolves the wave-46 F9 cramped-~372px wrap defect with named DOM nodes and real numbers. The B-6 mobile-backdrop-strand fix is equally convincing (S4, 390×800): the `fixed inset-0 z-40 rgba(0,0,0,0.5)` scrim and the drawer are both present when the drawer is open and BOTH removed after switching to the DM surface — corroborated by a genuine unit regression test that would fail if the `!dmHomeActive` guard or the new `setSidebarOpen(false)` reset were deleted (mutation-sane). The 5 AppShell tests (4 ChannelSidebar-gating + 1 backdrop) assert user-observable DOM presence/absence and `role="main"`, not mock call counts; T-1/T-2 lean legitimately on CI, which ran on the #65 merge. **T-3/T-4/T-7/T-8 skips are all defensible**: the wave diff is a single client component (AppShell.tsx) plus tests — no Zod/contract, no schema/migration/service, no endpoint/session/auth/state surface — so contract, integration, perf (single conditional render), and security layers have no target. **F-1 is genuinely pre-existing, NOT a regression of this wave** (verified against source below); it is correctly classified non-blocking and routed to V-2. Suite is honest: it proved the fix and surfaced the adjacent defect without silencing it. No coverage theater, no single-client realtime concern (no realtime in this wave), no flaky-retry masking.

## F-1 provenance judgment (wave-introduced vs pre-existing) — VERIFIED PRE-EXISTING

I read the source, not just the finding prose. Conclusion: **F-1 is pre-existing / adjacent, not wave-introduced.**

- **Symptom:** on the DM surface (`dmHomeActive=true`), clicking a ServerRail server icon (or Home) intermittently/deterministically stays on DM; a 2nd click is needed. Server→DM works every time; only DM→server (the return path) is affected.
- **Root cause (from source):** `ServerRail.tsx` server-icon `onClick` is `() => selectServer(s.id)` and the Home button has no click handler wiring at all — **neither clears `dmHomeActive`**. `AppShell.tsx` line 118 renders `dmHomeActive ? <DmHome/> : <MainColumn/>`, so selecting a server while `dmHomeActive=true` fires `selectServer` but the surface stays `<DmHome/>`. The only wiring that exits DM is the DM-button toggle `onDmHome` — hence the "needs a 2nd click via the DM toggle" recovery.
- **Provenance proof:** the pre-wave parent `01399a5^` renders `dmHomeActive ? <DmHome/> : <MainColumn/>` **identically** (lines 109-112) and its only DM-exit wiring was `onDmHome={() => setDmHomeActive((v)=>!v)}`. The merge's `--stat` touched only `AppShell.tsx` + `AppShell.test.tsx`; **ServerRail.tsx and ServerContext were NOT modified**. The wave's change to `onDmHome` (`setDmHomeActive(v=>!v); setSidebarOpen(false)`) is on the DM-button path, not the server-select/Home return path — it cannot have introduced the return-path race. The missing "clear dmHomeActive on server-select" wiring predates this wave.
- **Therefore:** F-1 is real (a genuine double-click UX papercut, deterministic on desktop) but structurally pre-dates wave-51 and is orthogonal to the ChannelSidebar-gating change under test. V-2 deferral is correct; no T-block REWORK is warranted. Recommend V-2 name the fix target as the ServerRail server-select + Home handlers (`selectServer` / Home onClick should also `setDmHomeActive(false)`).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
