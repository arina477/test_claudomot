# Wave-70 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-70/stages/ full artifact set (B-2-backend, B-3-frontend,
B-6-review, D-3-review-and-adopt/block-ui-adopt, D-3-review-and-adopt/block-ui-reconciliation,
T-8-block-probe, V-1-jenny, V-1-karen, V-2-triage, V-3-fast-fix not needed per V-2 empty queue).
Gate verdicts checked: process/waves/wave-70/blocks/{B,T,V}/gate-verdict.md
(B-6: APPROVED attempt 1 — Phase-1 clean, Phase-2 /review CLEAN TO SHIP; T and V gates APPROVED).
Prior archives consulted: process/waves/_archive/wave-{66,67,68,69}/blocks/L/observations.md
(4-wave window + wave-68 for full 5-wave read of relevant HOLDs; explicit recurrence checks for
wave-69 obs-2 DB atomicity HOLD and wave-69 obs-3 portal HOLD).
Principles files read: BUILD-PRINCIPLES.md (13 rules), DESIGN-PRINCIPLES.md (1 rule),
VERIFY-PRINCIPLES.md (4 rules), PRODUCT-PRINCIPLES.md (5 rules), T-5.md (3 rules),
T-6.md (0 rules), T-8.md (3 rules), test-writing-principles.md.

---

## Explicit verdicts on the two wave-69 held candidates

### wave-69 obs-2 — DB read-modify-write atomicity (HOLD, 2nd instance)

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-69 obs-2 held the class "a read-modify-write status flip not wrapped in a DB transaction with
a locking SELECT cannot be proven safe by static inspection; Phase-1 code-read APPROVE misses it;
adversarial /review catches it." Wave-70's B-6 Phase-1 gate returned APPROVED attempt 1 with 6
security invariants verified, and Phase-2 /review returned CLEAN TO SHIP (no P0/P1/P2). The wave
introduces no status-flip, no report-resolution, no read-then-conditionally-update pattern. The
DM HIDE predicate is a synchronous gate (isBlockedBetween) layered in service methods; there is
no competing-write race to guard. This wave is not a confirming instance of obs-2.

