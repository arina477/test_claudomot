# Wave 80 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 Phase-1 independent gate)
**Reviewed against:** process/waves/wave-80/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The T-block honestly proves every acceptance criterion of the presence privacy toggle, and the one load-bearing AC (AC-2 honor) is proven with genuine two-distinct-user delivery — not a single client's own echo — at two independent levels. **T-5** ran a live two-client test where Client A (Fixture A, real browser, live socket, **never reconnected**) toggled via the real `PUT /profile/privacy` path and a REAL second `socket.io-client` for a DISTINCT verified user B (Fixture B, via the documented WS-auth non-browser fallback in `ws-auth.ts`) RECEIVED `presence:offline{A}` at +126ms and `presence:online{A}` at +172ms, deterministic across 3 cycles (T-5 S2/S3/S4). This is backed by the **CI two-subject integration spec** (`presence-show-presence-honor.spec.ts`, read in full, green on postgres:16, run 28917150735) which drives the REAL PresenceGateway + PresenceService + PrivacyService against real Postgres, asserting the events the **co-member socket B receives** after A's real `updatePrivacy()` DB write fires the production `onShowPresenceChanged()` cross-module emit — the socket transport is a faithful room-routing double (`.to(room).emit` delivers only to joined sockets), an honest boundary given SuperTokens sessions don't exist in the pg harness; the system-under-test (gateway/service/privacy/DB) is entirely real, so this is NOT mock-the-SUT. The B-6 F1 no-clobber fix is proven live (T-3/T-8): showPresence=false, then a visibility-only PUT with NO showPresence key, then GET shows showPresence STILL false — a stale tab cannot silently re-enable a hidden presence. Own-visibility-only (hidden A still receives B inbound), the no-PII audit event (grep-clean privacy_settings_changed), and 401 unauth GET/PUT are all covered live. Both findings are correctly LOW and non-blocking: **F-T3-1** (unknown key stripped→200 not rejected→400) is verified mass-assignment-safe (only the 3 known keys map to columns; GET confirms bogusField never persists) — a doc/enforcement mismatch only; **F-T5-1** (idempotent duplicate presence frame) is same-status, client-deduped, no user-visible effect. Mutation-sanity holds — each honor assertion would fail on a real gate regression (missing offline emit, broken no-clobber). T-1 static is clean (0 production TS bypasses; all 23 in test files), T-2 unit covers all touched modules, T-6 confirms a REAL enabled emerald/grey DS-token switch (not the disabled whoCanDm-Beta affordance) with binary-online copy and NO last-seen framing (P-4 correction 4). **T-7 skip is justified** — additive boolean column (migration 0033, no backfill), reused presence fan-out, no new dependency, no hot-path or critical-render change. The **journey-map page-16 SettingsPrivacyPage entry (P-4 correction 6) is present and complete**, reflecting the live presence toggle, the showPresence field, the partial PUT, and the two-client honor proof; Phase-2 regen will confirm and commit it against deployed state. No coverage theater, no single-client realtime, no mock-the-SUT, no evidence-cites-fewer-surfaces-than-touched. Every touched surface (migration/getShowPresenceBatch/cross-module emit/audit/controller/schema/page) is traced to a passing probe.

## Escalation
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
