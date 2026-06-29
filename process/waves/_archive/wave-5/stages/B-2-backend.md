# Wave 5 — B-2 Backend (3 specs, commit-per-spec)
- 839af17f rate-limit (48358bf): Express sliding-window middleware in main.ts (10/60s/IP, in-memory Map) mounted BEFORE SuperTokens middleware → intercepts /auth/* (the SDK Express routes a NestJS guard would miss — P-4 Karen finding). ThrottlerModule+APP_GUARD for NestJS routes. @SkipThrottle on /health. 6 tests.
- e38c306e version (74f19bc): apps/api/src/version.ts reads package.json version at runtime; /health uses API_VERSION (no stale 0.1.0 fallback). test asserts == package version.
- 84e09891 avatar-2MB CODE (ee70ec2): confirm-time HEAD size check (FilesService.checkAvatarSize → 413 AVATAR_TOO_LARGE if >2MB) before persist; no frontend change; 503-graceful preserved. 7 tests. (Live upload pending founder bucket creds.)
57/57 api tests. Static imports.
