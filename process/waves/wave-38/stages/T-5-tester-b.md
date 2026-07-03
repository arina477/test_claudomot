# T-5 Tester B — Wave-38 Storage Go-Live (Partition B: avatar negatives + attachment activation)

**Target:** PRODUCTION — web `https://web-production-bce1a8.up.railway.app`, API `https://api-production-b93e.up.railway.app`
**Fixture:** `studyhall-e2e-fixture@example.com` (userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`, email-verified)
**Date:** 2026-07-03
**Storage backend observed live:** Tigris / `t3.storageapi.dev`, bucket `studyhall-avatars-ngavql0` (private; message attachments served via presigned-GET `X-Amz-*` URLs, 1h expiry)

## Method note — browser blocker + API fallback

**The Playwright MCP browser could NOT be used.** Every instance (playwright-1…10) is hardwired to
channel `chrome` → `/opt/google/chrome/chrome`, which is absent. It cannot be installed:
no `sudo`/root, `/opt` and `/usr/bin` are root-owned/unwritable, and `npx playwright install chrome`
fails at "Switching to root user … su: Authentication failure". The bundled Playwright chromium
(`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) launches fine (exit 0), so the fix is
**host-side MCP reconfig** (drop the `chrome` channel → use bundled chromium) OR install branded Chrome
as root. This blocks browser E2E for ALL sibling testers, not just this partition. **No `browser_close`
was ever issued (browser never opened).**

To avoid losing all signal, I ran **API-level black-box tests against production** (standard QA fallback)
exercising the identical presign → PUT → confirm → send → GET flows the browser UI drives. Auth: real
SuperTokens EmailPassword signin (header token transfer, `Authorization: Bearer <st-access-token>`),
`GET /me` → 200 verified. The only assertions I could NOT execute live are the *in-browser* pieces
(client-side rejection toast render; `<img>` visually painting) — those are instead **code-verified +
unit-test-verified** and noted per-AC below.

## Verdict table

| AC | Scenario | Verdict | Where enforced | Key evidence (live, prod) |
|----|----------|---------|----------------|---------------------------|
| **AC4** | Oversize avatar (4.3 MB) rejected; avatar unchanged | **PASS** (server proven live 2×; client-side code+unit verified, not browser-executed) | Dual-layer: client `ProfilePage.tsx:224` + server 413 | presign 200 → PUT 200 → **confirm 413 `AVATAR_TOO_LARGE`**; `avatarUrl` stays `null` |
| **AC6** | Message attachment (480 KB png) uploads + posts + renders | **PASS** (2× consistent, not flaky) | — | presign **200 (not 503)** → PUT 200 → confirm 200 → send **201** → attachment `url` GET **200 image/png, byte-identical** |
| **AC6-neg** | Oversize attachment (12 MB) rejected | **PASS** | Dual-layer: client `MessageComposer.tsx:337` (10 MB) + server 413 | PUT 200 → **confirm 413 `ATTACHMENT_TOO_LARGE`** ("≤ 10 MB. Uploaded file is 11723 KB") |

## AC4 — oversize avatar rejected (2 runs, identical)

Flow: `GET /profile` (baseline `avatarUrl: null`) → `POST /profile/avatar/presign {contentType:image/png}`
→ PUT 4.3 MB PNG to Tigris → `POST /profile/avatar/confirm {key}` → `GET /profile` (after).

```
[0] baseline      GET /profile           200   avatarUrl: null
[1] presign       POST .../presign       200   key: avatars/<uid>/<uuid>.png, uploadUrl → https://t3.storageapi.dev
[2] storage PUT   PUT <presigned>        200   (presigned-PUT carries NO size limit — expected)
[3] confirm       POST .../confirm       413   {"code":"AVATAR_TOO_LARGE","message":"Avatar must be ≤ 2 MB. Uploaded file is 4221 KB."}
[4] after         GET /profile           200   avatarUrl: null   ← UNCHANGED, avatar not persisted
```
Run 2: identical (presign 200 / PUT 200 / confirm **413 AVATAR_TOO_LARGE**). **Not flaky.**

**Where rejection happens — TWO layers:**
1. **Client-side (primary UX):** `apps/web/src/pages/ProfilePage.tsx:224` `if (file.size > 2*1024*1024)` →
   shows *"Image must be smaller than 2 MB."* and **does not call presign**. Covered by unit test
   `auth-pages.test.tsx` ("rejects avatar files larger than 2 MB without calling the API"). A normal
   browser user is stopped here — no network request at all. *(Not browser-executed this run due to the
   MCP blocker; code + unit test confirm it.)*
