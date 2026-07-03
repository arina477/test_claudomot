# Wave 38 — B-1 Contracts
No new shared Zod/DTO/OpenAPI contract surface. confirm response stays `{avatarUrl: string}` (value semantics changed to stable app URL, type unchanged). New `GET /users/:userId/avatar` returns a 302 redirect (no response body schema). users.avatar_key is an internal column, not a client contract. **B-1 no-op skip; fast-path not needed (single specialist serial chain).**
