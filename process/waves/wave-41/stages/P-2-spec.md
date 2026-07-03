# Wave 41 — P-2 Spec (pointer)
**Canonical spec:** `tasks.description` of seed 6cf06f99 (multi-spec YAML: 2 blocks — 6cf06f99 role/perm + 6ddddc2d moderation). **wave_type:** multi-spec · **design_gap_flag:** true
## Spec blocks (copy)
**6cf06f99 — Educator role via moderation permission:** add `moderate_members` boolean to roles + rbac.ts; grant via existing ServerRolesPage toggle; educator = role w/ moderate_members (+ existing manage_assignments, already gates assignments — no authz rewrite); real-PG authz tests.
**6ddddc2d — Light moderation:** delete-any-message (can(moderate_members), reuse shipped message:deleted socket) + member timeout (server_members.muted_until + send-guard mute check, server-side expiry); rank guard (can't moderate above you); non-mod 403; real-PG authz+behavior tests; minimal UI (D-block for timeout affordance).
