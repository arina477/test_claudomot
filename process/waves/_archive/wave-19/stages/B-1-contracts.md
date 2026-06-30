# Wave 19 — B-1 Contracts
```yaml
files: [packages/shared/src/messaging.ts]
added: ["AttachmentRef {id, filename, contentType, sizeBytes, url}", "MessageResponse += attachments?: AttachmentRef[]", "AttachmentPresignResponse {uploadUrl, key}", "ValidatedAttachment {key, filename, contentType, sizeBytes}", "sendMessage body += attachments?: ValidatedAttachment[]"]
shared_build: clean
```
