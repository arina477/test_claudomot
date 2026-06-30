# Wave 13 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 Action 0)
**Reviewed against:** process/waves/wave-13/blocks/T/review-artifacts.md + T-6/T-7/T-8 deliverables + source verification (messages.service.ts, messaging.gateway.ts, messages.service.spec.ts) + C-2 live evidence + live 401 boundary spot-check
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

Every load-bearing M3 lifecycle invariant is proven at three independent levels — production source, real-outcome unit assertions, and live prod probe — with no coverage theater. **Edit author-only**: `messages.service.ts:245-247` guards `message.author_id !== userId → 403`; the spec asserts both the author-success path (`isEdited:true`, content updated, `messages.service.spec.ts:322-323`) and the non-author 403 (`rejects.toThrow`, :331). **Delete author||moderator — the security-tightened crux**: serverId is SELECTed from `channels.server_id` (`:317-327`) and only then passed to `rbacService.can(userId, serverId, 'manage_channels')` (:336) — never request-trusted; the test proves this directly via `expect(rbacService.can).toHaveBeenCalledWith(MODERATOR_ID, SERVER_ID, 'manage_channels')` (:403), and exercises BOTH the moderator-allowed branch (can→true, :379) and the non-author-denied branch (can→false→403, :411), plus the idempotent double-delete (:456) and tombstone content→null (:452). **Reactions idempotent**: existence-check then DELETE/INSERT against UNIQUE(message_id,user_id,emoji) with `onConflictDoNothing` (:401-444); toggle true→false→true→false asserted on real return values (:501/520/539/551), `reactedByMe` per-caller aggregated (:650/654). **Room-only fan-out**: all five `@OnEvent` handlers (message.created/updated/deleted, reaction.added/removed) emit via `server.to('channel:${channelId}')` — never broadcast-all (messaging.gateway.ts:215-272) — and the no-leak invariant is live-verified two-client (non-joined socket received NONE of the three events). The two-client realtime latencies (message:updated 90ms / reaction:added 87ms / message:deleted 112ms, all <1s) are genuine separate-sender-and-receiver measurements, not single-client echo. C-2 deploy verification is honest: migration 0006 applied before cutover with soft-delete columns + message_reactions table + idempotency UNIQUE verified by direct pg query; deploy via Railway CLI `up` (real new image, proven by 404→401 route-probe on the new-only path); deployment-state from the authoritative GraphQL endpoint, not /healthz; per-service env scoping correct (no DB/SuperTokens creds on web). I independently re-confirmed the live boundary at the gate: PATCH edit → 401, POST reaction → 401, health → 200. Coverage is adequate across all applicable layers; evidence is solid, not fabricated.

## Findings carried to V (non-blocking)

- **info / emoji-validation** (T-8): emoji input has no documented allowlist/shape-validation — confirm the reaction emoji is not arbitrary at the B-block layer; V/L note if absent. Not a security blocker (reactions are session-authed, idempotent, room-scoped; an arbitrary string is a data-hygiene concern, not an authz/leak concern).
- **coverage-gap / cross-user authz live-probe** (carry-forward 4a2ad286): only one persistent verified-prod fixture exists, so the non-author edit/delete 403 path is proven by committed unit tests (non-author 403 + moderator-allowed both asserted) rather than a second live identity. This is the recurring M2/M3 live-verification gap (now multi-wave), a documented non-regression, not a wave-13 defect. Verified at source + unit; recorded for V-2 and the standing fixture escalation to L.

## Boundary / scope note
No threads / mentions / attachments / presence in M3 lifecycle scope (per P-2). LiveKit media-plane is out of this wave entirely. Single-pod in-memory Socket.IO adapter (multi-pod fan-out is a later milestone) — the room-only fan-out tested here is correct for the deployed single-pod topology.

## Cascade
Not applicable (APPROVED — no rework).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
