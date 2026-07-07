# V-1 Jenny — wave-70 semantic spec-conformance (DEPLOYED)

**Scope:** StudyHall wave-70 — user-to-user Block. Semantic conformance of DEPLOYED behavior
to the spec CONTRACT intent (task row `bc5986a9`, wave-70-spec: 4 blocks A/B/C/D). NOT
source-claim truth (Karen's remit). Method: live API probes (both prod fixtures) + deployed-web
inspection + source read of the two UI findings.

**Deployed under test:** web `https://web-production-bce1a8.up.railway.app` · api
`https://api-production-b93e.up.railway.app`. Fixtures: A `21984eb2-…-bc586a0be4d2`,
B `da74148e-…-a34c28e7481b`.

---

## VERDICT: APPROVE

The launch-gate safety core — **block + bidirectional DM HIDE** (spec A + spec B) — is deployed
and semantically satisfies the contract in full. All 5 HIDE seams enforce in BOTH directions on
prod. Spec C (UI) has two real, T-block-surfaced defects, but neither breaks the load-bearing
safety intent: a blocked user's DMs/content ARE hidden regardless of the UI polish gaps. Per the
gate rubric ("a MAJOR UI finding that doesn't break the core spec-intent need not be REJECT"),
these are APPROVE-with-findings, not REJECT. Both UI findings are logged for a follow-up bundle.

---

## Spec A — substrate + endpoints + DM HIDE (launch-gate core) — CONFORMS

Live prod API probes (fixture A/B bearer tokens):

| Contract clause | Probe | Result |
|---|---|---|
| POST /blocks self-block → 400 | A blocks A | **400** "Cannot block yourself" ✔ |
| POST /blocks non-existent → 404 | A blocks `0000…0000` | **404** "User … not found" ✔ |
| POST /blocks empty id → 400 Zod | `blockedUserId:""` | **400** Zod min(1) ✔ |
| POST /blocks happy → Block DTO | A blocks B | **201** `{id, blocker_id, blocked_id, created_at}` ✔ |
| Idempotent double-block, single row | A blocks B again | **201**, SAME row id `a33faa1e…` (no dup) ✔ |
| GET /blocks own list only (no IDOR) | GET as A | 1 row; **GET as B → `{blocks:[]}`** (B sees only own) ✔ |
| DELETE /blocks/:id → 204 | A unblocks B | **204** ✔ |
| DELETE idempotent no-op | unblock again | **204** ✔ |
| blocker_id ALWAYS from session (no IDOR) | — | GET/DELETE scoped to caller; B cannot see A's blocks ✔ |

**DM HIDE — all 5 seams, BIDIRECTIONAL (the launch-gate core):**

| Seam | Direction A-blocks-B | A→B probe | B→A probe |
|---|---|---|---|
| (a) createConversation | reject if block either dir | **403** "block relationship exists" | **403** (bidirectional) ✔ |
| (b) sendMessage | reject if block either dir | **403** | **403** ✔ |
| (c) getDmCandidates | exclude either-dir block | `[]` (B excluded) | `[]` (A excluded) ✔ |
| (d) listConversations | hide convo w/ blocked counterpart | count 1 → **0** when blocked | count 1 → **0** ✔ |
| (d) listMessages | hide content | **403** | **403** ✔ |

Reversibility proven: after DELETE, `listConversations` returns to count 1 and the convo is
readable again — spec-C AC3 "client does not error on a now-hidden conversation; degrades
gracefully" holds. Cross-server intent (no server_id on the block; hides DMs everywhere) is
structurally satisfied — the block table is user-scoped and the DM HIDE is server-agnostic.

**Answer to review Q3 (DM HIDE user-facing semantics):** YES — "the blocked user's DMs + content
are hidden" holds bidirectionally at the user-observable layer, not just the code paths T-8 proved.
A blocked pair cannot start, continue, read, or be suggested for a DM in either direction, and an
existing thread vanishes from BOTH inboxes the instant the block lands and returns on unblock.

## Spec B — shared Zod contracts — CONFORMS

`packages/shared/src/blocks.ts` exports CreateBlockSchema, BlockSchema, BlockListResponseSchema +
inferred types. Deployed DTO matches the schema EXACTLY (`{id, blocker_id, blocked_id, created_at}`,
ISO string timestamp).

- **Prose-vs-precedent note (NOT a defect):** the spec-B AC prose says "camelCase DTO convention,"
  but the actual repo precedent it names — `ReportSchema` in `reports.ts` — is snake_case, and
  `blocks.ts` deliberately mirrors it (self-documented at `blocks.ts:14-19`). The implementation is
  internally consistent with the real codebase convention; the AC prose is inaccurate about its own
  precedent. Deployed DTO conforms to the actual shared contract. No code change warranted.

## Spec C — Block UI + blocked-users settings list — CONFORMS-WITH-FINDINGS (2 defects, non-blocking)

### FINDING-1 — member-row Block affordance never reflects state — **spec-drift** (MEDIUM)
`apps/web/src/shell/MemberListPanel.tsx:546-566`: the member-row affordance is a hardcoded
"Block" button — `aria-label={`Block ${displayName}`}`, always `ProhibitIcon`, always calls
`onBlock`. No `isBlocked` lookup, no Block↔Unblock toggle. Spec-C AC1 says the affordance
"calls POST /blocks **and reflects blocked state**." It does not reflect state — it is block-only.

- **Assessment (review Q1):** this IS real spec-drift, not a spec-gap. The spec explicitly specced a
  state-reflecting affordance; the code shipped a one-directional one. **BUT** it does not break the
  safety intent: the block still lands (POST works), and the user has a working reverse path via the
  /settings/privacy blocked-users list (verified live below). Re-blocking an already-blocked user is
  idempotent (proven: same row id, no error), so the drift is cosmetic/UX, not a data or safety bug.
  Severity MEDIUM — degrades discoverability of unblock from the member row, does not endanger launch.

### FINDING-2 — blocked-users list shows raw UUID, not name/avatar — **spec-gap** (MEDIUM)
`BlockedUsersPanel.tsx:265` maps `displayName: b.blocked_id` — the panel renders the blocked user's
UUID as the display name (blank username, null avatar) because GET /blocks returns only
`{id, blocker_id, blocked_id, created_at}` with no profile fields. Self-documented at
`BlockedUsersPanel.tsx:232-235` ("use blocked_id as the display name fallback until a richer
endpoint is available"). **Confirmed on the DEPLOYED site** at /settings/privacy: the row renders
`DA` (initials from "da…") · `da74148e-132e-4faf-a526-a34c28e7481b` · `Unblock`.

- **Assessment (review Q2):** this is a **spec-gap**, not code-drift. Spec-C AC2 says "each row shows
  the blocked user" and the D-3 design canonical calls for avatar+name+@username — but the GET /blocks
  API contract (spec A) was never specced to return profile fields, so the client is structurally
  unable to render a name. The gap is at the contract seam between spec A (endpoint) and spec C (UI
  intent). Root fix is a richer GET /blocks (join profile) or a client-side profile hydrate.
  Severity MEDIUM — the list is functional (correct rows, working inline Unblock verified live), but
  fails the design intent: a user cannot recognize whom they blocked by a UUID. Not a safety breach.

### Spec-C parts that DO conform
- Own-row suppression: Block affordance guarded `{!isSelf && …}` (`MemberListPanel.tsx:547`) — no
  self-block affordance, aligns spec D. Confirmed via source; own-row cannot block.
- Blocked-users settings section: present at /settings/privacy, loading skeleton / list / empty
  states all implemented; empty copy "You haven't blocked anyone" ✔. Inline Unblock button present
  and wired (DELETE /blocks/:id, optimistic remove + restore-on-fail + toast).
- Graceful degrade: proven — hidden convo does not error; reappears on unblock.

## Spec D — own-row Report suppression — CONFORMS
`MemberListPanel.tsx:439` `isSelf = Boolean(selfUserId && member.userId === selfUserId)`; Report
FlagIcon guarded `{!isSelf && …}` (:524-525); `selfUserId` threaded from parent (:854). Report
suppressed on own row, rendered on others. Fail-safe when `selfUserId` unresolved: `isSelf=false`
→ Report renders on all rows (incl. own) until identity known — the spec edge-case permits either
this or the stricter "render on non-self only"; the shipped choice is within the allowed set.

---

## Review Q4 — NEW semantic divergences T-block may have missed

- **Group-DM block semantics — spec-anticipated gap, NOT a new defect.** `dm.service.ts:253` carries
  the P-4 "spec-gap 5a" note: createConversation checks all participants pairwise (blocking any
  listed participant → 403), and listConversations excludes a group convo if ANY other participant is
  in a block relation (`:488, :535`). The one documented limitation — a block placed AFTER a group DM
  already exists does not retroactively tear down the existing group DM for the OTHER members — was
  anticipated at spec time and fenced. For the 1:1 case (the launch-critical path) HIDE is complete.
  Could not exercise a live 3-person group DM (only 2 prod fixtures exist), but the source logic hides
  a group convo from the caller whenever it contains a blocked participant, so the caller-facing intent
  holds. **Flag for follow-up:** retroactive group-DM block behavior is untested against 3 live users.
- **Pending DM invite:** createConversation is the invite mechanism (no separate accept step in this
  model), and it is 403-guarded bidirectionally while blocked — so "blocking someone you have a
  pending DM invite with" resolves sensibly (the invite path is closed both ways). No divergence.
- No other new semantic divergence surfaced.

---

## Cleanup (prod-clean) — DONE

Blocks created during this review: A→B (row `a33faa1e-c8a0-4022-820f-0ed18f2e1c8f`), created and
removed twice during seam testing. **Final state: DELETED — GET /blocks as A → `{blocks:[]}`; B was
never a blocker.** Prod block table clean. NOTE: a pre-existing A↔B conversation `5f62052f-…` (created
2026-07-04, predates this review) was left as-is — not created by me.

## Findings summary

| # | Spec | Kind | Severity | Blocks launch? |
|---|---|---|---|---|
| FINDING-1 | C-AC1 | spec-drift | MEDIUM | No — reverse path exists via settings; block still lands |
| FINDING-2 | C-AC2 / A GET-contract | spec-gap | MEDIUM | No — list functional; only display name is a UUID |
| (group-DM retro) | A HIDE | spec-anticipated gap | LOW | No — fenced at P-4; 1:1 path complete |

**Load-bearing intent (block + bidirectional HIDE) = SHIPPED and CONFORMS. VERDICT: APPROVE.**
