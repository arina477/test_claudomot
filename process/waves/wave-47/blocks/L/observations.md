# Wave 47 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave observations stay here until a second wave confirms.

## V-block observations (seeded by head-verifier at V-3 end-of-life)

- **[V-2 triage — candidate for VERIFY-PRINCIPLES if it recurs]** A scope-fenced INFO improvement (e.g. adding a LIMIT to a live, defect-free query) floated as a cheap fast-fix should be DECLINED into a non-blocking task row, not pulled into the V-3 fast-fix loop. Rationale: the fast-fix loop is for BLOCKING findings; adding an unrequested change to a shipped live surface with no defect behind it is unscoped-green-by-addition and erodes the loop bound. Candidate rule shape: "Decline scope-fenced non-defect improvements from the fast-fix loop; route them to non-blocking task rows." — NOT promoting this wave (single occurrence; VERIFY-PRINCIPLES promotion requires 2+ waves per its Contract).

- **[V-2 non-blocking rows — already covered by memory note, not a new rule]** V-2 milestone-scoped follow-ups intended as future N-2 seeds must carry `wave_id = NULL` (provenance in prose), else they strand and can never be picked as a seed. Already captured in project memory (`v2-milestone-followup-wave-id-must-be-null-for-n2-seed`). Applied correctly this wave (all 3 rows `wave_id IS NULL`, DB-verified). No net-new rule.

- **[V-1 reviewer-false-negative probe — reinforces existing discipline, not net-new]** Both Karen + jenny APPROVE on a non-trivial change was probed, not accepted at face value: verdicts were evidence-backed (quoted WHERE clauses + line numbers from Karen; live click-path + network captures + screenshots from jenny), and the fresh head-verifier re-verified independently via `git show` at the merge SHA rather than trusting the summary. No net-new rule; existing VERIFY-PRINCIPLES rule 3 + the always-on probe already cover this.

