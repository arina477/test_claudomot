```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  All 6 items are pre-triaged V-2/T-6 follow-ups on the SHIPPED + verified M8 core
  (educator/moderation, assignment collect/return, class scheduling). Mandatory
  symptom-vs-cause check passed on every item: the MAJOR T6-F1 responsive bug names
  the ROOT cause (members panel fails to collapse to a toggle at the 1024 min
  breakpoint per DESIGN-SYSTEM §9, crushing the agenda card to 28px) not the 28px
  symptom; focus-restore, stale-panel re-sync, DTO omission, and stale comment all
  target the correct layer. No antipattern matched: no new feature is smuggled in as
  "polish" (zero new ACs; all bounded fixes on already-proven behavior), 683fec9b's
  V1-F1 is doc-only (comment stale, code already correct — no authz rewrite, so no
  antipattern #2), and there is no premature abstraction (#4). Framing is sound.
  Two blocked-dependency and one coherence flag are raised for P-1, not blockers to PROCEED.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

## Flags carried to P-1 (do NOT block PROCEED)

### FLAG 1 — Blocked dependency: ca43eb12 E2E depends on fixture-B, which is STRANDED
- **ca43eb12** (two-client delete-fan-out E2E) explicitly states "author once fixture-B is usable."
- **c50f3040** (the fixture-B re-provision task) is NOT in this bundle. It belongs to **wave-41, which is CLOSED (`status=ok`), yet the task itself is still `status=todo`** — it stranded when its wave closed without completing. This is the exact `wave_id`-not-NULL follow-up-stranding trap (see MEMORY.md: "V-2 milestone follow-up wave_id must be NULL for N-2 seed"). It is neither done nor claimable this wave under normal seeding.
- **Consequence:** ca43eb12's Playwright two-client spec is NOT buildable this wave until fixture-B signs in on deployed SuperTokens. P-1 should either (a) pull fixture-B (c50f3040) into this wave as an explicit prerequisite sibling and NULL its stranded `wave_id` first, or (b) defer/carry ca43eb12 as blocked-until-fixture. Do not schedule ca43eb12 without resolving fixture-B.

### FLAG 2 — Blocked dependency: 8d971bc2 attachment integration needs S3/Tigris test creds
- 8d971bc2 item (2) (T4-F1 attachment presign→upload→submit integration) self-declares "add once test-env storage creds exist." Item (1) (unit tests for submission service methods) is credential-independent and buildable now.
- **Consequence:** the wave can land the unit-coverage half; the attachment-integration half is credential-blocked. P-1 should split at the AC level — build item (1) now, defer/carry item (2) behind a creds prerequisite (aligns with PRODUCT-PRINCIPLES rule 3: build credential-independent ACs now, defer live verify).

### FLAG 3 — Coherence: 6-item mixed bundle (UI-polish + test-coverage + DTO-parity) — P-1 owns split decision
- The bundle mixes three shapes: UI polish (8e54799a, 683fec9b, 8828484f), test-coverage-hardening (8d971bc2, ca43eb12, parts of 0308cdf1), and a DTO/schema parity fix (0308cdf1 item 1). All share milestone M8 and the "non-blocking follow-up on shipped surface" theme, so it is coherent enough to NOT force a RESCOPE-AUTO-SPLIT verdict. But two members carry hard external blockers (Flags 1 + 2). Recommend P-1 slice the credential/fixture-blocked items (ca43eb12; 8d971bc2 item 2) into a deferred lane so the buildable-now polish + coverage ships without waiting on infra.

### Orchestrator note (spawn contract, not my verdict)
- Active milestone M8's `## Class` = **`product-feature`** → per P-0 stage contract Action 5, **mvp-thinner MUST also be spawned** alongside problem-framer + ceo-reviewer. (Likely returns OK/n-a here: this is polish/coverage on shipped features with zero new ACs to thin, but the spawn is still mandated by class.)

## Symptom-vs-cause ledger (mandatory, all items)
| Item | Symptom | Root cause named? | Fix at cause layer? |
|---|---|---|---|
| 8e54799a T6-F1 | agenda card 28px | members panel not collapsing ≤1024 (DESIGN §9) | yes |
| 8e54799a T5-F1 | focus lands on BODY | Esc handler not restoring to invoking element | yes |
| 8e54799a T5-F2 | detail panel stale after edit | open panel not re-synced on edit success | yes |
| 8e54799a T6-F3 | "Create Session" vs "Save" | copy mismatch vs mockup | yes |
| 683fec9b | modal vs popover / soft ring / empty name / stale comment | positioning + alpha token + null fallback + doc | yes |
| 8828484f | tight amber indicator | missing gutter token on MemberListPanel | yes |
| 8d971bc2 | no unit tests / no attachment integ | coverage gap (creds-blocked half) | yes |
| ca43eb12 | no two-client fan-out E2E | coverage gap (fixture-blocked) | yes |
| 0308cdf1 | DTO omits createdAt/updatedAt + no unit tests | schema+mapper omission + coverage gap | yes |

No symptom-layer masking detected. No antipattern match.