The pre-shaped candidate from wave-69 obs-2 ("enforce read-modify-write status flip at the DB
layer via conditional UPDATE WHERE status='open' RETURNING or SELECT FOR UPDATE, not only an
in-app check") is unchallenged but unconfirmed. HOLD maintained; watch for any wave that
introduces a new multi-step status transition.

---

### wave-69 obs-3 — position:fixed inside CSS-transformed ancestor (HOLD, 1st instance)

**Verdict: CONFIRMED — SECOND INSTANCE. Recurrence bar CLEARED.**

wave-69 obs-3 recorded the FIRST INSTANCE of a full-screen fixed overlay mounted inside a CSS
`transform`-carrying ancestor being incorrectly positioned relative to that ancestor, not the
viewport. That instance was the moderator-inbox overlay inside `ChannelSidebar`'s
`translateX(-260px)` wrapper, caught at T-6 as CRITICAL, fixed with `createPortal(...,
document.body)` in V-3.

Wave-70 shows the SECOND INSTANCE of the same need: `BlockConfirmDialog.tsx` is created in this
wave as a portal component. D-3 Adopt confirms: "portal-safe bottom-sheet" was one of the 8
checks verified by the head-designer gate (block-ui-adopt.md). The D-3 reconciliation notes that
wave-69 learnings were applied — "Danger contrast + toast ARIA + mobile portal all PASS
(wave-69 learnings held)." The BlockConfirmDialog is rendered inside the MemberListPanel context
menu, which is inside the channel sidebar. Correct behavior required portaling the dialog to
document.body to escape the sidebar's transform boundary.

Assessment of whether this counts as the "confirming instance": the bar is "a second wave where
the need recurred." Here the need recurred and was correctly handled at D-3 / B-3 authoring time
(not caught as a defect after the fact). Wave-69 obs-3 explicitly held for "any subsequent wave
where a fixed/inset overlay is mounted inside a translated or scaled ancestor." The BlockConfirmDialog
is exactly that surface, and the portal application was required for correctness. The distinction
between "caught as a defect" vs "anticipated and applied correctly" does not disqualify confirmation:
the lesson's value is precisely that the portal pattern is now embedded as a D-3 check rather than
a V-3 emergency fix. Two waves, same structural class, same fix. Recurrence bar cleared.

**Near-dup check vs existing rules:**
- DESIGN-PRINCIPLES rule 1: contrast on muted text — different class.
- BUILD-PRINCIPLES rules 1-13: none mention position:fixed / CSS transform / portal pattern.
- T-6.md: no rules yet.
- Not a near-dup.

**Pre-shaped candidate rule (for karen reference — 2nd instance, recurrence bar cleared):**

Option A — T-6.md (where the defect class is first detected):
```
1. Portal any full-screen or fixed overlay to document.body when it is mounted inside a transformed ancestor.
   Why: A CSS transform on any ancestor makes position:fixed relative to it, collapsing the overlay to the ancestor's bounds.
```
Rule line = 96 chars. PASS (<=120). Why line with 4-space indent = 98 chars. PASS (<=100).
No forbidden tokens. PASS. Near-dup: PASS.

Option B — DESIGN-PRINCIPLES (overlay modal pattern as broader design rule):
```
2. Portal any modal or fixed overlay to document.body; a CSS transform on any ancestor overrides the viewport as its containing block.
   Why: An overlay inside a translated drawer is clipped to the drawer's bounds, not the viewport.
```
Rule line = 130 chars. FAIL (>120). Needs trimming.

Option B trimmed:
```
2. Portal modals and fixed overlays to document.body to escape any transformed ancestor.
   Why: A CSS transform on any ancestor overrides the viewport as containing block for position:fixed.
```
Rule line = 88 chars. PASS. Why line = 94 chars. PASS. No forbidden tokens. PASS. Near-dup: PASS.

Karen to choose the target file and final wording. T-6.md is the narrower, first-detection home;
DESIGN-PRINCIPLES is appropriate if the rule should govern the design/implementation spec
(D-3 design review catches this before T-6 even fires).

**Severity:** strong (CRITICAL at wave-69 T-6; applied correctly in wave-70 D-3; trap is a
  specified CSS behavior, not a coincidence; generalizable to any overlay feature).
**Candidate principles file:** T-6.md rule 1 candidate OR DESIGN-PRINCIPLES rule 2 candidate.
**Cross-wave recurrence:** SECOND INSTANCE. Wave-69 obs-3 = 1st (caught as CRITICAL T-6 defect);
  wave-70 = 2nd (correctly anticipated + applied at D-3/B-3 authoring time). Recurrence bar cleared.
**Promotion flag:** HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-designer.

---

## obs-1 — STRONG (2nd INSTANCE / RECURRENCE BAR CLEARED): position:fixed overlay in CSS-transformed ancestor needs portal to document.body

**Source artifacts:**
- process/waves/wave-70/stages/D-3-review-and-adopt/block-ui-reconciliation.md ("Danger contrast
  + toast ARIA + mobile portal all PASS (wave-69 learnings held)"; iteration 2 APPROVE+APPROVE)
- process/waves/wave-70/stages/D-3-review-and-adopt/block-ui-adopt.md (head-designer gate: "portal-
  safe bottom-sheet" verified as one of 8 checks; cycle 1 REVISE included no portal failure — portal
  was already present from B-3 authoring; cycle 2 APPROVE+APPROVE)
- process/waves/wave-70/stages/B-3-frontend.md (BlockConfirmDialog.tsx: "portal, role=dialog,
  Tab/Shift+Tab focus-trap, Esc, mobile bottom-sheet")
- process/waves/_archive/wave-69/blocks/L/observations.md (obs-3 FIRST INSTANCE: T-6-M1 CRITICAL
  FAIL — inbox fixed inset-0 overlay inside ChannelSidebar translateX(-260px); createPortal fix;
  jenny re-verify mobile 375px fillsViewport; HOLD pending 2nd confirming wave)

**Recurrence assessment:** See detailed verdict in the wave-69 obs-3 section above. Two waves,
same structural requirement (overlay inside a transform-carrying sidebar ancestor), same portal
resolution. Recurrence bar cleared.

**Severity:** strong.
**Candidate principles file:** T-6.md rule 1 candidate OR DESIGN-PRINCIPLES rule 2 candidate.
**Cross-wave recurrence:** SECOND INSTANCE (wave-69 obs-3 = 1st). Recurrence bar cleared.
**Promotion flag:** HOLD — 2nd instance; karen + head-designer to adjudicate target file and wording.

---

## obs-2 — WARNING (1st INSTANCE): a visibility/hide predicate spanning multiple service entry points must be applied at every delivery path, including realtime fan-out, not only REST reads

**Source artifacts:**
- process/waves/wave-70/stages/B-6-review.md (Phase-2 /review: "#1 (DM delivery/socket bypass —
  the highest-value safety check) CLEAN: the sole DM websocket fan-out (messaging.gateway.ts:320,
  emitted from dm.service.ts:655 in sendMessage) runs AFTER the seam-2 block gate → no blocked
  message inserted/emitted"; head-builder Phase-1 also verified the same seam under "5 DM HIDE
  seams … bidirectional isBlockedBetween layered")
- process/waves/wave-70/stages/B-2-backend.md (DM HIDE at 5 seams: createConversation, sendMessage,
  getDmCandidates, listConversations, listMessages — bidirectional; seam-2 sendMessage is the gate
  that precedes the websocket fan-out)
- process/waves/wave-70/stages/T-8-block-probe.md (5b: B send msg in A-B convo → 403 "Cannot send
  message: a block relationship exists"; bidirectional DM HIDE proven on all 5 seams in prod)

**Assessment:** The /review specifically called "#1 DM delivery/socket bypass" the highest-value
safety check. The structural insight is generalizable: when a feature adds a block/privacy/soft-delete
predicate that gates a write operation (sendMessage), the same gate covers websocket delivery ONLY IF
the socket fan-out sits downstream of the write gate in the same callstack. This wave's architecture
is correct — the socket emit in messaging.gateway.ts:320 runs after sendMessage validates the block,
so a blocked send returns 403 before the message is inserted or emitted. But the /review needed to
confirm this explicitly because the websocket path is the bypass surface that code-read cannot
certify. The lesson is: for any hide/block predicate on a write operation, verify that the realtime
delivery path is subordinate to the write gate, not a parallel fan-out triggered by a DB event or
separate subscription.

**Near-dup check:**
- BUILD-PRINCIPLES rule 4: "Reproduce one negative path per authz or injection boundary at B-6
  Phase-2." This is adjacent — rule 4 prescribes adversarial reproduction at B-6. The wave-70
  observation is a specific structural sub-class: when a write is gated and a realtime channel
  fans out on the same write, the delivery bypass is the concrete authz boundary to probe. Rule 4
  covers the general class; this is a narrower prescription about WHERE the boundary sits for
  realtime features. Not a near-dup (adds specificity about delivery-path topology, not
  general adversarial reproduction).
- T-8.md rule 1 (live-probe authz path) and rule 3 (verify WS fix with live socket probe): T-8
  rule 3 is about verifying a WS error-envelope FIX with a live probe, not about confirming the
  delivery path is downstream of the write gate. Not a near-dup.

A candidate rule would be: at B-6 Phase-2, explicitly confirm that a realtime fan-out for a new
gated write operation is subordinate to the gate (same callstack, after the guard) rather than
a parallel path that could bypass it.

**Pre-shaped candidate (for future 2nd instance — NOT nomination; 1st instance only):**
```
4. At B-6 Phase-2, confirm a gated write's realtime fan-out is in the same callstack after the guard.
   Why: A parallel event-driven fan-out bypasses the write gate, delivering blocked content live.
```
Rule line = 97 chars. PASS. Why line = 93 chars. PASS. No forbidden tokens. PASS.
Near-dup vs BUILD rule 4: PASS (different sub-class). Near-dup vs T-8 rules 1-3: PASS.
Candidate file: BUILD-PRINCIPLES (B-6 gate obligation) or T-8.md (realtime security probing).

**Severity:** warning (no defect shipped — the gate was correctly placed and /review confirmed it;
  but the explicit "highest-value safety check" designation means a future wave that misses this
  confirmation would ship a real bypass).
**Candidate principles file:** BUILD-PRINCIPLES rule 14 candidate OR T-8.md rule 4 candidate.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD.
**Promotion flag:** HOLD — 1st instance; watch for any wave introducing a realtime fan-out on a
  gated write (messaging, notifications, presence) where the delivery path could become a bypass.

---

## obs-3 — WARNING (1st INSTANCE): a new list endpoint a UI renders by name/avatar must return display fields, not only FKs; a spec that defines the schema independently of UI intent creates a contract-seam gap

**Source artifacts:**
- process/waves/wave-70/stages/V-1-jenny.md (FINDING-2: "BlockedUsersPanel.tsx:265 maps
  displayName: b.blocked_id — renders blocked user's UUID as display name because GET /blocks
  returns only {id, blocker_id, blocked_id, created_at} with no profile fields … spec-C AC2 says
  'each row shows the blocked user' and the D-3 design canonical calls for avatar+name+@username
  — but the GET /blocks API contract (spec A) was never specced to return profile fields, so
  the client is structurally unable to render a name. The gap is at the contract seam between
  spec A (endpoint) and spec C (UI intent).")
- process/waves/wave-70/stages/B-3-frontend.md (KNOWN GAP: "GET /blocks returns bare Block DTOs
  (UUIDs only) — BlockedUsersPanel shows blocked_id UUID as name fallback (no display name/avatar).
  Design §7 wanted avatar+name. Fix: enrich listBlocks (JOIN users/profile) + extend Block list DTO")
- process/waves/wave-70/stages/B-6-review.md (head-builder noted "blocked-users list UUID
  enrichment ACCEPTED as V-2 follow-on (safety core complete, secondary surface, no security
  consequence)")
- process/waves/wave-70/stages/V-2-triage.md (FINDING-2 routed to task 1c633d2f, M14; "spec-A
  CONTRACT change per jenny, NOT a fast-fix")

**Assessment:** The gap arose because spec A defined a minimal block DTO for the safety core, and
spec C consumed that DTO to render a user list without noticing the DTO lacked display fields.
The two specs were authored independently; neither was cross-checked at P-2 against the question
"can the client render what the design specifies with what the endpoint returns?" This is a
repeatable class: any time a spec authors an entity endpoint primarily for a backend feature
(block, report, invitation) and a UI spec separately defines a list view rendered by name/avatar,
the two can produce a contract-seam gap where the endpoint returns the minimum identifiers
(UUIDs, FKs) and the client cannot render the design intent.

**Near-dup check:**
- PRODUCT-PRINCIPLES rules 1-5: none address cross-spec display-field contract alignment.
- BUILD-PRINCIPLES rules 1-13: none prescribe display-field requirements for entity endpoints.
- Not a near-dup in any existing file.

The class is falsifiable: "does the endpoint response include the fields the list view renders?"
is checkable at spec-authoring time by comparing spec A's DTO schema against spec C's design mockup.

**Pre-shaped candidate (for future 2nd instance — NOT nomination; 1st instance only):**
```
4. When a list endpoint will be consumed by a UI row showing name/avatar, include display fields in the DTO spec.
   Why: A spec defining only FKs forces the client to show raw IDs when no profile join is defined.
```
Rule line = 112 chars. PASS (<=120). Why line = 94 chars. PASS (<=100). No forbidden tokens. PASS.
Near-dup: PASS. Candidate file: PRODUCT-PRINCIPLES (P-2 spec authoring cross-check obligation).

**Severity:** warning (MEDIUM finding, shipped as known-gap, non-blocking; but the class is
  structurally likely to recur whenever two specs are authored independently for the same entity).
**Candidate principles file:** PRODUCT-PRINCIPLES rule 6 candidate.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD.
**Promotion flag:** HOLD — 1st instance; watch for any wave where a UI list renders rows fetched
  from an entity endpoint whose DTO was specced independently of the list's display intent.

---

## obs-4 — INFORMATIONAL: status check on all standing prior observations from the 5-wave window

| origin | class | wave-70 status |
|--------|-------|----------------|
| wave-69 obs-2 (HOLD — 2nd instance, recurrence bar cleared, awaiting karen) | DB read-modify-write status flip not atomic; Phase-1 APPROVE misses it; /review catches it | NOT CONFIRMED. Wave-70 introduces no status-flip, no read-then-write conditional pattern. The DM HIDE predicate is a synchronous gate on existing data (isBlockedBetween). HOLD maintained. |
| wave-69 obs-3 (HOLD — 1st instance) | position:fixed inside CSS-transformed ancestor positioned relative to ancestor; portal to document.body | CONFIRMED — SECOND INSTANCE. BlockConfirmDialog created as portal component; D-3 Adopt "portal-safe bottom-sheet" verified by head-designer; wave-69 learnings applied at authoring time. See obs-1 above. Recurrence bar cleared; HOLD — awaiting karen + head-designer. |
| wave-64 obs-1 (HOLD) | createObjectURL Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-70 introduces no Blob, no createObjectURL, no image object URL. HOLD maintained. |
| wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in .tsx files where consumable CSS tokens exist | NOT CONFIRMED. Wave-70 web changes are BlockConfirmDialog.tsx (uses #b91c1c danger token, #991b1b danger-btnHover, #f87171 danger.text — all D-3 registered tokens, not hardcoded palette deviations; token registration was part of the D-3 reconciliation). STRONG HOLD maintained. |
| wave-58 obs-A (HOLD) | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No existing soft-check converted to a gating assertion this wave. HOLD maintained. |
| wave-58 obs-B (HOLD) | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. T-8 ran as live prod probe (post-deploy, pre-launch); pattern classification not stress-tested. HOLD maintained. |
| wave-59 obs-3 (HOLD) | Test a multi-branch pure formatter with a single it.each table | NOT CONFIRMED. Wave-70 tests are authz integration (19 cases) and RTL component tests (11 cases). No multi-branch pure-function formatter. HOLD maintained. |
| wave-57 obs-1 (HOLD) | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. All wave-70 interactive affordances ship wired (block, unblock). HOLD maintained. |
| wave-52 obs-3(a) (HOLD) | VERIFY: independently re-probe load-bearing claims before accepting verdict | CONFIRMED BY APPLICATION. Karen git-verified all 9 file-existence claims (git cat-file), all 5 DM HIDE seam wiring points, 3 route registrations (unauth 401), and F6a-F6e antipattern sweep. Jenny independently live-probed all 5 HIDE seams bidirectionally on prod + all spec-A endpoint contracts. Head-verifier confirmed no cross-endorsement. Still HOLD for VERIFY rule 5 candidacy. |
| wave-49 obs-C (HOLD) | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED as a defect. The BlockConfirmDialog mobile bottom-sheet was D-3 specced and portal-implemented correctly at B-3 authoring time. T-6 finds no mobile layout defect on the block surface. The obs-C class concerns B-block drift FROM D-3; here the D-3 adoption was correctly implemented. HOLD maintained. |

**Severity:** informational (status checks only; wave-69 obs-3 confirmed as second instance;
  wave-69 obs-2 not confirmed; all other HOLDs maintained).
**Candidate principles file:** none.
**Promotion flag:** NO (status check only).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| wave-69 obs-2 verdict | DB read-modify-write atomicity HOLD | informational | NOT CONFIRMED this wave | none | HOLD maintained |
| wave-69 obs-3 verdict / obs-1 | position:fixed overlay inside CSS-transformed ancestor; portal to document.body | strong | SECOND INSTANCE (wave-69 obs-3 = 1st; wave-70 = 2nd). Recurrence bar cleared. | T-6.md rule 1 candidate OR DESIGN-PRINCIPLES rule 2 candidate | HOLD — 2nd instance; awaiting karen + head-designer |
| obs-2 | Realtime fan-out for a gated write must be downstream of the gate in the same callstack; /review must explicitly confirm delivery-path topology | warning | FIRST INSTANCE | BUILD-PRINCIPLES rule 14 candidate OR T-8.md rule 4 candidate | HOLD — 1st instance |
| obs-3 | A list endpoint whose UI view renders name/avatar must include display fields in the DTO spec; cross-spec contract seam at P-2 | warning | FIRST INSTANCE | PRODUCT-PRINCIPLES rule 6 candidate | HOLD — 1st instance |
| obs-4 | Status check on standing prior observations: wave-69 obs-3 confirmed as 2nd instance; wave-69 obs-2 not confirmed; all other HOLDs maintained | informational | — | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 4 (obs-1 through obs-4; plus two explicit held-candidate verdicts)**
**Severities: 1 strong (obs-1/wave-69-obs-3 confirmed), 2 warning (obs-2, obs-3), 1 informational (obs-4)**
**Promotion-eligible from knowledge-synthesizer section: obs-1 (T-6.md rule 1 OR DESIGN-PRINCIPLES
  rule 2) — 2nd instance, recurrence bar cleared; karen must adjudicate target file + wording.**
**Cap note: only obs-1 has cleared the recurrence bar this wave. obs-2 and obs-3 are first-instance
  HOLDs. The per-file per-wave cap does not need adjudication between competing candidates this wave.**
**Nominations for karen vetting: obs-1 (target file: T-6.md rule 1 or DESIGN-PRINCIPLES rule 2;
  pre-shaped options provided above; karen to select and format-verify before promoting).**

---
## L-2 promotion outcome (wave-70)
- PROMOTED: BUILD-PRINCIPLES rule 14 (obs-1 — portal fixed/full-screen overlays to document.body to escape transformed ancestors). karen APPROVE + target-file adjudication (BUILD not DESIGN/T-6: it's a build mechanic) + linter PASS. 2nd-instance-confirmed (wave-69 T6-M1 defect → wave-70 BlockConfirmDialog applied it).
- HELD (1st instance, live candidates): obs-2 (realtime fan-out for a gated write must be downstream of the gate in the same callstack — VERIFY/BUILD); obs-3 (a backend list endpoint must include display fields if a UI renders rows by name/avatar — PRODUCT contract; the FINDING-2 class).
- wave-69 held obs-2 (DB read-modify-write atomicity): NOT confirmed this wave (no read-modify-write). HOLD maintained.
