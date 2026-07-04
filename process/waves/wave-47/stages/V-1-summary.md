# Wave 47 — V-1 review summary (orchestrator)

**Block:** V (Verify) · **Stage:** V-1 · **Wave topic:** M8 DM entry-point completion — DMs STARTABLE via UI.

Karen (source-claim) and jenny (semantic-spec) ran in parallel, no shared context. Both authored their own reports; both APPROVE.

## Karen — source-claim verification → APPROVE
Full report: `stages/V-1-karen.md`.
- **F1 File/export existence (6/6):** `getDmCandidates` real query `apps/api/src/dm/dm.service.ts:677` (not a `[]` stub); `DmCandidateSchema` `packages/shared/src/dm.ts:171-176` mirrors ServerMember; route `dm.controller.ts:155-172` + `dm.module.ts:25`; StartDmPicker sources `/dm/candidates` (`StartDmPicker.tsx:109`, client `api.ts:749`); `DmHome.tsx:30` `currentUserId = profile?.userId`. Nuance: `profile.username` survives at `DmHome.tsx:31` but as display-name fallback, NOT identity — not a defect.
- **F2 Query correctness (5/5, SQL quoted):** server-scope `inArray`; self-exclude `ne(alias.user_id, callerId)`; nobody-exclude `ne(users.who_can_dm,'nobody')`; dedup `selectDistinctOn([users.id])`; session-derived callerId `req.session.getUserId()` (controller:170) — not spoofable.
- **F3 Deploy hash match:** live curl `/dm/candidates`→401 (guarded), bogus route→404 (control), `/health`→200; SHA `4db10675…` on main+origin/main; working-tree diff empty.
- **F4 Antipatterns:** no fake endpoint; decorative unit tests PRESENT-but-MITIGATED (T-2 mocks pre-filtered rows, comments admit it, but T-4 real-Postgres + T-8 live prove the fence); deferred work DOCUMENTED (not hidden); no scope creep (client `filteredCandidates` is a local substring filter, not a directory/typeahead).
- **F5 No DTO leak:** mapper `dm.service.ts:715-720` emits only `{userId, displayName, avatarUrl}`; T-8 live-verified no email/who_can_dm leak.
- 2 non-blocking Lows (rate-limit policy inconsistency; unit-layer WHERE-clause not directly asserted) already logged downstream.

## jenny — semantic-spec verification → APPROVE
Full report: `stages/V-1-jenny.md`.
- **HEADLINE — DMs startable via UI: CONFIRMED.** Live Playwright click-path as User A: DM rail → Start Direct Message → picker LISTS co-member B → select → Open DM → thread opens → send → own message renders `studyhallfixturea` (NOT "Unknown user"), persisted server-side once. Cures wave-46 F-A CRITICAL.
- Picker populated by `GET /dm/candidates→200` returning exactly co-member B; **no `/servers/:id/members` call fired**. Send: single `POST …/messages→200`, `authorId` = A's true opaque users.id.
- Scope fence intact (co-members only, no directory/typeahead). Self-exclusion live-confirmed. F7 cured (id-space fix). who_can_dm='nobody' excluded; everyone+server-members pass. Empty-state copy "No one to message yet…" present in deployed bundle; old dead-end absent. Client name filter + "No people match" confirmed live. Find-or-create opens existing thread (no dup). Journey continuity clean, 0 console errors.
- **Spec drift vs gap:** NONE. No divergence for either task 10967558 or 379978a4.
- Screenshots: `apps/web/wave47-picker-lists-candidate-B.png`, `apps/web/wave47-F7-own-message-shows-displayname.png`.

## Orchestrator probe of clean verdicts
Non-trivial change; both APPROVEs are evidence-backed, not rubber-stamps — Karen quoted actual WHERE clauses + line numbers and nuanced the surviving `profile.username`; jenny drove a live click-path with network capture + persisted-message check + screenshots. "Reviewer found nothing" probe satisfied. No re-spawn needed.

```yaml
karen_verdict: APPROVE
karen_findings_count: 5          # F1-F5 all CONFIRMED; 2 non-blocking Lows already logged
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 9          # F1-F9 all PASS
spec_drift_count: 0
spec_gap_count: 0
jenny_false_positives_documented: 0
findings:                        # raw, V-2 classifies (carried from T-block + V-1)
  - {source: T-8, sev: low, tag: rate_limit, desc: "throttle inconsistency /dm/candidates throttled ~4/burst vs /dm/conversations not; safe direction; possible root of T-5 poll 429s"}
  - {source: T-5, sev: low, tag: rate_limit, desc: "429 on GET messages polling under concurrent load; read-path only; POSTs 200; poll cadence/backoff review"}
  - {source: T-4/T-8, sev: low, tag: test-coverage, desc: "who_can_dm='nobody' + negative-isolation not live-proven (2-member proof-server fixture gap); fence proven ACTIVE by positive results — counter-example controls missing"}
  - {source: T-7, sev: info, tag: scale, desc: "getDmCandidates no LIMIT/pagination; fine at MVP scale; flag for future large-server wave"}
  - {source: T-5, sev: info, tag: cosmetic, desc: "background 401 on /auth/session/refresh; session stayed valid; cosmetic"}
  - {source: T-2, sev: info, tag: test-coverage, desc: "getDmCandidates exclusions proven only by mocks at unit layer; closed downstream by T-4/T-8"}
  - {source: T-1, sev: info, tag: lint, desc: "'as any' on mock EventEmitter (biome-ignored, test-only); zero production bypasses"}
```
