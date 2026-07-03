# Wave 38 — T-5 E2E (Pattern B — active, live prod)

Testers: 2 ui-comprehensive-tester (partition A happy/crux, partition B negatives/attachment). Ran against prod web `https://web-production-bce1a8.up.railway.app` + api `https://api-production-b93e.up.railway.app` with e2e-fixture. Each scenario run ≥2× (no flakes).

## Scenario verdicts (all trace to P-2 ACs)
| AC | Scenario | Verdict | Evidence |
|---|---|---|---|
| AC1 | presign returns 200 not 503 (authed) | PASS | POST /profile/avatar/presign → 200 (2×) |
| AC2 | PUT + confirm 200, persists avatar_url | PASS | PUT → 200, confirm → 200 returns .../users/{id}/avatar?v=hash |
| AC3 | **CRUX render — anon GET avatar_url → 200 image** | **PASS** | anon (no-cookie) GET → 302 → t3.storageapi.dev presigned → 200 image/png, valid PNG; `<img>` naturalWidth=64, paints correct color; survives reload |
| AC4 | >2MB avatar → 413, no persist | PASS | confirm 413 AVATAR_TOO_LARGE (4221KB), avatarUrl stayed null; dual-layer (client ProfilePage.tsx:224 + server backstop) |
| AC5 | bad content-type → 400 | PASS (covered) | allowlist enforced at presign (unit + contract) |
| AC6 | attachment upload→render live + ≤10MB cap | PASS | presign 200 (not 503) → send 201 → attachment presigned-GET 200 byte-identical; 12MB → 413 ATTACHMENT_TOO_LARGE (dual-layer) |
| AC7 | no storage endpoint 503 after creds live | PASS | all presign/confirm returned 200; C-2 smoke 404-not-503 |

## Findings (→ V-2)
- **F1 (MAJOR, frontend, PRE-EXISTING — not a wave-38 defect):** profile-settings entry button `button[aria-label="Your profile and settings"]` is a DEAD button (hover handlers only, no onClick; zero settings-open triggers in bundle). The avatar-upload component exists but nothing mounts it → a real user cannot REACH the avatar UI through the interface. Backend crux works (validated via the app's real SuperTokens fetch pipeline + real <img> render), but the feature is UI-unreachable. Independent earlier-wave (wave-4 era) UI wiring gap. Route to frontend; launch-relevant (avatar feature not user-reachable).
- **F2 (INFRA, test tooling):** all Playwright MCP instances hardwired to `chrome` channel (`/opt/google/chrome/chrome`, absent, root-only install) → browser E2E blocked; testers worked around via bundled playwright-core chromium (API-level + direct render). No browser_close issued. Fix: pin `--browser chromium` in .mcp.json (host-side).
- **F3 (LOW, matches documented design):** oversize blobs land in bucket transiently before confirm 413 rejects them → orphaned unreferenced objects, no GC. Documented known-debt (files.service.ts attachment comment). Non-blocking.

```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios:
  - {id: AC1, verdict: PASS}
  - {id: AC2, verdict: PASS}
  - {id: AC3-crux, verdict: PASS}
  - {id: AC4, verdict: PASS}
  - {id: AC5, verdict: PASS}
  - {id: AC6, verdict: PASS}
  - {id: AC7, verdict: PASS}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: major, scenario: F1-ui-reachability, description: "profile-settings entry button dead (no onClick); avatar UI unreachable by real users; pre-existing frontend gap"}
  - {severity: infra, scenario: F2-mcp-chrome, description: "Playwright MCP chrome channel missing; worked around via bundled chromium"}
  - {severity: low, scenario: F3-orphan-objects, description: "oversize blobs orphaned in bucket pre-confirm-reject; documented known-debt"}
```
