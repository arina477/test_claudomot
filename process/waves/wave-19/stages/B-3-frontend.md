# Wave 19 — B-3 Frontend
```yaml
files: [auth/api.ts (presignAttachment/confirmAttachment/putAttachmentToStorage + sendMessage attachments[]), icons.tsx (paperclip/file/image-broken/arrows-out/download), MessageComposer.tsx (picker+staged-strip+guard+upload), MessageList.tsx (AttachmentRender/ImageLightbox/FileChip + onerror-fallback), useMessages.ts (attachments through outbox), MainColumn.tsx, messaging.test.tsx]
upload_flow: "pick → client guard (≤10MB + ALLOWED_CONTENT_TYPES) → staged tile → SEND: presign → PUT uploadUrl (direct S3, no creds) → confirm → ValidatedAttachment[] → sendMessage(content, validated[], previews[]) → optimistic shows staged previews → server echo renders real AttachmentRef[] (presigned-GET urls)"
d_carries: ["hidden file input", "emerald upload progress per tile", "lightbox focus-trap + Esc + backdrop + focus-restore + alt→dialog aria-label", "img onerror → FileChip fallback", "aria-live staged strip", "download/retry semantics"]
client_guard: "≤10MB + content-type allowlist mirrors server; oversized/disallowed → inline error tile, send blocked while uploading/error"
verify: "web typecheck+vite-build clean (no CJS trap, type-only shared); biome 0; 151/151 web tests (+6: file-chip, image, tombstone-no-attachment, oversized-reject, disallowed-reject, pdf-staged)"
```
