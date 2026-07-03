# Wave 38 — T-3 Contract (Pattern A — CI-verified)
- API contract changes covered: POST /profile/avatar/confirm (response {avatarUrl} unchanged shape; now stable app URL) + NEW public GET /users/:userId/avatar (302 | 404 | 503). Controller unit tests (files.controller.spec.ts, users.controller path) assert status codes + method. CI green.
- No SDK contract drift (resolveAvatarUrl mirrors shipped resolveAttachmentUrl @aws-sdk usage).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green: controller contract specs pass"]
findings: []
```
