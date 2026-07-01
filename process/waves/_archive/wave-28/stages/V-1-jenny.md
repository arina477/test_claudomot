# V-1 Jenny — Semantic-Spec Verification (Wave 28)

**Task:** `d058283d-a979-4528-9cd6-3ff48b4cfbc1` — Rotate permanent server invite_code (owner-gated regenerate)
**Verdict:** **APPROVE** (with one LOW cosmetic finding routed to V-2 for a spec/code reconciliation decision — non-blocking)
**Scope:** Does the LIVE DEPLOYED behavior match the spec contract's INTENT, beyond the AC wording the T-block tested?

Spec source of truth: the DB row YAML head (7 ACs + contracts + edge-cases), NOT the P-2 pointer file.
Live api: `https://api-production-b93e.up.railway.app` (health 200). Deployed code = merge 8996230, deploy 48c515e9 SUCCESS.

---

## Method

Verified spec INTENT against (a) the deployed source in `apps/api/src/servers/{servers.controller.ts, servers.service.ts}` (post-merge working tree, matches deploy 48c515e9), and (b) the T-8 live-behavior evidence (`process/waves/wave-28/stages/T-8-security.md`, proof server ad62cd12), re-checking each T-8 claim against the spec's underlying intent rather than accepting the PASS wording at face value.

---

## AC-by-AC intent match

| AC | Spec INTENT | Deployed behavior | Match |
|---|---|---|---|
| AC1 | Owner rotate → 2xx, new `invite_code` ≠ prior | `rotateInviteCode` (service:387-415) regenerates + returns `{invite_code}`; T-8 LIVE: `PGrHRTlwNuPz_xLYhe2cRg` != old `DfXqa4F7nVJCqge9_uY5pA`, base64url 22-char | INTENT MET. **Status code is 201 not 200** — see F28-T8a below (cosmetic) |
| AC2 | Old link dead: old preview 404, old join 404 | Old code overwritten in the single UNIQUE `servers.invite_code` column (service:403); resolution reads that column for BOTH preview (service:457) and join (service:516) — no residual store. T-8 LIVE: old preview 200→404 | INTENT MET (old-join nuance below — not a defect) |
| AC3 | New link admits: new preview 200, new join 200 | New code resolves through same path; T-8 LIVE new preview 200 | INTENT MET |
| AC4 | Non-owner member → 403 (owner-ONLY, no creator path) | `if (server.owner_id !== callerId) throw ForbiddenException` (service:394-396) — single owner check, creator OR-branch dropped vs revoke (revoke keeps it at service:354). T-8 LIVE with a REAL verified non-owner session (fixture B): 403 | INTENT MET — this is the load-bearing intent and it is correctly narrowed |
| AC5 | Non-existent server → 404 | `if (!server) throw NotFoundException` (service:390-392), evaluated BEFORE the owner check | INTENT MET |
| AC6 | Unauth → 401; unverified → 403 (AuthGuard) | `@UseGuards(AuthGuard)` on the route (controller:96); T-8 LIVE unauth → 401 | INTENT MET |
| AC7 | CSPRNG regenerate + 23505 retry (≤5) → 409 | `generateCode() = randomBytes(16).toString('base64url')` (~128-bit, service:35-37); 5-attempt loop, `23505 && attempt<MAX-1 → continue`, exhausted → `ConflictException` 409 (service:398-414) — mirrors createInvite. T-8 LIVE: 5 consecutive rotations distinct, no pattern | INTENT MET |

---

## Targeted intent checks (per V-1 mandate)

**3. Old-link invalidation completeness (kills BOTH preview + join, not partial).** CONFIRMED. `servers.invite_code` is the single source resolving the permanent link. `rotateInviteCode` overwrites it in place (service:403); `resolveInviteCode`/preview reads it at service:457 and the join transaction re-resolves it at service:516. There is no second store (e.g., a cached copy or an `invites`-table row) that could keep the old code alive — so overwriting the column kills preview and join atomically. This matches the spec's "single source resolving the permanent link (servers.service.ts:401-402)" data-contract claim. Not a partial kill.