## Wave-47 net-new principle promotions proposed: 0
All V-block lessons this wave are either single-occurrence (hold for a 2nd wave) or already encoded (memory note / existing rules). Zero-promotion is the expected default.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-47/ full artifact set (T-2, T-5, T-8, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix, B-2-backend, B-6-review, T-block gate-verdict).
Prior archives consulted: process/waves/_archive/wave-{44,45,46}/blocks/L/observations.md (recurrence checks on entry-point coverage class, V-1 semantic-spec value, id-space bug class, and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES (9 rules), VERIFY-PRINCIPLES (3 rules), test-writing-principles (rules 1-27 + §13), T-5.md (2 rules), PRODUCT-PRINCIPLES.

---

- **[obs-A — wave-46 obs-1 CONFIRMED BY CORRECT APPLICATION; test-writing §27 is the encoding]**
  Wave-46 obs-1 was a HOLD: "T-5 E2E tested the DM picker from a server context that provided required state; the cold-start DM home entry point was never exercised; jenny V-1 caught a CRITICAL unreachable entry point." Wave-47 T-5 is the confirming second instance — but the confirmation is by CORRECT APPLICATION, not by recurrence of the failure. The T-5 team deliberately drove the REAL picker UI from the DM home nav rail (S2: role=dialog from `start-dm-button`; S3: role=option `studyhall-e2e-fixture-b` listed; T-5 headline: "DMs startable via picker UI — NOT an API shortcut, the wave-46 lesson"), and ALL scenarios PASS. The wave-46 lesson was applied, the entry-point was cold-start exercised, and the product works.

  Test-writing-principles §27 (promoted mid-block by head-tester at T-block) encodes this exactly: "Drive a feature's entry-point flow through the real UI affordance, never via a direct API call that skips the screen the user must click. Why: an API-shortcut E2E marks a feature green while its actual entry point is an unreachable dead-end in the UI." Near-dup check against T-5.md: a T-5.md rule 3 candidate with the same shape would be a near-dup of §27. Per the ≤1-per-file cap and the no-near-dup contract: NO T-5.md promotion. §27 is the correct permanent encoding; the T-5.md rule 3 slot remains open for the next distinct T-5-scoped observation.

  Status: wave-46 obs-1 PROMOTED VIA TEST-WRITING §27 (head-tester track, wave-47). No additional promotion to T-5.md.

- **[obs-B — jenny V-1 semantic-spec verification discipline; reinforces existing VERIFY rules]**
  Wave-47 V-1 jenny drove a live click-path (DM home → Start Direct Message → picker lists B → select → Open DM → thread → send → own message renders displayName not "Unknown user") with network captures and screenshots, confirming the wave-46 F-A CRITICAL is fully resolved. Karen independently byte-checked WHERE clauses and DTO mapper. Both APPROVE with evidence backing, not rubber-stamps. The orchestrator probe of clean verdicts was satisfied. This is confirmation of existing V-block discipline (VERIFY rules 1-3), not a new observation class. No promotion. V-block discipline is working correctly.

- **[obs-C — F7 id-space bug (username vs opaque userId for author resolution); single occurrence HOLD]**
  DmConversationList rendered "Unknown user" for sent messages because `authorId` was matched against `profile.username` (a display string) instead of `profile.userId` (the stable DB opaque uuid). Fixed at B-3 (DmHome.tsx:30 `currentUserId = profile?.userId`). The class — "component uses a display-identifier to match against a DB-identity field; resolves no match → falls back to sentinel string" — is a first recorded instance. Near-dup check: BUILD rules 1-9 contain no rule about display-identifier vs opaque-id mismatch. Test-writing has no near-dup. HOLD — promote if a second wave ships a component that matches authorId/userId against a display field.

  Severity: warning (bug shipped to production, caught at V-1 jenny). Candidate file: BUILD-PRINCIPLES rule 10. Watch for: any component that receives a server ID (opaque uuid) and resolves "is this mine?" by comparing against a display string (username, email, slug) from the auth profile.

- **[obs-D — status check on prior held observations]**
  | origin | obs | class | wave-47 status |
  |--------|-----|-------|----------------|
  | wave-44 obs-1 | Layout fix introduces overlay without WCAG dialog contract; BUILD rule 10 | NOT CONFIRMED. Wave-47 B-block introduces no new overlay or dialog surface (DM picker was an existing modal surface). Remains 3-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config; T-5 rule 3 | NOT CONFIRMED (positive — T-5 launched cleanly). Remains 2-wave HOLD. |
  | wave-45 obs-2 | playwright --list false-green; BUILD rule 10 candidate | NOT CONFIRMED. No playwright config change this wave. Remains 2-wave HOLD. |
  | wave-46 obs-1 | T-5 cold-start entry-point coverage; T-5 rule 3 | CONFIRMED BY CORRECT APPLICATION — test-writing §27 encodes it (head-tester track). No separate T-5.md promotion (near-dup). CLOSED. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision; PRODUCT rule 4 | NOT CONFIRMED. No T-8-sourced architectural conflict. Remains 7-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green; CI rule 7 amendment | NOT CONFIRMED. No V-3 fast-fix redeploy. Remains 6-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive; VERIFY rule 4 | NOT CONFIRMED. No bundle verification via symbol-name grep. Remains 6-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap; BUILD rule 10 | NOT CONFIRMED. No new parallel enforcement boundary. Remains 6-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params; BUILD rule 10 | NOT CONFIRMED. No new text-keyed route params. Remains 7-wave HOLD. |

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-A | wave-46 entry-point class confirmed by correct application at wave-47 T-5; test-writing §27 is the encoding | strong | 2nd instance (confirmed by application) | T-5.md rule 3 (near-dup of §27) | CLOSED — test-writing §27 encodes it; no T-5.md promotion (near-dup) |
| obs-B | jenny V-1 semantic-spec discipline reinforces existing VERIFY rules; no new class | informational | confirmation-by-application | VERIFY-PRINCIPLES | NOT A NEW CANDIDATE |
| obs-C | F7 id-space bug: display-identifier matched against opaque DB id → "Unknown user"; BUILD-PRINCIPLES | warning | 1st instance | BUILD-PRINCIPLES rule 10 | HOLD — promote on 2nd confirming wave |
| obs-D | Status check on prior held observations | informational | status checks | null | STATUS CHECK ONLY |

**Observations emitted (L-2 synthesis): 4 (obs-A through obs-D)**
**Severities: 1 strong (obs-A), 1 warning (obs-C), 2 informational (obs-B, obs-D)**
**Promotion-eligible this wave: 0 (obs-A closed via test-writing §27 already landed; obs-C is 1st-instance HOLD)**
**Mid-block validations: test-writing §§26-27 VALIDATED OK (see below)**
