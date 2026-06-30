# Wave 19 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED   # after REWORK of H-1 (composer allowlist drift); code-read PASSED the 3 load-bearing checks but Phase-2 caught C-1
phase2_review_invocations: 2
findings_critical: []   # C-1 (send-time trusted client descriptors → size-bypass + type-spoof + cross-channel IDOR) FIXED (validateAndHeadAttachments: server-derived size/type via HeadObject + anchored channel-key regex) + re-confirmed
findings_high: []       # H-1 (confirm key startsWith → traversal) FIXED (anchored regex); H-2 (presigned-PUT no cap) documented (send-time HeadObject = binding gate); + the Phase-1 H-1 composer-allowlist-drift FIXED (6 types)
findings_medium_accepted: [M-1 channel_id/object_key divergence (now API-unreachable), M-2 url:'' dead-link render-time, M-3 no integration/e2e for wired path]
findings_low_accepted: [L-1 optimistic double-render, L-2 dead _userId, L-3 composer cosmetic size, L-5 NoSuchKey→5xx UX nit, L-6 createReply test symmetry]
fix_up_commits:
  - "b21b37f: composer allowlist → server's 6 types (Phase-1 H-1)"
  - "05fb706: validateAndHeadAttachments at send — server-derived size/type (HeadObject) + anchored channel-key regex; closes C-1 size-bypass + type-spoof + cross-channel IDOR; H-1 confirm anchored regex; H-2 doc"
final_verdict: APPROVE
```
- Phase 1 head-builder REWORK (composer allowlist drift, fixed) then APPROVED-ready; the 3 named load-bearing checks (rule-4 403, row-at-send atomicity, presigned-GET) PASSED code-read. **Phase-2 /review (adversarial, per the freshly-promoted BUILD-PRINCIPLES rule 4) caught a CRITICAL the code-read missed:** the row-at-send redesign trusted client-supplied descriptors at send (confirm was advisory-only) → size-bypass + type-spoof + cross-channel key-swap IDOR. **3rd consecutive wave (17/18/19) where adversarial Phase-2 caught what Phase-1 code-read passed — rule 4 working as designed (it mandated the negative-path verification).**
- Fix: send-time validateAndHeadAttachments re-establishes ALL invariants server-side (HeadObject-derived size+type, anchored channel-key regex) before the atomic INSERT; client claims discarded. 10 new negative-path tests (api 338). Repo green: typecheck 4/4, build 3/3, api 338 + web 151. Re-review: 0 Critical/High.
