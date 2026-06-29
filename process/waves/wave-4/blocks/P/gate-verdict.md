# Wave 4 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave4-p4)
**Reviewed against:** process/waves/wave-4/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-4 completes M1's profile pillar (the founder-approved wave-3 split sibling) and ladders cleanly to that live milestone: it adds username/avatar/accent to the user profile, extends the existing profile read/write API, stands up a shared file-storage subsystem behind the locked presigned-upload pattern, and wires the settings page's placeholder controls so they actually work — with the storage subsystem deliberately built under the low-blast-radius avatar use so it is reuse-ready for later message attachments. All ten acceptance criteria are independently observable and the hard non-happy paths are specified, not assumed: username collision / case-fold / concurrent-claim (guaranteed by a database UNIQUE constraint on lowercased username, not an app-level check), invalid-format username, oversized / wrong-type avatar, expired upload link, and graceful behaviour when storage credentials are absent (the service boots and the rest of the profile still works). The plan holds exactly to the locked storage contract in the architecture library (server-controlled user-scoped object key → no path traversal or cross-user overwrite, MIME allowlist, 2 MB cap, short-lived URL, the API never streams the binary, FilesModule shaped `purpose: 'avatar'|'attachment'`), reuses the established single-`users`-table profile model and the documented `AWS_*` env-var contract, and explicitly rejects the parallel multipart-through-API path. Every AC maps to a build step owned by a specialist that exists in AGENTS.md (backend-developer, react-specialist, typescript-pro, devops-engineer, postgres-pro), dependencies are justified and permissively licensed, and the storage-credential question is sequenced correctly — self-provision attempt then founder-ask, surfaced at B-0 so deploy/test don't block late — because only avatar upload needs the credential while schema/API/username/accent do not. Scope is held to the founder-approved split with no resize/transcode/CDN or multi-tenant/billing gold-plating. The only security-relevant surface is the file upload, which is adequately specified for the build and for the T-8 file-upload security layer; this wave does not touch auth, sessions, cookies, rate-limits, or user-creation, so the tightened security gate does not apply. Build-ready — proceeding to Phase 2 reviewers.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged) — PASS
- **Karen: APPROVE** — all source claims VERIFIED (users id/email/display_name only → migration real; /profile display_name-only → extension real; SessionNoVerifyGuard exists/reusable; presign pattern matches _library #15/#16/#5; @aws-sdk libs absent→adding real; settings-profile.html has the 3 controls). No antipatterns. B-advisories: use exact AWS_ENDPOINT_URL+AWS_REGION=auto; username 3-20 (spec) vs mockup 10/32 counter — spec wins, align frontend+Zod.
- **jenny: APPROVE** — no drift; 6/6 MATCH (completes wave-3 split sequencing; storage matches locked arch; username on users #5; accent_color naming reconciled [_library wins]; scope held no resize/CDN; completes M1 profile pillar). Notes: accent_color vs databases.md avatar_color reconcile; username length align.
- **Gemini: CONCERN (triaged NON-MATERIAL, encoded)** — orphaned avatar object if upload-without-confirm. Encoded as a spec edge-case (bucket lifecycle / confirm-on-exists; deferred hardening, trivial for self-use-mvp). Not blocking.
GATE: PASS → B-block (D skipped — design_gap_flag=false). Security-scope tightened gate does NOT apply (file-upload only); T-8 still assesses the upload surface. B-0 carries the storage-credential founder-ask.
