# Wave 13 — V-2 Triage
Both APPROVE; no security/correctness blocking. 1 small defence-in-depth Low (head-verifier decides fast-fix vs defer).
| Finding | Sev | Bucket | Proposed disposition |
|---|---|---|---|
| toggleReaction doesn't gate on is_deleted (react to soft-deleted msg) | Low | FAST-FIX candidate | spec edge-AC "react-to-deleted blocked/no-op". 1-line guard (throw/no-op if message.is_deleted) in toggleReaction. UI-unreachable but a real defence-in-depth + closes the AC. Small → fast-fix; OR defer (UI-unreachable). head-verifier calls. |
| emoji validation | info | non-blocking | jenny confirms shape-validated (messaging.ts:72); OK. |
| cross-user authz live-probe gap | info | non-blocking | unit-tested (both branches); single-fixture limit (4a2ad286). |
```yaml
findings_blocking: []
fast_fix_candidate: [react-on-deleted is_deleted-guard]
