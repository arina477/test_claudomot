# Wave 47 — V-1 Karen (reality verification of load-bearing source claims)

**Block:** V · **Stage:** V-1 · **Reviewer:** karen (reality/completion lens; jenny owns spec-conformance separately)
**Scope:** Are the wave's LOAD-BEARING SOURCE CLAIMS true in the DEPLOYED + MERGED state?
**Merge SHA:** `4db10675e0537b1d5e95e4b87bd3bb7d1e1660d4` (PR #61 → main; confirmed on `main` + `origin/main`)
**Wave topic:** Make DMs startable — `GET /dm/candidates`, StartDmPicker rewire, DmHome self-id fix.

## VERDICT: APPROVE

Every load-bearing claim is true in source AND deployed state. Code is present at the merge SHA (not just working tree — `git show 4db10675:…` confirmed for all four files; working-tree diff vs SHA is empty). The deployed api serves the new route (401 guarded, not 404). The one antipattern worth flagging (decorative unit tests) is fully mitigated by a real-Postgres T-4 integration pass and a live T-8 security pass; the two genuine coverage gaps are documented Low findings, not hidden. No claimed-but-fake endpoint, no DTO leak, no scope creep.

---

## Findings (each cites claim location + confirming/contradicting evidence)

### F1 — FILE/EXPORT EXISTENCE — CONFIRMED (all six)
- `getDmCandidates` service method: `apps/api/src/dm/dm.service.ts:677` — real two-step co-members query (NOT a stub returning `[]`). Body at lines 677–722.
- `DmCandidate` type/schema mirroring ServerMember: `packages/shared/src/dm.ts:171-176` — `DmCandidateSchema = z.object({ userId, displayName, avatarUrl: z.string().nullable() })`; `avatarUrl` name deliberately follows `ServerMemberSchema` (documented at dm.ts:159-168).
- `/dm/candidates` route registered: `apps/api/src/dm/dm.controller.ts:155-172` (`DmCandidatesController @Controller('dm')`, `@Get('candidates')`); wired in `apps/api/src/dm/dm.module.ts:25` (`controllers: [DmController, DmCandidatesController]`).
- StartDmPicker sources from `/dm/candidates`: `apps/web/src/shell/StartDmPicker.tsx:109` (`api.getDmCandidates()`); client at `apps/web/src/auth/api.ts:749` (`request<DmCandidate[]>('/dm/candidates')`).
- DmHome `currentUserId = profile.userId`: `apps/web/src/shell/DmHome.tsx:30` (`const currentUserId = profile?.userId ?? null`). Confirmed at merge SHA via `git show`.
- `profile.username` gone from IDENTITY path: no `profile.username` in currentUserId. **NOTE:** one surviving `profile.username` at DmHome.tsx:31 is the *display-name* fallback (`currentUserDisplay = profile?.displayName ?? profile?.username ?? 'Me'`), NOT identity. The F7/self-exclusion claim was specifically about `currentUserId`, which is clean. Not a defect.

### F2 — QUERY CORRECTNESS — CONFIRMED (all five), SQL quoted
From `apps/api/src/dm/dm.service.ts:677-722`:
- **(a) scopes to caller's servers:** `inArray(alias.server_id, callerServerIds)` (line ~704), where `callerServerIds` derives from step-1 select of `server_members WHERE user_id = callerId`.
- **(b) excludes self:** `ne(alias.user_id, callerId)` (line ~705).
- **(c) excludes who_can_dm='nobody':** `ne(users.who_can_dm, 'nobody')` (line ~706).
- **(d) dedups:** `.selectDistinctOn([users.id], {...})` (line ~692) — DISTINCT ON users.id across shared servers.
- **(e) auth-guarded, session-derived callerId:** `dm.controller.ts:170` `const callerId = req.session.getUserId()` — NOT a body/param/header. Route carries `@UseGuards(AuthGuard)` (line 167). Not spoofable.

### F3 — DEPLOY HASH MATCH — CONFIRMED (live probes just run)
- C-2 claims api deploy `9502de2a…` / web `bd9dcd2f…`, both SUCCESS with `meta.commitHash == 4db10675…` (C-2-deploy-and-verify.md:44-45).
- Live `GET https://api-production-b93e.up.railway.app/dm/candidates` → **HTTP 401** `{"message":"unauthorised"}` (route mounted + guarded).
- Control: `GET .../dm/nonexistent-xyz` → **HTTP 404** (proves 401 above is a real mounted+guarded route, not a catch-all).
- `GET .../health` → **HTTP 200**.
- Merge SHA on `main` + `origin/main`; all four wave-47 files present at `4db10675…` via `git show`; working-tree diff vs SHA empty.

### F4 — ANTIPATTERN CATALOG
- **Claimed-but-fake:** NONE. `getDmCandidates` is a real query over `server_members ⋈ users`, not a hardcoded/empty return. Live endpoint answers 401 (guarded), not a stub 200.
- **Decorative tests — PARTIALLY PRESENT but MITIGATED (LOW).** The T-2 unit tests in `apps/api/src/dm/dm.service.spec.ts:764-899` mock `mockSelectDistinctOn` to return PRE-FILTERED rows; the WHERE clauses (self-exclude, nobody-exclude, DISTINCT ON) are NOT exercised by the unit layer — the tests' own comments admit this ("filter happens in query — mock verifies contract", spec.ts:803; "mock returns already-deduped rows to simulate what the real query produces", spec.ts:829). **HOWEVER** the actual WHERE clause IS exercised for real in T-4 (`process/waves/wave-47/stages/T-4-integration.md`): live authed probes A↔B against deployed Postgres proved co-member inclusion, self-exclusion, dedup, and DTO-strip all PASS; and T-8 (`T-8-security.md:7,12-15`) live-proved co-members-only (no global directory) + bidirectional + DTO-no-leak. So the WHERE clause is genuinely exercised somewhere real. Not blocking.
- **Deferred-but-UNDOCUMENTED:** NONE. Two real coverage gaps exist — `who_can_dm='nobody'` exclusion not live-proven (no `nobody` co-member fixture in prod), and negative-isolation (non-co-member hidden) not live-proven (only a 2-member proof server) — but both are explicitly logged as Low findings in T-4 and T-8 (T-4-integration.md findings block; T-8-security.md:42,58). Deferred-but-DOCUMENTED. Acceptable.
- **Scope creep vs SCOPE FENCE:** NONE. StartDmPicker's `filteredCandidates` (StartDmPicker.tsx:118-119) is a LOCAL substring filter over the already-fetched bounded candidate list — not a global-directory / typeahead / server-side search endpoint. No `/search`, no global user directory, no serverId leaking back in (StartDmPicker takes no serverId prop anywhere; grep confirms). Within the fence.

### F5 — NO SECRET/DTO LEAK — CONFIRMED
- Service selects `email` + `who_can_dm` internally (needed for display fallback + filter) but the mapper at `dm.service.ts:715-720` emits ONLY `{ userId, displayName, avatarUrl }` — email and who_can_dm are dropped.
- `DmCandidateSchema` (packages/shared/src/dm.ts:171-176) declares only those three fields.
- T-8 live-verified BOTH directions: response carries neither email nor who_can_dm (T-8-security.md:15, `no_dto_leak: PASS`).

---

## Non-blocking observations (already logged downstream; not V-1 defects)
- T-8 rate-limit inconsistency (Low): `/dm/candidates` throttles ~4/burst but `/dm/conversations` does not (T-8-security.md:57). Safe direction; policy review only.
- Unit-layer decorative pattern (see F4): consider one pg-backed unit/integration case asserting the WHERE clause directly so the query claims aren't solely mock-asserted at the unit layer. Nice-to-have; real coverage already exists via T-4/T-8.

**Handoff:** APPROVE → V-2 triage (both open items are Low, already documented). No REWORK required from the reality/completion lens.
