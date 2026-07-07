# Wave 73 — P-0 Frame

## Discover
- **wave_db_id:** 2b94866f-7a91-41c0-971c-753c4831de5a (wave_number 73; milestone_id set to M10 at INSERT — no separate backfill needed).
- **Prior-work:** M10 account-erasure (wave-72) + data-export (wave-35) shipped the surfaces this audit log observes; wave-70 shipped blocks; wave-70/35 shipped privacy-settings. No prior audit-log code (clean addition, confirmed by problem-framer).
- **Roadmap milestone:** M10 Compliance & data rights (97d65b49, in_progress). Regime-INDEPENDENT leg (founder-reserved M10 scope — compliance-regime pick, FERPA/COPPA, consent — fenced by the N-1 decomposition; recorded in product-decisions).
- **Spec-contract short-circuit verdict:** `no-prior-spec` (seed carries prose only, no fenced YAML head) → full P-1..P-3.
- **Product decisions:** none this wave (regime-independent; no Tier-3 signal — the founder-reserved compliance decisions are fenced out).

## Reframe
**Original framing:** append-only privacy-events audit log + AppendPrivacyEvent service + non-blocking after-commit write hooks at 4 shipped seams (erasure, export, privacy-settings, block/unblock); read-list sibling framed "optional/deferred".

- **problem-framer: PROCEED.** Symptom-vs-cause PASSES (durable record of privacy actions is the true cause, fixed at the persistence + service-hook layer). All 4 seams verified real in live code; schema precedent (reports.ts) real; regime-independence holds (per product-decisions). Best-effort after-commit posture mirrors the shipped deleteAccount session-revoke idiom (not invented). Append-only-by-convention correctly scoped (crypto tamper-evidence would be gold-plating). **Load-bearing refinement:** highest risk is the "plumbing built but not wired" pattern — P-2 must keep the "hook fires with correct event_type" AC binary + PER-SEAM, and T-1/T-4 must assert an actual `privacy_events` row exists after each action (never accept a code-read that the hook exists).
- **mvp-thinner: OK.** Seed is a coherent minimal backend slice; ALL 4 seams mvp-critical (splitting settings/block would ship a record omitting 2 of 4 privacy actions — undercuts the durability claim; hooks are the cheapest part). DTO sibling already separate; read-list already separate. No gold-plating (jsonb context is minimal non-PII). No THIN. Flag: M10 success-metric _TBD by founder_ (could reshape scope later — not a bundled defect).
- **ceo-reviewer: SELECTIVE-EXPANSION.** Backend-only append-only log at ~0 users = invisible plumbing (3/10); the read-list sibling `5a2521bc` (already in the bundle, one parent_task_id away, targets the shipped /settings/privacy) converts it to a user-facing trust signal (9/10) — the exact artifact the founder points at when a paying-school requirement lands (M10's promote-to-H1 trigger). Fences (regime/consent/metric) stay out.

**Mediation:** none required (ceo SELECTIVE-EXPANSION + mvp-thinner OK — not THIN; no tie). The proposed expansion target (read-list 5a2521bc) is ALREADY a claimed sibling in the wave-73 bundle, so "expansion" = committing to ship it rather than treating it as droppable-optional. Accepted.

**Sibling task IDs created:** none (no new split; bundle already = seed + DTO + read-list).

**Disposition: PROCEED.**

## Final framing for the rest of P-block
Ship all 3 bundled tasks as one wave: (1) seed 156aa2ee — privacy_events table + migration + AppendPrivacyEvent append-only service + non-blocking after-commit write hooks at the 4 shipped seams; (2) 03940edd — shared @studyhall/shared Zod contract/types for the event shape; (3) **5a2521bc — "Your privacy activity" read list on /settings/privacy (COMMITTED, not optional)** — the user-facing trust signal. Binding refinements: every hook is LIVE-DB verified per-seam (a real privacy_events row asserted after each of the 4 actions, T-4 integration), event_type validated against a Zod z.enum (no pgEnum), append-only (no update/delete on the service), logging failure must not fail/rollback the user action. This is a UI wave (read-list) → P-1 will set design_gap_flag (likely false — /settings/privacy + list patterns already exist; P-1 confirms).
