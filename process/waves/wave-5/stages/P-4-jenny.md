# P-4 Phase 2 — Spec-drift verification (jenny)

**Wave:** 5 — M1 foundation hardening (multi-spec, 6 blocks)
**Verifier:** jenny (independent spec↔decision alignment)
**Date:** 2026-06-29
**Inputs read:** wave-5 spec contract (tasks.839af17f description, all 6 blocks) · `process/waves/wave-5/stages/P-3-plan.md` · `command-center/product/product-decisions.md` (2026-06-29 "a bit of both" ruling L139-140 + N-1 reconciliation L142-143) · `command-center/dev/architecture/_library.md`

---

## VERDICT: APPROVE

All 6 spec blocks faithfully decompose the founder-named M1-hardening direction. Each AC traces to a settled decision (founder ruling, wave-4 fold-in, wave-3 remediation, or locked architecture). No spec-drift, no gold-plating, no M2+ scope pulled forward. The one excluded item (Resend-domain a1299e88) is correctly excluded per the founder ruling + N-1 reconciliation. The known horizontal-scaling concern on the in-memory throttler is a documented H2 deferral, not a drift.

---

## Bundle faithfulness vs the 2026-06-29 "a bit of both" ruling — MATCHES

The ruling (product-decisions.md L139-140) reads: M1 priorities = login rate-limiting (839af17f) + finish avatar storage (84e09891); lower-value follow-ups (branch-protection 478e9d43, CI node-20 a7667fb7, version e38c306e, browser-E2E c51589cd) "stay tracked, folded in around the work"; THEN M2 servers/channels → M3 messaging.

The wave-5 spec's `claimed_task_ids` = exactly `[839af17f, 84e09891, e38c306e, a7667fb7, 478e9d43, c51589cd]` — the 2 founder-named priorities + the 4 named follow-ups, nothing else. This is a literal match to "priorities + folded-in follow-ups."

- **Resend-domain (a1299e88) EXCLUDED** — MATCHES. Not in `claimed_task_ids`. The spec head note explicitly states it "remains, non-blocking" as "a pure founder-DNS item." The N-1 reconciliation (L143) lists a1299e88 among items that "stay tracked under M1." _library R-SDK-2 (L596) confirms it is a founder DNS action (SPF/DKIM/MX records), standalone from code work. Correct exclusion — no conflicting decision.

## Item 1 — 839af17f Auth rate limiting — MATCHES

