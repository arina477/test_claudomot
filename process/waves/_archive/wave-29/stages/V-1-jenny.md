# Wave 29 — V-1 Jenny (semantic-spec verification)

**Verdict: APPROVE**

Scope: behavior-preserving code-debt cleanup (wave-14 KI-2/KI-3). Two `??`→`||` displayName-fallback fixes + deletion of a dead schema wrapper. Bar per V-1 charter: does the empty-edge fix match spec intent AND do the happy paths NOT regress. Both met.

Spec source of truth: `tasks` row `d23a0740-0326-4748-a158-62e69ea733e7` (YAML head, 5 ACs). Merge commit `fd03d27` verified as ancestor of `main` HEAD; deployed api `/health`→200 (`studyhall-api` 0.0.1). displayName fix is on an authenticated read path (impractical to construct a live empty-local-part member), so AC1 empty-string behavior is verified via the diff logic-trace + the mutation-genuine T-2/T-4 coverage (5 guard tests executed nonzero on fd03d27, would fail under old `??`). T-block claims verified against spec intent below — not taken on trust.

## AC-by-AC evidence

**AC1 — empty local-part / stored-empty display_name → userId, never '' (both sites).** MATCH.
- `presence.gateway.ts` (fd03d27): `userRow?.display_name || userRow?.email?.split('@')[0] || userId`.
- `servers.service.ts` (fd03d27): `r.displayName || r.email.split('@')[0] || r.userId`.
- Logic trace (`||` short-circuits on first *truthy*, so falsy `''` falls through — unlike `??` which only catches null/undefined):
  - `display_name=null, email='@example.com'` → `null || '' || userId` → **userId** (both falsy, final fallback wins).
  - `display_name='', email='@example.com'` → `'' || '' || userId` → **userId**.
  - `display_name='', email='alice@…'` → `'' || 'alice' || userId` → **'alice'** (stored-empty display_name guarded).
  - Under OLD `??`: `null ?? '' ?? userId` → `''` — the exact defect the AC targets. Fix is semantically genuine, never yields `''`.
- Diff (`b35ebe0..fd03d27`) confirms exactly the MIDDLE `??` replaced at both sites (trailing `|| userId` is the intended final fallback). No collateral edits.
- T-2 coverage cross-checked: `email:'@example.com'+display_name:null → .toBe('user-ghost') AND .not.toBe('')` and `display_name:'' → .toBe('alice')` at servers.service; `handleConnection` real-state `socket.data.displayName .toBe(USER_ID)` at presence.gateway. All assert user-observable outputs (not mock-call counts) and are mutation-genuine (fail under `??`). T-block claims align with spec intent — verified, not trusted.

**AC2 — normal email, no display_name → local-part (happy path unchanged).** MATCH. `'' `/null display_name + `'bob@studyhall.app'` → `null || 'bob' || userId` → **'bob'**. `||` and `??` are behaviorally identical here (local-part non-empty is truthy AND non-null). No regression. T-2 `bob@studyhall.app + null → .toBe('bob')` confirms.

**AC3 — non-null display_name → that value (happy path unchanged).** MATCH. `'Carol Jones' || … ` → **'Carol Jones'** (first operand truthy, short-circuits). Identical outcome under old `??`. No regression. T-2 `'Carol Jones' → .toBe('Carol Jones')` confirms. Note: for a hypothetical *non-empty-but-falsy* display_name there is none — display_name is a string; only `''` differs between `??`/`||`, and `''`→fall-through is the *intended* AC1 behavior, not a regression.

**AC4 — dead schema deleted, typecheck green, zero consumers.** MATCH. `git grep ServerMembersResponse` at fd03d27 across `apps/ packages/` (excluding dist) → **NO MATCHES**. Diff shows `ServerMembersResponseSchema` (`z.object({members: z.array(...)})`) + `ServerMembersResponse` type + BOTH barrel re-exports (value-export list :23 and type-export list :33) cleanly removed. Post-state barrel `grep -c ServerMembersResponse` = 0. `ServerMemberSchema`/`ServerMember` (the live symbols) retained and still exported. Deletion is behavior-neutral dead code; no consumer relied on it.

**AC5 — GET /servers/:id/members wire unchanged (bare ServerMember[]).** MATCH. `servers.controller.ts` `listServerMembers(...): Promise<ServerMember[]>` returns `this.serversService.listServerMembers(...)` — bare array, both pre- and post-merge. The deleted `{members:[...]}` wrapper never matched the wire (bare array both ends) and had no consumer, so its removal cannot touch the response shape. No new/changed endpoint.

## Spec-gap detection
None. The spec anticipated exactly the two firing conditions (empty email local-part; stored-empty display_name) and the align→delete reframe for the dead wrapper. No intent surfaced that the spec failed to cover. The edge-cases block even pre-declared the `'@example.com'` and empty/malformed-email cases now covered by tests.

## Journey-map (T-9 annotation-only stance)
Correct. No user-visible surface, route, or wire changed: happy paths (AC2/AC3) produce identical output; the only behavior delta (AC1) replaces a rendered empty string with the userId on a malformed-email edge — a strictly-better display fallback, not a new/removed screen or endpoint. AC5 confirms the members wire is untouched. Annotation-only is the right call; nothing silently dropped.

## Blocking vs cosmetic
- Blocking (semantic incorrectness): **NONE**.
- Cosmetic / notes: none material. The `.not.toBe('')` assertion pattern in T-2 is a strong tell that makes the `||`-vs-`??` distinction load-bearing in-test — noted, not a defect.

**Classification: neither spec-DRIFT nor spec-GAP.** Deployed behavior matches spec intent at all 5 ACs. APPROVE.
