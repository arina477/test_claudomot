# T-8 — Security / Privacy (wave-80, presence honor — CROWN JEWEL)

**Pattern:** B — Active-execution. wave_type includes auth (privacy). Applicable probes: honor(privacy-enforcement), no-clobber, own-visibility, audit, secret-grep, auth-boundary(401). Auth-flow/CSRF-token/session-rotation/rate-limit probes N/A (wave adds no auth flow, no new session lifecycle; PUT uses the existing SameSite-cookie session guard already probed project-wide).

## 1. Honor LIVE (presence-visibility enforcement — the whole wave)
show_presence=false user is NOT broadcast online to co-members — PROVEN LIVE two-client (T-5):
- A (browser socket live, no reconnect) PUT showPresence=false → co-member B's `/presence` socket RECEIVED `presence:offline{A}` at +126ms; un-hide → `presence:online{A}` +172ms; repeatable 3 cycles.
- Snapshot honor + offline-gate + connect-race reconcile additionally proven by the CI two-subject integration spec (presence-show-presence-honor.spec.ts, green on postgres:16, merge 4795638 — read in full: real gateway+service+PG+faithful room-routing double asserting the co-member's RECEIVED events).
- Enforcement is server-side (privacy service → presence gateway proactive emit + emit-path gates), NOT a client hide.

## 2. NO cross-tab clobber (the B-6 F1 partial-update fix) — LIVE
Probed live (fixture A, header-mode session):
- set showPresence=false (PUT {showPresence:false} → 200, GET false)
- then PUT {profileVisibility:"server-members"} (visibility-only, NO showPresence key)
- GET → `{profileVisibility:server-members, whoCanDm:everyone, showPresence:FALSE}` — showPresence UNCHANGED.
The partial-update no-clobber HOLDS in prod: a visibility-only write does NOT reset showPresence (and the schema is `.partial()`, service merges only present keys). A stale second tab re-sending only its changed field cannot silently re-enable a presence a first tab just hid.

## 3. Own-visibility-only — LIVE
Hidden user still receives co-members' presence: B's snapshot on connect included A online (B receives A inbound); A's browser member panel showed "ONLINE — 2" including studyhall-e2e-fixture-b when B connected (A receives B inbound). The toggle governs OUTBOUND broadcast only; INBOUND view unaffected. (T-5 S5.)

## 4. Audit event — LIVE, no PII
Toggling showPresence writes a privacy-audit event via AppendPrivacyEventService — OBSERVABLE at GET /profile/privacy-events:
- A toggle produced a new `privacy_settings_changed` event (count 27→28) with context `{showPresenceFrom:true, showPresenceTo:false, visibilityFrom/To, whoCanDmFrom/To}`.
- **NO PII:** grep of the events payload for email / display_name / password / @example → ZERO matches. Context is enum + boolean values only.
- (This appended 1 event to the append-only ledger — inherent to an audit log, not deletable, not mutable user-facing state.)

## 5. Auth boundary — 401
- unauth GET /profile/privacy → 401. unauth PUT /profile/privacy → 401. (Confirmed live + at C-2.)

## Secret grep (Action 5 — ALWAYS runs)
`git diff 4795638~1..4795638` over source/env → 1 match: a CODE COMMENT in ws-auth describing SuperTokens session tokens ("...validates SuperTokens sessions, which do not..."). NOT a committed credential. Zero real secrets. show_presence migration + code carry no keys.

## Findings
- F-T3-1 (LOW, carried from T-3): unknown-key PUT body returns 200 (stripped) not 400 — schema comment claims `.strict()` but schema lacks it. Mass-assignment SAFE (only 3 known keys map to columns; verified bogusField never surfaces in GET). Doc/enforcement mismatch → V-2.
- F-T5-1 (LOW, carried from T-5): presence:offline/online delivered to co-member twice (idempotent duplicate) → V-2.
- NO critical/high. Honor holds. No clobber. Own-visibility holds. No PII. 401 enforced.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [honor_enforcement, no_clobber, own_visibility, audit_event, secret_grep, auth_boundary_401]
honor_live: "PASS — B recv presence:offline{A} 126ms after A hides, no A reconnect (T-5 two-client) + CI two-subject proof"
no_clobber_live: "PASS — visibility-only PUT preserves showPresence=false (F1 partial fix live)"
own_visibility_live: "PASS — hidden A still receives B's presence; B receives A inbound"
audit_event_live: "PASS — privacy_settings_changed w/ showPresenceFrom/To; NO PII (grep clean)"
auth_boundary: "PASS — 401 unauth GET + PUT"
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: low, category: contract, description: "F-T3-1 unknown-key stripped+200 not rejected+400; .strict() absent. Mass-assignment safe.", remediation: "add .strict() to UpdatePrivacySchema if rejection intended, or fix comment."}
  - {severity: low, category: realtime, description: "F-T5-1 presence:offline/online double-delivered to co-member (idempotent).", remediation: "dedupe co-member room emit; no user-visible impact."}
```
