# Wave-79 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read:
- process/waves/wave-79/stages/ full artifact set (P-0-frame, P-0-ceo-reviewer, P-0-mvp-thinner,
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0..B-6,
  B-6-review, B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify, T-1..T-9, V-1-karen,
  V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
- Gate verdicts: process/waves/wave-79/blocks/P/gate-verdict.md (APPROVED first-attempt, Phase-1
  head-product + Phase-2 karen APPROVE + jenny APPROVE; Gemini UNAVAILABLE degraded non-blocking).
  B-6 /review (crypto adversarial) found 3 High (F2 sender-auth gap, F4 side-effecting keygen,
  F7 indicator-honesty race) — all FIXED via B-3 re-entry dc7132e, re-review CLOSED, MERGE-READY.
  V-block 0 blocking; karen + jenny both APPROVE at V-1; head-verifier APPROVED.
Prior archives consulted (most recent, up to 5):
- wave-78/blocks/L/observations.md — obs-1 (BUILD-17 fail-closed hidden-vs-error) promoted as STRONG
  1st instance; obs-2 (VERIFY content-in-tree-not-hash-ancestry) HOLD 1st instance.
- wave-77/blocks/L/observations.md — obs-1 (BUILD-16 delegate-to-seam) + obs-2 (T-8 rule-4 assert-body)
  BOTH promoted (2nd instance).
- wave-76, wave-75, wave-9 observations (pre-promotion HOLD history).
Principles files read:
- BUILD-PRINCIPLES.md (17 rules), PRODUCT-PRINCIPLES.md, VERIFY-PRINCIPLES.md, T-8.md (4 rules).

**Critical de-dup up front (already-shipped rules — do NOT re-propose):**
- **BUILD rule 16 (delegate authz/visibility to the shared tested seam)** — shipped wave-77.
- **BUILD rule 17 (default a hidden-vs-error branch to hidden, error-allowlist, never `!== status`)** —
  shipped wave-78. The wave-79 honest E2E indicator (fail-closed: plaintext-fallback shows NO lock;
  absent proof → not-encrypted; proof-based per-message labeling from actual send outcome, B-6 F7 fix)
  is a THIRD fail-closed instance of this class. **Recorded as confirming-in-practice only — NO
  re-promotion** (see obs-4).
- **T-8 rule 4 (assert the body, not the status alone)** — shipped wave-77. Wave-79's byte-identical
  uniform-404 matrix is a confirming instance; NO re-promotion.

---

## obs-1 — STRONG (1st INSTANCE): when reusing a shared authz/visibility seam for a new surface, verify the seam enforces the SPECIFIC setting that surface needs, not a sibling setting

**Source artifacts:**
- process/waves/wave-79/blocks/P/gate-verdict.md Phase-1 rationale point (3): head-product APPROVED the
  peer-key-fetch delegating to `ProfileVisibilityService.resolve()` (the profile_visibility seam) —
  i.e. the Phase-1 gate itself did NOT catch the wrong-seam reuse.
- process/waves/wave-79/blocks/P/gate-verdict.md Phase-2 Karen correction 1 (load-bearing): "peer-key
  GET must gate on **who_can_dm** (dm.service.enforceWhoCanDm), NOT ProfileVisibilityService
  (profile_visibility only) — reusing the wrong service under-gates DM-ability." Folded as binding
  correction; carried to B and T-8.
- process/waves/wave-79/stages/T-8-security.md §2: proven LIVE — "Gate is `who_can_dm`
  (DmService.canDm / enforceWhoCanDm seam), NOT profile_visibility (P-4 karen correction 1)." Live gate
  flip verified (nobody→404, everyone→200).
- process/waves/wave-79/stages/T-4-integration.md §5: CI matrix binds the 404/200 rows to
  `DmService.canDm` (who_can_dm), not the profile_visibility resolver.

**Assessment:** The two settings — `profile_visibility` (can you SEE the profile) and `who_can_dm`
(can you MESSAGE the user) — are independently configurable. A user may be profile-visible to everyone
yet accept DMs from nobody. The peer-encryption-key fetch is a DM-capability surface; gating it on
profile_visibility would have let a stranger fetch the encryption key (and confirm key-existence /
DM-reachability) of a user who has closed DMs — an under-gate and a soft DM-reachability oracle.

This is a DISTINCT axis from BUILD rule 16. Rule 16 says "delegate to the shared tested seam rather
than re-querying inline" — it is satisfied here (the code DID delegate to a shared seam, not hand-roll).
The defect is orthogonal: the delegation went to the WRONG seam — a sibling setting's seam. Rule 16
prevents re-derivation drift; it says nothing about whether the chosen seam enforces the correct
predicate for the new surface. A reviewer applying only rule 16 would sign off (the Phase-1 gate did
exactly that). The generalizable obligation: when a new surface reuses a shared authz/visibility seam,
verify the seam enforces the SPECIFIC setting the surface semantically requires, not a sibling
setting that happens to be adjacent and reusable.

**Near-dup check:**
- vs BUILD rules 1-17: rule 16 (delegate to shared seam) is the closest neighbor but governs
  re-query-vs-delegate, not seam-correctness. Rule 4 (reproduce a negative authz path at B-6) is a
  test-obligation. No BUILD rule says "verify the reused seam enforces the right setting." PASS —
  incremental, not a near-dup. Karen should note the adjacency to rule 16 at promotion (this is the
  natural rule 18, the complement: rule 16 = delegate to a seam; rule 18 = to the RIGHT seam).
- vs PRODUCT-PRINCIPLES: this is a build/gate-verification obligation, not a product-scope lesson.
  A P-4-verification framing is defensible but the root cause is an implementation seam-selection
  error caught by the gate, so BUILD is the better target.

**Pre-shaped candidate (BUILD-PRINCIPLES.md rule 18 — root-cause form):**
```
18. Reusing a shared authz or visibility seam, verify it enforces the setting the new surface needs, not a sibling setting.
    Why: Two independently-configurable settings conflated let the wrong gate under-guard the new surface.
```
Rule line = 120 chars. PASS (=120). Why line = 92 chars. PASS (<=100). No forbidden tokens (no em-dash,
no `we`/`our`, no wave ref). Karen MUST re-verify the final char count (rule line is exactly at the
limit).

**Severity:** strong — a real under-gate on the wave's crown-jewel privacy/crypto surface, caught by
the P-4 Phase-2 gate (Karen), NOT by the Phase-1 head-product gate which had explicitly blessed the
wrong seam. The failure mode is silent (both seams return a `{visible:false}`/404-collapsing result, so
a code-read looks correct) and security-relevant (DM-reachability oracle + key-existence leak).
**Candidate principles file:** BUILD-PRINCIPLES.md rule 18 (or a PRODUCT/P-4-verification form; not both).
**Cross-wave recurrence:** FIRST INSTANCE.
**Promotion flag:** STRONG 1st INSTANCE — meets generalizable + falsifiable (grep: does a reused-seam
gate enforce the setting matching the surface's semantic?) + cited (P-4 gate Phase-2, T-8 §2, T-4 §5).
Below the routine 2-wave bar. Recommend head-learn CONSIDER via the strong-1st discretion (same
profile as wave-78 BUILD-17 — security-critical, silent-by-code-read, gate-caught); if declined, HOLD
for a clean 2nd instance (any future wave where a surface reuses a shared authz seam that enforces a
sibling setting). Note the max-1-rule/file/wave cap: obs-2 and obs-3 below also target BUILD — only ONE
BUILD rule may promote this wave; obs-1 is the strongest BUILD candidate.

---

## obs-2 — STRONG (1st INSTANCE): authenticate a message's sender by binding decryption to the sender's server-registered key, never a key asserted inside the message envelope

**Source artifacts:**
- process/waves/wave-79/stages/B-6-review-output.md F2 (High): "Recipient derived shared secret from
  envelope-embedded senderKeyRef, not the author's server-registered key → spoofed key decrypts +
  shows lock (sender-auth gap)." → FIXED B-3 re-entry dc7132e: "decrypt binds to author's server key
  (`resolvePeerKey(authorId)`); mismatched senderKeyRef → cannot-decrypt (dm-crypto.ts:189)."
- process/waves/wave-79/stages/B-6-review.md: F2 among the 3 High findings the Phase-1 head-builder
  APPROVE MISSED; caught only by the Phase-2 adversarial crypto /review; re-review CLOSED.
- process/waves/wave-79/stages/V-2-triage.md finding 2: the server-side complement (server does not
  validate senderKeyRef == author's registered key) carried as non-blocking hardening (task 1f48f4db).
- process/waves/wave-79/stages/T-8-security.md F-T8-2 (low): server passes senderKeyRef through
  (server-blind); client-side author-key binding is the load-bearing defense.

**Assessment:** The envelope carries a `senderKeyRef` the sender ASSERTS. Deriving the ECDH shared
secret from that asserted ref (rather than from the author's server-registered public key, looked up by
authorId) means an attacker who can influence the envelope can supply their own key and have the
recipient decrypt + display the "End-to-end encrypted" lock on a spoofed message — a sender-authenticity
break. The fix binds decryption to `resolvePeerKey(authorId)` (the server-registered key for the
message's author), so a mismatched envelope ref fails closed to cannot-decrypt.

The generalizable crypto rule: authenticate WHO sent a message by binding the decryption key to the
sender's independently-registered identity key (server-side registry, looked up by the authenticated
author id), never to a key the message itself asserts. A message cannot vouch for its own sender.

**Near-dup check:**
- vs BUILD rules 1-17: none govern crypto sender-authentication or trust-the-registry-not-the-envelope.
  Rule 16 (delegate to shared seam) is authz, not crypto key-binding. PASS — genuinely new.
- vs T-8.md rules 1-4: these are test-obligations (live-probe, malformed-id, WS-envelope, assert-body).
  A T-8 form would be "probe a spoofed-senderKeyRef envelope and assert cannot-decrypt / no lock." The
  root cause is an implementation rule (bind to the registered key); BUILD is the better target, with a
  possible T-8 test-obligation sibling. Not both.

**Severity:** strong — a real sender-authenticity break on the crypto crown jewel, missed by Phase-1
head-builder + unit tests (26/26 green pre-fix), caught only by the adversarial Phase-2 /review, fixed
pre-merge with a cited fail-closed line. Security-critical, silent-by-code-read.
**Candidate principles file:** BUILD-PRINCIPLES.md (crypto) — OR a T-8 test-obligation form. Not both.
**Cross-wave recurrence:** FIRST INSTANCE (this is the project's first E2E-crypto wave; no prior
sender-authentication surface exists).
**Promotion flag:** STRONG 1st INSTANCE on merit, BUT constrained by the max-1-BUILD-rule/wave cap —
obs-1 is the stronger + more recurring-shaped BUILD candidate (an authz-seam class that has a clear
recurrence path), whereas this is a crypto-specific class unlikely to recur until another E2E-crypto
wave. Recommend HOLD for a 2nd instance UNLESS head-learn judges the security-criticality alone clears
the strong-1st bar AND prefers it over obs-1 for the single BUILD slot. If head-learn wants both
recorded as rules, the T-8 test-obligation form (a different file) sidesteps the per-file cap.

---

## obs-3 — WARNING (1st INSTANCE): never trigger a destructive or irreversible state change as a side effect of a read or decrypt path

**Source artifacts:**
- process/waves/wave-79/stages/B-6-review-output.md F4 (High): "Key regeneration as a decrypt
  side-effect → transient key-unavailability silently rotates+re-registers → permanent history loss +
  downgrade." → FIXED dc7132e: "removed side-effecting regen; missing key → cannot-decrypt, no rotation
  (useDmEncryption.ts:237); keypairRef race resolved (single keypairPromiseRef)."
- process/waves/wave-79/stages/B-6-review.md: F4 among the 3 High the Phase-1 APPROVE missed; Phase-2
  adversarial /review caught; re-review CLOSED.

**Assessment:** Decrypt is a READ. It was wired so that a transient key-unavailability during decrypt
triggered a key REGENERATION + re-registration — a destructive, irreversible side effect: rotating the
keypair orphans every previously-encrypted message (permanent history loss) and silently downgrades the
user's crypto state. A read path (or any path a user reasonably expects to be non-mutating) must never
carry an irreversible mutation as a side effect, especially one gated on a transient/error condition
where it fires exactly when the system is least stable.

The generalizable rule: a read/decrypt/fetch path must not trigger a destructive or irreversible state
change (key rotation, deletion, re-provisioning) as a side effect — least of all one triggered by a
transient failure inside that path. Fail closed (cannot-decrypt / retry) instead of mutating.

**Near-dup check:**
- vs BUILD rules 1-17: rule 15 (wrap all-or-nothing mutation in a transaction) is about atomicity of a
  deliberate mutation, not about a mutation hiding inside a read. Rule 5 (guard reconnect-triggered
  async loops with a coalescing flag) is the closest — F4's fix also resolved a keypairRef race with a
  single promise-mutex, which IS a rule-5 instance — but rule 5 governs double-firing of a loop, not
  "a destructive op should not be a read side effect at all." The destructive-side-effect-of-read class
  is distinct. PASS — the race sub-fix confirms rule 5 in practice; the primary class is new.
- The race-coalescing half of the F4 fix (single keypairPromiseRef) is a clean confirming-in-practice
  instance of BUILD rule 5 — recorded, no re-promotion.

**Severity:** warning-to-strong — a real data-loss + crypto-downgrade vector, caught by the adversarial
Phase-2 /review (Phase-1 + units missed it), fixed pre-merge. Distinct and generalizable, but the
"destructive op as a read side effect" antipattern is broad and has only one instance here.
**Candidate principles file:** BUILD-PRINCIPLES.md.
**Cross-wave recurrence:** FIRST INSTANCE.
**Promotion flag:** HOLD — 1st instance. Real and generalizable, but (a) the max-1-BUILD-rule/wave cap
means obs-1 takes the BUILD slot, and (b) unlike obs-1/obs-2 this did not surface a silent-until-future
oracle — the fix path (fail-closed cannot-decrypt) is the same fail-closed discipline BUILD-17 already
embodies at a different layer. Watch for a 2nd instance (any future wave where a read/fetch/decrypt path
carries an irreversible mutation) to promote.

---

## obs-4 — INFORMATIONAL: the honest E2E indicator is a 3rd confirming instance of BUILD-17 (fail-closed); the adversarial /review again caught what Phase-1 + units missed (confirms BUILD rule 4)

**Source artifacts:**
- process/waves/wave-79/stages/B-6-review-output.md F7 (High): "Delivered-row indicator state from live
  capability, not actual send outcome → plaintext row could show lock in a race." → FIXED dc7132e:
  "proof-based labeling via `sentModeRef` (actual OutgoingCrypto.mode) (useDm.ts:250-255)."
- process/waves/wave-79/stages/T-8-security.md §3: honest indicator PROVEN LIVE fail-closed — emerald
  lock count=1 on encrypted DM, 0 on 29 plaintext history rows, 0 on a server-channel negative control.
- process/waves/wave-79/stages/B-6-review.md: F2/F4/F7 all missed by Phase-1 head-builder APPROVE, all
  caught by the Phase-2 adversarial crypto /review.

**Assessment (two confirming-in-practice signals, NO new rule):**
1. **BUILD rule 17 (fail-closed hidden-vs-error branch), 3rd instance.** The E2E lock is a fail-closed
   indicator: it shows ONLY on proof of actual encrypted send (per-message `OutgoingCrypto.mode`), and
   defaults to not-encrypted for plaintext-fallback / absent-proof / race. This is the same
   default-to-the-safe-state discipline BUILD-17 encodes (wave-77 conflation ancestor → wave-78
   privacy-hidden-vs-error → wave-79 encrypted-vs-not). The rule is shipped and confirmed; no
   re-promotion.
2. **BUILD rule 4 (reproduce a negative path at B-6 Phase-2; a Phase-1 code-read APPROVE is not
   sufficient).** All 3 High crypto findings (F2/F4/F7) passed the Phase-1 head-builder code-read APPROVE
   AND the green unit suite (26/26), and were caught ONLY by the Phase-2 adversarial /review. This is a
   clean, high-value confirming instance of rule 4 on a crypto crown jewel — a future temptation to skip
   Phase-2 on a "primitives look sound" wave would have shipped a sender-auth break, a data-loss keygen,
   and a dishonest lock. No new rule; recorded so the value of the mandatory Phase-2 pass stays visible.

**Severity:** informational — confirms shipped BUILD rules 17 and 4; no new rule.
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## obs-5 — INFORMATIONAL (1st INSTANCE): prove a server-blind / no-plaintext invariant by a separate-connection real-DB read-back asserting the sensitive column IS NULL and the ciphertext IS NOT NULL, plus a full-table count of leaked plaintext = 0

**Source artifacts:**
- process/waves/wave-79/stages/T-4-integration.md §1: `dm-encryption.integration.spec.ts` on real
  postgres:16 — after `sendMessage(...envelope)`, a **separate-connection** SELECT shows
  `content IS NULL`, `ciphertext = 'BASE64_AES_GCM_ENVELOPE…'`; a full-table scan
  `WHERE content IS NOT NULL` → count 0; `listMessages` returns content NULL for the encrypted row.
- process/waves/wave-79/stages/T-8-security.md §1: server-blind PROVEN via two lines — LIVE
  (`GET /dm .../messages` returns `content:""` + `hasCipher:true`; plaintext never on the wire) AND the
  CI separate-connection read-back. Honest limitation recorded: `$CLAUDOMAT_DB_URL` is the BRAIN db not
  the app db, so a direct prod app-DB SELECT was not reachable — evidenced instead by the live server
  round-trip + the CI real-Postgres read-back. No fabricated app-DB PASS.

**Assessment:** The pattern is the honest way to prove a persistence-blindness invariant (server stores
no plaintext): do NOT trust the DTO or the write-path return value; open a SEPARATE DB connection, read
the row back, assert the sensitive column is NULL and the ciphertext column is populated, AND run a
full-table `WHERE <sensitive> IS NOT NULL → count 0` to catch any leak on any code path. This mirrors
BUILD rule 4's "never mock the SUT" and the project's existing separate-connection integration harness
discipline (pg-harness) — but adds the specific NULL-column + count-0 assertion shape for a
blindness/redaction invariant.

Is a rule warranted? This is the 1st formally-named instance of the "prove-blindness-by-read-back"
shape. It is a strong technique but narrow (fires only on a wave that ships a persistence-blindness /
redaction / at-rest-encryption invariant), and it is adjacent to already-shipped disciplines (BUILD
rule 9 integration-spec-per-boundary; the separate-connection harness is existing practice, not new
this wave). A 2nd instance (any future wave asserting a column-blindness / redaction invariant via
real-DB read-back) would elevate it to a T-8 or T-4-layer rule. No target-file gap (T-8.md exists), but
one data point.

**Severity:** informational — a strong honest-proof technique on the crown-jewel invariant; the
app-DB-vs-brain-DB limitation was disclosed rather than papered over (good T-8 hygiene).
**Candidate principles file:** none this wave (potential future T-8.md rule — prove a blindness/redaction
invariant via separate-connection read-back asserting NULL + count-0, not the DTO).
**Cross-wave recurrence:** FIRST INSTANCE. HOLD pending a 2nd blindness/redaction-invariant wave.
**Promotion flag:** HOLD — 1st instance.

---

## obs-6 — INFORMATIONAL: status check on remaining standing held candidates

| origin | class | wave-79 status |
|--------|-------|----------------|
| wave-78 obs-2 (HOLD — 1st instance) | VERIFY: verify a claimed fix by its content in the merge tree, not commit-hash ancestry under squash-merge | NOT CONFIRMED as an independent 2nd instance. V-1-karen this wave verified the F2/F4/F7 fixes are present in the merge tree by content (per V-2-triage "B-6 crypto fixes present in merge tree"), which is correct technique, but no hash-ancestry false-negative arose to re-exercise the class. HOLD maintained. |
| wave-77 obs-3 (HOLD — 1st instance) | T-8 rule-2 carve-out: uniform-404 on malformed :id stronger than the 400 rule prescribes | 3rd SIGHTING of the exception: T-8-security.md §2 case C2 shows malformed non-uuid → byte-identical uniform 404 (NOT 500, NOT 400) on the anti-oracle key-fetch endpoint. Still an exception, not a promotable obligation; a future T-8 rule-2 carve-out. HOLD maintained (sightings accumulate but each is on an anti-oracle endpoint of the same class, not an independent obligation). |
| wave-75 obs-2 (HOLD — 1st instance) | PRODUCT: shape a fenced seam by its async contract, not mock convenience | NOT CONFIRMED. No new fenced DI seam this wave (crypto is native Web Crypto + IndexedDB, no mock seam). HOLD maintained. |
| wave-73 obs-1 (HOLD — 1st instance) | T-4: prove a side-effect hook fires by the persisted row, not the call site | ADJACENT confirming technique but NOT the hook class: T-4 proves server-blind writes via separate-connection read-back (obs-5), which is read-back-not-call-site discipline, but the writes are direct persistence, not audit/notification/webhook HOOKS. HOLD maintained. |
| wave-76 obs-3 (HOLD — 1st instance) | DESIGN genre-fence per-line audit | NOT CONFIRMED as the genre-fence class. A D-block ran (E2E status indicator) but no genre-fence-drift recurred. HOLD maintained. |

**Severity:** informational (status check only).
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Reusing a shared authz/visibility seam, verify it enforces the RIGHT setting, not a sibling | strong | 1st INSTANCE | BUILD-PRINCIPLES.md rule 18 | STRONG 1st — head-learn CONSIDER (takes the single BUILD slot); else HOLD |
| obs-2 | Bind decryption to the sender's server-registered key, never an envelope-asserted key | strong | 1st INSTANCE | BUILD-PRINCIPLES.md (crypto) or T-8 test form | STRONG 1st on merit; HOLD unless head-learn prefers it / uses the T-8-form to dodge the BUILD cap |
| obs-3 | No destructive/irreversible state change as a side effect of a read or decrypt path | warning | 1st INSTANCE | BUILD-PRINCIPLES.md | HOLD — 1st instance (BUILD slot taken by obs-1) |
| obs-4 | Honest E2E indicator = 3rd BUILD-17 instance; adversarial /review confirms BUILD rule 4 | informational | confirms BUILD 17 + BUILD 4 | none | NO (already covered) |
| obs-5 | Prove server-blind invariant via separate-connection read-back (NULL col + count-0) | informational | 1st INSTANCE | none (future T-8.md) | HOLD — 1st instance |
| obs-6 | Status check: standing HOLDs; wave-77 obs-3 got a 3rd (same-class) sighting | informational | -- | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 6 (obs-1..obs-6).**
**Severities: 2 strong (obs-1, obs-2), 1 warning (obs-3), 3 informational (obs-4, obs-5, obs-6).**

---

## Promotion-candidate assessment

**Genuine promotion candidates this wave: up to 1 conditional (obs-1, as a strong 1st instance at
head-learn discretion). 0 that clear the routine 2-wave bar.**

- **obs-1** (BUILD rule 18 — reuse the RIGHT authz/visibility seam, not a sibling setting): STRONG 1st
  INSTANCE. Generalizable, falsifiable (grep: does the reused seam enforce the setting matching the
  surface?), cited (P-4 gate Phase-2 Karen correction 1, T-8 §2 live, T-4 §5 CI). It is the natural
  complement to shipped BUILD rule 16 (rule 16 = delegate to a seam; rule 18 = to the RIGHT one), and
  the defect was gate-caught (Phase-2), silent-by-code-read, on the crown-jewel surface — the same
  profile that justified the wave-78 BUILD-17 strong-1st promotion. Recommend head-learn CONSIDER; if
  declined, HOLD for a 2nd instance. Pre-shaped rule line is exactly 120 chars — karen MUST re-verify.

- **obs-2** (bind decrypt to server-registered sender key): STRONG on merit but crypto-specific
  (recurrence unlikely before another E2E-crypto wave) and blocked by the max-1-BUILD-rule/wave cap
  behind obs-1. Promotable only if head-learn prefers it for the single BUILD slot OR takes the T-8
  test-obligation form (different file, dodges the cap). Otherwise HOLD.

- **obs-3** (no destructive side effect on a read/decrypt path): HOLD — 1st instance, BUILD slot taken.

- **obs-4, obs-6:** no promotion (obs-4 confirms shipped BUILD 17 + BUILD 4; obs-6 status check).

- **obs-5** (prove-blindness-by-read-back): HOLD — 1st instance; potential future T-8.md rule.

**Per-file cap note:** obs-1 / obs-2 / obs-3 all target BUILD-PRINCIPLES.md — the max-1-rule/file/wave
cap permits AT MOST ONE BUILD promotion this wave. obs-1 is the recommended pick. obs-2 could instead
land in T-8.md (a different file) if head-tester + head-learn want a second rule this wave without
breaching the per-file cap.

**Standing HOLD that got a 2nd data point this wave:** none that qualifies as an independent 2nd
instance. wave-77 obs-3 (uniform-404-on-malformed-:id exception) got a 3rd SIGHTING (T-8 §2 case C2),
but again on an anti-oracle endpoint of the same class — not an independent obligation, so it remains a
documented T-8 rule-2 exception awaiting a future carve-out, not a promotion. wave-78 obs-2 (merge-tree
content vs hash-ancestry) was NOT re-exercised (fixes verified by content, but no hash-ancestry
false-negative arose). No prior HOLD reached a promotable 2nd instance.
```