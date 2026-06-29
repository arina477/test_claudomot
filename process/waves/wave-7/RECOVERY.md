# Wave-7 recovery note (worker restart reset local git to fbca667)
Lost (local-only, never pushed): wave-7 P-block + D-block + backend commits. DB CANONICAL survived: M1 done, M2 in_progress, wave-7 running, 4 tasks in_progress w/ full specs in tasks.description (a47ed9bc = 5120 chars).
Lost FS: apps/api/src/servers/*, db/schema/servers.ts, shared/src/servers.ts (backend); design/server-rail-sidebar.html (gone); design/create-server.html reverted to old 3-step wizard.
Recovery: P-block specs intact in DB (no re-plan). Rebuild backend (B-0/B-1/B-2) from DB spec → PUSH branch immediately. Re-do D-block design (single-step create-server + server-rail-sidebar). Build B-3 frontend. PUSH after each major stage to survive restarts.
