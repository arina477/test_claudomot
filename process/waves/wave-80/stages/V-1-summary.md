# Wave 80 — V-1 Independent reviews (summary)

Karen + jenny parallel, no shared context. Both APPROVE. wave-80 (presence privacy toggle, LIVE 4795638) verified on both axes.

## Karen (source-claim) — APPROVE (6/6, 0 REJECT)
Files+migration on merge tree; 3 honor gates real (online wentOnline&&showPresence / offline cached flag / snapshot batch co-member flags); proactive onShowPresenceChanged under per-user withPresenceLock mutex + reconcileHiddenUser (closes connect-vs-toggle race) + F3 cached-serverId audience; partial update (.partial() + present-key-only + UI single-field); migration verified on prod (show_presence boolean NOT NULL true) + Railway SUCCESS @ 4795638; two-subject spec genuine (real room routing, distinct sockets, real cross-module path, ran in CI). .strict() mismatch confirmed cosmetic (unknown keys stripped, only 3 known keys map to columns, no mass-assignment).

## jenny (spec-semantic) — APPROVE (0 DRIFT, 0 GAP, 11 checks)
LIVE-proven (2 fixtures + 2 real Socket.IO clients): AC-2 proactive honor (A off → B offline ~101ms, no reconnect; on → ~97ms); snapshot batch (fresh B connect sees hidden A offline); own-visibility (hidden A still sees B); partial PUT no-clobber (showPresence-only preserves visibility + vice versa); invalid→400; unauth→401; audit privacy_settings_changed no-PII; binary online (no last-seen); real enabled toggle (not Beta); truthfulness bounded (online-broadcast only, not activity rosters — UI honestly says "appear offline"). Prod left clean.

## Findings → V-2 (0 blocking)
- F-T3-1 (LOW): .strict() comment/code mismatch — unknown key→200 strip, mass-assignment-safe (cosmetic/hardening).
- F-T5-1 (LOW): duplicate presence emit to co-member (idempotent, client dedupes, no user-visible effect).

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
jenny_verdict: APPROVE
jenny_findings_count: 0
spec_drift_count: 0
spec_gap_count: 0
```
