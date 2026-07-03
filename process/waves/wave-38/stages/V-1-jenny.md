# V-1 Semantic-Spec Verification — Wave 38 (avatar + attachment storage go-live)

**Agent:** jenny (semantic-spec verifier) · **Lane:** spec-INTENT vs DEPLOYED behavior (not source-claim truth — that's Karen)
**Target:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app`
**Spec source of truth:** `tasks.description` YAML head of `84e09891-2b2f-4b68-b6e2-e2ef340ef32a` (DB row; P-2-spec.md is a pointer)
**Method:** live authed probes as fixture `studyhall-e2e-fixture` (userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`, username `studyhallfixturea`) + anonymous no-cookie probes.

## VERDICT: APPROVE

All 7 acceptance criteria verified live against DEPLOYED production. The wave's whole point — a persisted avatar rendering to an anonymous, cookie-less client — is PROVEN live (302 → presigned-GET → 200 image bytes). Attachments activated end-to-end. No storage endpoint returns 503. Two LOW findings reproduced (both non-AC, non-blocking, already tracked → V-2). One real UX dead-end (F1) is a spec-SCOPE gap, correctly flagged and out of this wave's ACs.

---

## Acceptance-criteria verdicts (each = spec section → deployed evidence)

**AC1 / AC7 — presign 200 not 503 (authed) · no endpoint 503s** — PASS
`POST /profile/avatar/presign {contentType:image/png}` (Bearer) → `200 {uploadUrl, key}`. Unauth → `401 {"message":"unauthorised"}` (guard-first, not 503). Across every probe below no storage endpoint returned 503 → creds are live. AC7 met.

**AC2 — PUT ≤2MB → confirm 200 persists avatar_url** — PASS
presign → `PUT` 78-byte PNG to `uploadUrl` → `200` → `POST /profile/avatar/confirm {key}` → `200 {avatarUrl:".../users/<id>/avatar?v=93183dec"}`. Re-read `GET /profile` → `avatarUrl` == the new `?v=93183dec` app URL. Persisted + cache-bust hash rotated from prior `v=3a70fcc9`.

**AC3 CRUX — persisted avatar_url fetched ANONYMOUSLY → 200 image bytes** — PASS (proven 2×, on two distinct objects)
Anonymous (no Authorization header) `GET /users/<id>/avatar?v=...`:
- `HTTP/2 302` → `location: https://t3.storageapi.dev/studyhall-avatars-ngavql0/avatars/<id>/<uuid>.png?...X-Amz-Expires=300...&x-id=GetObject` → follow → `200 · content-type image/png · 136 bytes` (existing object) and `200 · image/png · 78 bytes` (my freshly-confirmed object). No 403/AccessDenied. The private-bucket render risk the P-2/P-3 flagged is genuinely resolved via the presigned-GET redirect (300s expiry, GET-only). This is the falsifiable gate and it holds live.

**AC4 — oversize (>2MB) confirm → 413 AVATAR_TOO_LARGE, no persist** — PASS
PUT 3,145,728-byte object → confirm its key → `413 {"code":"AVATAR_TOO_LARGE","message":"Avatar must be ≤ 2 MB. Uploaded file is 3072 KB."}` (server-derived size via HEAD). `GET /profile` afterward still shows `v=93183dec` — the oversize URL was NOT persisted. `checkAvatarSize()` verified live, no code change needed.

**AC5 — non-allowlist content-type at presign → 400** — PASS
`{contentType:application/pdf}` and `{contentType:text/html}` → `400 {"message":"contentType must be one of: image/png, image/jpeg, image/webp"}`. Allowlist enforced at controller.

