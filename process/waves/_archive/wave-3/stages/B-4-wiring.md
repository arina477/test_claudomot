# Wave 3 — B-4 Wiring
Done within B-3: App.tsx initSuperTokens() + <SuperTokensWrapper><AppRouter/>; router.tsx mounts all 8 routes with Auth/Guest guards; apps/web/.env.example VITE_API_ORIGIN=https://api-production-b93e.up.railway.app; vite-env.d.ts for import.meta.env typing. Backend CORS already allows the web origin + credentials (wave-2). Cookie-based session across origins (credentials:'include' on /me + /profile fetches). Repo typecheck+build green end-to-end.
```yaml
wiring_complete: true
```
