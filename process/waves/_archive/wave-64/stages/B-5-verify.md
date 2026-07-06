# B-5 Verify — wave-64
- web tsc --noEmit: exit 0 (full tsc run, incl new test files).
- FULL web vitest: 539/539 (35 files) — no regression from Dexie v4 or the attachment-image wire-in.
- attachment-blob-cache.test.ts: 12/12 incl v3→v4 upgrade-PRESERVATION (all 7 prior tables' rows survive — NAMED exit criterion).
- attachment-image-cache.test.tsx: 7/7 incl object-URL REVOKE-on-unmount + revoke-on-src-change (the key leak hazard).
- biome ci: clean.
verdict: PASS
