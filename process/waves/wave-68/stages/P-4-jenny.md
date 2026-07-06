# P-4 Phase 2 — jenny DRIFT check (wave-68, M11 publish-write-half + memberCount fix)

**Agent:** jenny (spec/plan vs prior-decisions + journey-map drift)
**Scope:** spec `2bd37c4c-eca8-4eda-900b-0276fe46f1b3` (single-spec) + `P-3-plan.md` + `P-0-frame.md`
**Verdict: APPROVE — no material drift.** This is the documented next M11 bundle; opt-in owner-controlled; moderation correctly deferred. Zero DRIFTS found; every judged item MATCHES a prior decision or the established codebase model.

---

## Sources cross-referenced
- product-decisions.md: L722-746 (M11 promotion + first bundle 609c9bdd/wave-67 + this bundle's own P-1 override L742-746), L728-732 (first-bundle deferral list incl. moderation L732), L736-739 (wave-67 override + "moderation required before public LAUNCH" strategic carry).
- user-journey-map.md: page-17 `/discover` (L73), F12 (L298-303), L21 wave-67 T-9 header (names `2bd37c4c` as the deferred publish-write path + F67-T5-1 memberCount:0), L386-392 pending-build note.
- Code: `apps/api/src/servers/servers.service.ts` — owner-gate idiom L366-368 (`server.owner_id !== callerId → ForbiddenException`) + rotateInviteCode owner-only L400-408; memberCount correlated subquery L550-554.
- Design: `design/server-settings.html` L3-10 (Roles tab SUPERSEDED; Overview/Members/Channels/Invites shell remains valid prior art).

---

## Per-item MATCHES / DRIFTS

### 1. Owner-gated publish (owner-only PATCH) vs StudyHall owner-authz model — **MATCH**
Spec AC1/AC2 gate PATCH /servers/:id on `server.owner_id !== req.session.getUserId() → 403`, service-layer, with a hard non-owner-reject test. This is the *exact* idiom StudyHall already uses for owner-privileged server mutations: invite revoke (servers.service.ts:366-368, owner-or-creator) and invite-code rotate (L400-408, owner-only). The plan (P-3 §1) explicitly reuses "the :368 idiom." No new authz primitive invented; no RBAC-flag substitution that would blur the owner boundary. The frame correctly notes owner-or-`manage_server` as the gate; spec narrows to strict owner_id, which is the tighter, safer choice and consistent with rotate (owner-only). MATCH.

### 2. Opt-in publish (is_public default false, owner toggles, unpublish retracts) vs wave-67 privacy posture — **MATCH**
Spec AC3: is_public only changes when explicitly provided; default stays false; no wave changes existing servers' visibility; unpublish retracts from /discover; toggle both ways idempotent. This is verbatim consistent with the wave-67 posture recorded at L739 ("Opt-in visibility (is_public default false) verified at P-0") and the first-bundle design where createServer leaves is_public=false and /discover filters is_public=true only (journey L300). No backfill — AC3 "no wave changes existing servers' visibility" explicitly preserves the no-backfill stance. UNPUBLISH (retraction) is an added safety floor, consistent with the frame's mvp-thinner "UNPUBLISH (safety floor, do-not-over-cut)." MATCH.

### 3. memberCount fix + mandatory live-DB test vs wave-67 V-3 DEFER — **MATCH**
The wave-67 V-3 DEFER (F67-T5-1) is folded into this bundle per the spec head ("[FOLDED IN from wave-67 V-3 DEFER, head-verifier]") and journey L21/L302. Spec AC (memberCount fix) rewrites the L550-554 correlated subquery — confirmed present in code and confirmed by journey L302 as returning 0 with 1 AND 2 members. The live-DB test is a HARD AC (spec: "real-Postgres integration test (pg-harness) … NOT a mock … the guard the mocked unit test lacked"). This directly matches the fold-in mandate and the L745 P-1 carry ("memberCount live-DB test (hard AC — the mocked unit test missed the bug)"). The bug-shipped-green-under-mocks diagnosis (journey L21, spec head) is the exact rationale for the live-DB test. Plan routes it to backend-developer/pg-harness (P-3 B-2, AC9). MATCH.

### 4. Reuse server-settings Overview shell (not superseded Roles tab) vs design decisions — **MATCH**
Spec AC5 + plan §3 reuse the canonical `design/server-settings.html` Overview shell + DS form primitives and explicitly forbid touching the superseded Roles-tab permission matrix. This is directly corroborated by the design file's own banner (server-settings.html:3-10): the Roles tab is SUPERSEDED (wave-10 D-3, replaced by server-roles.html), but "The Overview / Members / Channels / Invites shell here remains valid prior art." The frame's NOTE (P-0-frame L11) captures this precisely. design_gap_flag=false is justified (no new page — additive controls on an existing surface). MATCH.

### 5. Moderation deferral (before public LAUNCH, not this build) vs wave-67 L732 — **MATCH; no contradicted prior decision**
The wave-67 first bundle explicitly deferred "moderation/safety on public join (bans/blocklists/capacity)" to later M11 bundles (product-decisions L732) and carried the strategic sequence "moderation bundle required before public LAUNCH" (L739). This wave restates the identical sequence at L745 ("moderation bundle MUST precede any public launch (publish now → moderation next → launch)") and the frame (P-0-frame L12 ceo-reviewer FLAGS + L17 STRATEGIC). Deferring moderation to a later bundle while shipping the opt-in publish path is consistent — the publish path is owner-controlled opt-in at 0 users, and public-LAUNCH-go remains founder-reserved (frame L8). No prior decision is contradicted by the publish-write path: it is the exact bundle the journey map named as deferred-from-wave-67 (L21, L73, L298-302, L309, L386-392 — all cite `2bd37c4c` by ID). MATCH.

### 6. Journey: settings publish toggle is a new user action on an existing settings surface — **CONFIRMED addition, not contradiction**
The publish/unpublish toggle + description/topic edit is a new owner action layered onto the existing server-settings Overview surface, and it activates the F12 /discover directory that currently renders the honest empty-state in prod (journey L21, L299, L309 all note prod directory is empty *until this publish path ships*). This is additive: it populates page-17 rather than altering its contract, and corrects memberCount on the existing card shape (no response-shape change — spec contracts.api). This is a T-9 journey ADDITION (new F12 write-half action + the already-pending-build note at L386-392 resolves), not a contradiction of any existing journey node. Confirmed — flag for T-9 regen, no drift.

---

## Overall
**APPROVE.** Every element traces to a documented prior decision or the established StudyHall codebase model:
- Owner-gate = reuses shipped invite-revoke/rotate idiom (item 1).
- Opt-in/unpublish = wave-67 privacy posture preserved, no backfill (item 2).
- memberCount + live-DB test = the exact wave-67 V-3 DEFER fold-in with the mocked-test gap closed (item 3).
- Overview-shell reuse = design file's own superseded-Roles/valid-Overview split (item 4).
- Moderation-before-LAUNCH = wave-67 L732/L739 sequence restated, publish path contradicts nothing (item 5).
- Journey = additive write-half activating the already-mapped-but-empty /discover (item 6).

No conflicting decision to cite. This is the documented next M11 bundle, opt-in and owner-controlled, with moderation correctly deferred and public-LAUNCH-go left founder-reserved.
