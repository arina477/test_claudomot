# V-1 jenny — wave-78 semantic spec-conformance verification

**Wave:** 78 — member-profile-card UX polish (M13 leg-2 follow-up)
**Deployed state verified:** merge 855e811, LIVE (api api-production-b93e / web web-production-bce1a8, live bundle `/assets/index-0B5kNdBU.js`)
**Spec source of truth:** primary task 4be3b084 `description` (2-block multi-spec); pointer `P-2-spec.md` — no divergence found, pointer faithfully mirrors the DB row.
**Axis:** semantic conformance to SPEC CONTRACT intent (Karen's source-truth axis independent, not seen here).

## VERDICT: APPROVE

Both blocks' acceptance-criteria INTENT is met by deployed behavior. 8 ACs across 2 blocks verified against live API probes + live-bundle inspection. 0 spec DRIFT, 0 spec GAP that blocks. 3 non-blocking observations (all already known / carried), 0 REJECT.

---

## Block 1 — academicRole clearable (seed 4be3b084) — live API probes, fixture A

Auth: SuperTokens cookie mode (`st-auth-mode: cookie`, `rid: anti-csrf` on mutating verbs); access-token rotation handled across calls.

| # | Spec AC (§acceptance-criteria) | Probe | Deployed result | Verdict |
|---|---|---|---|---|
| B1.1 | PATCH `{academicRole:null}` → 200, persists NULL; GET returns `null` | PATCH null → GET | **200**, body `academicRole:null`; GET round-trips `null` | MATCH |
| B1.2 | PATCH omitting academicRole → existing value **unchanged** (undefined≠null) — the load-bearing service fix | set 'educator' → PATCH `{bio:...}` (role absent) → GET | role **stays 'educator'**, bio updated | MATCH — **crux proven** |
| B1.3 | PATCH `academicRole:''` → coerced to null → clears (200) | PATCH `{academicRole:""}` → GET | **200**, cleared to `null` | MATCH |
| B1.4 | PATCH non-enum non-null → 400, value unchanged (enum preserved) | PATCH `{academicRole:"teacher"}` → GET | **400**; GET shows value unchanged | MATCH |
| B1.5 | Valid enum sets & persists | PATCH `{academicRole:"student"}` → GET | **200**, persists 'student' | MATCH |
| B1.6 | 409-username + other fields unaffected | PATCH username→'studyhallfixtureb'; PATCH `{bio:""}` | **409** collision; unrelated field 200 | MATCH |

**Edge cases (spec §edge-cases):**
- `null` → NULL ✓ (B1.1)
- `''` → NULL ✓ (B1.3)
- absent/undefined → leave unchanged ✓ (B1.2) — service genuinely distinguishes `undefined` from `null`, not the old `!== undefined` string-only gate
- non-enum `'teacher'` → 400 unchanged ✓ (B1.4)
- **clear-from-null idempotent** (jenny extra): PATCH `null` when already `null` → **200**, stays `null` ✓
- **non-string `5`** (jenny extra): → **400** ✓
- **whitespace `'   '`** (jenny extra): → **400** — only the literal empty string coerces to null; whitespace is neither enum nor `''`, correctly rejected. Reasonable boundary, no spec conflict.

## Block 2 — hidden vs transient error on member card (sibling 3b3530d8) — server contract (live) + client branch (live bundle + source)

The wave-78 change is entirely CLIENT-SIDE (MemberProfileCard branches on `HttpError.status` / transport outcome); server contract is unchanged. Verified both halves.

**Server contract (live probes, fixture A):**
- GET `/profile/:userId` visible → **200** PublicProfile, 11-key allowlist, **NO `email`** key (checked self + shape) ✓
- Uniform **404** `{"message":"Profile not found","error":"Not Found","statusCode":404}` (68 bytes) — **byte-identical** across nonexistent UUID, malformed non-UUID, and second nonexistent UUID (diff clean); no body oracle ✓
- Self-view of own profile while `profileVisibility:'nobody'` → **200** (correct self-exemption; the anti-oracle concern is *other* viewers, and the server's uniform-404 for hidden-to-others was proven at wave-77 T-8 and re-proven at wave-78 T-8 via client fetch-patch). PUT `/profile/privacy` restored to `everyone`.

**Client branch (live bundle `index-0B5kNdBU.js` + source `MemberProfileCard.tsx:215`, `auth/api.ts`):**
- Live bundle contains the exact minified branch: `.catch(S=>{x||(!(S instanceof vl)||S.status>=500?c({kind:"error"}):c({kind:"hidden"}))})` — `vl` = minified `HttpError`.
- `request()` in api.ts throws `HttpError(status,…)` for HTTP responses; a `fetch()` transport failure (network/offline/timeout/DNS/TLS) propagates as a raw non-HttpError throw. So the branch is exactly: **non-HttpError throw OR status ≥ 500 → `error` (retryable); every other HttpError status (401/403/404/410/429) → `hidden` (fail-closed)**.

| # | Spec AC (§acceptance-criteria) | Deployed evidence | Verdict |
|---|---|---|---|
| B2.1 | 404 → calm "Profile Unavailable" hidden, NO retry, byte-identical across all reasons | Live bundle strings "Profile Unavailable" + "academic identity is hidden due to visibility settings" (fixed copy, no reason variable → byte-identical); hidden branch has no retry affordance | MATCH |
| B2.2 | Transport (network/timeout/5xx) → DISTINCT retryable "could not load" state | Live bundle: `status>=500`→`error`; error copy "Couldn't load profile" / "Something went wrong reaching this profile. Check your connection and try again." + `member-card-retry` button (amber DS accent, not danger-red) | MATCH |
| B2.3 | Retry re-fetches: 200→renders / repeated 404→hidden / repeated transport→stays retryable | `handleRetry` bumps `attempt`, an effect dep → re-runs the identical fetch+branch; 200→'loaded', 404→'hidden', transport→'error' | MATCH |
| B2.4 | Distinction is CLIENT-SIDE only; NO new server field / no why-oracle (uniform-404 preserved) | Server contract unchanged; uniform-404 68-byte identical (above); branch derives only from `HttpError.status` / transport | MATCH |

**Edge cases (spec §edge-cases):**
- 404 (any hidden reason) → hidden, no retry, byte-identical ✓
- network/fetch-throw/timeout → retryable error ✓ (non-HttpError branch)
- 5xx → retryable error ✓ (`status>=500` branch)
- 401 unauth → existing auth behavior (not a card error state) ✓ — 401 falls into the `else`→hidden card branch, but the app's auth layer handles 401 upstream; card never special-cases it, consistent with spec.
- retry after transient-then-success → 'loaded' renders ✓
- **Fail-closed default** (jenny extra): every non-5xx non-404 status (403/410/429) → hidden, so no future target-specific status can leak an error-kind oracle. Verified in source comment + branch; the 403→hidden guard is CI-tested and was T-8-proven live via fetch-patch (honest note: server has no live 403 path).

## Contract conformance
- PATCH `/profile` accepts enum | null | `''`(→null) | absent; returns full ProfileResponse; 400 only on non-empty non-enum; 409 username preserved ✓
- GET `/profile` shape stable, includes `academicRole` (nullable) ✓
- GET `/profile/:userId` → 200 PublicProfile (no email) | uniform 404 no oracle ✓

## User-journey continuity
- Editor-clear journey: the `/settings/profile` academic-role select's empty "Not specified" option now clears (PATCH null path is live) — no dead-end, the save round-trips and reflects cleared on reload (T-5 corroborates).
- Member-card journey: loaded / loading / hidden / **error(retry)** / partial — the new error state offers a forward path (retry) instead of a dead-end; no broken-back, no unhandled-error white-screen (transport failures land in the calm error card, not an exception).
- T-9 journey map (`user-journey-map.md` §wave-78, lines 486-493) accurately regenerated: documents the 5th card state + editor-clear + fail-closed anti-oracle; matches deployed behavior.

## Spec-gap detection
No blocking spec gap. The spec anticipated the deployed behavior well, including the fail-closed generalization (spec §contracts.types for 3b3530d8 says "404→hidden, network/timeout/5xx→retryable"; the implementation is stricter/safer by routing ALL non-5xx to hidden — a superset-safe hardening, not a drift).

---

## Findings (all NON-BLOCKING; 0 critical, 0 REJECT)

- **J-1 (LOW, observational — NOT introduced this session):** live `displayName` reads "Fixture A" rather than an original null — this is the wave-78 T-3-probe residue already documented in the T-9 map (absent-field test PATCHed the min-length-validated displayName, un-restorable). The wave's own field (academicRole) is restored EXACTLY to 'educator'. No action; noted for provenance.
- **J-2 (LOW, honest-coverage note):** the "hidden-as-seen-by-another-viewer uniform-404" could not be re-probed live here because fixture B's password was not provided (B signin → WRONG_CREDENTIALS). Mitigated: (a) server uniform-404 is byte-identical across nonexistent/malformed/second-nonexistent from A's session; (b) wave-77 T-8 + wave-78 T-8 proved the cross-viewer hidden→404; (c) self-view exemption (200 for own nobody-hidden profile) is correct and not an oracle. Anti-oracle intent holds.
- **J-3 (LOW, spec-representation, GAP-not-DRIFT, cosmetic):** spec §contracts.types names only "404→hidden, 5xx→retryable" for the client branch; deployed additionally routes 401/403/410/429→hidden (fail-closed). This is a SAFE superset the spec under-specified rather than a divergence — flagging as a documentation completeness note, not a defect.

## Prod hygiene
Left CLEAN: academicRole='educator', pronouns='', bio='', profileVisibility='everyone', whoCanDm='everyone'. No blocks created. displayName residue is pre-existing (J-1).
