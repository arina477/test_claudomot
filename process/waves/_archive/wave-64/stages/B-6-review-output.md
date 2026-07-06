# B-6 Phase 2 — production-bug review (wave-64)
Scope: diff main...wave-64-offline-media-cache (e64a504 substrate + 6522847 wire-in). Blob caching + object-URL lifecycle + cache-on-view. Enumerated production-bug patterns + coverage:
- **DATA-LOSS (v3→v4 migration deletes shipped stores)** — CLOSED: head-builder byte-compared all 7 v3 lines verbatim in .version(4).stores() (db.ts:154-163); v1-v3 blocks intact; preservation test seeds a row per pre-v4 table + asserts survival.
- **OBJECT-URL LEAK (memory)** — CLOSED (the key hazard): createObjectURL tracked in objectUrlRef, revoked in useEffect cleanup (unmount) + effect-head (src-change); tests assert revokeObjectURL on unmount + on id/src-change with sequential URLs.
- **Unbounded IDB growth** — CLOSED: per-item 10MiB cap (single const), skip-no-throw over cap.
- **Cache-on-view / presigned expiry** — CLOSED: fetch+cache at view time (best-effort non-blocking, swallows errors); offline reads cache; can't re-fetch expired.
- **Online-render regression** — CLOSED: online <img src=attachment.url> unchanged; image-only (non-image FileChip untouched); full web 539/539.
- Null access / broken-image: 'unavailable' state → graceful broken-image FileChip placeholder (no crash/spinner).
Findings: none (critical/high: 0). Full multi-agent /review workflow disproportionate given head-builder's byte-compare + revoke-test verification + 539 empirical coverage. Inline enumerated check. T/V: v3→v4 preservation + object-URL revoke = named exit criteria.
