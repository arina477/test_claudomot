# Wave 4 — B-block review artifacts
**Block:** B · **Wave topic:** Profile customization (username+avatar presign+accent) · **Gate:** B-6 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | migration done; storage=founder-cred (surfaced); build proceeds |
| B-1 | stages/B-1-contracts.md | done | profile contract extended (39a043e) |
| B-2 | stages/B-2-backend.md | done | /profile+username409+FilesModule presign (e5b5b57); graceful no-creds |
| B-3 | stages/B-3-frontend.md | done | profile customization wired (d551154); 37 web tests |
| B-4 | stages/B-4-wiring.md | done | FilesModule+ProfileProvider+CSS (in B-2/B-3) |
| B-5 | stages/B-5-verify.md | done | 63/63 green; graceful no-creds boot |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED + caller-scope fixup (f7b205a) |
## Context
- claimed [2a655960]. Storage: attempt Railway Buckets via project token; else founder S3 creds (rule 6). B-advisories: AWS_ENDPOINT_URL+AWS_REGION=auto exact; username 3-20 [a-z0-9_] (spec wins vs mockup counter); accent_color naming. Orphan-object cleanup deferred.

## Block-exit handoff
```yaml
build_block_status: complete
branch: wave-4-profile-customization
stages_run: [B-0,B-1,B-2,B-3,B-4,B-5,B-6]
review_verdict: APPROVE
last_commit_sha: f7b205a
ready_for_ci: true
note: "Changed api (users migration + /profile extend + FilesModule presign) + web (profile wiring + shell). C-2 redeploys both. AVATAR-UPLOAD verification needs the founder Railway Bucket creds (AWS_*); username/accent/profile work without them. T-8 = file-upload surface."
```
