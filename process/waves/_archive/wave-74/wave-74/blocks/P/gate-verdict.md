# Wave 74 — P-4 Gate Verdict (Phase 1, independent head-product review)

**Reviewer:** head-product (fresh P-4 gate, Phase 1)
**Wave:** 74 — M9 Monetization: entitlements substrate (pricing/credential-independent first slice)
**Milestone:** M9 (`3e507bc0`, sole `in_progress` — verified live) — traces cleanly to the M10-good-enough→M9 pivot
**Verdict:** **APPROVED**
**design_gap_flag:** false (confirmed — hand off to B directly)

---

## Independent verification performed (not inferred from upstream artifacts)

| Load-bearing claim | Method | Result |
|---|---|---|
| M9 is the sole `in_progress` milestone; wave row points at it | `psql milestones` + `waves` | PASS — `3e507bc0`; wave-74.milestone_id = `3e507bc0` |
| 3 claimed tasks exist, `todo`, unclaimed, on M9 | `psql tasks` | PASS — all 3 present, `todo`, `wave_id` NULL-at-read, milestone M9 |
| Net-new (no prior tier/entitlement/subscription billing code) | `grep resolveForServer\|EntitlementsService\|z.enum(['free` | PASS — zero hits (grep "subscription" noise = WS/presence, not billing) |
| `createServer` has NO per-owner cap today (real wiring target, not dead code) | Read `servers.service.ts:71-96` | PASS — unconditional `insert(servers)`; no cap gate exists → check is a REAL new read-path |
| reports.ts idiom real (text/uuid/timestamp, no pgEnum) | Read `reports.ts:1-25` | PASS |
| Migration numbering | `ls drizzle/migrations` | PASS — last is `0028`; plan's `0029` is correct-next |

---

## Stage-exit checklist

### P-0 Frame — PASS
- [x] **Root cause, not symptom.** The problem is correctly framed as *"real charging needs two founder-reserved inputs (Stripe keys, prices/limits/metric) not yet available; build the billing-agnostic substrate any monetization plugs into now."* This is the cause (missing entitlements seam → future scattered inline `if(tier===)` debt), not a symptom. problem-framer PROCEED (symptom-vs-cause passes, no antipattern).
- [x] **Maps to exactly one live bet/milestone by id.** M9 (`3e507bc0`), sole in_progress, cited. Not an orphan wave.
- [x] **Falsifiable.** Observable solved-signal: the VERIFY-GATE-READS test (stubbed restrictive cap BLOCKS createServer). This is the binding proof the substrate is wired, not scaffolding.
- [x] **problem-framer + ceo-reviewer + mvp-thinner present and reconciled.** PROCEED / PROCEED-HOLD-SCOPE / OK; no silent override. Mediation: none needed (no expansion/thin tie).

**Substrate-first vs pause-for-Stripe judgment (my independent call):** Building the substrate NOW is the correct autonomous move, NOT premature/YAGNI. Rationale: (a) the wave is genuinely credential- and price-INDEPENDENT — nothing here needs the founder's Stripe keys or pricing, so pausing would idle the loop against a checkpoint that arrives in parallel; (b) the entitlements seam has a REAL, verified consumption target (createServer with no cap today), which defuses the "built but never wired" YAGNI objection — this is the exact distinction that separates a legitimate substrate from speculative abstraction; (c) the founder-reserved asks were surfaced non-blocking (checkpoint file confirmed) so the *next* real-charging slice unblocks with no wait. Pausing to get keys first would strand a zero-founder-input slice behind a founder decision it does not depend on — the wrong trade. Disposition sound.

