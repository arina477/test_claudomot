# Wave 38 — B-2 Backend (node-specialist)
- `files.service.ts`: +`resolveAvatarUrl(key): Promise<string|null>` (presigned GET, AVATAR_GET_EXPIRY_SECONDS=300; mirrors resolveAttachmentUrl).
- `files.controller.ts` confirm: checkAvatarSize (kept) → persist avatar_key + stable app URL `${PUBLIC_API_URL}/users/:id/avatar?v=<hash>` via users.setAvatar → return stable URL.
- `users.controller.ts` (NEW): public/unauth `GET /users/:userId/avatar` → 404 (no key) | 503 (storage unset) | 302 presigned redirect + `Cache-Control: public, max-age=300`. `@SkipThrottle()` (image loads on every render; per-IP anti-enumeration = T-8 follow-up).
- `users.service.ts`: +setAvatar(id,key,url), +findAvatarKey(id).
- module wiring: forwardRef Files<->Users.
- Attachments: NO code change (already presigned-GET; verify-only at C-2/T).
