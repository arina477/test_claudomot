# Wave 47 — T-block findings aggregate

Canonical V-2 input. Append-only as the T-block runs. Each entry: severity · layer · location · description · evidence.

_No entries yet._

## T-2 Unit
- **[info]** T-2 · `apps/api/src/dm/dm.service.spec.ts` getDmCandidates suite · Self/nobody/dedup exclusions proven only by mocks returning pre-filtered rows; actual WHERE clause (`ne user_id`, `ne who_can_dm`, `DISTINCT ON`) not exercised at unit layer. Deferred to T-4 (real Postgres) + T-8 (live privacy fence). Correct layering; tracked so downstream layers MUST close it.

## T-1 Static
- **[info]** T-1 · `apps/api/src/dm/dm.service.spec.ts:135` · `as any` on mock EventEmitter (biome-ignored, test-only). Zero bypasses in production code.

## T-3 Contract — no findings (401 unauth + 200 schema-exact PASS)
## T-4 Integration
- **[low]** T-4 · getDmCandidates who_can_dm filter · nobody-exclusion not live-proven (no nobody co-member fixture in prod). Correct by inspection + unit mock.
- **[low]** T-4 · getDmCandidates server-scope · negative-isolation (non-co-member hidden) not live-proven (2-member proof server; no disjoint 3rd user). Correct by construction.
## T-5 E2E (HEADLINE)
- **HEADLINE PASS:** DMs STARTABLE end-to-end through the real picker UI (A: login→DM home→open picker→picker LISTS co-member B→select→Open DM→thread opens→message sends with correct author). wave-46 unstartable dead-end GONE. F7 "Unknown user" ABSENT. Search filter + "No people match" empty state PASS. Esc-close PASS. 2 runs, no flake.
- **[low]** T-5 · message polling · 429 rate-limit on GET messages polling under concurrent load; read-path only, send/create POSTs 200. Poll cadence/backoff review.
- **[info]** T-5 · session refresh · background 401 on /auth/session/refresh; session stayed valid. Cosmetic.
## T-6 Layout — no findings (picker chrome byte-identical to wave-46; render-confirmed dark @1280)
## T-7 Perf (SKIPPED — not heavy)
- **[info]** T-7 · getDmCandidates · no LIMIT/pagination; fine at MVP scale, flag for future large-server scaling wave.
## T-8 Security (candidate privacy fence)
- **HEADLINE PASS:** privacy fence holds — co-members only, self excluded, bidirectional, NO email/who_can_dm DTO leak, unauth→401, IDOR callerId-spoof (query/param/header) all ignored (session-derived), secret-grep clean, rate-limited.
- **[low]** T-8 · rate_limit · throttle inconsistency (/dm/candidates throttled ~4/burst, /dm/conversations not). Safe direction; review policy; root of T-5 poll 429s.
- **[low]** T-8 · privacy_coverage · who_can_dm='nobody' + negative-isolation not live-proven (fixture gap). Correct by code.
