# Wave 23 — T-block findings aggregate

## T-1 Static
- No production ts-bypasses (2 hits both test-mock DI casts, acceptable). CI lint+typecheck green.

## T-2 Unit
- No findings. Both authz boundaries have in-block negative-path unit coverage (395 api + 216 web green).

## T-3 Contract
- No findings. EffectivePermissions + role DTOs typed end-to-end (no server↔client drift).

## T-4 Integration
- F23-T-4 (Low, non-blocking): no dedicated real-DB integration test for the new authz surface (migration 0011 + getEffectivePermissions + manage_assignments gate). Covered by unit tier + C-2 prod-migration verification + C-2 live 401 probe. Reinforces re-homed debt task 02fa8011 (real-PG integration tier).
