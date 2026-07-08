# P-0 MVP-Thinner — wave-79 (M13 leg-3, richer privacy/E2E posture)

**Agent:** mvp-thinner
**Milestone:** M13 — Institution partnerships & portable identity (`## Class = product-feature`)
**Wave:** M13 leg-3 — final autonomous leg (4-task bundle, ~3,200 LOC)
**Lens:** AC-level thinness — "of the ACs this wave proposes, which could split into siblings without breaking the milestone's mvp-critical claim?"

---

## VERDICT: **THIN** — split task 4 out; ship the E2E chain (tasks 1→2→3) as a focused unit.

One clean cut available. The wave bundles two independent concerns under one "privacy leg" banner: an **irreducible E2E-encryption chain** (tasks 1→2→3) and a **separable presence/read-receipt privacy-settings task** (task 4). The chain is mvp-critical and cannot be thinned internally. Task 4 is crypto-independent, standalone, and not load-bearing for the E2E claim — it should split to its own M13 sibling wave.

---

## The mvp-critical claim under test

M13 leg-3's stated job (product-decisions.md 2026-07-08): *"StudyHall stores DM content as plaintext today, so the server can read every direct message — this bundle gives users a real end-to-end-encryption path plus tighter presence controls."*

Two claims, conjoined by "plus":
1. **E2E claim** — users get a server-blind encrypted DM path (the differentiating posture vs Discord/Telegram; the thing StudyHall provably lacks today).
2. **Presence claim** — read-receipt + last-seen privacy toggles (a tightening of the already-shipped privacy-settings module).

The E2E claim is the wave's reason to exist. The presence claim is a **coherent-but-additive** enhancement to an already-shipped surface. They share a theme ("privacy") but no code, no schema, no dependency edge.

---

## AC-level re-classification

### Tasks 1→2→3 (the E2E chain) — **mvp-critical, IRREDUCIBLE. Keep bundled.**

| Task | Role | Thinnable? |
|---|---|---|
| **60bda5be** — public-key registry (table + PUT/GET + shared schema, ~600 LOC) | Enables the envelope | **No.** A registry with no envelope/client is dead code — no consumer reads the keys. Cannot ship alone. |
| **491cb85d** — server-blind encrypted DM envelope (ciphertext column + server-blind persist + plaintext back-compat, ~700 LOC) | Enables the client | **No.** An envelope with no client to write/read ciphertext is an unpopulated column — unreadable, unwriteable, unverifiable. Cannot ship alone. |
| **3fb88f44** — client-side DM encryption web (Web Crypto keygen, encrypt/decrypt in DM view, E2E indicator, ~1,200 LOC) | Delivers the user-visible E2E path | **No.** The client is the only place the mvp-critical claim ("users get a real E2E path") becomes true and observable. Without it the prior two tasks are backend plumbing that ships zero user value and cannot be verified at T-block/V-block. |

**Why irreducible:** this is a vertical slice where the mvp-critical claim is only satisfied at the top of the stack (the client), and the top depends transitively on both lower layers. Splitting any layer to a later wave produces either dead code (registry/envelope alone) or an unverifiable half-feature. The minimum shippable unit that makes "the server can no longer read a DM" *true and demonstrable* is exactly {1, 2, 3}. There is no thinner cut that preserves the claim. This is the textbook case where mvp-thinner does NOT force a split — thinning here would be OVER-CUT.

Internal AC-thinning within the chain (deferrable-but-not-split): key rotation, multi-device key sync, key-change re-verification UX, group-DM encryption, and message-history re-encryption are all legitimately out of scope for leg-3 and should already be fenced by P-2 as future ACs — flag to head-product to confirm they are NOT smuggled into the three specs. That is AC-scoping, not a task split.

### Task 4 (3038a4bc) — read-receipt + presence privacy toggles — **NOT mvp-critical to the E2E claim. SPLIT to sibling wave.**

