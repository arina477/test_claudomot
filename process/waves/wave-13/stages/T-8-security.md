# Wave 13 — T-8 Security (active — MANDATORY; edit/delete authz). Lifecycle invariants:
```yaml
test_pattern: active
applicable_probes: [access_control, auth_smoke, secret_grep]
results:
  - "Edit AUTHOR-ONLY: PATCH — author_id===session userId else 403; deleted→409. LIVE: 401 unauthed; edit 200 isEdited. Tested (non-author 403)."
  - "Delete author OR moderator: author_id OR can(serverId, manage_channels) — serverId RESOLVED from channels.server_id BEFORE can() (not request-trusted). Soft-delete tombstone (content null). Idempotent. LIVE: delete→tombstone. Tested (moderator-deletes-others/member-403)."
  - "Reactions idempotent: toggle UNIQUE(message_id,user_id,emoji); user session-derived; aggregated reactedByMe per-caller. LIVE: toggle true→false. Tested."
  - "Realtime room-only: gateway @OnEvent(message.updated/deleted/reaction.added/removed) → server.to('channel:id') ONLY (never broadcast-all). LIVE two-client: B got events 87-112ms; non-joined got NOTHING (no-leak). Tested."
  - "Secret grep (wave-13 diff): clean."
findings:
  - {severity: info, category: emoji-validation, description: "emoji allowlist/shape-validation — confirm not arbitrary (B-block) → V note if absent"}
```
T-8 PASS: edit/delete authz (author/moderator server-side) + idempotent reactions + room-only fan-out — tested + LIVE-verified (no-leak two-client). No critical/high.
