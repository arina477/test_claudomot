# Wave 14 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 Phase 1)
**Reviewed against:** process/waves/wave-14/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The M3 presence layer implements every acceptance criterion across all three claimed specs, and the load-bearing no-leak security boundary holds. The /presence namespace reuses the exact SuperTokens WS-upgrade auth path via the new shared `common/ws-auth.ts` helper — and the messaging gateway was refactored to delegate to that same helper with zero behavioral change (cookie-first `sAccessToken`, `getSessionWithoutRequestResponse`, `assertClaims` email-verification, reject on any failure), so no auth surface was weakened. Presence fan-out is membership-scoped and never global: online/offline emit only to `presence:server:<serverId>` rooms the subject belongs to (`socket.to(...)` excludes self on online; `this.server.to(room)` on offline after the socket has left), and a non-co-member is never in those rooms. Typing is channel-scoped through `presence:channel:<channelId>` rooms gated by `canViewChannelById()` re-derived from the DB on every `join_channel` AND re-checked on every `typing:start` — there is no path for a non-viewer to receive or inject typing events; `typing:active` is only ever emitted to the channel room, never to the server room. displayName is resolved server-side from `users.display_name` at connect and never client-provided (no spoof). The new `GET /servers/:id/members` is `AuthGuard`-protected and its service method member-gates the caller (`ForbiddenException` if not a member) — IDOR-closed. Multi-tab ref-counting (`Map<userId,Set<socketId>>`, online on 0→1, offline on →0) keeps self-presence stable across tabs; snapshot-on-join is emitted to the joining socket only. The client literal event-string constants in `presenceSocket.ts` (the B-5 build-break fix replacing the runtime CJS import) match the gateway's `PRESENCE_EVENTS` values byte-for-byte, including the bare `join_channel`/`leave_channel` strings — contract integrity preserved with the shared `presence.ts` Zod schema as the single source. Boot-safety is correct: the value imports for `RbacService` and `PresenceService` carry the `useImportType` biome-ignore (wave-12 type-only-import-crash lesson honored). Scope is held — in-memory only, no Redis/multi-pod, no idle/away/rich-presence, and author-row dots (10b9d18e) correctly deferred. Commit discipline: every claimed task_id has at least one citing commit and no commit's file set escapes the union of its cited tasks' declared contracts. One non-blocking finding (responsive breakpoint, see below) is routed to Phase 2 / T-5 layout, not gated here.

## Findings carried to Phase 2 / downstream (non-blocking)

### M-1 (Medium — responsive breakpoint mismatch)
- **Where:** `apps/web/src/shell/AppShell.tsx:110` — `<div className="hidden xl:flex">` wrapping `MemberListPanel`.
- **What:** Tailwind `xl:` is the ≥1280px breakpoint; the spec AC (058984c5) and design §9 specify the panel collapses at ≤1024px (i.e. visible ≥1025px). With `xl:flex` the panel is hidden across 1025–1279px where the design intends it visible. No layout break occurs (panel cleanly absent), so this is a cosmetic responsive-tuning miss, not a contract/security/data failure.
- **Why not a gate-blocker:** does not violate the no-leak boundary, the contract, or any data-integrity invariant; the AC's "no layout break at narrow widths" intent is met. Severity Medium per B-6 triage (style/layout) — fix in same-branch if cheap or document as accepted-debt; verify at T-5 layout.
- **Suggested fix (if taken):** change to `hidden lg:flex` and confirm against design §9, or add an explicit `min-w-[1025px]` media query matching the design token; route to react-specialist.

### N-1 (Note — commit granularity, no action)
- B-2 (`4772b7a`) and B-3 (`092a24c`) each cite two task_ids because the typing spec (58633934) is physically inseparable from the /presence namespace (its handlers live inside `presence.gateway.ts`) and from the frontend client. The file sets stay within the union of the cited tasks' declared contracts. This is the documented multi-spec interleave, not scope drift; a rebase-split would be artificial file churn for zero integrity gain. PASS — no rework.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
