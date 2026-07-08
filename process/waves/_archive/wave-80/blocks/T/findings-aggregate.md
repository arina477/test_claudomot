# Wave 80 — T-block findings aggregate

(canonical V-2 input; append-only as the block runs)

## Findings (V-2 input)

### F-T3-1 — LOW (contract-hygiene) — from T-3 / re-cited T-8
- **Where:** PUT /profile/privacy, `UpdatePrivacySchema` in packages/shared/src/privacy.ts.
- **Symptom:** an unknown key (`{bogusField:true}`) returns **200 (silently stripped)**, not 400. The schema's own comment claims "`.strict()` keeps unknown keys rejected," but the deployed schema is `.object({...}).partial()` WITHOUT `.strict()`.
- **Severity rationale:** LOW. NOT a security issue — mass-assignment safe: the service maps only the 3 known keys to columns; bogusField never reaches the DB (GET returns only the 3 fields). Documentation/enforcement mismatch only.
- **Evidence:** live probe on prod (fixture A) — `{bogusField:true}` → 200, GET unchanged.
- **Remediation options:** add `.strict()` to UpdatePrivacySchema (reject unknown → 400), OR correct the comment to reflect strip-not-reject.

### F-T5-1 — LOW (realtime hygiene) — from T-5 / re-cited T-8
- **Where:** presence proactive emit / co-member room fan-out (presence.gateway onShowPresenceChanged + emit paths).
- **Symptom:** each `presence:offline{A}` and `presence:online{A}` was delivered to co-member B's socket TWICE (duplicate frame, identical payload) on every toggle.
- **Severity rationale:** LOW. Idempotent — same status; the client presence store dedupes. No user-visible effect, no correctness issue. Possible double-emit across overlapping co-member rooms.
- **Evidence:** B socket frame log — two `presence:offline` frames at 04:36:13.152 + 04:36:13.161; two at 04:36:48; (online single at 04:36:27 in one cycle, double in others).
- **Remediation:** dedupe the co-member-room emit or emit once per distinct socket; non-blocking.

### No critical / high findings.
Honor holds live (co-member sees hidden user offline, no reconnect). Partial no-clobber holds live. Own-visibility holds. Audit event fires with no PII. 401 unauth enforced. Zero committed secrets. Zero production TS bypasses.
