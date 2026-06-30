# B-6 Phase-2 Review — wave-19 M3 Attachments

Branch: `wave-19-m3-attachments` vs `main`. READ-ONLY review. Severity-bucketed.

Repo state at review: typecheck/build green, api 328 + web 151 pass. Phase-1 APPROVED after H-1 (composer allowlist narrowed to 6 server types).

---

## CRITICAL

### C-1 — Send-time attachment descriptor is fully client-trusted; confirm is advisory-only (size + content-type cap bypassable, key-channel scoping not re-checked at send)

The `/confirm` endpoint (`attachments.controller.ts:135-179`) is the only place size (HeadObject ≤10MB) and key-channel scoping are enforced. But `confirm` creates NO DB row (row-at-send) — it just returns a `ValidatedAttachment` `{ key, filename, contentType, sizeBytes }`. That descriptor is a plain client-controlled object: `ValidatedAttachmentSchema` (`packages/shared/src/messaging.ts:39-45`) validates only types, not provenance.

At send, `messages.service.ts:431-443` (createMessage) and `:966-978` (createReply) INSERT the attachment row using the client values **verbatim** — `object_key: a.key`, `content_type: a.contentType`, `size_bytes: a.sizeBytes` — with no re-validation. There is no check that:
- `a.key` is scoped to `attachments/<channelId>/` (the confirm-time guard at `attachments.controller.ts:154` is NOT repeated at send), and
- the object actually exists / was ever confirmed / matches the claimed size + content-type.

A client can skip `/confirm` entirely and POST `/channels/:channelId/messages` with a hand-crafted `attachments[]`. Concrete exploits:

1. **Size-cap bypass:** send `sizeBytes: 500` for a 50MB object actually PUT to storage (presign has no size condition — `files.service.ts:244-248` PUTs without ContentLengthRange). The 10MB cap (the stated AC) is never enforced on the persisted row; the DTO will display the false size. The real object lives in the bucket at full size.

2. **Content-type spoofing:** send `contentType: 'image/png'` for any object. The render path (`MessageList.tsx` AttachmentList) trusts `contentType` to decide inline-image vs file-chip; `resolveAttachmentUrl` re-signs whatever `object_key` is stored. Combined with (3) this is the real risk.

3. **Cross-channel key swap at SEND (the IDOR the confirm guard was meant to stop):** the confirm guard blocks confirming a key for a channel you can't see, but a member of BOTH channel A and channel B can confirm a key in A, then SEND it attached to a message in B (or never confirm at all and craft `attachments/<A>/...`). Because send-time does NOT check `a.key.startsWith('attachments/' + channelId + '/')`, the stored `attachments.object_key` can point at an object scoped to a different channel. Since `resolveAttachmentUrl` signs the raw `object_key` and the message DTO is channel-gated by membership of the message's channel, this lets a user surface, in channel B, a presigned-GET URL for an object that was uploaded under channel A's prefix. The `attachments.channel_id` column is written from the route `channelId` (correct) but `object_key` is not constrained to match it — they can diverge.

The single load-bearing guard (key prefix `attachments/<channelId>/`) exists at confirm (`attachments.controller.ts:154`) and is unit-tested (`attachments.controller.spec.ts:205-227`), but is structurally bypassed because nothing forces a send to have gone through confirm, and the same guard is absent at send.

**Fix direction (root cause, not patch):** re-validate every `ValidatedAttachment` inside the send transaction before INSERT — minimally `a.key.startsWith('attachments/' + channelId + '/')` (reject 400 otherwise), and re-derive `size_bytes` + `content_type` from a server-side HeadObject (or sign+store a short-lived confirm token in confirm and require it at send) rather than trusting the client body. The "row-at-send / no row at confirm" design is sound only if send re-establishes the confirm invariants; today it does not.

---

## HIGH

### H-1 — Path-traversal / sibling-prefix in confirm key guard
`attachments.controller.ts:154` uses `key.startsWith('attachments/' + channelId + '/')`. `channelId` is the route param (a string, not validated as UUID at the controller). Two concerns:
- No traversal normalization: a key like `attachments/<channelId>/../<otherChannelId>/x.pdf` passes `startsWith` and is then handed to S3 `HeadObject`/`GetObjectCommand` raw. Most S3-compatible stores treat `..` literally (not a real bypass on Tigris/R2), but the key is also persisted and later re-signed verbatim — defense-in-depth wants the key validated against a strict pattern (`^attachments/<uuid>/<uuid>\.<ext>$`) rather than a prefix check.
- `channelId` is not constrained, so `attachments/<channelId>/` where `channelId` itself contains attacker text is accepted. Combined with C-1's missing send-time check this widens the surface. Tighten to a regex anchored on the channel UUID + a single path segment.

