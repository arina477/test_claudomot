# P-4 jenny — wave-65 DRIFT cross-reference

**Stage:** P-4 Phase 2 (drift audit — NOT code-truth; that is karen's lane).
**Wave:** 65 (StudyHall, M12 Offline-first moat). Single-spec, task `db3ade72-6504-4700-93b1-9d99b4098f38`.
**Question:** Does the wave-65 spec + plan contradict any prior product decision or the established offline-first approach, or introduce an undocumented journey surface?

Method: cross-referenced the spec YAML head (DB row `db3ade72`), P-3 plan, and P-0 frame against `command-center/product/product-decisions.md` (M12 entries waves 62/63/64/65 + wave-20/21 M4 precedents + wave-59 founder-reserved circuit-breaker) and `command-center/artifacts/user-journey-map.md` (page-9 server-channel-view, F5 offline, F11 DM, app-shell chrome).

---

## Per-item verdict

### Item 1 — Offline-cache-the-DTO approach vs the established M12 read-through pattern
**MATCHES.**
The spec caches the fetched DTO in Dexie with a network-first / fallback-to-cache read-through, best-effort non-blocking write-through — the exact shape shipped four times:
- wave-20/21 M4: `getCachedMessages` read-through + Dexie store (product-decisions L288; journey L320).
- wave-62 M12 #1: `useDm` write-through on `GET /dm/*`, fall back to `getCachedDm*` (L681–685; journey L293).
- wave-63 M12 #2: AssignmentsPanel/ClassCalendar write-through on success, fall back on fetch-fail; Dexie v3 (L696–701; journey L20).
- wave-64 M12 #3: `cachedAttachmentBlobs` cached blob object-URL (spec AC5 cites it; commit 1744de8).

The plan's explicit "cache the full ServerDetail DTO vs wiring the dormant granular `channels` table → DTO-blob WINS, matches the shipped 'cache the DTO you fetched' pattern (cachedAssignments, CachedDmConversation)" (P-3 plan L13) is the same DTO-intersection precedent (`CachedAssignment`/`CachedDmConversation`). The `.version(5).stores()` restate-all-8-tables + fake-indexeddb upgrade-preservation test (AC6) mirrors the wave-62/63 rule-11 discipline verbatim (journey L19–20). No drift — this is the fourth application of a proven pattern, network-first (keeps the online happy path unchanged), no new abstraction.

### Item 2 — Scoping OUT conflict-resolution UI + assignment-media leg
**MATCHES.**
Both exclusions are directly compelled by recorded prior decisions:
- **Conflict-resolution UI deferred:** wave-59 set M12's working success metric as "full offline content access ... + conflict-resolution UI" (L676), and every subsequent M12 bundle explicitly deferred it as its own heavier item building ON the read-cache layer (L684, L692, L699, L707). The wave-65 P-0 ceo-reviewer re-affirmed **HOLD-SCOPE — "refuse to bundle standalone conflict-resolution UI"** (P-0 frame L22), and the floor-merge entry records "conflict-resolution UI = ceo HOLD-SCOPE own-wave" (L712). Excluding it is decision-faithful; bundling it would have been the drift.
- **Assignment-media leg deferred:** wave-64 P-0 DESCOPED the assignment-attachment media leg (no online byte-render/open surface; task `10e7543f` re-homed to a deferred M12 candidate pending that prerequisite) (L706). P-0 frame L22 records "assignment-media leg blocked." The spec caches server-list + channel-tree only and does not touch assignment media. Faithful.

The P-0 mvp-thinner also ruled `{server LIST, server DETAIL}` the inseparable minimal slice (member/roles/presence/unread NOT in scope, no split) (P-0 frame L24) — consistent with the exclusion set. No drift.

### Item 3 — Reusing ConnectionStateIndicator (no new offline UI) vs wave-20/21 offline-signal decision
**MATCHES.**
wave-21 established the app-shell `ConnectionStateIndicator` as THE canonical offline signal reflecting real socket state (product-decisions L282–283 "infra-activation ... already-shipped, design-system-compliant connection-state indicator"; journey L255, L326, F5 L253). Every M12 read-cache wave since reuses it rather than adding UI (L685 "reuse the shipped connection-state signal"; journey L293 states "reuses ... shipped connection indicator"). AC7 mandates "reuse ConnectionStateIndicator — NO new offline UI component," and `design_gap_flag: false` (spec head; P-2 L3). No prior decision mandates a different or additional offline affordance for this surface — the design-system entry (L84) lists ConnectionStateIndicator as the single offline-wedge primitive. Reuse is the decision-faithful choice. No drift.

### Item 4 — New/undocumented journey surface or contradicted flow
**MATCHES (no new surface, no contradicted flow).**
The wave targets the existing **page-9 server-channel-view** (`/servers/:id/:channelId`), which the journey map already lists with feature **"offline sync"** among its features (journey L64) and whose app-shell chrome already carries the ConnectionStateIndicator (journey L83, L113–115). The server rail (`GET /servers`) and channel sidebar (`GET /servers/:id`) are documented live surfaces (journey L113, L115, L152). The spec adds **no new route, screen, endpoint, or component** — it is a data-source change (Dexie read-through) on existing surfaces, identical in kind to the wave-62/63/64 M12 entries that all regenerated the journey map annotation-only ("NO new route/screen/endpoint/component," journey L19–20). API contracts are REUSED with NO server change (spec `api:`/`data:`; P-3 L22–25). Graceful cold-cache empty-state (AC7) is additive, not a contradiction of any documented flow. No drift.

### Item 5 — P-0 reframe consistency (message-list → ServerContext); stale message-list language in the spec
**MATCHES (reframe fully propagated; NO stale message-list language in the spec).**
The recorded framing: original "wire the message-LIST read path" premise was **false-absent** — `useMessages.ts:299-316` already falls back to `getCachedMessages`; the real cold-offline gate is one layer up in `ServerContext.tsx` (`fetchServers`/`getServerDetail` `.catch` with no cache fallback) (P-0 frame L11–18; floor-merge entry L714). The spec YAML head + prose consistently target the **server-list + server-detail / ServerContext** read path, and explicitly and repeatedly assert **"useMessages.ts is NOT modified / UNTOUCHED"** in AC5, the contracts note, and the prose body — treating it as the already-shipped fallback that merely becomes *reachable* once the sidebar hydrates. The plan (P-3 L44) and P-2 pointer (L10) both carry the same "LEAVE useMessages.ts untouched" instruction. There is no stale "fix the message-list read path" language that would misdirect V-block toward `useMessages.ts`. The spec correctly frames useMessages.ts as an untouched reachability beneficiary, not a work item. Reframe is consistent; no drift.

---

## Floor-override + reframe entry consistency check
**CONSISTENT.**
The just-appended floor-merge entry (L710–716) accurately describes the spec: single-spec, sub-floor (~500–800 LOC incl. tests, below the >1,500 single-spec floor), `floor_merge_attempt: 0`, override-ship by rule (wave-21/53 infra-reuse / UX-completion floor-exemption lineage + PRODUCT-PRINCIPLES rule 5), no BOARD (anti-pattern #1 routine-sizing + wave-24 standing no-re-litigate). It correctly records the P-0 reframe (message-list false-absent → ServerContext, useMessages.ts untouched) and the scope-fence (conflict-UI HOLD-SCOPE own-wave, assignment-media `10e7543f` blocked). The entry's LOC/scope/reframe claims match the spec + plan + frame with no contradiction.

---

## Overall verdict

**APPROVE — no material drift.**

All five spec items MATCH prior product decisions and the established offline-first approach:
1. DTO read-through cache = fourth application of the proven M4/wave-62/63/64 pattern.
2. Conflict-UI + assignment-media exclusions are compelled by wave-59/64 deferrals + wave-65 P-0 ceo HOLD-SCOPE.
3. ConnectionStateIndicator reuse = the wave-21 canonical offline-signal decision.
4. No new journey surface — data-source change on the documented page-9 server-channel-view (already tagged "offline sync").
5. P-0 reframe (message-list → ServerContext) is fully and consistently propagated into the spec; no stale message-list language would mislead V-block; useMessages.ts is correctly framed as untouched-but-reachable.

The floor-override + reframe decision-log entries are consistent with the spec. This wave is a decision-faithful continuation of the M12 offline-first moat arc, not a divergence.

**No conflicting prior decision identified. No REWORK/ESCALATE trigger on drift grounds.**

*(Scope note: this is a drift audit only. Whether the code actually caches the DTO, restates all 8 tables, and hydrates the sidebar offline is karen's / V-block's verification lane, not judged here.)*
