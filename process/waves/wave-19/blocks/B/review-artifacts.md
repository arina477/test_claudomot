# Wave 19 — B-block review artifacts
**Block:** B (Build) | **Wave topic:** M3 attachments (data plane + composer + render) | **Gate:** B-6 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim + migration 0009 (attachments, message_id NOT NULL) |
| B-1 | stages/B-1-contracts.md | done | AttachmentRef + MessageResponse.attachments[] + presign/confirm types |
| B-2 | stages/B-2-backend.md | done | FilesService extend + attachments persistence + message-association (row-at-send) |
| B-3 | stages/B-3-frontend.md | done | composer picker/preview/upload + message-row render (vs canonical) |
| B-4 | stages/B-4-wiring.md | done | routes + typecheck + storage env |
| B-5 | stages/B-5-verify.md | done | |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review caught+fixed C-1 IDOR+size-bypass (rule-4 worked); clean |
## Context
- Branch: wave-19-m3-attachments | claimed: [20db0c16, 7c39c9e3, cf1ae370]
- **P-4 carries (MANDATORY):** (1) ROW-AT-SEND — confirm validates-only (HeadObject ≤10MB + content-type → validated descriptor); createMessage/createReply INSERT attachment rows with message_id NOT NULL atomically (createMessage MUST be wrapped in db.transaction); NO orphan rows; (2) AttachmentRef.url = presigned-GET (resolveAttachmentUrl via GetObjectCommand, Railway Buckets PRIVATE — NOT static resolvePublicUrl); (3) rule-4 channel-derived authz on presign/confirm + B-6 Phase-2 non-member 403 negative-path test (the freshly-promoted BUILD-PRINCIPLES rule 4); (4) ≤10MB server-enforced at confirm (HeadObject); (5) storage graceful-503 if env absent; (6) abandoned storage objects = logged known-debt (no GC cron).
- **Storage:** REUSE FilesService + Railway Buckets + @aws-sdk/client-s3 (installed). SDK-doc: command-center/dev/SDK-Docs/ObjectStorage/object-storage.md. NO new dep, NO founder cred-ask.
- **D-block carries (JS):** hidden-input bind, upload-progress, lightbox focus-trap/Esc/backdrop/focus-restore, img-onerror→fallback-chip, aria-live staged strip, chip/retry aria. Visual contract: design/server-channel-view.html.
## Gate verdict log
<appended by head-builder at B-6>

## Block exit handoff
```yaml
build_block_status: complete
branch: wave-19-m3-attachments
stages_run: [B-0,B-1,B-2,B-3,B-4,B-5,B-6]
review_verdict: APPROVE
idor_and_size_bypass_closed: true
ready_for_ci: true
```
