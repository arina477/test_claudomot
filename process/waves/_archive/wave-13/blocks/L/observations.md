# Wave 13 — L-2 Distill Observations

Synthesized from wave-13 artifacts (M3 message lifecycle: edit/delete + reactions; LIVE, PR#24 + fast-fix PR#25; main @ 8487601).
Prior archives consulted: process/waves/_archive/wave-{8,9,10,11,12}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (3 rules), VERIFY-PRINCIPLES (1 rule), CI-PRINCIPLES (2 rules), T-8.md (1 rule), PRODUCT-PRINCIPLES (0 rules), DESIGN-PRINCIPLES (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      toggleReaction selected the is_deleted column in its opening query but never
      branched on it: a direct authenticated API caller with channel access could POST a
      reaction to a soft-deleted (tombstoned) message. The spec edge-AC said "react-to-deleted
      -> blocked/no-op". The gap was unreachable via the product UI (tombstone renders no
      reaction affordances), but the defence-in-depth invariant was broken. jenny caught it
      at V-1 ("selects is_deleted but doesn't GATE on it"); V-3 fast-fixed with a 1-line
      ConflictException guard at messages.service.ts:386-388, mirroring the established
      editMessage 409 pattern already present in the same file. The root-cause class is
      generalizable: reading a soft-delete flag into a SELECT but failing to gate on it means
      every other mutation path on the same table is a latent instance of the same defect.
      The edit path already had the 409 guard (service:250-252); the delete path had an
      idempotency return (service:312-314); only the reaction toggle was missing, precisely
      because it was added after the soft-delete columns were established and the reviewer
      consulted the SELECT result without asking "does every branch refuse a deleted row?"
    source:
      - process/waves/wave-13/stages/V-1-jenny.md
        # "service checks message exists + belongs to channel (service:376-384) but does NOT
        #  block a reaction on an is_deleted row (it reads is_deleted into the select but
        #  never gates on it)"
      - process/waves/wave-13/stages/V-2-triage.md
        # "toggleReaction doesn't gate on is_deleted (react to soft-deleted msg) | Low |
        #  FAST-FIX candidate: spec edge-AC 'react-to-deleted blocked/no-op'"
      - process/waves/wave-13/blocks/V/gate-verdict.md
        # "Guard added messages.service.ts:386-388 (if (message.is_deleted) throw new
        #  ConflictException(...)), mirroring the established editMessage 409 pattern."
      - process/waves/wave-13/stages/B-2-backend.md
        # editMessage already guards: service:250-252; gap was in the later-added toggleReaction.
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First-occurrence in this exact form (select-a-column-but-omit-the-gate-check on a
      soft-delete flag). No prior wave archive records this specific class. The V-1 independent
      review is what caught it; B-6 and the full 220-test suite did not. Hold for a second
      confirming wave before promoting. The defect class is distinct from VERIFY-PRINCIPLES
      rule 1 (seeding AC masked by safe fallback) because the column is present and selected;
      the failure is in the conditional branch, not the data state.
    near_dup_check: >
      BUILD-PRINCIPLES rules 1-3: none address mutation-path guards on a soft-delete column.
      VERIFY-PRINCIPLES rule 1: guards against safe fallbacks hiding missing seeds; different
      mechanism (column gating vs initial-state absence). No near-dup found.
    promotion_gates:
      generalizable: true
        # Any table with is_deleted/deleted_at soft-delete + multiple mutation endpoints is
        # a candidate instance; applies across stacks and ORMs.
      falsifiable: true
        # Checkable at B-6: for every mutation path that opens a query on a soft-deletable row,
        # does the service function branch on the soft-delete flag before proceeding?
      cited: true
        # V-1-jenny, V-2-triage, V-gate-verdict, B-2-backend all reference the same defect.
    candidate_rule_shape: >
      4. For every mutation on a soft-deletable row, gate on the soft-delete flag before acting,
         even when the flag is already selected.
         Why: Selecting a column does not enforce a branch; each mutation path needs its own guard.
      Rule line = 102 chars (within 120); why line = 71 chars (within 100). No forbidden tokens.

  - id: obs-2
    summary: >
      The wave-13 fast-fix branch survived a worker restart mid-V-block because the branch
      had already been pushed to origin after B-block (BUILD-PRINCIPLES rule 2). The V-3
      fix commit (7124776, fix/wave13-react-deleted-guard) was pushed to origin immediately
      after the fast-fix landed; V-block deliverable files (V-1-jenny.md, V-1-karen.md,
      V-2-triage.md) survived on disk because they were written during the same session
      without a restart occurring before the gate-verdict. This is a positive confirmation
      that BUILD-PRINCIPLES rule 2 (push after every B-block and D-block stage) provided
      the intended safety net: the V-block fast-fix was recoverable because the feature
      branch was already at origin before the restart. No work was lost. No new rule is
      indicated; this is an informational confirmation that rule 2 holds under V-block
      fast-fix conditions as well as B/D stages.
    source:
      - process/waves/wave-13/blocks/V/gate-verdict.md
        # "Commit 7124776 on fix/wave13-react-deleted-guard (pushed to origin)."
      - command-center/principles/BUILD-PRINCIPLES.md rule 2
        # "Push the branch to origin after every B-block and D-block stage before
        #  starting the next stage."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      Positive confirmation of rule 2 under V-block conditions; rule already promoted
      at wave-8 L-2. No new rule warranted; confirming the rule's scope covers
      fast-fix branches as a natural consequence.

  - id: obs-3
    summary: >
      The idempotent reaction toggle was implemented via a DB UNIQUE constraint
      (UNIQUE(message_id, user_id, emoji)) plus onConflictDoNothing at INSERT, rather
      than an app-level check-then-insert. This pattern forces the DB to be the single
      arbiter of "has this user reacted with this emoji on this message", eliminating the
      TOCTOU race a check-then-insert creates under concurrent requests. The pattern is
      consistent with the wave-8 max_uses atomic UPDATE approach (B-6 gate-verdict, wave-8:
      "max_uses enforcement is not atomic" REWORK → fixed to conditional UPDATE). Both waves
      moved idempotency enforcement down to the DB constraint layer rather than the app layer.
      Karen confirmed the UNIQUE is live in both schema and committed migration (V-1-karen:
      "UNIQUE constraint is live in both schema (messages.ts:69) and committed migration").
    source:
      - process/waves/wave-13/stages/V-1-karen.md
        # "INSERT with onConflictDoNothing on the UNIQUE target (toggle on)... UNIQUE
        #  constraint is live in both schema (messages.ts:69) and committed migration."
      - process/waves/wave-13/stages/B-2-backend.md
        # "toggleReaction (idempotent INSERT/DELETE on UNIQUE)"
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # obs-2: "B-6 gate caught a genuine TOCTOU violation in the max_uses path"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      Second wave applying the DB-constraint-as-idempotency-arbiter pattern
      (wave-8: atomic conditional UPDATE for max_uses; wave-13: UNIQUE + onConflictDoNothing
      for reactions). Both instances were caught positively (gate confirmed correct), not as
      defects. Pattern is sound and well-established. The risk class (app-level check-then-insert
      as TOCTOU) was corrected in wave-8; wave-13 implemented the correct form from the start.
      Not a defect pattern requiring a rule; informational positive confirmation.

```

---

## Wave-13 L-2 distill disposition

**obs-1 (select-without-gate on soft-delete flag) — SINGLE-WAVE; HOLD.**

Strongest candidate this wave. Clear mechanism, independently confirmed by jenny (V-1), V-2-triage, V-3 gate-verdict, and B-2 artifact. Generalizable across any soft-delete table with multiple mutation paths. Falsifiable (checkable at B-6: does each mutation branch on the flag?). No near-dup in BUILD-PRINCIPLES or VERIFY-PRINCIPLES. However: first occurrence only. Recurrence condition not yet met. Hold in observations; promote to BUILD-PRINCIPLES rule 4 if a second wave catches the same class (a mutation path selects a soft-delete column but omits the conditional guard).

Candidate rule for next qualifying wave:
```
4. For every mutation on a soft-deletable row, gate on the soft-delete flag, even when already selected.
   Why: Selecting a column does not enforce a branch; each mutation path needs its own guard.
```
Rule line = 97 chars (within 120); why line = 65 chars (within 100). No forbidden tokens. No near-dup.

**obs-2 (worker-restart recovery, BUILD rule 2 confirmation) — INFORMATIONAL; NO PROMOTION.**
Rule 2 already exists. Positive confirmation only.

**obs-3 (DB-constraint idempotency) — INFORMATIONAL; NO PROMOTION.**
Second positive instance, but both instances were correct from the start or corrected at gate — not a recurring defect class requiring a rule. Noting the consistent pattern.

**Summary table:**

| id    | title (short)                              | severity      | recurrence | disposition                                      |
|-------|--------------------------------------------|---------------|------------|--------------------------------------------------|
| obs-1 | Select-without-gate on soft-delete flag    | strong        | 1 wave     | keep-as-observation; promote if recurs (BUILD-4) |
| obs-2 | Worker-restart recovery (rule 2 confirmed) | informational | n/a        | informational confirmation; no promotion         |
| obs-3 | DB-constraint idempotency (positive)       | informational | 2 waves    | informational; no defect pattern; no promotion   |