### P-1 Decompose — PASS
- [x] **One seed + only must-ship-together siblings.** Seed (data model) + EntitlementsService (the resolver half — not splittable from the model) + gate-wiring (the proof-of-read-path whose removal drops the bundle under the multi-spec floor). mvp-thinner returned OK with **zero** split candidates; the only expandable scope (Stripe/pricing/enforcement) is founder-reserved and correctly fenced out.
- [x] **Every AC mvp-critical.** No AC is a nice-to-have; the one optional item (thin "Your plan = Free" display) is explicitly conditional-and-skippable, not gold-plating.
- [x] **No dependency on unbuilt out-of-bundle task.** Serial B-0→B-1→B-2→B-3, all internal.
- [x] **Sizing legit.** ~2,000–2,800 LOC / 3 specs, borderline on the >2,500 floor. Floor waived per PRODUCT-PRINCIPLES rule 5 (mvp-thinner OK / zero valid split) — a feature with no valid split is exempt; no BOARD required. This matches the wave-50 precedent in product-decisions. Legit.
- [x] **design_gap_flag=false justified.** Backend-heavy (schema + service + gate); the only UI is an optional thin static "Your plan = Free" label reusing existing DS panel chrome (wave-72/73 read-panel precedent). No novel surface, no checkout/pricing UI (fenced). Correct.

### P-2 Spec — PASS (with one non-blocking B-0 note)
- [x] **ACs enumerated + independently verifiable.** Confirmed against the DB spec contract (source of truth, task 53d18d7f.description) — not just the pointer copy. Each of the 3 specs' ACs is binary.
- [x] **The CRITICAL "built but not wired" risk is defused — the verify-gate-reads AC is BINARY and BINDING.** The spec (2f61a317 AC-2) mandates: *a stubbed/injected RESTRICTIVE cap (maxServers=0) makes createServer BLOCK* AND *the free placeholder cap does NOT block* — and explicitly states *"a test that only checks 'free tier can still create a server' is INSUFFICIENT — the restrictive-cap-blocks assertion is mandatory (proves the check is not dead code)."* This is exactly the coverage-theater rejection the problem-framer binding refinement demanded, and it is embedded in the DB contract, not just the convenience copy. This is the single most important gate for this wave and it PASSES.
- [x] **Non-happy states specified:** default-free-when-absent (no row → 'free', not error); out-of-enum tier (validated at app boundary against TierSchema → safe-default-to-free, documented); no-regression for existing servers (free caps permissive); restrictive-cap-blocks (the enforcement edge). Empty/loading/error/offline: the substrate is backend-internal (no new user-facing async surface); the optional display is static text. States coverage adequate for the surface.
- [x] **Non-goals explicit.** FENCED list is airtight: NO Stripe SDK/keys/webhooks/checkout/customer-portal, NO price columns, NO real limits/quota columns, NO upgrade/downgrade UI, NO educator-admin feature build-out (flag only), M9 success-metric deferred. Verified against the spec: data ACs explicitly say "NO Stripe customer/subscription IDs, price columns, quota values."
- [x] **Fence airtight (independent check).** I confirmed the schema AC lists ONLY id/server_id/tier/created_at/updated_at — no Stripe/price/quota column leaks into the substrate. Placeholder caps are capability-shape only (storageMb/callCapacity/educatorAdminTools), no prices. No pricing/checkout leak found.
- [x] **Security-scope surface check.** This wave touches no auth/session/cookie/rate-limit surface; the createServer gate reuses the existing session-auth path unchanged (read-only, permissive under free). No new tightened-security-gate surface introduced. (Note: the *next* real-charging M9 slice WILL touch Stripe webhooks + payment → flags T-8/tightened gate then. Correctly deferred, noted for the next wave.)
- [x] **Full contract embedded in the primary task description** (fenced YAML head + prose), verified via psql — not only the pointer copy.

**Non-blocking B-0 precision note (carry to B, not a REWORK):** the spec/plan wording says `server_id text (FK servers.id)`, but `servers.id` is **uuid** in this codebase (confirmed against reports.ts, which FKs `target_server_id → servers.id` as uuid). The spec hedges correctly — *"match the servers FK convention"* — so the intent is unambiguous (match the actual uuid convention), but the literal "text" wording is imprecise. B-0 (postgres-pro) must FK `server_id` as **uuid** to match `servers.id`, not text. This is a builder-executable convention-match already covered by the spec's own hedge; it does not rise to a spec-vs-intent divergence that would block the gate. Flagged so the builder does not copy "text" literally.

