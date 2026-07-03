# Wave 38 — B-4 Wiring
- UsersController registered in UsersModule; FilesService injected via forwardRef. Route `GET /users/:userId/avatar` live.
- PUBLIC_API_URL consumed in confirm (apps/api). Placeholder in .env.example; real value set on Railway api at C-2.
- End-to-end typecheck clean (tsc --noEmit exit 0) — no B-2↔B-3 drift (no frontend).
