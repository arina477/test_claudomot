# Wave 48 — T-block findings aggregate

Canonical V-2 input. Severity scale: CRITICAL (blocks) / HIGH / MEDIUM / LOW / NOISE.

| # | Severity | Layer | Location | Description |
|---|---|---|---|---|
| 1 | LOW | T-4 integration | apps/api/test/integration/dm-candidates.spec.ts | Coverage gap (not a regression): who_can_dm='server-members' value is NOT exercised at integration. Current controls cover 'nobody' (excluded) and 'everyone' (included). 'server-members' is the third enum value and a natural POSITIVE-control candidate — a co-member with server-members in a shared server SHOULD be returned. Non-blocking; the shipped fence for that value was already covered by unit tests + wave-47 T-8 pen-test. Future positive-control follow-up. Noted at B-6 /review. |

**Criticals:** 0
**Total findings:** 1 (all LOW)
