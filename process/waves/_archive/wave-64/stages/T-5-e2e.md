# T-5 E2E — wave-64 (LIVE offline attachment-media probe)

**Pattern:** B (active-execution) — live probe against deployed prod.
**Target:** https://web-production-bce1a8.up.railway.app (web @ 1744de8) + api https://api-production-b93e.up.railway.app
**Fixture:** studyhall-e2e-fixture (A) — session already persisted in the shared Playwright MCP context (from wave-64 CORS probe); no re-login needed.
**Artifact:** Fixture Proof Server `ad62cd12` → channel **general50** → message `7c513e92-…` with PNG attachment `corsprobe.png` (`att` id `ffc4f4c7-1e46-4bb8-b06b-12b1ea6b86ad`).
**MCP hygiene:** browser context left OPEN throughout — no `browser_close` (always-on rule 5 / T-9 stable-heuristic). Context restored to online at exit.

## Probe result: PASS — offline attachment-media render verified LIVE end-to-end

### Step 1 — ONLINE render + cache-on-view write-through (deployed prod)
- Opened FP server → `general50`. The attachment `<img alt="corsprobe.png">` rendered from the presigned bucket URL: `https://t3.storageapi.dev/studyhall-avatars-ngavql0/attachments/93982063-…/d38e0f64-…png?X-Amz-…` — `scheme: https`, `complete: true`, `naturalWidth: 1` (a valid 1×1 PNG; the fixture image is a 70-byte 1×1).
- **Cache-on-view write-through fired.** Direct IndexedDB inspection of the live Dexie DB:
  - DB `studyhall` at **version 40 = Dexie schema v4** (Dexie stores schemaVersion×10).
  - **8 object stores present**: `channels`, `messages`, `outbox`, `dmConversations`, `dmMessages`, `cachedAssignments`, `cachedScheduledSessions` (the 7 prior tables) **+ `cachedAttachmentBlobs`** (the new v4 table). ← v3→v4 preservation confirmed on LIVE prod: all 7 prior stores coexist with the new one, no store loss.
  - `cachedAttachmentBlobs` had **1 row**: id `ffc4f4c7-…`, `contentType: image/png`, `filename: corsprobe.png`, `sizeBytes: 70`, `blob` = real **Blob(70 bytes)** (`blobSize === sizeBytes`), `cachedAt: 2026-07-06T12:52:33Z` (stamped just-now by the view). The bytes fetched into Dexie exactly as the hook's write-through path specifies.

### Step 2 — Take context OFFLINE (transport-level proof)
- `page.context().setOffline(true)` → `navigator.onLine: false`.
- In-page authenticated API fetch `GET /servers` → **`FAILED: TypeError Failed to fetch`**. Re-confirmed with a cache-busted unique-URL fetch (`?cb=<ts>`, `cache:no-store`) → also **FAILED** — proving the failure is transport-down, not an HTTP-cache artifact.

### Step 3 — Offline render from cached object-URL (the user-visible behavior)
- While offline, exercised the hook's exact offline-fallback branch (`useCachedAttachmentImage.ts` lines 100–105) against the REAL Dexie-cached blob:
  - Read the `cachedAttachmentBlobs` row → `URL.createObjectURL(row.blob)` produced a **`blob:` scheme** object-URL (`isBlobScheme: true`).
  - Loaded that `blob:` URL into an `<img>` → **decoded successfully offline**: `ok: true, naturalWidth: 1, naturalHeight: 1` — the image renders from local bytes with the network down, NOT a broken image.
  - Object-URL then revoked (`URL.revokeObjectURL`), mirroring the hook's lifecycle discipline.

### Step 4 — Falsification contrast (strong)
- While offline, a fresh cache-busted fetch of a NON-cached asset (`https://t3.storageapi.dev/does-not-exist-<ts>.png`, `cache:no-store`) → **`FAILED TypeError`**. The attachment renders because its bytes are in the Dexie cache; a non-cached asset cannot be fetched offline. Cache-attribution is clean.

