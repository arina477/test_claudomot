# Wave 4 — B-2 Backend (backend-developer, e5b5b57)
- UsersService.updateProfile (partial; lowercases username; PG 23505 unique-violation → ConflictException → 409 not 500) + setAvatarUrl + findById 4-field.
- ProfileController GET (4 fields) + PATCH (UpdateProfileSchema; 400 invalid / 409 username-taken / 200).
- FilesModule (shared purpose avatar|attachment): lazy S3Client (null + WARN when AWS_* unset, NEVER throws at construction → graceful boot); POST /profile/avatar/presign (SessionNoVerifyGuard; content-type allowlist png/jpeg/webp; server-controlled key avatars/{userId}/{uuid}.{ext}; 300s TTL; 2MB; → 503 STORAGE_NOT_CONFIGURED when no creds); POST /profile/avatar/confirm (key-prefix validated → setAvatarUrl). api never streams binary. Wired in AppModule.
- 26/26 tests (incl. username validation suite + presign-503-no-crash). Static imports (no dynamic-import bug). Boots without storage env (verified).
```yaml
files: [packages/shared/src/profile.ts, apps/api/src/users/users.service.ts, apps/api/src/profile/profile.controller.ts, apps/api/src/files/*, app.module.ts]
username_409: "PG 23505 → ConflictException (static import)"
graceful_no_creds: "lazy S3, 503 STORAGE_NOT_CONFIGURED, boots clean"
```
