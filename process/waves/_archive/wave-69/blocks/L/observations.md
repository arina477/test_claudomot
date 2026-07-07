# Wave-69 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-69/stages/ full artifact set (B-0-branch-and-schema,
B-2-backend, B-6-review, C-1-pr-ci-merge, C-2-deploy-and-verify, T-5-e2e, T-6-layout,
T-8-security, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-69/blocks/{B,T,V}/gate-verdict.md
(B-6: APPROVED after Phase-2 /review P1 catch + fix; T and V gates APPROVED).
Prior archives consulted: process/waves/_archive/wave-{64,65,66,67,68}/blocks/L/observations.md
(5-wave window; recurrence checks for wave-47 obs-C id-space class, wave-65 obs-3
async/temporal concurrency class, and all standing HOLDs).
Principles files read: BUILD-PRINCIPLES.md (12 rules), DESIGN-PRINCIPLES.md (1 rule),
VERIFY-PRINCIPLES.md (4 rules), CI-PRINCIPLES.md (10 rules), PRODUCT-PRINCIPLES.md (5 rules),
T-5.md (3 rules), T-6.md (0 rules), T-8.md (3 rules), test-writing-principles.md (rules 1-29).

---

## obs-1 — SECOND INSTANCE (warning): display-identifier passed where opaque DB id is required; isOwn/self gate always false; sentinel fallback masks the mismatch

**Source artifacts:**
- process/waves/wave-69/stages/T-5-e2e.md (F1: "currentUserId={profile?.username ?? null}
  passed to MessageList which computes isOwn by comparing against msg.authorId (a UUID) →
  isOwn ALWAYS false; fix: profile?.userId"; own-message Edit missing, own-message Delete
  shows moderator-variant label, own content becomes reportable)
- process/waves/wave-69/stages/V-3-fast-fix.md (F1 1-LOC fix: MainColumn.tsx:343
  currentUserId=profile?.username → profile?.userId; isOwn confirmed UUID-vs-UUID
  at MessageList.tsx:1060)
