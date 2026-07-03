# Wave 40 — P-2 Spec (pointer)
**Canonical spec:** `tasks.description` of 7525b759 (YAML head + `---` + prose).
**wave_type:** single-spec (backend) · **claimed_task_ids:** [7525b759] · **design_gap_flag:** false
## ACs (copy)
1. GET /users/:id/avatar NUL/control-byte id → 400 (not 500).
2. REGRESSION GUARD: valid non-UUID SuperTokens id → 302/404, NEVER 400 (no ParseUUIDPipe).
3. confirm never-uploaded key (NoSuchKey) → 404/400 (not 500), no persist.
4. Existing preserved: valid round-trip 200/renders; >2MB 413; unauth 401; no-avatar 404; has-avatar 302.
**Approach:** fix#1 = NUL-byte boundary reject (guard OR extend SupertokensExceptionFilter), NOT ParseUUIDPipe. fix#2 = catch HeadObject NoSuchKey in checkAvatarSize.