**4. Owner-ONLY intent (not owner-OR-creator).** CONFIRMED and correct. The dangerous mistake here would have been copying revoke's owner-OR-creator gate; the code does NOT — rotate has one `owner_id !== callerId` branch (service:394), the creator OR-clause present in revoke (service:354) is deliberately absent, which is exactly the spec's "load-bearing" authorization nuance. T-8 proved this against prod with a genuine verified non-owner session (fixture B, server ad62cd12) → 403, not with a mere unauth probe. This is the strongest part of the wave.

**5. Edge cases.**
- **Concurrent rotate (last-write-wins):** No lock; two `UPDATE servers SET invite_code` race, final persisted code wins, all prior codes dead. Consistent with spec ("Documented, not locked; no abuse surface at 0 prod servers"). Intent met.
- **23505 retry → 409:** Loop returns 409 only after 5 collisions (astronomically rare at 128-bit). Consistent.
- **Ad-hoc invites unaffected:** Rotate touches only `servers.invite_code`; ad-hoc rows live in the separate `invites` table and are never written by this path. Consistent with spec.

**6. Spec-gap detection.** One thing the spec did not anticipate: the HTTP success status. Spec AC1 + api-contract assert **200**; the deployed endpoint returns **201** (see F28-T8a). No other divergence surfaced.

---

## F28-T8a adjudication — 200-vs-201 status

**Classification: spec-GAP (spec wrong), NOT spec-DRIFT.**

Reasoning:
- The **body** contract (`{ invite_code: string }`, new ≠ old) is exactly right and is the load-bearing part of AC1 — that is what any future consumer reads. The status text ("200") is the incidental part.
- The endpoint is a genuine resource-creating action semantically (it mints a NEW credential), so **201 Created is arguably the MORE correct status** than 200 — the sibling `createServer` (controller:38-40) and `createInvite` (controller:109-111) both deliberately carry `@HttpCode(HttpStatus.CREATED)` for the same reason. The rotate handler simply omits `@HttpCode` (controller:95-102) and inherits NestJS's `@Post` default of 201 — which happens to land on the semantically-defensible value.
- The spec author wrote "200" as a generic 2xx placeholder (the P-0 keep-OUT explicitly removed the client UI, so there was no consumer forcing a status contract). This is a spec-authoring imprecision, not the code doing the wrong thing.
- **There is no client consumer this wave** (regenerate-link UI is keep-OUT per spec). Nothing breaks. Severity: **LOW, cosmetic** — a status-text mismatch with zero downstream reader.

**V-2 recommendation: amend the spec to 201/2xx (do NOT add `@HttpCode(200)`).**
- Amending the spec is the cleaner, lower-risk move: 201 is consistent with the two sibling POST-create handlers in the same controller, so forcing 200 would make rotate the *inconsistent* one.
- Concretely: loosen AC1 + the api contract from "200" to "201 (Created)" — or "2xx" if V-2 prefers to leave it status-agnostic. Update the DB row `description` YAML head (the source of truth) and the P-2 pointer copy.
- Do NOT touch production code for this — a code change to force 200 would be churn that makes the codebase less internally consistent, for no consumer benefit. (Concur with a @code-quality-pragmatist read: the simplest correct action is the doc edit.)

---

## Secondary note — old-join 401-vs-404 (AC2), NOT a finding

T-8 recorded old-code **join** returning **401** where AC2 says **404**. This is a test-methodology artifact, not a behavior gap: `POST /invites/:code/join` sits behind `@UseGuards(AuthGuard)` (controller:151-152), so an **unauthenticated** old-join is gated at 401 *before* the (now-dead) code is ever resolved. AC2's "404" presumes an **authenticated** caller — with a valid session the dead code resolves through the same `NotFoundException` path as preview and returns 404. The spec intent ("the leaked permanent link is dead") is fully satisfied either way (401 or 404 both deny). No action. (T-8 already logged F28-T8b separately for the 403-vs-404 existence-oracle on non-owner; that is B-6 accepted-debt, spec-conformant to AC4, and out of V-1 semantic scope.)

---

## Blocking vs cosmetic summary

- **Blocking semantic incorrectness:** NONE. All 7 ACs' INTENT is met in the live deployment; the owner-ONLY authorization core — the whole point of the wave (closing the wave-9 irrevocable-leaked-link gap) — is correctly implemented and live-proven with a real non-owner session.
- **Cosmetic:** F28-T8a (201-vs-200) — LOW, spec-GAP, no consumer. Route to V-2 as a **spec amendment** (201/2xx), not a code fix.

**VERDICT: APPROVE.**