### H-2 — Presigned-PUT accepts arbitrary object size (no content-length condition) and presign does not bind the eventual size to the cap
`files.service.ts:217-255` issues a presigned PUT with only `ContentType` — no `ContentLengthRange` (correctly noted as a presigned-POST-only feature). The intended compensating control is the confirm-time HeadObject. Given C-1, the compensating control is not actually on the persistence path. Independent of C-1, this means a presigned URL can be used to upload an object of unbounded size into the bucket (storage-cost / abuse vector) even if it is never attached. Consider presigned-POST with a policy, or a lifecycle rule to reap unconfirmed/unreferenced objects. (Pre-existing pattern shared with avatars, but attachments raise the cap 5x to 10MB and add per-channel volume.)

---

## MEDIUM

### M-1 — `attachments.channel_id` and `object_key` can diverge with no DB-level constraint
`attachments.ts` stores `channel_id` (from route) and `object_key` (from client) independently. Nothing (schema or app) enforces that `object_key` is under `attachments/<channel_id>/`. This is the storage-layer manifestation of C-1; even after the C-1 app fix, there is no invariant in the schema. A CHECK constraint is awkward (cross-column string match) but worth a comment + the app-side guard being the sole enforcement point being made explicit. Low data-integrity exposure today, but it makes the C-1 fix the only thing standing between correct and corrupt rows.

### M-2 — `resolveAttachmentUrl` returning null silently yields `url: ''` → renders as broken
`messages.service.ts:299` falls back to `url: ''` when storage is unconfigured. `MessageList.tsx` image path will `onError → broken chip` (handled), but the file-chip path renders an anchor to `''`. Graceful-degradation intent is fine; confirm the file-chip with empty `url` doesn't render a clickable dead link (should disable/omit the href when `url === ''`). Verify in `FileChip`.

### M-3 — No integration/e2e coverage for the attachment HTTP path (guards exercised only by direct instantiation)
`attachments.controller.spec.ts` uses direct instantiation, so `@UseGuards(AuthGuard)` and the NestJS request pipeline are not exercised end-to-end; the rule-4 403 is verified only via the controller's own `canViewChannelById` call (which IS genuinely tested — `:73-85`, `:189-201`). Acceptable for unit scope, but there is zero test that a non-member is actually rejected through the wired controller+guard, and zero test for the C-1 send-time path. Add at least one integration test sending a forged `attachments[]` (mismatched key/size) to lock in the C-1 fix once applied.

---

## LOW

### L-1 — Optimistic + socket double-render window
`useMessages.ts`: the sender's own message can arrive via socket `message:new` (added to realMessages by id) before the POST response resolves and removes the optimistic row (`:299`). Both the real and optimistic rows are visible until the POST resolves. Id-dedup prevents a permanent duplicate; the window is brief and self-heals. Pre-existing pattern, not attachment-specific.

### L-2 — `presignAttachmentUpload` accepts `_userId` but ignores it
`files.service.ts:217-221` documents the deliberate omission of userId from the key (channel-scoped is sufficient, authz at controller). Reasonable; flagging only because the parameter is dead — consider dropping it for clarity, or keep for symmetry with avatars. No security impact.

### L-3 — `humanSize`/progress are cosmetic-only; `sizeBytes` shown to user is client-reported pre-confirm
Composer staged tiles show `f.sizeBytes` from `file.size` (client). After C-1 fix, the persisted/displayed size should be the server HeadObject value (already returned by confirm as `sizeBytes`). Ensure the rendered DTO size is server-authoritative (it is, post-fix) — no action beyond C-1.

### L-4 — Migration 0009 is additive and correct
`0009_narrow_carnage.sql`: `message_id` NOT NULL + FK ON DELETE CASCADE (no orphan on message delete — verified), `channel_id` ON DELETE CASCADE, `uploader_id text` matches `users.id` (text PK), INDEX(message_id) present. No issues. Atomicity verified: createMessage/createReply wrap message+attachment INSERT in `db.transaction` with `isNewInsert` guard so idempotent replay does not double-attach (`messages.service.ts:431`, `:954-979`); attachment INSERT cannot commit without the message (same txn), and `message_id` NOT NULL prevents orphans.

---

## Verdict inputs (head-builder owns the gate)