### P-3 Plan — PASS
- [x] **Reuses locked architecture.** reports.ts schema idiom (verified real); new EntitlementsModule registered in AppModule; ServersModule→EntitlementsModule one-way/acyclic (EntitlementsModule imports only DB/shared, not Servers — no cycle); shared Zod contract via packages/shared ESM `.js` re-export idiom (matches existing shared package structure). Default-tier-when-absent chosen over backfill-a-row-per-server (cheaper, no data risk) — sound. No parallel/invented mechanism.
- [x] **No gold-plating / no scale infra the MVP doesn't need.** No Stripe, no Redis, no state machine, no multi-tenant, no billing engine. Placeholder caps = a single founder-tunable config map (not hardcoded, not a DB-driven rules engine) — the correct minimal restraint. `resolveForServer` is a plain resolver, not a policy framework. Migration `0029` is the correct next number (verified last is `0028`).
- [x] **Every AC → a file-level step with an AGENTS.md specialist.** B-0 schema+migration (postgres-pro) → B-1 shared contract (typescript-pro) → B-2 service+module+gate+verify-reads test (backend-developer) → B-3 optional display (react-specialist). Self-consistency sweep present; every P-2 AC maps to a step; the binding verify-reads test is carried explicitly to B-2 with B-6 verification.

### P-4 Gate (this stage) — PASS
- [x] Every upstream checkbox ticked from a concrete artifact (DB spec contract + codebase reads), not inferred.
- [x] No unresolved spec-vs-bet or load-bearing-claim drift. The one imprecision (server_id text vs uuid) is a builder-convention note covered by the spec's own hedge, not drift.
- [x] design_gap_flag=false handoff correct → B-block (not D-block).

---

## Anti-pattern sweep

- **Symptom framing** — clear (root cause: missing billing-agnostic seam; problem-framer PROCEED).
- **Orphan wave** — clear (M9 cited, sole in_progress, verified).
- **Decomposition bloat** — clear (mvp-thinner zero split; only optional item is skippable).
- **Happy-path-only spec** — clear (default-absent, out-of-enum, no-regress, restrictive-block all specified).
- **Vague ACs** — clear (verify-reads AC is binary + binding; the highest-risk AC of the wave is the tightest).
- **Spec-vs-bet drift** — clear (fence airtight; substrate matches the "pricing/credential-independent first slice" bet).
- **Architecture-blind plan** — clear (reports.ts idiom, acyclic module wiring, default-when-absent — all reuse).
- **Gold-plating at self-use-mvp** — clear (no Stripe/Redis/state-machine/billing; single placeholder-config; founder-reserved leak = none found).
- **Gate-by-vibe** — avoided (every box walked from an artifact/codebase check).

---

## Rationale (one paragraph)

