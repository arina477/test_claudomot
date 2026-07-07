# Wave 74 — T-block findings aggregate

## Carried from B-6 /review
- [P2/accepted → V-2] boundary-TOCTOU: concurrent createServer at the cap boundary could exceed by 1. Unreachable at cap=100; revisit when paid-tier caps drop low (next real-charging M9 slice).

## T-5 E2E (live prod) — REGRESSION caught + FIXED + re-verified
- **[HIGH → FIXED same-wave] free-tier cap regression:** the shipped free placeholder maxServersPerOwner=100 blocked a LIVE owner (Fixture A, 646 servers) from createServer — violated the B-2 non-regression requirement. CI/unit missed it (fresh DB, no 100+-server owner). Fix-forward (PR #92 / d79dd18): free cap 100→100_000 (155× the observed max 646), tiers scaled. Both services redeployed on d79dd18; the "authed create-server" e2e RE-RAN GREEN against the fixed prod → Fixture A can create again, gate non-restrictive. Real-user impact was nil (no real user at 100 servers); the fixture's inflated count exposed the too-low placeholder.
- **Non-regressive confirmed:** e2e authed-create-server PASS on d79dd18.

## T-8 Security (the createServer authz gate) — PASS
- The gate is server-CREATION authz (not a new auth/payment surface — security_scope_flag=false). Owner comes from the session (createServer(ownerId) — ownerId is session-derived, no-IDOR: an owner can only create their own servers + the cap counts their own). Fail-closed on resolve error (correct for a cap gate — no silent bypass). No new endpoint, no PII, no Stripe/secret. Secret grep 0 (B-block). Nothing to probe beyond the gate behavior (CI-verified THROWS + live non-regressive).
