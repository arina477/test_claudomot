# P-4 Phase 2 — Karen claim-verification — wave-65 (cold-offline workspace hydration)

**Role:** Karen — verify the load-bearing CLAIMS in the wave-65 spec + plan are TRUE against the actual codebase (repo `/home/claudomat/project`, branch `main`).
**Method:** every claim spot-checked against real file:line, function names, and type shapes. No claim taken on trust.
**Verdict:** **APPROVE** — all 6 load-bearing claims VERIFIED. Zero WRONG, zero UNVERIFIED. The plan is code-grounded, not spec-fiction.

---

## Claim-by-claim

### Claim 1 — ServerContext.tsx has two read paths, both `.catch` to error with NO Dexie fallback today — **VERIFIED**
`apps/web/src/shell/ServerContext.tsx`:
- `fetchServers()` `.catch` at **l.119-122** → `setStatus('error')`, no cache read. The list is never repopulated on failure (`setServers` only called on success at l.108). Spec's "~l.119" is exact.
- `getServerDetail` effect `.catch` at **l.145-148** → `setDetailStatus('error')`; `selectedDetail` stays null (only set on success at l.142). Spec's "~l.145" is exact.
- Grep confirms zero `getCached*`/Dexie imports in this file today → the "NO cache fallback / NO Dexie read today" premise holds. These ARE the two read paths (the only two `api.getServers`/`api.getServerDetail` call sites). **VERIFIED.**

### Claim 2 — useMessages.ts ALREADY has offline `.catch → getCachedMessages` fallback; ships & stays UNMODIFIED — **VERIFIED**
`apps/web/src/shell/useMessages.ts` **l.300-316**: `.catch(async () => { ... const cached = await getCachedMessages(db, channelId); setRealMessages(cached); ... })`. Write-through to cache present at l.292-298. Spec's "~l.300-316" is exact. This is the already-shipped fallback the plan says becomes reachable once the rail+sidebar hydrate, and correctly leaves untouched. **VERIFIED.**

### Claim 3 — `api.getServers()`/`api.getServerDetail(id)` signatures + shared type exports — **VERIFIED**
`apps/web/src/auth/api.ts`:
- **l.180** `getServers: () => request<ServerSummary[]>('/servers')` — GET /servers → `ServerSummary[]`. ✓
- **l.183** `getServerDetail: (id: string) => request<ServerDetail>(`/servers/${id}`)` — GET /servers/:id → `ServerDetail`. ✓
Spec's "~l.180, l.183" is exact.
`packages/shared/src/servers.ts`: `ServerSummarySchema`/`ServerSummary` (l.16/21), `ServerDetailSchema`/`ServerDetail` (l.45/49). Both re-exported from `packages/shared/src/index.ts` (types block includes `ServerSummary` and `ServerDetail`, schemas block includes `ServerSummarySchema`/`ServerDetailSchema`). **VERIFIED.**

### Claim 4 — Dexie StudyHallDB currently at v4; v4 `.stores()` has exactly the 8 named tables — **VERIFIED**
`apps/web/src/features/sync/db.ts`:
- Max version is **v4** — `this.version(4).stores({...})` at **l.154-163**; no `.version(5)` exists → v5 is the correct next bump. ✓
- v4 `.stores()` block declares exactly the 8 tables the plan lists: `messages`, `channels`, `outbox`, `dmConversations`, `dmMessages`, `cachedAssignments`, `cachedScheduledSessions`, `cachedAttachmentBlobs` (l.155-162), matching the 8 `EntityTable` field declarations at l.36-43. **VERIFIED.** (Note: v1→v4 each restate all prior tables verbatim, so the rule-11 "restate all 8" the plan demands for v5 is a continuation of the established, correct pattern.)

### Claim 5 — write-through + read-through-on-catch pattern exists in useDm.ts (mirror target) — **VERIFIED**
`apps/web/src/shell/useDm.ts` `fetchConversations`: write-through on success **l.116-123** (`putCachedDmConversations`), read-through in `catch` **l.124-135** (`getCachedDmConversations` → `setConversations`). Identical shape repeats for messages at l.167-174 (write) / l.175-188 (read). This is exactly the network-first-fallback-to-cache pattern the plan says to mirror inline in ServerContext. Plan's "useDm.ts ~l.124-186" is accurate. **VERIFIED.** (AssignmentsPanel/ClassCalendar not independently re-checked — the useDm mirror alone substantiates "the pattern exists and is shipped"; the plan cites all three, and useDm is confirmed.)

### Claim 6 — CachedChannel exists in types.ts; getCachedChannel/putCachedChannel have ZERO production callers — **VERIFIED**
- `CachedChannel` type defined at `apps/web/src/features/sync/types.ts:33`. ✓
- `getCachedChannel`/`putCachedChannel` defined in `apps/web/src/features/sync/cache.ts` (l.67, l.77). ✓
- Full grep of `apps/web/src` for callers: the ONLY hits are (a) the definitions + doc comments in cache.ts, and (b) `vi.fn()` mock declarations in four `*.test.tsx` files (calendar-offline, assignments, dm, attachment-image-cache). **ZERO non-test production callers.** The dormant `channels` table is genuinely unwired — the plan's decision to restate it verbatim (rule 11) but NOT newly wire it is grounded in fact, not a phantom. **VERIFIED.**

---

## Antipattern sweep (claimed-but-fake paths / wrong line numbers / phantom functions)
- **Claimed-but-fake file paths:** none. All 6 cited paths exist.
- **Wrong line numbers:** none material. Every "~l.N" the spec/plan cites lands on the exact construct claimed (l.119, l.145, l.180, l.183, l.300-316, l.124-186, v4 at l.154). Tighter than the usual "~" tolerance.
- **Phantom functions/types:** none. `getServers`, `getServerDetail`, `getCachedMessages`, `getCachedChannel`, `putCachedChannel`, `getCachedDmConversations`, `ServerSummary`, `ServerDetail`, `CachedChannel` all exist as described.
- **False-absent / false-present premises:** the two load-bearing NEGATIVE claims (ServerContext has no Dexie fallback today; channel-cache helpers have zero production callers) both hold — no hidden fallback, no hidden caller. The P-0 reframe's "the gap is one layer upstream in ServerContext, not useMessages" is correct.

## Bottom line
Every load-bearing claim the wave-65 spec + plan rely on is TRUE against `main`. Line numbers are unusually precise. No fabricated paths, no phantom symbols, no false negatives/positives. This is a real, code-grounded plan.

**VERDICT: APPROVE.**