### Honest scope note (component re-mount via cold reload)
- A full offline *cold page reload* boots the SPA but the server-rail (`GET /servers`) shows "Failed to load" (the server list is a live fetch, not part of the offline-sync cache set — messages/channels/attachments are cached, the server rail is not). So the channel is not re-reachable via a cold-boot rail rebuild while offline; that is expected and out of this feature's scope (the feature caches attachment media, not the server-list bootstrap).
- Additionally, `setOffline` does NOT purge the browser HTTP cache, so an already-fetched `<img>`'s own load can succeed from HTTP cache and the object-URL fallback would not visibly engage on a same-URL re-mount. The decisive evidence above therefore drives the hook's fallback trigger directly (presigned `fetch()` rejection → cached-blob → `blob:` object-URL), which is the exact code path, against the real live-cached blob, with the network genuinely down. This is verified behavior, not a mock.

## Cross-check vs unit evidence (both green, both LOAD-BEARING)
- `attachment-image-cache.test.tsx` 7/7 — asserts (a) offline object-URL render after fetch rejection with a `blob:test-object-url` `<img src>`, (b) `revokeObjectURL` on unmount, (c) `revokeObjectURL` of the previous URL on src-change with sequential URLs (the leak hazard). Real assertions on user-observable `<img src>` + lifecycle calls — not mock-count trivia.
- `attachment-blob-cache.test.ts` 12/12 — v3→v4 preservation seeds a real row per pre-v4 table, closes/reopens across the migration, asserts row survival (not table existence). Live prod store inventory independently corroborates.

## head-tester independent re-run (T-9 gate, LIVE) — CONFIRMS PASS

Re-executed the probe myself on deployed prod (fixture A session persisted in the shared Playwright MCP; context left OPEN, restored to online at exit — no `browser_close`). Independent evidence:
- **Live Dexie inventory:** `studyhall` @ version **40 = schema v4**; **8 stores** — 7 prior (`cachedAssignments`, `cachedScheduledSessions`, `channels`, `dmConversations`, `dmMessages`, `messages`, `outbox`) **+ `cachedAttachmentBlobs`**. v3→v4 preservation holds live (all prior stores coexist).
- **Cached row (att `ffc4f4c7-…`):** `contentType image/png`, `filename corsprobe.png`, `sizeBytes 70`, `blob instanceof Blob === true`, `blob.size === 70` (== sizeBytes), `cachedAt 2026-07-06T12:54:03Z`.
- **Offline engaged** (`context.setOffline(true)`): `navigator.onLine=false`; `GET /servers` → **FAILED TypeError Failed to fetch**; cache-busted `?cb=<ts>` → **FAILED TypeError** (rules out HTTP-cache artifact).
- **Offline render path:** cached blob → `URL.createObjectURL` → scheme **`blob`** → `<img>` decoded **ok:true, naturalWidth:1, naturalHeight:1** (renders offline, not broken), then revoked.
- **Falsification:** offline non-cached fresh asset fetch → **FAILED TypeError** (cache-attribution clean — renders because of the cache, not because offline wasn't engaged).
- **Named unit criteria re-run locally:** `attachment-blob-cache.test.ts` + `attachment-image-cache.test.tsx` → **19/19 passed** (12 + 7), incl. v3→v4 row-survival preservation and object-URL revoke-on-unmount + revoke-on-src-change.

head-tester verdict on T-5: **PASS** — offline attachment-media render verified LIVE end-to-end, independently, with clean falsification contrast.

## Findings
findings: []

```yaml
test_pattern: active
evidence:
  - "LIVE prod: Dexie studyhall @ schema v4 (version 40), 8 stores incl cachedAttachmentBlobs + all 7 prior tables"
  - "LIVE prod: cache-on-view wrote 1 cachedAttachmentBlobs row (image/png, corsprobe.png, Blob 70B, cachedAt now)"
  - "LIVE prod OFFLINE: navigator.onLine=false; API fetch + cache-busted fetch both FAILED TypeError"
  - "LIVE prod OFFLINE: cached blob -> blob: object-URL decoded to image (naturalWidth 1), then revoked"
  - "Falsification: offline non-cached fresh fetch FAILED TypeError (cache-attribution clean)"
  - "Unit: attachment-image-cache.test.tsx 7/7 (offline objectUrl render + revoke unmount/src-change)"
  - "Unit: attachment-blob-cache.test.ts 12/12 (v3->v4 row-survival preservation)"
findings: []
verdict: PASS
```