| Property | Assessment |
|---|---|
| Depends on the crypto chain? | **No.** UpdatePrivacySchema + 2 columns + emit-path honoring + 2 settings toggles. Extends the *shipped* privacy-settings module (packages/shared/src/privacy.ts, AppendPrivacyEventService, SettingsPrivacyPage). Zero shared code with tasks 1–3. |
| Load-bearing for the E2E claim? | **No.** The E2E claim ("server can no longer read DMs") is fully satisfied by 1→2→3. Presence toggles neither enable nor strengthen encryption. |
| Standalone-shippable? | **Yes.** ~700 LOC, self-contained vertical slice (schema + columns + emit + UI), independently verifiable, delivers its own user value on day one. |
| Bundling value ("one coherent privacy leg")? | **Weak.** The coherence is thematic (both say "privacy"), not architectural. The two do not review, test, or verify together — the T-8 security-scope gate the chain triggers (auth/crypto/message-content) does NOT cover presence toggles; they are separate security surfaces with separate test matrices. |

---

## Split proposal

**Defer task 4 (3038a4bc) to its own M13 sibling wave.** Concretely:

- **This wave (leg-3a):** seed 60bda5be + siblings 491cb85d + 3fb88f44 — the E2E encryption chain, ~2,500 LOC, `<40` files. Ships as a focused, single-concern unit: "DMs are now end-to-end encrypted." One coherent T-8 security-scope gate over one surface (crypto/key-management/message-content). One coherent V-block acceptance ("prove the server stores only ciphertext; prove the client round-trips plaintext").
- **Next wave (leg-3b):** 3038a4bc becomes a **new sibling seed under M13**, `wave_id = NULL`, `status = todo`, `parent_task_id = NULL` (seed of its own bundle). N-1 picks it up as the next M13 bundle after 3a ships. Per MEMORY note, a re-parented/deferred follow-up under an in_progress milestone must carry `wave_id = NULL` or it strands and is never seedable — this seed is fresh so it is NULL by construction; confirm at re-author.

### Why split (concrete gains)

1. **Focus + verifiability.** The E2E chain is the highest-risk, highest-value work in leg-3 (crypto correctness, key management, server-blind persistence, back-compat). It deserves a wave where the T-8 gate, V-block acceptance, and reviewer attention are undivided. Bundling a crypto-independent 700-LOC settings feature dilutes the security review's focus and inflates the wave's diff (~3,200 → ~2,500 LOC) and its blast radius.
2. **Independent failure domains.** If presence-toggle work hits a snag (emit-path honoring across the Socket.IO fan-out is a known StudyHall risk surface), it should not hold the E2E ship. Conversely, if the crypto chain needs a V-3 fast-fix loop, task 4 shouldn't be sitting half-built in the same wave.
3. **No coherence lost.** "One privacy leg" is a documentation framing, not a build constraint. Shipping 3a then 3b back-to-back tells the exact same milestone story — M13's ## Approach is explicitly multi-leg and tolerates sub-legs. The founder-facing narrative ("we shipped encrypted DMs, then tightened presence controls") is arguably *clearer* as two ships than one.
4. **No dead code / no orphan.** Unlike the chain, task 4 ships complete value on its own. Deferring it strands nothing and blocks nothing — the definition of a clean cut.

---

## Metric-absence honesty

M13's `## Success metric` is founder-reserved *TBD*, so mvp-criticality cannot be **measured** against a target metric. I therefore did NOT force thinness on the basis of a metric. The THIN verdict rests entirely on the milestone's own *stated job prose* (the "plus" that conjoins two structurally-independent concerns) and on hard dependency-graph facts (the chain is transitively coupled; task 4 shares no edge). Where the metric is silent, I abstain from metric-based cuts — but a dependency-graph cut needs no metric to justify it. This is a structural split, not a value-judgment split, so the metric absence does not push this to OK.

Had task 4 been *entangled* with the chain (shared schema, shared emit path, shared review surface), I would have abstained to OK on metric-absence grounds. It is not entangled, so the cut stands.

---

## Handoff to head-product (P-4 gate)

- **Adopt the split:** author 3a as the wave bundle (60bda5be + 491cb85d + 3fb88f44); re-seed 3038a4bc as a standalone M13 sibling seed (`wave_id=NULL`, `parent_task_id=NULL`, `status=todo`) for N-1 to pick up next.
- **Do NOT thin the chain further** — {1,2,3} is the minimum unit satisfying the mvp-critical E2E claim; any internal task split is OVER-CUT.
- **Confirm P-2 fences** the deferrable in-chain ACs (key rotation, multi-device sync, group-DM crypto, history re-encryption) OUT of the three specs — these are future ACs, not this wave's.
- **Expect the T-8 security-scope tightened gate** on 3a (crypto/key-management/message-content surface) — now cleaner because presence toggles no longer share the wave.
