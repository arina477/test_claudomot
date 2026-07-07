# B-4 — Wiring (wave-70)
Repo-wide typecheck (pnpm typecheck, turbo all 3 packages) 4/4 EXIT 0. No B-2↔B-3 drift.
Routes: 3 block endpoints (POST/DELETE/GET /blocks) registered; BlocksModule in app.module (:8/:58); DmModule imports BlocksModule (DM HIDE); api client blockUser/unblockUser/getBlocks present. No new frontend route (BlockedUsersPanel is a section in the existing /settings/privacy). No new env.
```yaml
typecheck_passed: true
routes_registered: [POST /blocks, DELETE /blocks/:blockedUserId, GET /blocks]
env_vars_wired: []
drift_defects: []
```
