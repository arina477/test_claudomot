# Wave 23 — T-block findings aggregate

## T-1 Static
- No production ts-bypasses (2 hits both test-mock DI casts, acceptable). CI lint+typecheck green.

## T-2 Unit
- No findings. Both authz boundaries have in-block negative-path unit coverage (395 api + 216 web green).

## T-3 Contract
- No findings. EffectivePermissions + role DTOs typed end-to-end (no server↔client drift).

## T-4 Integration
- F23-T-4 (Low, non-blocking): no dedicated real-DB integration test for the new authz surface (migration 0011 + getEffectivePermissions + manage_assignments gate). Covered by unit tier + C-2 prod-migration verification + C-2 live 401 probe. Reinforces re-homed debt task 02fa8011 (real-PG integration tier).

## T-7 Perf
- No findings. Bundle unchanged (0 new deps); new /me/permissions endpoint mean 0.12s (indexed 2-select, within read SLO); no render-path change.

## T-8 Security (LIVE prod authz probe — AIRTIGHT; 0 crit/high/med)
- Write door (manage_assignments gate): full truth-table proven LIVE — no-perm→403, manage_channels-only→403 (swap complete), granted→201, owner→201. Read door (/me/permissions): session-derived, IDOR-safe both directions, non-member 403, unauth 401. Escalation door: all self-grant paths 403 (manage_roles/manage_members gated). Secret-grep 0. Cookies HttpOnly/Secure unchanged (SameSite=None correct for split-origin).
- F23-T-8a (Low, non-blocking): malformed non-UUID :serverId → 500 (Postgres 22P02 uncaught) on /me/permissions + assignments endpoints. NOT a bypass (well-formed non-existent UUID → 403), no leak. Fix: ParseUUIDPipe on path params. Likely app-wide pattern.
- F23-T-8b (Low): stale manage_channels comments (assignments.controller.ts:45-47,221 + assignments.service.ts:56) — runtime correct (line 61 manage_assignments). Same as B-6 /review Low-1. Docs cleanup.
- F23-T-8c (Low, pre-existing platform): no HSTS header on API.
- F23-T-8d (Low, cosmetic): 429 body leaks "ThrottlerException" + x-powered-by:Express (fingerprinting).
