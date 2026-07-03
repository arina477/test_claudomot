# Wave 40 — T-block findings aggregate

## T-8 Security re-verify — all PASS
- NUL/control-byte (C0+DEL, incl. embedded) → 400, zero 500s.
- REGRESSION: non-UUID id → 404, real id → 302 (guard imposes no UUID shape).
- confirm-never-uploaded key → 404 (was 500), avatar_url NOT persisted.
- No data leak (generic 4xx bodies). Happy path 200 + unauth 401 intact.
- INFO (non-blocking, pre-existing, out-of-scope): x-powered-by: Express banner (SH-W40-INFO-1).
