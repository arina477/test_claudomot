# B-3 Frontend — wave-64 (multi-spec, 2 commits)
Executor: react-specialist (3a substrate ad09be68cc2f03449; 3b wire-in ae7e8bb070b77c8ed).
- **3a substrate (task a1b9b06b, commit e64a504):** db.ts Dexie v4 — .version(4).stores() re-states 7 v3 tables VERBATIM + cachedAttachmentBlobs 'id, cachedAt'; v1-v3 blocks preserved. types.ts CachedAttachmentBlob {id,blob:Blob,contentType,filename,sizeBytes,cachedAt}. cache.ts get/putCachedAttachmentBlob (put skips if >10MiB MAX_CACHED_BLOB_BYTES, no-throw). attachment-blob-cache.test.ts: 12 tests incl v3→v4 PRESERVATION (all 7 prior tables' rows survive) + size-cap + Blob round-trip. Deviation: jsdom Blob structured-clone reconstructs Blob as {} (size/type getters absent) → test asserts blob-present + sizeBytes scalar round-trip (production browser IDB round-trips Blobs fully) — documented.
- **3b wire-in (task 83aa28e4-af9d, commit 6522847):** useCachedAttachmentImage hook (discriminated union {kind:url|objectUrl|unavailable, src}). Online → <img src=attachment.url> + best-effort fetch(url).blob()→putCachedAttachmentBlob at view time (presigned 1h TTL, non-blocking, swallows errors). Offline/fail → getCachedAttachmentBlob(id)→URL.createObjectURL. **Object-URL REVOKE:** useEffect revokes prior URL on src-change + cleanup revokes on unmount (via objectUrlRef). Wired into AttachmentRender (BOTH thumbnail + lightbox use resolved src). IMAGE-only (isImageType); non-image FileChip unchanged; never-cached→broken-image FileChip placeholder. attachment-image-cache.test.tsx: 7 tests incl revoke-on-unmount + revoke-on-src-change + write-through + offline-render + placeholder + FileChip-passthrough. Deviation: hook at useCachedAttachmentImage.ts (not .tsx); removed old broken/onError state (superseded by 'unavailable').
Results: web tsc exit 0; full web vitest 539/539; biome clean.
```yaml
specialists: [react-specialist x2]
commits: [e64a504, 6522847]
deviations: [jsdom Blob-clone test-env workaround; hook naming]
```