- Rule-4 authz at presign + confirm: **PASS** — channel-membership via `canViewChannelById`, 403 negative path genuinely tested at both endpoints, key-scoping IDOR tested at confirm.
- Row-at-send atomicity / no-orphan / no-double-attach / FK cascade: **PASS**.
- Frontend (lightbox focus-trap/Esc/restore, img onError fallback, tombstone hides attachments, broken-send guard, optimistic reconcile): **PASS** (L-1 minor).
- **Size cap + content-type + cross-channel scoping ENFORCED end-to-end: FAIL** — see C-1/H-1/H-2. The stated ≤10MB AC and the cross-channel IDOR guard are bypassable because send-time trusts the client descriptor and does not re-establish the confirm invariants.

**C-1 (Critical) + H-1/H-2 (High) require B-6 re-entry.**

Relevant files:
- `/home/claudomat/project/apps/api/src/messaging/messages.service.ts` (lines 431-443, 966-978 — send-time INSERT, no re-validation)
- `/home/claudomat/project/apps/api/src/files/attachments.controller.ts` (lines 154-178 — confirm key guard, advisory-only)
- `/home/claudomat/project/apps/api/src/files/files.service.ts` (lines 217-255, 270-320)
- `/home/claudomat/project/packages/shared/src/messaging.ts` (lines 39-45, 186-196 — ValidatedAttachment is type-only validation)
- `/home/claudomat/project/apps/api/src/db/schema/attachments.ts`
- `/home/claudomat/project/apps/api/src/files/attachments.controller.spec.ts`

---

# B-6 Phase-2 RE-REVIEW (iteration 2) — wave-19 M3 Attachments

Branch `wave-19-m3-attachments` @ `05fb706`. READ-ONLY. Verifies the C-1 (Critical) + H-1/H-2 (High) fixes from iteration 1. Repo green confirmed locally: messaging spec 58 + attachments spec 19 = 77 pass (full suite reported api 338 / web 151, typecheck/build clean).

## CRITICAL

**None.** C-1 cleared.

### C-1 — VERIFIED CLEARED (send-time descriptor now fully server-re-validated)

Root cause was: send-time INSERTed client-supplied `object_key` / `contentType` / `sizeBytes` verbatim, with `/confirm` only advisory. The fix introduces `validateAndHeadAttachments()` (`messages.service.ts:349-411`), invoked in BOTH `createMessage` (`:467-471`) and `createReply` (`:1023-1027`) BEFORE `db.transaction` opens. Per descriptor it:

1. **Cross-channel IDOR (key-swap) — CLOSED.** Anchored regex `^attachments/<escapedChannelId>/[A-Za-z0-9._-]+$` (`:364-365`) built from the message's ACTUAL `channelId` (route-derived in createMessage; for createReply the param is already proven `=== parent.channel_id` at `:992` before this runs). A key under another channel's prefix fails `.test()` → `BadRequestException` (400) at `:376-380`. The character class excludes `/` and `.` sequences, so `..` and nested slashes cannot pass.
2. **Size-bypass — CLOSED.** `filesService.headAttachment(key)` (`:383`) returns the SERVER `ContentLength`; `>10MB` → `PayloadTooLargeException` (413) at `:388-393`. Client `sizeBytes` is discarded.
3. **Type-spoof — CLOSED.** Server `ContentType` checked against `ATTACHMENT_ALLOWED_MIME` (`:396`); not-in-allowlist → 400 at `:397-400`.
4. **Persisted INSERT uses server-derived values.** Both INSERT sites (`createMessage:548-558`, `createReply:1093-1103`) map `content_type: a.contentType` + `size_bytes: a.sizeBytes` from the `validated[]` entries, which carry the HeadObject values (`:405-406`), NOT the client body. `object_key: a.key` is the regex-validated key. Can a client skip `/confirm` and forge a send? No — the send path itself now re-establishes every invariant; `/confirm` is genuinely advisory and bypassing it changes nothing.

Tests assert all vectors (`messages.service.spec.ts`):
- cross-channel key → 400, headAttachment NOT called (`:1723-1742`)
- path-traversal segment → 400, headAttachment NOT called (`:1744-1761`)
- HeadObject 11MB → 413 (`:1764-1787`)
- HeadObject `video/mp4` → 400 (`:1789-1811`)
- happy path: persisted row carries server `image/png` + `204800`, NOT client's `application/pdf`/`500` (`:1813-1868`)
- createReply mirror: cross-channel → 400 (`:1909-1928`), 15MB → 413 (`:1930-1953`)

