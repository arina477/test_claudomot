# Wave 19 — V-1 Summary
- **Karen APPROVE** — 6/6 VERIFIED. C-1/IDOR fixed (validateAndHeadAttachments :349-411 before txn :467/:1023; anchored regex :365 closes cross-channel+traversal; server-derived size/type persisted :555/:1100, client discarded). Row-at-send atomic (db.transaction, message_id NOT NULL, isNewInsert no-double-attach). presigned-GET (resolveAttachmentUrl GetObjectCommand) + no-N+1 (batch inArray + parallel presign). Migration 0009 additive. Frontend composer+render+tombstone-safe. No gold-plating; M3 metric met. Caveat: prod app-DB ledger not queryable from brain DSN (verified indirectly via file + live 401; ALREADY confirmed at C-2 — head-ci-cd direct-queried the attachments table + FKs + index present, ledger advanced).
- **jenny APPROVE** — 9/9 ACs MATCH, no drift. presign→PUT→confirm→row-at-send; >10MB→413/disallowed→4xx; channel-derived authz 403; DTO {id,filename,contentType,sizeBytes,url}; composer picker/preview/guard; render image-preview/lightbox/file-chip/0-N/tombstone-safe; broken-image fallback. Storage=Railway Buckets verbatim, no new provider/SDK. 2-namespace lock honored. Implementation EXCEEDS spec (send-time server re-validation) — not drift. **M3 feature-complete: reactions(13)+threads(18)+attachments(19) all shipped; in_progress, closure-eligible at N-1 modulo parked orphan-GC debt.**
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: []   # 0 blocking
```
