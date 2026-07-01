# P-4 Karen — Wave-26 load-bearing-claim reality check

**Role:** karen at P-4 Phase 2. Verify the load-bearing claims in the wave-26 spec + plan are TRUE in the codebase before any code is written.
**Method:** grep / Read / DB query, evidence-cited per claim. No claim taken on the plan's word.

**Overall verdict: APPROVE.** All 7 load-bearing claims VERIFIED. Both antipattern checks (under-floor override-ship precedent, DM/hover sibling split) VERIFIED-legit. Two cosmetic path/line offsets noted (non-blocking) — no claimed-but-fake premise found. The frame rests on real code: `PresenceDot` genuinely does not exist yet, the member-panel dot really is inline hard-coded hexes, the presence socket really is a module singleton, and `authorId` really is a userId — so AC2 (extract-then-share), AC3-degrade, and AC4 (single socket) are all grounded, not fabricated.

---

## Per-claim verdicts

### Claim 1 — No `PresenceDot` component exists yet → **VERIFIED**
`grep -rn "PresenceDot" apps/web/src` returns **zero matches** (grep exit 1). The plan CREATES it (PresenceDot.tsx step #1); no duplicate/pre-existing component. The whole "extract first" REFRAME is warranted, not busywork.

### Claim 2 — Member-panel dot is inline hard-coded hexes, not a shared component/token → **VERIFIED**
`apps/web/src/shell/MemberListPanel.tsx:92-101` — inline `<div>` presence dot with literal hexes:
- `:94` `backgroundColor: '#121214'` (ring/backing)
- `:99` `backgroundColor: online ? '#10b981' : '#52525b'` (the dot itself)

No shared component, no CSS-var token — raw hex literals exactly as claimed. (Cited `~:91-101`; actual dot block is :92-101, the `:91` line is the `{/* Presence dot */}` comment. Within tolerance.)

### Claim 3 — `--color-accent-emerald` token exists → **VERIFIED** (path corrected)
Token exists: `--color-accent-emerald: #10b981;` — but at **`apps/web/src/styles/globals.css:18`**, NOT `apps/web/src/globals.css:18` as the prompt/plan cited. **Line number :18 is exact; the directory is off by one segment (`styles/`).** The token is real and its value (`#10b981`) matches the member-panel online hex (:99), confirming the plan's "bind PresenceDot to the token, replacing the literal" is a faithful de-duplication, not a color change. Path typo is cosmetic — flag for the B-3 executor so it edits the right file.

### Claim 4 — Presence socket is a module-level singleton; usePresence/getPresenceStatus are pure consumers → **VERIFIED**
`apps/web/src/shell/presenceSocket.ts`:
- `:84` `let _socket: Socket | null = null;` (module-level singleton var — exact)
- `:94` `export function getPresenceSocket(): Socket {` with `:95` `if (!_socket) {` (guarded lazy-init — exact)
- `:148` `export function getPresenceStatus(userId: string): PresenceStatus` — pure store read
- `usePresence.ts:16` imports `getPresenceStatus, subscribePresence`; `:41` `return getPresenceStatus(userId)` — pure consumer, no socket creation.

AC4 ("exactly one presence socket at runtime") is architecturally supported: authors dots reuse the same singleton via getPresenceStatus, opening no new connection. (Claim cited `:84/:94`; both exact. `:95` for the `if (!_socket)` guard confirmed.)

### Claim 5 — MessageList author-avatar render sites exist → **VERIFIED**
`apps/web/src/shell/MessageList.tsx` — three avatar render sites, all `rounded-full` avatar `<div>`s where a dot can attach:
- **:1013-1020** main author avatar (`{/* Avatar */}` at :1013; `h-10 w-10 ... rounded-full` at :1015; `{abbr}` initials at :1019)
- **:1226-1228** dimmed-variant avatar (`{/* Avatar — dimmed */}`)
- **:1316-1318** third variant avatar

All present as claimed. The `relative` wrapper needed for absolute-positioned dot placement is the executor's concern, not a frame falsification.

### Claim 6 — authorId is a userId (same identity space as presence store) → **VERIFIED**
- Client: `MessageList.tsx:959` `const isOwn = !!currentUserId && msg.authorId === currentUserId;` — authorId compared directly to the userId. Exact.
- Server: `apps/api/src/messaging/messages.controller.ts:84` and `:311` — `const authorId = req.session.getUserId();` (both send + edit paths). Security invariant reinforced at `messages.service.ts:427` and controller comments :61/:266/:310 ("author_id ALWAYS from session — never from body").

authorId shares the presence store's userId key space → "unknown → no dot" (AC3) is a genuine EDGE case (non-co-member author), not the common case. De-risks AC2's degrade path exactly as P-0 claimed.

### Claim 7 — `react-specialist` is in `command-center/AGENTS.md` → **VERIFIED**
`command-center/AGENTS.md:82` — `| \`react-specialist\` | React 19 + Vite SPA components, hooks, state, performance | B-3 frontend | _(pre-built — VoltAgent)_`. The routing target exists; fallback `frontend-developer` also present (:71/:87).

---

## Antipattern scan

### Under-floor override-ship precedent-application — **LEGIT (not fabricated)**
The 5th-consecutive-precedent chain in `P-1-decompose.md:20/35` cites w16/w23/w24/w25. Verified against the append-only `command-center/product/product-decisions.md`:
- `:300-303` — wave-23 floor-merge BOARD 6/7 (real).
- `:306-309` — wave-24 floor-merge BOARD 6/7, with the carry "roadmap-planning/L-2 floor-rubric revision" (real).
- `:313-314` — wave-25 precedent-application citing the wave-24 **explicit "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead"** instruction (real, quoted accurately).
- `:319-322` — wave-26 override-ship entry logged with the same chain + `floor_merge_attempt=0` rationale (decomposition known-futile: M5's sole unbuilt scope is the Resend-cred-blocked reminders arc; only same-concern sibling was just deferred at P-0).

The precedent is a real standing ruling applied, not an invented dodge. The Resend-key M5 blocker is consistently surfaced (not buried). Legit.

### DM/hover split — sibling fdb444fc really created → **LEGIT (real DB row)**
DB query confirms:
```
fdb444fc-370d-475e-82f5-2513bed650e7 | "Extend presence dots to DM / member-mention / hove..."
  parent_task_id = 10b9d18e-... | milestone_id = a5232e16 (M5) | wave_id = NULL | status = todo
```
Parented to the primary (10b9d18e), same milestone, wave_id NULL — exactly the mvp-thinner THIN split P-0 described. The deferred scope is genuinely carved off to a real backlog row, not vaporware. The spec "Out of scope" line (DM/mention/hover → fdb444fc) is honest.

### Claimed-but-fake sweep — **NONE FOUND**
No fabricated file, export, line, precedent, or task. The only defects are two cosmetic citation offsets (see below), neither of which falsifies a load-bearing premise.

---

## Defects (non-blocking — for the B-3 executor, not gate-blockers)

| # | Severity | Defect | Correction |
|---|---|---|---|
| 1 | **Low** | Claim 3 / plan cites `apps/web/src/globals.css:18` for the token | Actual file is `apps/web/src/styles/globals.css:18` (line exact, dir wrong). Executor must edit `styles/globals.css`. |
| 2 | **Low** | Claim 2 dot block cited as `~:91-101` | Actual dot markup is `:92-101` (:91 is the comment line). Cosmetic. |

Neither alters scope, ACs, specialist routing, or architecture. Recommend the P-block gate note the `styles/` path correction so B-3 doesn't hunt for a non-existent `src/globals.css`.

---

## Verdict

**APPROVE.** Every load-bearing claim in the wave-26 spec + plan is TRUE in the codebase. The frame is grounded in verified reality: the PresenceDot extraction is genuinely net-new (Claim 1), the debt it removes genuinely exists as inline hexes (Claim 2), the token it binds to is real (Claim 3), the single-socket invariant AC4 depends on is real (Claim 4), the attach sites are real (Claim 5), the identity mapping that makes degrade an edge case is real (Claim 6), and the specialist exists (Claim 7). The two antipattern risks (override-ship, DM/hover split) are both legitimately backed. No fabrication. The only fixes are two cosmetic path/line offsets to hand to the B-3 react-specialist.
