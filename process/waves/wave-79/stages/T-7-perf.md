# T-7 — Perf (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Verdict: SKIPPED.**

## Skip reasoning
`wave_type` does NOT include `heavy`. Per T-7 skip condition + judgment path:
- The crypto work is **client-side and bounded**: a one-time ECDH-P256 keypair generation on first DM use + per-message AES-GCM encrypt/decrypt of a short text envelope. Web-Crypto (SubtleCrypto) is a native, hardware-accelerated browser primitive — per-message cost is sub-millisecond and O(message length), not a render-path or bundle-bloat risk.
- No new heavy route, no new dependency (SubtleCrypto is native; `dexie` was already in apps/web). Bundle delta is a small module set, not a >50KB dep.
- Two new API endpoints (PUT/GET encryption-key) are single-row upsert/select — not hot-path or N+1 candidates. The server never decrypts (passes ciphertext through), so no added server CPU per message.
- No perf budget declared at risk in `command-center/principles/test-layer-principles/T-7.md`.

The post-deploy performance signal for this wave is the T-5 live E2E (message send + decrypt observed responsive; optimistic render intact) and the C-2 healthy deploy. No load-test warranted at MVP scale (0 real users).

```yaml
test_pattern: skipped
skipped: true
skip_reason: "crypto is client-side (native Web-Crypto) + bounded; no heavy route, no new dep, no perf-sensitive area touched; single-row key endpoints; server never decrypts"
bundle_delta: null
vitals: null
api_latency: null
heavy_wave_probes: null
fix_up_cycles: 0
findings: []
```
