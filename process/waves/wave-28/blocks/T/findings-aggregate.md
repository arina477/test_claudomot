# Wave 28 — T-block findings aggregate

Canonical V-2 input. T-block surfaces findings with evidence; V-2 classifies blocking / non-blocking / noise.

| # | Stage | Severity | Category | Description | Evidence | Suggested disposition |
|---|---|---|---|---|---|---|
| F28-T8a | T-8 | LOW | spec-vs-impl | Spec AC1 says owner rotate "-> 200" but the live endpoint returns 201 (NestJS @Post default). Body correct {invite_code}; status is 2xx success. Cosmetic spec-text vs framework-default mismatch, not a behavioral defect. | Live: POST /servers/ad62cd12/invite-code/rotate (owner A) -> HTTP 201, body {"invite_code":"PGrHRTlwNuPz_xLYhe2cRg"}. Integration + controller specs assert body shape, not a literal 200. | V-2: non-blocking. Loosen AC to "2xx" or add @HttpCode(200) if 200 is contractually required. No client consumer this wave. |
| F28-T8b | T-8 | LOW (accepted-debt, carried from B-6) | authz-oracle | 403-vs-404 existence oracle: non-owner->403 (AC4) reveals server exists to an authenticated non-member; missing->404. Matches spec AC4 + existing findServerDetail precedent; server ids are non-secret UUIDs; owner-only mutation still enforced. | B-6 Phase-2 /review finding (accepted-debt, no code change); live-confirmed non-owner B -> 403. | V-2: non-blocking (B-6 already accepted; spec-conformant). Record only. |

## Notes
- No critical/high findings. Security-load-bearing invariants (owner-ONLY authz, unauth 401, CSPRNG unpredictability, proven old-link invalidation) all PASS at the LIVE layer against prod with real verified sessions.
- T-block does NOT decide which findings block - V-2 owns classification.
