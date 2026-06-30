# Wave 19 — B-4 Wiring
```yaml
typecheck_passed: true     # repo turbo
build_passed: true         # repo turbo
routes_registered: ["POST /channels/:channelId/attachments/presign", "POST /channels/:channelId/attachments/confirm (AttachmentsController in files module)"]
storage: "reuse FilesService + Railway Buckets env (AWS_ENDPOINT_URL/ACCESS_KEY/SECRET/STORAGE_BUCKET_NAME); graceful 503 if absent (avatar pattern)"
drift_defects: []
```
