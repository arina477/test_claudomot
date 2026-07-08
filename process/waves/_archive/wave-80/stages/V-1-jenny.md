# V-1 jenny — wave-80 semantic spec-conformance verification

**Wave:** 80 — M13 leg-3b presence (online-status) privacy toggle
**Spec source:** task 3038a4bc `description` (YAML head + prose + "## P-4 Phase-2 BINDING CORRECTIONS")
**Deployed:** merge 4795638 · api https://api-production-b93e.up.railway.app · web https://web-production-bce1a8.up.railway.app
**Axis:** SEMANTIC spec-intent conformance beyond the ACs T-block tested (Karen's source-truth axis is independent; not consulted).
**Verified live** with two real fixtures A (studyhall-e2e-fixture, 21984eb2) + B (studyhall-e2e-fixture-b, da74148e), co-members of server ad62cd12, via HTTP + two real Socket.IO `/presence` clients.

---

## VERDICT: APPROVE

11 checks performed. 0 DRIFT, 0 GAP, 0 REJECT. All acceptance-criteria semantics, all six P-4 BINDING CORRECTIONS, the contract shapes, and journey continuity conform to spec intent on the deployed build. Prod left CLEAN (A restored `showPresence:true`, `profileVisibility:everyone`).

---

## Protocol 1 — AC semantics

**1.1 Real working toggle (not disabled-Beta) — CONFORM.**
Spec AC-1: "REAL working toggle … because presence is a live feature." Source `apps/web/src/pages/SettingsPrivacyPage.tsx` renders `role=switch`, `aria-checked={showPresence}`, ENABLED (disabled only transiently during save), emerald-on `#10b981`/grey-off `#52525b` DS tokens, auto-saves via partial PUT, hydrates from GET. It is modelled on the enabled visibility panel, explicitly NOT the disabled whoCanDm-Beta affordance (which sits below it with `aria-disabled`, `pointer-events:none`, BETA badge). Live PUT→GET round-trip proven (§1.3). Contrast to the still-inert DM panel is preserved in the same file.

**1.2 show_presence=false excludes from broadcast; proactive mid-session, no reconnect — CONFORM (headline honor point).**
Two-client live test (`/tmp/w80-twoclient.mjs`): A online, B subscribed to `/presence`. A `PUT {showPresence:false}` → **B received `presence:offline` for A ~101ms later WHILE A stayed connected (`a.connected === true`, no reconnect)**. A `PUT {showPresence:true}` → B received `presence:online` for A ~97ms later. This is the real AC-2 mechanism (P-4 #1), proven end-to-end on prod.

**1.3 Partial PUT (only changed field, no cross-field clobber) — CONFORM.**
Live: `PUT {showPresence:false}` alone → 200, GET returns `showPresence:false` with `profileVisibility/whoCanDm` UNCHANGED. Then `PUT {profileVisibility:"nobody"}` alone → GET returns `visibility:nobody` AND `showPresence` STILL `false` (no clobber). `UpdatePrivacySchema.partial()` + service merges only present keys (`if (dto.X !== undefined) set.X`).

**1.4 Own-visibility-only (hidden user still sees others) — CONFORM.**
Live (`/tmp/w80-ownvis.mjs`): A hidden connects → A's own `presence:snapshot` includes B `status:online`. The toggle governs outbound only; inbound view intact. Matches AC-4 / P-4 #2 subject-set = co-members' flags, not the connecting user's.

**1.5 Audit event via AppendPrivacyEventService — CONFORM.**
Live `GET /profile/privacy-events`: each toggle wrote `privacy_settings_changed`, `targetType:self`, context carrying `showPresenceFrom`/`showPresenceTo` (+ visibility/whoCanDm from/to). **No PII** (only enums + booleans; no email/displayName). No-op gate confirmed by design (event only on actual change) and consistent with visibility/whoCanDm events.

**1.6 Binary online (no last-seen) — CONFORM.**
Contract carries `showPresence: boolean` only; no timestamp field anywhere. UI copy is binary ("Turn it off to appear offline to everyone" / "You'll appear offline to everyone") — zero last-seen framing. Emit payloads are `{userId}` online/offline only.

---

## Protocol 2 — P-4 BINDING CORRECTIONS conformance

- **#1 Proactive toggle-time emit — CONFORM.** Proven live §1.2 (offline ~101ms / online ~97ms, no reconnect). `PrivacyService.updatePrivacy` calls `presenceGateway.onShowPresenceChanged` gated on `showPresenceInPayload && showPresenceChanged`; a visibility-only PUT does NOT trigger a presence re-broadcast (gate requires the field in payload).
- **#2 Snapshot batch co-member flags — CONFORM.** Live (`/tmp/w80-snapshot.mjs`): A hidden while staying connected → **B fresh-connect snapshot reports A as `offline`**. `getShowPresenceBatch(coMemberIds)` keyed on co-member ids drives the per-member visible-gate in `handleConnection` step 4.
- **#3 Cache show_presence at connect — CONFORM.** `handleConnection` caches `socket.data.showPresence`; `handleDisconnect` reads it with NO DB query; `onShowPresenceChanged` keeps every live socket's cached flag in sync. Behaviorally consistent with the observed offline-on-disconnect gating.
- **#4 Binary online/offline, drop last-seen — CONFORM.** See §1.6.
- **#5 Truthfulness scope (presence-hidden ≠ activity rosters) — CONFORM (honestly bounded).** The toggle gates ONLY the `/presence` online broadcast. Study-timer "N studying" (`/study-timer` namespace) and focus-room rosters (`/study-room` namespace) are distinct modules and legitimately still show the user. UI copy says "appear offline" / "see when you're online" — it never over-claims to hide activity. The bound is honest (see Protocol 5).
- **#6 T-9 journey map add — CONFORM.** `user-journey-map.md` page-16 entry documents the enabled `role=switch` [showPresence], binary copy, PUT/GET round-trip, and the two-client honor result. `GET/PUT /profile/privacy` row documents `showPresence` + partial PUT + migration 0033.

---

## Protocol 3 — Contract conformance

- `packages/shared/src/privacy.ts`: `PrivacySettingsResponseSchema` + `UpdatePrivacySchema` both gain `showPresence: z.boolean()`; update is `.partial()`. Named ESM exports. CONFORM.
- Live `GET /profile/privacy` → `{profileVisibility, whoCanDm, showPresence}` (all three, `showPresence:true` default). CONFORM.
- Live `PUT /profile/privacy` partial body accepted (200); invalid non-boolean `showPresence:"yes"` → **400** `{"fieldErrors":{"showPresence":["Expected boolean, received string"]}}` at the Zod boundary. Unauthed GET+PUT → **401**. CONFORM.
- Migration `0033_wave80_users_show_presence.sql`: `ADD COLUMN "show_presence" boolean DEFAULT true NOT NULL` — DEFAULT true = no backfill, existing users stay visible. CONFORM.

---

## Protocol 4 — User-journey continuity

`/settings/privacy` (page-16): Privacy heading + honesty statement → enabled online-status switch (auto-save, inline ✓ success, ErrorBanner+revert on failure) → disabled DM-Beta block → account-data/export → activity → danger zone. No dead-end, no broken-back: the toggle is inline auto-save (no navigation), optimistic with local-captured revert target (F4) so a concurrent visibility save cannot corrupt the revert. Journey is coherent and continuous.

---

## Protocol 5 — Spec-gap detection

**No unbounded/dishonest behavior found.** The one area worth naming — presence-hidden does NOT hide study-timer / focus-room participation — is **explicitly and honestly bounded** by P-4 #5 and the UI copy: the control is titled "Show my online status" and promises only "appear offline," never "hide my activity." A hidden user genuinely disappears from the online/offline presence broadcast (proven live in all three paths: connect-broadcast suppressed, snapshot-batch offline, proactive mid-session offline, and disconnect gated). The activity rosters are a separate module and the copy does not imply they are covered. This is a truthful, well-scoped control — the anti-theater bar the wave set for itself (read-receipts descoped for exactly this reason) is met.

**Known carries observed (all pre-triaged, non-blocking, NOT new REJECTs):**
- F-T3-1 (LOW): unknown PUT keys stripped+200 rather than rejected+400. Confirmed live (`{"bogusKey":true}` → 200, no field touched). Mass-assignment-safe (column set is allowlisted from `dto.X !== undefined` on the three known keys only). Documented in T-9 map. Acceptable.
- Cosmetic: `packages/shared/src/privacy.ts` comment claims `.strict()` "keeps unknown keys rejected," but the exported schema is `.partial()` WITHOUT `.strict()` — hence the strip-not-reject behavior above. Stale comment, not a behavior defect. (Observation only; below REJECT bar.)

---

## Evidence index
- `/tmp/w80-twoclient.mjs` — proactive mid-session offline ~101ms / online ~97ms, A no-reconnect (AC-2, P-4 #1)
- `/tmp/w80-ownvis.mjs` — own-visibility-only (hidden A sees B) + connect-time online-broadcast suppressed while hidden (AC-4)
- `/tmp/w80-snapshot.mjs` — snapshot co-member batch flag: fresh B sees hidden A as offline (P-4 #2)
- Live HTTP: GET all-three-fields; partial PUT no-clobber; 400 on non-boolean; 401 unauthed; audit events with showPresenceFrom/To, no PII
- Source: `SettingsPrivacyPage.tsx` (enabled switch), `privacy.service.ts` (partial-merge + gated emit), `presence.gateway.ts` (3 gated emit paths + onShowPresenceChanged + reconcile), `privacy.ts` (contract), `0033_*.sql` (migration)
- Prod restored CLEAN: A `showPresence:true`, `profileVisibility:everyone`.
