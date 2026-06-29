# Wave 4 — T-8 Security (active — file-upload surface)
Security-scope tightened gate does NOT apply (no auth/session change — P-4). File-upload probes live:
```yaml
test_pattern: active
applicable_probes: [file_upload_authz, mime_allowlist, graceful_degradation, secret_grep, rate_limit]
results:
  - "Avatar-confirm caller-scope: POST /profile/avatar/confirm with a FOREIGN-user key → 400 (not 500, no leak). Key is server-minted avatars/{userId}/{uuid}; confirm enforces caller-prefix (f7b205a). PASS."
  - "MIME allowlist: presign with non-image (application/x-msdownload) → 400. PASS."
  - "Graceful no-creds: presign image/png → 503 STORAGE_NOT_CONFIGURED (bucket not provisioned); /health 200 stable. No crash. PASS."
  - "No path traversal / cross-user overwrite: key server-controlled + user-scoped (code + 38 api tests incl. prefix-collision edge). PASS."
  - "Secret grep (wave-4 diff): clean — AWS_* are env placeholders only, no committed creds. PASS."
  - "Rate-limit: auth endpoints still unthrottled — tracked 839af17f (launch-blocker)."
findings:
  - {severity: low, category: rate-limit, description: "auth/profile endpoints unthrottled — tracked 839af17f"}
  - {severity: info, category: avatar-upload, description: "real upload security (live S3 PUT constraints) verifiable once bucket provisioned (84e09891); key/MIME/scope enforced server-side + unit-tested now."}
```
T-8 PASS: file-upload authz + MIME + graceful + no-leak verified; rate-limit tracked.
