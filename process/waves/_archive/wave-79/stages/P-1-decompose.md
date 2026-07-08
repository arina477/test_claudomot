# Wave 79 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~28-38 (2 Drizzle migrations; users schema key table; dm schema ciphertext/sender-key-ref/envelope-version/tombstone; packages/shared/src/privacy.ts contracts; profile controller +2 key endpoints; encryption-key service; dm.service server-blind persist; messaging gateway envelope passthrough; web keygen+storage, DM-view encrypt/decrypt, api.ts key fns, E2E indicator; tests across all) | no |
| New primitives | >60 | ~14 (key table + 2 endpoints + EncryptionKeySchema + PublicKeyResponseSchema + ciphertext columns + encryption-key service + client keygen + encrypt/decrypt + peer-key cache + E2E indicator) | no |
| Estimated net LOC | >5,000 | ~2,600-3,200 (crypto err-high) | no |
| Stage-4 working set | >350K | moderate (Web Crypto is a standard browser API — no heavy SDK docs; reuses shipped visibility/dm/privacy substrate) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [60bda5be (seed), 491cb85d, 3fb88f44] → 3 → **multi-spec**.
- Multi-spec floor: net LOC >2,500 OR ≥6 specs. Estimate ~2,600-3,200 → **FLOOR MET** (upper + conservative both clear 2,500). No merge, no rule-5 waiver needed. (Note: mvp-thinner's THIN split of task 4 was applied at P-0; the remaining E2E chain is irreducible per mvp-thinner — OVER-CUT if split further.)
- `floor_merge_attempt: 0`.

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "E2E status indicator (apps/web DM view) — a NEW trust-signal UI element: shows whether a conversation is end-to-end encrypted vs plaintext-fallback (peer has no key). LOAD-BEARING anti-security-theater: must NEVER show a lock/encrypted state on a plaintext-fallback message; fails closed to 'not encrypted'. No existing mockup; the honest-indicator visual language (encrypted / not-encrypted / peer-has-no-key) is a genuinely new pattern warranting a D-brief."
  - "DM key-setup / first-use affordance (apps/web) — MAY be minimal (silent keygen on first DM) or need a light 'setting up secure messaging' state; D-1 audit decides if it's a true gap or reuses existing DM-view states."
```
Rationale: the E2E indicator is a new trust-signal surface where getting the visual semantics wrong = shipping a false privacy promise (the make-or-break AC per ceo-reviewer + problem-framer). design_gap TRUE → D-block. Backend legs (key registry, envelope, service) are design-independent. D-block MUST enforce the fail-closed indicator (no false padlock).

## Verdict
- **PROCEED** (multi-spec; max-rubric clear; floor met; no split; design_gap_flag TRUE → D-block).
- **Binding refinements carried P-0 → P-2 (LOAD-BEARING, security-critical):** (1) server-blind invariant = hard AC + non-happy proof + mandatory T-8 + P-4 security-scope gate; (2) migration relaxes dm content NOT NULL + defines ciphertext/sender-key-ref/envelope-version/tombstone (build, don't inherit); (3) honest E2E indicator fails closed (no padlock on plaintext-fallback) — ship-blocker; (4) key-loss/no-multi-device/plaintext-fallback = accepted v1 constraints (product-decisions logged); (5) GET /profile/:userId/encryption-key routes through the shipped fail-closed visibility gates (mirror who_can_dm) — a key-fetch leak IS a visibility leak.

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [60bda5be-a592-437c-94e5-4ac11a5231f4, 491cb85d-05df-4cec-b7d7-27a980608b97, 3fb88f44-2aa6-498f-a93e-faa9b4455b89]
floor_merge_attempt: 0
design_gap_flag: true
missing_surfaces: ["E2E status indicator (DM view)", "DM key-setup affordance (D-1 assesses)"]
```