**AC6 — attachment activate: presign→PUT→send→presigned-GET 200 · >10MB → 413** — PASS
On a channel the fixture owns (`5920500b...` in server `eefbe99b...`):
- `POST /channels/:id/attachments/presign {contentType,filename}` → `200 {uploadUrl,key}` (not 503). NOTE the body field is `filename` (not `fileName`); `contentType` alone with wrong field → 400 — contract is `{contentType, filename}`.
- PUT 78-byte PNG → 200 → `POST /channels/:id/messages {content, attachments:[{key,filename,contentType,sizeBytes}]}` → `201`, DTO `attachments[0].url` = a DIRECT S3 presigned GET (`X-Amz-Expires=3600` = 1h `ATTACHMENT_GET_EXPIRY_SECONDS`, `x-id=GetObject`). Anonymous GET of that url → `200 · image/png · 78 bytes` byte-identical.
- Oversize: PUT 11,534,336-byte object → send referencing it → `413 {"code":"ATTACHMENT_TOO_LARGE","message":"Attachment must be ≤ 10 MB. Object ... is 11264 KB."}` (server-derived via `headAttachment`, wave-19 send-time gate). Attachments correctly stay presigned-GET direct-to-S3 (private, channel-scoped), distinct from the avatar API-redirect path — matches spec edge-case wording exactly.

---

## Spec edge-cases — deployed behavior

- **Private-bucket render** — resolved via presigned-GET redirect (AC3). No semantic drift; deployed behavior matches P-3's chosen fix.
- **No-avatar 404** — `GET /users/11111111-...-111111111111/avatar` → `404 {"message":"User has no avatar"}`. PASS.
- **Storage-unset 503** — cannot exercise (creds live by design); AC7 confirms the pre-state is removed.
- **Cross-user confirm IDOR** — `confirm {key:"avatars/<other-uuid>/x.png"}` → `400 {"message":"key must be a valid avatar key scoped to the requesting user"}`. Security boundary intact.
- **Cross-channel attachment key swap (IDOR)** — send with `key:"attachments/<foreign-channel>/x.png"` → `400` (anchored channel-scope regex). Intact.

## LOW findings reproduced live (non-AC, non-blocking, already tracked → V-2)

- **F-T8-2 (LOW, Medium-noise):** `confirm` of an OWN-scoped key that was never uploaded → `500 {"Internal server error"}` (uncaught storage-stat on missing object). Should catch → 404/400. Reproduced directly. Does not touch any AC; no data leak.
- **F-T8-1 (LOW):** malformed userId. A plain non-UUID string `not-a-uuid` degrades gracefully → `404 "User has no avatar"` (better than the finding implied); the 500 is specific to NUL-byte / driver-rejected input (needs `ParseUUIDPipe` → 400). Narrower than "any malformed," still LOW, no leak.

Both are drift-free against the spec (spec ACs never asserted these paths) — they are spec GAPS the wave didn't anticipate, correctly parked, not deployed-behavior divergence.

## Journey-map continuity (v0.25) + F1 caveat

The map accurately reflects deployed state: line 90-92 (wave-4 section, updated) documents presign/confirm 200-not-503, the NEW public `GET /users/:userId/avatar` 302→presigned render, and the CRUX-proven-live note. Endpoint inventory matches what I probed.

**F1 (profile-settings entry button dead → avatar upload UI unreachable by real users):** this is a REAL UX dead-end, NOT a semantic drift. It is a spec-SCOPE gap — every AC in this wave's contract is backend/HTTP-level (presign, confirm, render, attachment); none asserts the settings-page entry button, and the spec explicitly scoped the wave as "wire creds + verify both upload paths." The backend crux works through the app's real fetch pipeline; the wave delivered exactly its ACs. Flag stands for a follow-up frontend task (already filed), and it is honest that a real user cannot yet reach avatar upload through the UI. It does not block THIS wave's spec-conformance verdict. Separately, M7 does not fully close regardless (sibling Resend task `a1299e88` still founder-blocked).

## Drift vs gap summary

- **Semantic drift (deployed diverges from spec wording):** NONE found. Every AC's deployed behavior matches the contract, including the presigned-expiry values (avatar 300s, attachment 3600s), the 413 codes, the 400 allowlist, and the 401 guard-first doors.
- **Spec gaps (spec didn't anticipate):** F1 UI-reachability (out-of-scope, flagged), F-T8-1/-2 500-on-malformed / 500-on-missing-object (LOW, parked). All correctly triaged to V-2 / follow-up.

**Recommendation:** APPROVE at V-1. Route F-T8-2 (confirm-missing-object 500) and F1 (dead settings entry button) to V-2 triage / frontend follow-up; neither gates this wave. Consult @task-completion-validator only if the parent wants the UI-entry path itself proven (it is knowingly out of scope here).
