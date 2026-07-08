# Wave 80 — B-6 /review output (presence adversarial)

Scope CLEAN. Honor verified sound (3 emit paths + proactive emit gate on show_presence; inbound-unaffected; audit PII-free; migration DEFAULT true).

## Findings → triage
| # | Sev/Conf | Finding | Disposition |
|---|---|---|---|
| F1 | P2/9 | Cross-tab full-replace PUT clobber: a stale tab changing visibility re-sends showPresence=true, silently re-enabling a presence-off | **FIXED** 5cca542 (partial schema + present-key-only service update) + 7ecb493 (UI sends only changed field). Re-review CLOSED. |
| F2 | P1/7 | Connect-vs-toggle race: a new tab connecting during the toggle DB-write broadcasts a hidden user online | **FIXED** 5cca542: per-user mutex serializes connect-broadcast + onShowPresenceChanged; reconcileHiddenUser emits corrective offline. Re-review CLOSED. |
| F3 | P2/7 | Proactive emit audience used fresh serverIds vs connect-time cached (H-1b invariant) → phantom/missed events on mid-session membership change | **FIXED** 5cca542: fans out to the UNION of live sockets' cached serverIds. Re-review CLOSED. |
| F4 | P3/6 | Optimistic revert restored the wrong value under overlapping saves | **FIXED** 7ecb493: pre-change local const. |
| — | P3/8 | getShowPresenceBatch IN-list unbounded (scale ceiling) | **Accepted** — self-use-MVP scale; parameterized (no injection). |
| — | — | privacy.ts comment says .strict() but code is .partial() (harmless — Zod strips unknown keys) | **Accepted debt** (cosmetic comment/code mismatch, no functional path). |

Verified-correct (unchanged): inbound-unaffected, audit-PII-free, migration-default, multi-tab-steady-state, offline no-op.

Post-fix re-verification: typecheck 4/4; biome clean (395); web 735/735, api 820/820, shared 49/49; build 3/3. Re-review: MERGE-READY (all 3 privacy violations closed at cited enforcing lines; no deadlock/loop/skip).
