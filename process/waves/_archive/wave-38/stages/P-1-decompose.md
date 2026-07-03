# Wave 38 — P-1 Decompose

## Maximum size rubric (split when over)

| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~2–6 (files.service.ts avatar render path; possibly files.controller.ts + a frontend avatar-URL consumer if presigned-GET migration is needed; test files; Railway env config) | > 60 | no |
| New primitives | 0–2 (at most one avatar presign-GET endpoint if bucket is private) | > 60 | no |
| Estimated net LOC | ~50 (public-read bucket path — wire creds + verify only) to ~500 (if bucket is private → migrate avatar render to presigned-GET) | > 5,000 | no |
| Stage-4 working set | small (~60K) | > 350K | no |

**Max verdict:** not tripped.

## Wave type

`claimed_task_ids = [84e09891]` → **single-spec**. (The ceo SELECTIVE-EXPANSION attachment path — task 20db0c16 — is already `status=done`; it is re-verified as an in-wave verification pass, NOT re-claimed as a done-task, so it does not enter claimed_task_ids.)

## Minimum size floor

- single-spec floor: net LOC `> 1,500`.
- Estimate: ~50–500 LOC → **FLOOR TRIPS** → RESCOPE-AUTO-MERGE path.

### RESCOPE-AUTO-MERGE → decomposition-expansion known-futile → PRECEDENT-APPLICATION override-ship

- **floor_merge_attempt: 0.** Decomposition-expansion is known-futile by inspection: M7's entire open queue after claiming 84e09891 is a single task — a1299e88 "Verify a Resend domain for transactional email", which is **founder-cred-blocked** (needs a founder-owned domain + DNS; the founder supplied storage creds but not the domain). No unblocked adjacent M7 scope exists to floor-fill. M7 is `product-polish` and otherwise fully shipped (10 done). Padding with re-homed cross-milestone debt would be bloat and would contradict the P-0 reframe (ceo SELECTIVE-EXPANSION was bounded to verify-only; problem-framer confirmed the root work is ops+verify, not new code).
- **Why NOT a fresh 7-member BOARD:** the wave-24 BOARD (6/7 override-ship, product-decisions 2026-07-02) explicitly instructed "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead." Waves 25 and 26 applied this as PRECEDENT-APPLICATION. This wave-38 is the identical pattern: an infra-reuse / launch-ops wave that makes already-shipped upload infrastructure (avatar built wave-4, attachments built wave-19) actually function at runtime — the founding wave-21 exemption language ("the floor — a thin-FEATURE-wave guard — does not apply when the wave's job is to make shipped infra actually function at runtime") applies verbatim. The decomposition-expansion is cred-blocked exactly as the M5-reminders precedents were (Resend). Applying the standing twice-decided ruling honors the gate, not skips it.
- **Additional authority:** this wave is explicitly **founder-directed** (Path A resume directive — the founder chose to finish M7 launch-ops and supplied the storage creds). Founder direction is higher authority than a BOARD floor vote.

**Verdict:** PROCEED-AFTER-MERGE (override-ship via P-1 §2b resolution (a); PRECEDENT-APPLICATION citing wave-21 infra-reuse exemption + wave-24 standing "do-not-re-litigate" ruling).

## design_gap_flag

```yaml
design_gap_flag: false
missing_surfaces: []
```

Rationale: no new UI surface. The avatar upload/settings UI shipped wave-4 with its design; avatar images render via `<img>` regardless of whether the URL source is a static-public URL or a presigned GET (same visual surface, different URL provenance). Attachment verify exercises existing shipped UI. Backend-wiring + verify wave → **D-block skips, P-block hands off to B**.

```yaml
floor_merge_attempt: 0
wave_type: single-spec
verdict: PROCEED-AFTER-MERGE
design_gap_flag: false
```