## HIGH

**None (cleared + no new).**

### H-1 — VERIFIED CLEARED (confirm key guard anchored)
`attachments.controller.ts:163-171` now builds the same anchored regex `^attachments/<escapedChannelId>/[A-Za-z0-9._-]+$` (channelId escaped at `:165`), replacing `startsWith`. Tests: path-traversal `attachments/<ch>/../other-channel/...` → 400 (`attachments.controller.spec.ts:229`), nested slash → 400 (`:243`), cross-channel → 400 (`:205`), missing-prefix → 400 (`:217`), valid key passes (`:255`).

### H-2 — VERIFIED CLEARED (documented known-debt; send is the binding gate)
`files.service.ts:244-254` carries the comment: presigned-PUT cannot carry `ContentLengthRange` (POST-only feature); an oversized object can land in the bucket but is never persisted because send-time `headAttachment()` caps the PERSISTED row at 10MB (verified above — server ContentLength gate at `messages.service.ts:388`). Oversized = abandoned/unreferenced object, never surfaced. Accepted known-debt (no GC cron this wave).

## No new Critical/High from the fix

- **headAttachment failure handling — safe (fail-closed).** Runs before `db.transaction`; a throw (503 storage-unconfigured, or S3 `NoSuchKey` for a forged/never-uploaded key) aborts the send with zero partial write — the transaction never opens. Minor nit: NoSuchKey surfaces as 5xx rather than 400 (UX, not security) — folded into L-5 below.
- **Regex escaping correct.** `channelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` escapes all regex metacharacters; UUIDs need no escaping but the guard is correct belt-and-suspenders. Identical in both controller and service.
- **Legit happy-path still associates.** Verified by the happy-path test — a valid in-channel key with a real object inserts the attachment row and the DTO carries it.
- **Atomicity + idempotent-no-double-attach intact.** Validation is OUTSIDE/BEFORE the transaction; the `isNewInsert` guard (`createMessage:547`, `createReply:1080-1092`) is untouched — attachment INSERT still fires only on a fresh insert, never on idempotent replay. message+attachment still co-commit in one `db.transaction`; `message_id` NOT NULL + FK CASCADE (L-4) unchanged.

## Carried Medium/Low — accepted, non-blocking

- **M-1** (`channel_id`/`object_key` divergence, no schema-level CHECK) — app-side `validateAndHeadAttachments` regex is now the single enforcement point; the C-1 fix makes divergence unreachable via the API. No schema constraint added. Accepted.
- **M-2** (`url:''` dead-link when storage unconfigured) — render-time, untouched by these backend fixes; FileChip empty-href guard still owed. Accepted.
- **M-3** (no integration/e2e for the wired controller+guard or the C-1 send path; covered by unit tests via direct instantiation only) — accepted; unit coverage now genuinely exercises the send-time vectors.
- **L-1** optimistic+socket double-render window — accepted (self-heals, pre-existing).
- **L-2** `presignAttachmentUpload` dead `_userId` param — accepted.
- **L-3** composer cosmetic client size pre-confirm; persisted/displayed size is now server-authoritative post-fix — accepted.
- **L-4** migration 0009 additive + correct (FK CASCADE, message_id NOT NULL, INDEX) — accepted.
- **L-5 (new, Low)** `headAttachment` NoSuchKey (forged/expired key) propagates as 5xx rather than a 400; fail-closed so no security impact, minor UX nit. Accepted non-blocking.
- **L-6 (new, Low)** createReply C-1 tests cover cross-channel + 413 but not the type-spoof-400 or happy-path-server-derived assertions present on the createMessage path; both paths call the identical `validateAndHeadAttachments` helper so the behavior is covered, but reply-path test symmetry is incomplete. Accepted non-blocking.

## Verdict inputs (head-builder owns the gate)

- C-1 (Critical): **CLEARED** — send-time re-validates channel-scope (anchored regex on real channelId) + size (server HeadObject) + type (server ContentType); persisted row is server-derived; bypassing /confirm changes nothing. Tests lock all vectors.
- H-1 (High): **CLEARED** — confirm uses anchored regex; traversal + nested-slash + cross-channel tested.
- H-2 (High): **CLEARED** — documented; send-time is the binding persisted-row size gate.
- No new Critical/High introduced; atomicity + idempotency intact; happy path associates.

**Critical: [] — High: [] — re-review PASS. C-1/H-1/H-2 cleared. Carried debt M-1/M-2/M-3 + L-1..L-6 all accepted non-blocking.**
