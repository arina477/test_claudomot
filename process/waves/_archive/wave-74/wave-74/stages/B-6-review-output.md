# Wave 74 — B-6 /review output (Phase 2)
Independent adversarial /review over the entitlements diff. **Recommendation: ship-as-is** (no FIXABLE, no INVESTIGATE).
## Verified SAFE (3 high-risk items)
- **Gate non-regressive:** resolveCreateGateForOwner counts ONLY the owner's servers (WHERE owner_id=ownerId); free cap=100 → an existing owner blocked only at ≥100 (none realistically). Behavior unchanged for all current owners.
- **Cap boundary correct:** `currentServerCount >= maxServersPerOwner`, count taken BEFORE insert (excludes in-flight server) → 100 is max-that-exists, 101st blocked. No off-by-one.
- **No module cycle:** EntitlementsModule imports nothing (leaf); ServersModule→EntitlementsModule one-way; AppModule lists both. No DI cycle → no boot white-screen.
- Fail-closed on resolve error (correct for a cap gate — no silent bypass); Drizzle parameterized + `.limit(1)` bounded; out-of-enum tier safe-defaults 'free' (no crash); fence held (no Stripe/price/quota columns).
## P2 accepted-debt (non-actionable at cap=100)
- FK subscriptions.server_id no onDelete — harmless (orphan sub row defaults resolve to free).
- **Boundary TOCTOU:** two concurrent creates by the same owner at the 99→100 boundary could both pass → end at 101. Unreachable at cap=100; **revisit when paid-tier caps drop to low numbers** (the next real-charging M9 slice) → V-2 note.
