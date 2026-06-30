# Wave 19 — T-8 Security (LOAD-BEARING — C-1/IDOR ratified)
```yaml
verdict: PASS
ratified:
  - "validateAndHeadAttachments (messages.service.ts:349-411) runs BEFORE txn in createMessage(:467)+createReply(:1023)"
  - "cross-channel key-swap IDOR CLOSED: anchored regex ^attachments/<channelId>/[A-Za-z0-9._-]+$ from message's real channelId → 400; char class excludes / and .. (traversal closed)"
  - "size-bypass CLOSED: server headAttachment ContentLength >10MB → 413; client sizeBytes discarded"
  - "type-spoof CLOSED: server ContentType vs ATTACHMENT_ALLOWED_MIME → 400"
  - "persisted INSERT (:553,:1098) uses server-derived content_type/size_bytes, NOT client body — bypassing /confirm changes nothing"
  - "presign/confirm rule-4 canViewChannelById (403 non-member) + confirm anchored key regex (H-1)"
tests_executed_in_CI: [cross-channel→400 (headAttachment not called), traversal→400, 11MB→413, video/mp4→400, happy-path persists server image/png+204800 not client pdf/500, reply cross-channel→400 + 15MB→413]
live_probe: "presign 401 + confirm 401 unauth on serving revision; health 200; gitleaks clean"
known_debt: "H-2 presigned-PUT no ContentLengthRange (presigned-POST-only) — send-time HeadObject is the binding persisted-row gate; oversized = abandoned object (no GC cron)"
```