- AC1: "@nestjs/throttler, in-memory store (single-pod MVP per _library L423 — NO Redis), ~10 req/min per IP." Verified against _library Services § Rate limiting (L113): "10 req/min on auth endpoints." Verified against _library DevOps § "No Redis at MVP" (L423): distributed rate-limit store is an explicit **H2 upgrade trigger (c)**, and Redis is named in the Stack § "Deferred to H2" (L43). In-memory is therefore the *decided* MVP path — faithful, **not** drift.
- The horizontal-scaling limitation of an in-memory throttler (the Gemini-class concern: per-pod buckets don't share across replicas) is the **same documented H2 deferral** — single api pod at MVP (_library L423 trigger (a) multi-replica api). Not a spec gap.
- AC2 (429 on exceed, live probe >10 rapid signins) + AC3 (/health + non-auth exempt) are verifiable, non-happy-path ACs. Edge-cases (window reset, 429 leaks no internal state) align with security scope. Security-tightened gate correctly flagged → T-8 mandatory (matches always-on auth-surface rule).

## Item 2 — 84e09891 Avatar storage completion — MATCHES

- AC1 creds (`AWS_ACCESS_KEY_ID/SECRET/AWS_ENDPOINT_URL/AWS_REGION=auto/STORAGE_BUCKET_NAME`) match _library DevOps env block (L386-390) + resolved decision #16 (L583) verbatim.
- AC3 "Server-side 2MB enforcement (the wave-4 AC7 fold-in)" — MATCHES the wave-4 V-2/jenny AC7 fold-in. Also independently anchored in _library Security § File uploads (L321) "size cap (2 MB avatars...)" + resolved decision #15 (L582) "2 MB avatar... Enforced server-side at pre-sign endpoint." The spec's "presigned POST content-length-range OR bucket policy, not just client-side" is the correct server-side mechanism.
- **Intentional deferral (not gap):** AC edge-case "creds pending → presign 503 graceful" + the wave note "CREDENTIAL-GATED (founder bucket pending)" correctly model the founder-pending dependency surfaced in N-1 reconciliation (L143). Build/verify gated on founder creds; the other 5 ship independently. Faithful.

## Item 3 — e38c306e API version alignment — MATCHES

AC ("/health reports real package version, not the hardcoded 0.1.0 fallback") is a genuine M1 foundation-correctness fix (the /health surface shipped in waves 1-2). Named in the founder ruling as a folded-in follow-up. No architecture conflict. Verifiable AC with edge-case (env unset → still package version). No gold-plating.

## Item 4 — a7667fb7 CI Node-20 deprecation — MATCHES

AC (bump ci.yml action versions clearing Node-20 deprecation; all 5 jobs stay green) is foundation CI hygiene, named in the founder ruling. Aligns with _library DevOps CI (`actions/setup-node@v4`, L355) and the wave-1 Node-22 standardization decision (product-decisions L119-125). Note: spec says "all 5 jobs" — consistent with item-6's added E2E job + the existing lint/typecheck/test/build (+gitleaks per resolved decision #18); job count is plan-internal, not a drift. No conflict.

## Item 5 — 478e9d43 Branch protection on main — MATCHES

AC ("main requires PR + passing CI; direct pushes blocked; closes the eed4c3c direct-push gap") directly remediates the wave-3 process-deviation (the eed4c3c direct-push). This is genuine foundation/process hardening, named in the founder ruling. Edge-case correctly preserves the brain's own PR→squash-merge flow (matches product-decisions L92 "squash merge"). Enabled via gh API (orchestrator/head-ci-cd ops per P-3). No conflict.

## Item 6 — c51589cd CI browser E2E (Playwright chromium) — MATCHES

AC (a CI job installs chromium + runs a minimal Playwright smoke asserting the login page renders; the browser-E2E coverage deferred across waves 1/3/4) is foundation test-coverage completion, named in the founder ruling. Aligns with _library Test § T-5/Playwright (L437, L478-482) and resolved decision #13 (L580, "CI runs ... e2e ... jobs"). Edge-case (gated/non-flaky, targets live/preview URL) is correctly scoped to a **minimal smoke**, not a full F1-F9 swarm — no gold-plating. P-3 correctly flags the ci.yml conflict with item-4 (node-20) and calls for serialization.

---

## Scope-discipline checks

- **No M2+ scope pulled forward** — MATCHES. No servers/channels/membership (M2) or messaging/realtime (M3) in any block. Avatar (item 2) is M1 UsersModule/FilesModule (profile completion), not M2. All 6 are M1.
- **No gold-plating** — MATCHES. No Redis (item 1 stays in-memory), no CDN (item 2 uses existing Railway Buckets presign), no full E2E swarm (item 6 is a single smoke). The throttler limit, file-size mechanism, and E2E scope are all the minimum that satisfies the AC.
- **All 6 are genuine M1-hardening** — MATCHES. Two are founder-named priorities (security + profile completion); four are foundation hygiene/coverage/process remediation. None is a new product feature.

## Drift / gap / deferral ledger

| Item | Classification | Notes |
|------|----------------|-------|
| In-memory throttler horizontal-scaling limit | **Intentional deferral** (H2) | _library L423 trigger (a)/(c) + L43 Redis-to-H2. Single-pod MVP. Not drift. |
| Avatar founder Railway Bucket creds | **Intentional deferral** (founder-pending) | N-1 reconciliation L143; build/verify gated, graceful 503 until provided. |
| Resend-domain a1299e88 | **Intentional exclusion** (standalone founder-DNS) | Founder ruling L140 + N-1 L143 "stay tracked"; _library R-SDK-2. Correctly NOT in bundle. |
| All other ACs | **No drift / no gap** | Each AC traces to a settled decision or locked architecture line. |

No spec-drift found. No unexplained spec-gap found.

---

## Recommendation

APPROVE for P-4 gate. Hand to head-product for the head-X gate verdict. Downstream:
- Security-tightened gate APPLIES (item 1 is the auth surface) → T-8 is mandatory; confirm at the T-block.
- @task-completion-validator at V-block to confirm the rate-limit live 429 probe and the avatar end-to-end flow actually work (both have live-behavior ACs the spec marks as probes).
- Watch the ci.yml serialization between items 4 (node-20) and 6 (E2E) called out in P-3 L13 — a coordination item, not a spec issue.