- process/waves/_archive/wave-47/blocks/L/observations.md (obs-C FIRST INSTANCE:
  "DmConversationList rendered 'Unknown user' for sent messages because authorId was
  matched against profile.username (a display string) instead of profile.userId
  (the stable DB opaque uuid)"; BUILD-PRINCIPLES rule 10 candidate; HOLD)

**Recurrence assessment:** wave-47 obs-C recorded the FIRST INSTANCE of this class — a
component receives an identity comparison target (authorId, a UUID) but is passed a
display-identifier (username string) from the parent, causing the equality check to silently
never match. The wave-47 fix was DmHome.tsx:30 currentUserId = profile?.userId; this wave's
fix is MainColumn.tsx:343 currentUserId = profile?.userId. Structurally identical: same
profile shape, same field-name confusion (username vs userId), same silenced authorId
comparison. Two instances confirmed across distinct components and waves.

The class is falsifiable ("pass the identity the comparison expects; a component comparing
against a UUID must receive a UUID, not a display string") and generalizable to any
isOwn/isSelf/isAuthor gate that receives a profile prop without an explicit contract on
which field carries the opaque id.

Near-dup check vs BUILD-PRINCIPLES rules 1-12: none prescribe the id-field contract for
identity-comparison props. Rule 12 (test through real parent caller) is a different class
(wiring, not id-space). Not a near-dup.

Pre-shaped candidate rule (for karen reference — this is a nomination; 2nd instance, recurrence
bar cleared):
  "13. Pass the opaque user id, not the display username, to any prop used in an identity
       comparison such as isOwn or isSelf."
  Rule line = 88 chars. PASS (<=120).
  "    Why: A component comparing authorId (UUID) against a username string always returns
       false, silently hiding the owned-content branch."
  Why line with 4-space indent = 99 chars. PASS (<=100).
  No forbidden tokens (no `we`, `our`, `the team`, wave refs, em-dash). PASS.
  Near-dup check vs BUILD rules 1-12: PASS. Not a near-dup.

**Severity:** warning (MAJOR finding; the own-content report affordance leaked; own-message
  Edit was missing; moderator-variant Delete label appeared on own messages; all in production).
**Candidate principles file:** command-center/principles/BUILD-PRINCIPLES.md (rule 13 candidate).
**Cross-wave recurrence:** SECOND INSTANCE. Wave-47 obs-C = 1st. Wave-69 F1 = 2nd.
**Promotion flag:** HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-builder.

---

## obs-2 — SECOND INSTANCE (warning): Phase-1 code-read APPROVED; Phase-2 /review caught a P1 temporal concurrency defect invisible to static inspection

**Source artifacts:**
- process/waves/wave-69/stages/B-6-review.md (Phase-1 head-builder Attempt 1: "APPROVED — 5
  security invariants code-verified"; Phase-2 /review Run 1: "[P1] TOCTOU double-resolve race
  (resolve 409 not atomic) → FIXED (db.transaction + SELECT FOR UPDATE + conditional flip
  WHERE status='open' RETURNING → 409)"; Attempt-2 APPROVED after fix)
- process/waves/wave-69/blocks/B/gate-verdict.md (TOCTOU analysis: "The row lock is acquired
  at load via .for('update') on the SELECT; a second concurrent resolve blocks at the SELECT
  until the first commits, then re-reads status != 'open' and throws 409")
- process/waves/_archive/wave-65/blocks/L/observations.md (obs-3 FIRST INSTANCE:
  "Phase-1 head-builder code-read returned APPROVED and noted the appendServer write-through
  as accepted-debt, but did not surface two correctness defects that /review subsequently
  identified: (a) stale-response race; (b) non-atomic put+prune")

**Recurrence assessment:** wave-65 obs-3 was the FIRST INSTANCE of the pattern "Phase-1
code-read APPROVE misses a temporal/concurrency defect that adversarial /review catches."
That instance was client-side (React async-effect cancellation + Dexie non-atomic put+prune).
The wave-69 instance is server-side (two concurrent HTTP requests reaching resolveReport
with no SELECT FOR UPDATE — a second resolve could read status='open', pass the in-app
open-check, and commit a second resolution before the first commits). Different domain, same
structural class: a read-modify-write sequence is safe if no concurrent caller can interleave
between the read and the write, which static inspection cannot verify and only adversarial
reproduction can expose.

The held pre-shaped candidate from wave-65 obs-3 was:
  "Run adversarial /review on any new async effect with sequential state writes or DB helpers
  with read-then-write sequences; Phase-1 code-read cannot catch interleaving."

This wave's instance is a pure DB read-modify-write sequence, not an async effect, so the
candidate's scope ("async effect") is narrower than this wave's instance requires. The broader
claim is: any read-modify-write sequence (whether in React state, Dexie, or a server DB
transaction) that is not guarded at the storage layer is a potential TOCTOU, and static
code-read cannot detect it because the race requires concurrent callers. Both instances were
caught only by adversarial /review after a Phase-1 APPROVE; both required a structural fix
(cancellation flag / db.transaction + FOR UPDATE).

Near-dup check vs BUILD-PRINCIPLES rule 4: rule 4 covers authz and injection boundaries;
it prescribes reproducing one negative path per authz boundary at B-6 Phase-2. This class
is the temporal/concurrency boundary: a TOCTOU or stale-write race is not an authz defect
but a state-consistency defect that the same adversarial /review gate catches. Rule 4 does
not enumerate this class. Not a near-dup; the concurrency sub-class is uncovered.

Note on generalizability: the actionable version of this observation is narrower than "always
adversarial /review" (already structurally implied by the two-phase B-6 gate). The specific
falsifiable prescription is: a read-modify-write status flip or state update that is not
wrapped in a DB transaction with a locking SELECT cannot be proven safe by static inspection;
the guard must live in the DB (conditional UPDATE WHERE status='open' RETURNING, or SELECT FOR
UPDATE in a txn), not only in application-layer code. This is distinct from rule 5 (async
loop coalescing) and rule 4 (authz reproduction).

**Severity:** warning (P1 finding; a concurrent double-resolve would have silently succeeded
  in production; caught by /review after head-builder code-read APPROVED).
**Candidate principles file:** command-center/principles/BUILD-PRINCIPLES.md (rule 13 candidate
  — competing with obs-1 for the per-file per-wave cap if both reach promotion stage).
**Cross-wave recurrence:** SECOND INSTANCE. Wave-65 obs-3 = 1st (different domain —
  React async + Dexie); wave-69 = 2nd (server-side DB TOCTOU). Same structural class:
  read-modify-write invisible to static inspection, caught only by adversarial /review.
**Promotion flag:** HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-builder.
  Cap note: obs-1 and obs-2 are both warning-level BUILD-PRINCIPLES candidates. karen must
  apply the per-file per-wave cap and promote at most one per wave.

---

## obs-3 — FIRST INSTANCE (strong): position:fixed overlay mounted inside a CSS-transformed ancestor is clipped and mis-positioned relative to the viewport

**Source artifacts:**
- process/waves/wave-69/stages/T-6-layout.md (T6-M1 CRITICAL FAIL: "At 375px the inbox
  fixed inset-0 overlay is mounted INSIDE the ChannelSidebar drawer wrapper which carries
  transform: translateX(-260px) on mobile. A transformed ancestor becomes the containing
  block for position:fixed descendants → the inbox collapses to a 260px box parked
  off-screen left (rendered x=-188, width=260); only a ~72px clipped sliver shows.")
- process/waves/wave-69/stages/V-3-fast-fix.md (T6-M1 4-LOC fix: ChannelSidebar.tsx —
  report-inbox overlay now createPortal(<overlay/>, document.body), escaping the drawer's
  translateX transformed ancestor; jenny re-verify: "mobile 375px inbox fillsViewport
  (x=0,w=375,transform:none)")

**Assessment:** The finding is a well-documented CSS stacking-context trap: a `transform`,
`perspective`, or `filter` on any ancestor overrides `position:fixed`'s normal behavior
(the nearest containing block becomes that transformed ancestor rather than the viewport).
This is a browser-specified behavior (CSS Transforms spec, "containing block" definition),
not an edge case. The defect cost a CRITICAL and required a V-3 fast-fix + redeploy.

The fix pattern (portal full-screen overlays to document.body to escape the transform
boundary) is a standard React/DOM escape hatch that is widely applicable to any modal,
drawer, toast, or overlay that needs true viewport-relative positioning.

Near-dup check vs DESIGN-PRINCIPLES rule 1 (contrast on muted text): different class. No
existing DESIGN-PRINCIPLES, BUILD-PRINCIPLES, or T-6.md rule covers the transformed-ancestor
stacking-context trap. Not a near-dup.

Falsifiability: checkable — any `position:fixed` descendant of a `transform` ancestor will
fail a T-6 mobile screenshot exactly as described here.

Pre-shaped candidate rule for T-6.md or DESIGN-PRINCIPLES (for karen reference — NOT a
nomination; 1st instance only):
  "1. Portal any full-screen fixed overlay to document.body; a CSS transform on any ancestor
     makes position:fixed relative to that ancestor, not the viewport."
  Rule line = 109 chars. PASS (<=120).
  "    Why: A transformed ancestor overrides the viewport as containing block, collapsing
       the overlay to the ancestor's bounds."
  Why line with 4-space indent = 95 chars. PASS (<=100).
  No forbidden tokens. PASS.
  Candidate file: T-6.md (T-6 is where this class is first detected) or DESIGN-PRINCIPLES
  (overlay modal pattern is broader than one test stage). BUILD-PRINCIPLES is also viable
  (implementation rule for the portal pattern). Three plausible homes; karen to decide.

**Severity:** strong (CRITICAL severity at T-6; the moderator inbox was completely unusable
  on mobile; required a separate V-3 fast-fix + redeploy; trap is a recurring CSS class
  not specific to this feature).
**Candidate principles file:** T-6.md rule 1 candidate (first stage to detect it) OR
  command-center/principles/DESIGN-PRINCIPLES.md rule 2 candidate (broader modal design
  pattern). BUILD-PRINCIPLES also viable.
**Cross-wave recurrence:** FIRST INSTANCE in the 5-wave archive window. HOLD.
**Promotion flag:** HOLD — 1st instance; watch for any subsequent wave where a fixed/inset
  overlay is mounted inside a translated or scaled ancestor and mis-positions or collapses.

---

## obs-4 — INFORMATIONAL: status check on all standing prior observations from wave-68 obs-3 and the 5-wave archive window

| origin | class | wave-69 status |
|--------|-------|----------------|
| wave-68 obs-1 (HOLD — recurrence bar cleared, awaiting karen) | Built-but-not-wired component seam invisible to isolated tests + optional-prop typecheck | PROMOTED to BUILD-PRINCIPLES rule 12 at wave-68 L-2. Class resolved; observation closed. |
| wave-65 obs-3 / wave-66 obs-2 (HOLD) | Phase-1 code-read misses async-effect race / non-atomic DB write; /review catches both | CONFIRMED — SECOND INSTANCE. Wave-69 B-6 /review caught a server-side TOCTOU (non-atomic resolveReport SELECT-then-update) that Phase-1 APPROVED. See obs-2 above. The domain differs (server DB transaction vs React async + Dexie) but the structural class is identical. Recurrence bar cleared. HOLD — awaiting karen + head-builder for cap adjudication with obs-1. |
| wave-47 obs-C (HOLD) | Display-identifier passed where opaque DB id required; isOwn always false; sentinel string | CONFIRMED — SECOND INSTANCE. Wave-69 F1 is structurally identical (profile?.username passed to a UUID comparison). See obs-1 above. Recurrence bar cleared. |
| wave-64 obs-1 (HOLD) | createObjectURL Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-69 introduces no Blob, no createObjectURL, no image object URL. HOLD maintained. |
| wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files | NOT CONFIRMED. Wave-69 web changes are MainColumn.tsx (1-line userId fix) and ChannelSidebar.tsx (4-line createPortal). No new hardcoded palette hex. STRONG HOLD maintained. |
| wave-58 obs-A (HOLD) | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No soft-check converted to a gating assertion this wave. HOLD maintained. |
| wave-58 obs-B (HOLD) | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. T-5 ran as live post-deploy probe per established pattern; no classification stress-test. HOLD maintained. |
| wave-59 obs-3 (HOLD) | Test a multi-branch pure formatter with a single it.each table | NOT CONFIRMED. Wave-69 tests are authz integration, E2E flows. No multi-branch pure-function formatter. HOLD maintained. |
| wave-57 obs-1 (HOLD) | Interactive nav/rail button shipped with no onClick | NOT CONFIRMED. All report affordances ship wired (member-row leak is a separate follow-on task cc783559, not a dead-onClick). HOLD maintained. |
| wave-52 obs-3(a) (HOLD) | VERIFY: independently re-probe load-bearing claims before accepting verdict | CONFIRMED BY APPLICATION. Karen git-verified both fix commits at HEAD (MainColumn:343 userId, ChannelSidebar:16/419/470 createPortal); jenny independently live-probed 0/33 own-message report (exact inversion) + mobile inbox fillsViewport. Head-verifier confirmed no cross-endorsement. Behavior continues correctly. Still HOLD for VERIFY rule 5 candidacy. |
| wave-49 obs-C (HOLD) | Responsive breakpoint not validated against D-3 adopted design at B-block | PARTIAL RELATED. T6-M1 is a mobile breakpoint failure; however it was caught at T-6 (the intended stage), not a B-block miss vs D-3. The T6-M1 defect is a CSS stacking-context trap at the implementation level, not a design-vs-implementation drift. Not a direct confirming instance of obs-C (which concerns B-block drift from adopted D-3 design). HOLD maintained for the B-block drift sub-class. |

**Severity:** informational (status checks only; wave-47 obs-C and wave-65 obs-3 both
  confirmed as second instances; all other HOLDs maintained or closed as appropriate).
**Candidate principles file:** none.
**Promotion flag:** NO (status check only).

---

## obs-5 — INFORMATIONAL: pgEnum vs text convention adjudicated at B-0; schema aligned with zero existing pgEnum precedent

**Source artifacts:**
- process/waves/wave-69/stages/B-0-branch-and-schema.md (§Adjudicated deviation: "postgres-pro
  initially emitted two pgEnums (report_target_type, report_status) per the spec's literal
  'enum' wording. Adjudicated → REVERT to plain text columns: the codebase has ZERO pgEnum
  across all 12 sibling schema tables (every status/type is text + app-layer Zod); ALTER TYPE
  ADD VALUE migration friction for a domain expected to gain values.")

**Assessment:** This was a successful B-0 adjudication preventing a schema deviation before
migration generation. No defect shipped. The lesson — that a spec's verbal "enum" should
map to text+Zod when the codebase has an established text+Zod convention — is already implicit
in BUILD-PRINCIPLES rule 1 context (prod-like convention matching) and the CLAUDE.md "REUSE,
do not reinvent" principle encoded in the B-0 schema conventions.

This is not a new promotable class. The adjudication worked as designed. Noted for completeness:
a schema-convention check at B-0 before migration generation is the correct moment to catch
this, and the specialist complied when adjudicated.

**Severity:** informational (prevented a deviation; no defect; no new rule warranted).
**Candidate principles file:** none.
**Promotion flag:** NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Display-identifier (username) passed to UUID identity comparison; isOwn always false; own-content affordance leaks | warning | SECOND INSTANCE (wave-47 obs-C = 1st; same class: profile?.username vs profile?.userId) | BUILD-PRINCIPLES rule 13 candidate | HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-builder; cap note below |
| obs-2 | Phase-1 code-read APPROVED; /review caught server-side TOCTOU (non-atomic resolve); DB-layer guard required | warning | SECOND INSTANCE (wave-65 obs-3 = 1st; different domain, same structural class) | BUILD-PRINCIPLES rule 13 candidate | HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-builder; cap note below |
| obs-3 | position:fixed overlay in CSS-transformed ancestor collapses to ancestor bounds; portal to document.body | strong | FIRST INSTANCE | T-6.md rule 1 candidate OR DESIGN-PRINCIPLES rule 2 candidate | HOLD — 1st instance; watch for recurrence |
| obs-4 | Status check on standing prior observations: wave-47 obs-C + wave-65 obs-3 confirmed as 2nd instances | informational | — | none | STATUS CHECK ONLY |
| obs-5 | pgEnum vs text adjudicated at B-0; adjudication worked; no defect; no new rule warranted | informational | — | none | NO PROMOTION |

**Observations emitted (knowledge-synthesizer): 5**
**Severities: 1 strong (obs-3), 2 warning (obs-1, obs-2), 2 informational (obs-4, obs-5)**
**Promotion-eligible from knowledge-synthesizer section: obs-1 (BUILD-PRINCIPLES rule 13) and
  obs-2 (BUILD-PRINCIPLES rule 13) — BOTH cleared the recurrence bar this wave; karen must
  apply the per-file per-wave cap and promote AT MOST ONE of the two per wave.**
**Nominations for karen vetting: obs-1 and obs-2 compete for the single BUILD-PRINCIPLES slot;
  obs-3 is a HOLD (1st instance) for T-6.md or DESIGN-PRINCIPLES on a future 2nd confirming wave.**

---
## L-2 promotion outcome (wave-69)
- PROMOTED: BUILD-PRINCIPLES rule 13 (obs-1 — pass opaque user id not display username to identity-compared props). karen APPROVE + cap-1 rewrite + linter PASS.
- HELD (live 2-instance candidate for next confirming wave): obs-2 (enforce read-modify-write status flip in the DB via conditional UPDATE / row lock, not an in-app check). karen APPROVE'd it too, but the ≤1-per-file cap picked obs-1 (novel ground vs rule 5's concurrency theme). Re-log for a future BUILD-PRINCIPLES promotion or a sharpening of rule 5.
- HELD (first-instance): obs-3 (position:fixed inside a CSS-transformed ancestor is positioned relative to that ancestor → portal to document.body). Strong but needs a 2nd confirming wave before promotion; candidate home DESIGN-PRINCIPLES or T-6.md.
