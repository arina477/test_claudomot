# Wave 19 — P-block review artifacts
**Block:** P (Product) | **Wave topic:** M3 attachments — upload/storage data plane + composer send + message-row render | **Gate:** P-4 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED; storage-SDK research next) |
| P-1 | stages/P-1-decompose.md | done |
| P-2 | tasks.description of 20db0c16 (+pointer) | done |
| P-3 | stages/P-3-plan.md | done |
| P-4 | blocks/P/gate-verdict.md | done | PASSED — head-product+karen+jenny APPROVE; Gemini orphan-concern→row-at-send annotation |
## Context
- **THE LAST M3 SUCCESS-METRIC FEATURE** — completes "reactions, threads, and attachments working". BOARD-endorsed feature-first lineage (wave-17 7/7).
- claimed: [20db0c16 (data plane), 7c39c9e3 (composer send), cf1ae370 (message-row render)]
- **CRITICAL P-block dependency:** object-storage SDK (S3-compatible / Railway Buckets) — P-0/P-2 SDK-research per external-sdk-integration-rules.md → SDK-Docs/<Name>/. LIKELY needs account-issued storage creds (rule-6 exception → P-block cred-ask). BUT first enumerate self-provision options (rule 10: Railway token APP_RAILWAY_TOKEN may provision a bucket → no ask). The storage approach is a P-0/P-3 research decision.
- Scope: ≤10MB, image preview + file chip, content-type allowlist. Reuse MessagingModule + /messaging + ChannelPermissionGuard authz.
- design_gap: likely TRUE (composer file picker + preview + message-row attachment render = new UI).
## Gate verdict log
<appended by head-product at P-4>