Building the entitlements substrate now is the correct autonomous move: the slice is genuinely price- and credential-independent, has a REAL verified wiring target (createServer carries no per-owner cap today, confirmed at `servers.service.ts:71-96`), and defers every founder-reserved input (Stripe keys, prices, limits, M9 metric) to a non-blocking checkpoint that unblocks the next slice in parallel — so pausing for keys first would strand a zero-founder-input wave behind a decision it does not depend on. Framing is sound (three reviewers PROCEED/OK, reconciled), sizing is legit (floor waived per rule 5 with zero valid split), the fence is airtight (no Stripe/price/quota columns, no checkout, verified in the DB contract), the plan reuses locked architecture (reports.ts idiom, acyclic EntitlementsModule wiring, default-when-absent) with no gold-plating, and — most importantly — the "built but not wired" failure mode is defused by a BINARY, BINDING verify-gate-reads AC that mandates a stubbed restrictive cap BLOCK createServer and explicitly rejects the free-succeeds-only coverage-theater test. One non-blocking builder note (FK `server_id` as uuid to match `servers.id`, not the literal "text" wording) is carried to B-0, covered by the spec's own "match the convention" hedge and not a gate-blocking divergence.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1
  reviewers:
    problem-framer: PROCEED
    ceo-reviewer: PROCEED (HOLD-SCOPE)
    mvp-thinner: OK
  independent_verifications:
    - "M9 sole in_progress; wave.milestone_id=3e507bc0 — PASS"
    - "createServer has no per-owner cap today (servers.service.ts:71-96) — REAL wiring target, PASS"
    - "net-new: zero prior tier/entitlement/subscription billing code — PASS"
    - "verify-gate-reads AC is binary+binding (restrictive-cap-BLOCKS mandatory) in DB contract — PASS"
    - "fence airtight: no Stripe/price/quota columns, no checkout — PASS"
    - "migration 0029 correct-next (last committed 0028) — PASS"
  failed_checks: []
  non_blocking_carry:
    - "B-0: FK server_id as uuid to match servers.id (spec 'text' wording imprecise; covered by spec's match-the-convention hedge)"
    - "next real-charging M9 slice flags T-8 tightened security gate (Stripe webhooks + payment)"
  design_gap_flag: false
  rationale: >
    Substrate-first is the correct autonomous move (price/credential-independent, real verified
    wiring target, founder asks non-blocking). Framing sound, sizing legit (floor waived rule 5),
    fence airtight, plan reuses locked architecture with no gold-plating, and the built-but-not-wired
    risk is defused by a binary+binding verify-gate-reads AC. One non-blocking B-0 FK-type note carried.
  next_action: PROCEED_TO_B_BLOCK
```

---
# Wave 74 — P-4 Verdict (Phase 2 — karen + jenny + gemini merged)
**Phase:** 2 | **Attempt:** 1
## Verdict
APPROVED — exit P-block.
## Per-reviewer
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | **APPROVE** | 8/8 verified: reports.ts idiom; createServer real + UNCAPPED (servers.service.ts:71-121, unconditional insert = real gate target); **servers.id is UUID** (servers.ts:23) → B-0 FK must be uuid; shared ESM idiom; AppModule + ServersModule wiring points; migration 0029; specialists present; verify-gate-reads test implementable (inject stubbed EntitlementsService maxServers=0 → createServer throws). |
| jenny | **APPROVE** | No drift. Substrate matches M9 scope + the 2026-07-07 pivot decision; fence AIRTIGHT (no Stripe/price/quota/checkout/metric); tier enum placeholders sound; M10-done/M9-in_progress trace correct. |
| gemini | UNAVAILABLE (429) or see P-4-gemini-review.md | non-blocking (Action 3). |
## Merge: karen + jenny APPROVE + gemini UNAVAILABLE → gate PASSES. security_scope_flag=false this wave (no auth/payment surface — the NEXT real-charging M9 slice with Stripe → tightened T-8).
## BINDING carry-forward to B-block
1. **B-0 FK type (karen + head-product):** `servers.id` is UUID. The subscriptions `server_id` FK MUST be `uuid('server_id').references(() => servers.id)` — NOT the literal "text" in the spec AC. The spec's "match the servers FK convention" clause is operative; convention is uuid (per reports.ts target_server_id).
2. **B-2 verify-gate-reads (problem-framer BINDING):** the test MUST assert a stubbed RESTRICTIVE cap (maxServers=0) makes createServer THROW (a real exception), AND free default succeeds. Free-succeeds-only is coverage theater. B-6/V confirm the thrown-exception assertion + no regression for existing createServer callers.
3. **B-2 gate-subject (jenny):** pick ONE concrete cap dimension (e.g. servers-per-owner) + document tier-resolution at create-time so the test targets the real path.
4. **Fence:** NO Stripe/price/quota columns, NO checkout — surfaced founder-reserved asks stay in the checkpoint.
## Footer
- verdict_complete: true
- gate: PASSED
- next: B-0 (design_gap_flag=false → skip D)
