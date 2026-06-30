# Wave 13 — V-1 Summary
- **Karen APPROVE** — 7/7 VERIFIED: 401 boundary live; editMessage author-only (403/409-deleted); deleteMessage author OR can(manage_channels) with serverId RESOLVED from channels.server_id (not request-trusted, no IDOR); soft-delete tombstone null; toggleReaction idempotent UNIQUE + reactedByMe per-caller; gateway @OnEvent room-only (tests assert server.emit NOT called); 354 tests; no gold-plating. (Note: CLAUDOMAT_DB_URL = brain DB not app DB — verified via live routes + migration SQL + C-2.)
- **jenny APPROVE** — 3/3 blocks MATCH live; completes M3 conversational basics; no creep (threads/mentions/attachments/presence grep-clean); reuses gateway; M3 correctly NOT closed (presence remain); lands stable contract for M4. 1 LOW: toggleReaction selects is_deleted but doesn't GATE on it → a direct-API caller could react to a soft-deleted message (spec edge said blocked/no-op); UI-unreachable (tombstone hides pills); suggest an is_deleted guard (defence-in-depth).
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: [react-on-deleted-no-guard-LOW (defence-in-depth; UI-unreachable), emoji-validation-info(jenny confirms shape-validated), cross-user-live-probe-gap]
