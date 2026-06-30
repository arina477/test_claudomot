# Wave 22 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED   # code-read; the 4 named checks (can()-403, soft-delete-hides, isolation, headObject-before-insert) all genuine
phase2_review_invocations: 2
findings_critical: []   # authz spine solid (no cross-server/cross-member IDOR, soft-delete on all read paths, per-member isolation)
findings_high: []       # H1 (cross-server attachment key swap — key not server-scoped) + H2 (forged key 5xx) FIXED (anchored ^attachments/<serverId>/ regex row/route-derived + NoSuchKey→400) + re-confirmed
findings_medium_accepted: [M3 controller IDOR-derivation assertion (property holds in code)]
findings_low_accepted: [L1 client owner-only gate vs server manage_channels (safe under-grant → V-2), L2 rowToDto N+1, L3 optimistic-revert visual-only, L4 build/CJS clean]
fix_up_commits:
  - "5e79456: H1 anchored server-scoped key regex (^attachments/<serverId>/[A-Za-z0-9._-]+$, serverId from route/row never client; closes cross-server swap + path-traversal) before headAttachment/INSERT; H2 NoSuchKey/NotFound→400 (infra→5xx); + M1 non-member-403 + M2 soft-deleted-404 tests"
final_verdict: APPROVE
```
- Phase 1 head-builder APPROVED by code-read (the 4 named load-bearing checks genuine). **Phase-2 /review (adversarial, BUILD rule 4) caught 2 Highs the code-read passed:** the assignment-attachment key was NOT server-scoped → cross-server key-swap (the wave-19-attachment-IDOR class again) + forged-key 5xx. **rule 4 validated AGAIN (Phase-2 catches cross-tenant attachment IDOR).**
- Fix: anchored server-scoped key validation (matching the actual presign format, serverId from the assignment's real server) + NoSuchKey→400 + the M1/M2 negative-path tests. Repo green: typecheck 4/4, build 3/3, api 388 + web 215. Re-review: 0 Critical/High.
