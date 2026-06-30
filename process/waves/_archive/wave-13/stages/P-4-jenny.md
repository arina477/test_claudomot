# P-4 Phase 2 — Jenny spec-drift verification (wave-13, M3 message lifecycle)

**Verdict: APPROVE**

Scope is the literal next clause of M3 `## Scope` ("message send/receive/**edit/delete**, **reactions**"), right-sized, no creep, no gold-plating. Three specs trace cleanly to the M3 milestone prose, the bet ("match Discord's messaging"), the locked `_library` data model, and product-decisions [2026-06-30]. Reuses the wave-12 MessagingModule + `/messaging` gateway + ChannelMessageGuard — no new namespace, no new auth surface.

## Per-block findings

### e12886d7 — Message edit + delete (soft-delete) + realtime — MATCHES
- **Authz matches M3 security posture:** edit = author-only (`session.getUserId() === message.author_id` else 403); delete = author OR moderator (`can(manage_channels)`) — both server-side, behind AuthGuard + ChannelMessageGuard. Mirrors the spec-head SECURITY clause and milestone "core collaboration surface."
- **Soft-delete matches `_library` L153-154** (is_edited/edited_at/is_deleted/deleted_at; "Soft-deletes only — no hard delete at MVP; content replaced with `[deleted]`"). Migration ALTER columns match L153 exactly. Tombstone payload (content hidden, not the row) is the locked behavior. NO hard delete — correct (H2 deferral, L611).
- **Realtime room-only:** `message.updated`/`message.deleted` → `server.to('channel:id')` ONLY — matches wave-12 fan-out pattern; no cross-channel leak. Edge cases (edit-a-deleted-message blocked, idempotent delete, moderator-deletes-others, tombstone-hides-content) all enumerated and verifiable. Non-happy paths (401/403) covered.

### d78df376 — Message reactions (toggle + realtime) — MATCHES
- **Reactions are named in the M3 success metric** ("with reactions … working") and `_library` L142/L173 (`message_reactions` table, MessagingModule-owned). Migration `UNIQUE(message_id, user_id, emoji)` matches the locked design — and is the load-bearing idempotency mechanism.
- **Toggle idempotent** via UNIQUE (insert-or-remove); aggregated `[{emoji, count, reactedByMe}]` from caller session; room-only fan-out (`reaction:added/removed`). Cascade-on-message-delete and react-to-deleted-message-no-op edge cases present. No drift.

### f323a71f — Message UI (inline-edit / tombstone / reaction-pills) — MATCHES
- Pure consumer of the two REST surfaces + realtime events above; the user surface for the slice. Own-message-only edit/delete affordances (moderator delete on others), tombstone replaces content+reactions, optimistic reaction reconcile, edited indicator, <1s live convergence. Bound to `design/server-channel-view.html` primitives + dark theme. design_gap_flag TRUE is correctly a component-level delta (inline-edit, tombstone, reaction-pill) on the existing page — not a new page. Matches DESIGN-SYSTEM MessageRow primitive (product-decisions L66).

## Scope discipline — confirmed, no creep
- **Deferred correctly:** threads (`thread_parent_id`), mentions, attachments, presence + typing (`/presence` namespace), member-list. All explicitly DEFERRED in the spec head, milestone-decomposition note (product-decisions L190), and P-3. None leak into the three ACs. The `/presence` namespace is deliberately held for its own future M3 wave — correct, since it introduces a second locked namespace + new auth surface.
- **No gold-plating:** no reaction allowlist over-engineering (a reasonable emoji-shape validation only), no edit-history table, no hard-delete/audit-log machinery (H2 per L611), no analytics. Right-sized to the edit/delete/react clause.

## M3 disposition — correct
- M3 is **progressing, not closeable** — presence/typing, threads, mentions, attachments, member-list remain. The spec head and prose both say so. No premature milestone-close.
- **Lands before M4 correctly:** M4 (offline-first wedge) "builds on a STABLE message-lifecycle contract" — the offline outbox replays idempotent message ops, so the edit/delete/reaction contract must be frozen first. Sequencing matches `_library` and the M3 `## Required by: M4` field.

## Clarifications / minor notes (non-blocking)
- `_library` L155 mentions `content_snapshot` (JSONB) to prevent tombstones-on-account-delete. Not in scope here (it's a send-path concern) and not contradicted — flag only so B-block doesn't accidentally regress it during the soft-delete content-clear.
- Spec says delete returns "200/204" and edit-a-deleted returns "409/404" — the OR is acceptable latitude at spec level; B-block/T-2 contract should pin one. Not drift.

**No drift across all three blocks. Slice completes M3's conversational basics (edit/delete/react) without over-reach. APPROVE.**