2. **Server-side (enforced backstop) — PROVEN LIVE:** even bypassing the JS check (direct API, as done
   here), `POST /profile/avatar/confirm` issues a HeadObject and returns **413 `AVATAR_TOO_LARGE`**; the
   avatar URL is never persisted. Note the presigned **PUT itself returns 200** (S3-compat presigned-PUT
   cannot carry a `ContentLengthRange` — that's presigned-POST only), so the object does land in the
   bucket transiently but is never linked to the profile. This matches the code comments in
   `files.controller.ts` / `files.service.ts:187`.

## AC6 — message attachment upload + render (the activation-verify) — 2 runs, identical

Fresh server + text channel created by the fixture (`d4262442…` / channel `472cb2fd…`).
Flow: presign → PUT 480 KB png → confirm → `POST /channels/:id/messages {content, idempotencyKey, attachments:[…]}`
→ read delivered message DTO → GET the attachment's presigned `url`.

```
[1] presign     POST .../attachments/presign   200   NOT 503  (storage IS configured) key: attachments/<chid>/<uuid>.png
[2] storage PUT PUT <presigned>                200
[3] confirm     POST .../attachments/confirm   200   {key,filename,contentType:image/png,sizeBytes:480613}  (server-derived size)
[4] send        POST .../messages              201   msgId 8763136a-…; attachments:[{id,filename,contentType,sizeBytes:480613,url:<presigned-GET>}]
[5] render/dl   GET attachments[0].url         200   content-type image/png, size 480613, BYTE-IDENTICAL to source
```
The delivered message DTO carries a **presigned-GET URL** (`messages.service.ts` `resolveAttachmentUrl`,
host `t3.storageapi.dev`, `X-Amz-Expires=3600`) — this is exactly what the `<img>` in the message list
loads. It resolved **200 with the exact original bytes**, proving the attachment both **uploads and
renders**. Run 2 identical (presign 200 / PUT 200 / confirm 200 / send 201 / download 200 image/png).
**Not flaky.** This confirms message attachments — previously shipped-but-dormant — are **now live**.

## AC6 negative — oversize attachment (12 MB) rejected

```
[1] presign  200 (key issued)
[2] PUT 12MB → storage  200
[3] confirm  413  {"code":"ATTACHMENT_TOO_LARGE","message":"Attachment must be ≤ 10 MB. Uploaded file is 11723 KB."}
```
Dual-layer, same pattern as avatars: client guard `MessageComposer.tsx:337` (`MAX_ATTACHMENT_BYTES = 10 MB`
→ "Too large (max 10 MB)", blocks before presign) + server-side 413 backstop **proven live**. **PASS.**

## Findings / notes

1. **Storage is genuinely live.** presign returns 200 (not `503 STORAGE_NOT_CONFIGURED`) for both avatars
   and attachments; PUTs to Tigris succeed; HeadObject size enforcement works; presigned-GET download of an
   attachment returns the exact bytes. Both formerly-dormant surfaces are activated.
2. **Size caps are server-enforced, not just client-hinted.** Both 413 paths (avatar 2 MB, attachment
   10 MB) fire server-side via HeadObject even when the client JS guard is bypassed — a real security/abuse
   backstop, not cosmetic. Avatar is not persisted on rejection (`avatarUrl` stayed `null`).
3. **Transient oversize object lands in the bucket.** Because presigned-PUT can't carry a size condition,
   an oversized blob is written to storage before `confirm` rejects it (never linked to any row/profile).
   Not a functional bug (matches documented design), but a minor housekeeping note: rejected oversize
   objects are orphaned in the bucket with no observed cleanup. Low severity / cosmetic.
4. **Attachment MIME allowlist** (server + client): `image/png, image/jpeg, image/webp, image/gif,
   application/pdf, text/plain`. Avatar presign allowlist is narrower: `image/png, image/jpeg, image/webp`.

## Coverage gap (blocker-induced, for T-9 / re-run)

Not executed live, pending a working browser MCP: (a) the client-side rejection **toast rendering**
in-page for oversize avatar/attachment; (b) the attachment **`<img>` visually painting** in the message
list; (c) drag-drop / paperclip file-chooser interaction. All three are code- + unit-test-backed; the
underlying network behavior they depend on is proven live above. Recommend a browser re-run once the MCP
`chrome` channel is fixed host-side.
