# Wave 19 — P-1 Decompose
## Max-size rubric (no trip)
| Measure | Est | Threshold | Pass |
|---|---|---|---|
| Files | ~24-30 (migration 0009, attachments schema, FilesService extend, attachments service/controller, message DTO, gateway, composer picker/preview, message-row render, api.ts, tests) | >60 | ✓ |
| Net LOC | ~2800 | >5000 | ✓ |
## Wave type + floor
- claimed = [20db0c16, 7c39c9e3, cf1ae370] → 3 → **multi-spec**. Floor (>2500 LOC OR ≥6 specs): ~2800 > 2500 → above floor (mvp-thinner OK, no split).
## Verdict: PROCEED (multi-spec)
## design_gap_flag: TRUE
```yaml
design_gap_flag: true
missing_surfaces:
  - composer-attachment: file/image picker on the composer + pre-send preview (image thumbnail / file chip) + upload-progress. Prior art: MessageComposer (recessed input + emerald focus) + the reaction/mention affordances. Task 7c39c9e3.
  - message-row-attachment: inline image preview (constrained, click-to-full) + file chip (icon + filename + size) on the message row. Prior art: MessageList row (avatar/name/body/timestamp/reactions/tombstone). Task cf1ae370.
```
- Storage: REUSE the existing FilesService (presign→PUT→HeadObject-confirm) + Railway Buckets + @aws-sdk/client-s3 (already installed). No new SDK, no founder cred-ask.
