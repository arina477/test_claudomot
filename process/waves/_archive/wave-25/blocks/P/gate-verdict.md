# Wave 25 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-25/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-25 is aimed at a real, code-verified problem, scoped to the smallest durable increment, and specified precisely enough that a builder cannot diverge from intent. The frame stands on evidence, not the wave-15 prose: both premises were confirmed in source at P-0 — the server slug `[a-zA-Z0-9_-]+` (mentions.ts:35) excludes `.` so `@bob.dev` resolves+persists `bob`, while the client renderer (MessageList.tsx:559-565) looks up the whole run `bob.dev` in the server's mentions map (keyed `bob`), key-misses, and renders plain text; and editMessage (messages.service.ts:668-721) runs UPDATE + DELETE + INSERT as three unwrapped calls while createReply (:1031) and reply-delete (:839) in the same file already wrap. The root cause is correctly named — grammar duplication that drifted across four milestones — and the fix is at the right layer: extract the slug grammar to packages/shared as ONE source of truth both sides import, which structurally forecloses re-drift. This is right-sized: all three P-0 reviewers (problem-framer PROCEED, ceo-reviewer SCOPE-EXPANSION, mvp-thinner OK) converged on the MINIMAL slug-constant extraction, and a full tokenizer framework — flagged by mvp-thinner as gold-plating for two consumers — is named explicitly out of scope. The five ACs are each independently falsifiable with observable signals (pill render for @bob.dev, no false pill for unresolved handles, mentions.spec.ts green as the behavior-preserving regression guard, real-PG rollback leaving zero partial message_mentions, fail-loud on missing DATABASE_URL_TEST per CI rule 5). The plan maps every AC to a file-level step under the correct specialist and reuses the locked architecture (message_mentions table, the wave-24 pg-harness, the createReply transaction precedent, the existing packages/shared Zod home) with no new dependency, migration, or infrastructure. The 4th floor-merge was resolved by applying the standing wave-24 BOARD override-ship ruling — which explicitly instructed not to re-litigate a 4th — rather than re-running a deprecated ceremony, which honors the gate; and the true strategic surface, the recurring Resend-credential block, is escalated to the founder as an M5-disposition decision (provide the key → build reminders → close M5, or defer reminders → transition M5), recorded in product-decisions and surfaced to the digest. The M5-disposition escalation is correctly surfaced upstream and is NOT a gate blocker for this wave's shippable slice. design_gap_flag=false is justified — the client change is tokenizer logic against the existing MessageList pill component, with no new surface — so the block hands off to B-0.

## Checklist walk (Phase 1)

**Frame (P-0)** — PASS. Concrete user job (a mention resolved once renders consistently everywhere); both premises code-verified with file:line evidence, not inherited from prose; root cause (grammar duplication) named, not the symptom; falsifiable (pill render + green regression suite); maps to one live milestone M5 (a5232e16, in_progress); problem-framer + ceo-reviewer + mvp-thinner verdicts all present and reconciled to the minimal form.

**Decompose (P-1)** — PASS. Single coherent slice (client-render parity half + server-persist atomicity half) under the active milestone; below-floor resolved via PRECEDENT-APPLICATION of the standing w24 BOARD ruling (defensible vs a fresh 4th ceremony the BOARD explicitly deprecated); M5-disposition escalated to founder and recorded; no in-bundle task depends on unbuilt out-of-bundle work.

**Spec (P-2)** — PASS. 5 ACs enumerated, each independently verifiable and observable; the load-bearing claims (behavior-preserving extraction, client pill parity, no-false-pill gated by the server mentions map, txn wrap, asserted-executed real-PG rollback) are all testable; non-goals explicit (grammar rewrite, exhaustive edge cases, full framework, pill redesign, reminders); full contract embedded as fenced YAML head in the primary task's DB `description`. No auth/session/cookie/user-creation/rate-limit surface → security-scope tightened gate not triggered.

**Plan (P-3)** — PASS. Each AC → file-level step with specialist (typescript-pro shared grammar / backend-developer server import + txn + rollback spec / react-specialist client import); reuses established architecture (message_mentions, pg-harness, createReply txn pattern, packages/shared) — no parallel path; no new infra/dep/migration; behavior-preserving guardrail + hand-sync fallback stated; parallelization (B-1 first, then disjoint B-2 ∥ B-3) sound.

**Anti-over-engineering** — PASS. Right-sized durable fix (shared slug constant), not a framework (gold-plating, out of scope) and not under-scoped hand-sync (the rejected cause of the drift). No premature scale infra for a self-use wedge.

## Note on P-2 pointer count
The P-2 convenience pointer (process/waves/wave-25/stages/P-2-spec.md) heads its list "## ACs (6)" but enumerates 5 items; the DB spec contract (source of truth, per always-on rule 7) carries exactly 5 ACs. The "(6)" is a stale count label in the non-authoritative copy, not a missing AC — the DB row governs and is internally consistent. Not a gate blocker; the count label may be corrected opportunistically at L-1.

---

# Phase 2 — Gemini cross-review CONCERN triage

**Reviewer:** head-product (fresh spawn)
**Trigger:** Gemini cross-review returned CONCERN (not APPROVE) → P-4 gate rule requires MATERIAL vs NOT-MATERIAL triage before proceeding to karen+jenny.

## The CONCERN
Gemini: the plan "solves it by enshrining the server's RESTRICTIVE grammar as the single source of truth. This fixes the consistency symptom by making the client's behavior as flawed as the server's, rather than fixing the underlying issue that the grammar itself is too limited."

## Triage verdict
**NOT-MATERIAL.**

## Decisive test + evidence
The CONCERN rests on one factual premise: that the mention grammar is "too limited" — i.e. that `@bob.dev` *should* resolve as a valid dotted handle and the server's dot-excluding slug is a flaw. That premise is only true if StudyHall usernames can contain `.`. They cannot.

Authoritative write-side grammar (the ONLY gate that mints/edits a username):
- `packages/shared/src/profile.ts:14-20` — `UpdateProfileSchema.username = z.string().regex(/^[a-z0-9_]{3,20}$/, ...)`. Usernames are **lowercase alphanumeric + underscore only**. No `.`, and not even `-`. (`ProfileResponseSchema.username` at :5 is a nullable read-side passthrough, not a constraint.)

Server mention slug:
- `apps/api/src/messaging/mentions.ts:35` — `/(?:^|\s)@([a-zA-Z0-9_-]+)/g`, dot-excluding. It captures `bob` from `@bob.dev` and treats `.dev` as trailing literal.

Because no user named `bob.dev` can legally exist, `@bob.dev` genuinely means "mention `bob`, then literal `.dev`." The server slug is NOT enshrining a flaw at the dot boundary — for that boundary it is *correctly consistent* with the username grammar. P-0 problem-framer already confirmed the server resolves `bob` from `@bob.dev` (frame.md:14), which is only coherent if `bob` is the valid handle and `.dev` is trailing.

Gemini's premise ("grammar too limited") is therefore FALSE for the actual username rules. The right fix is exactly what the plan does: make the client tokenize with the same slug the server (and the username validator) already use, so `@bob.dev` renders identically both sides. Spec AC "no false pill on unresolved handles" is correct precisely because the client must NOT invent a superset key that the server's mentions map never carries. Expanding the grammar to accept dots would let the client render a pill for a user that can never exist — a regression, not a fix.

Note: the server slug is a *superset* of the username grammar (it also permits `-`, which usernames forbid). That over-permissiveness is harmless here — a captured `bob-x` that isn't a real username simply key-misses the resolved-mentions map and falls back to plain text, the identical safe behavior this wave makes the client honor. Tightening the slug to drop `-` is out of scope (no user-perceivable symptom, not in the seed) and does not affect the dot boundary the wave fixes.

## Disposition
CONCERN is NOT-MATERIAL — premise falsified against the username validation grammar (`packages/shared/src/profile.ts:17`). No return to P-2/P-3. Logged here; gate proceeds to the karen+jenny reviewer pool on the Phase-1 APPROVED verdict, which stands.

## Footer
- verdict_complete: true
- phase2_triage: NOT-MATERIAL
- rework_attempt_cap_remaining: 2

---
## Phase 2 — Karen + jenny + Gemini (appended)
**Verdict: PASS** (karen APPROVE + jenny APPROVE; Gemini CONCERN triaged NOT-MATERIAL by head-product).

| Reviewer | Verdict | Notes |
|---|---|---|
| karen (a5fa68fe65ad03e32) | APPROVE | All premises VERIFIED (server slug mentions.ts:35, client divergence MessageList.tsx:559-565, editMessage unwrapped :668-721 vs createReply :1031, packages/shared exists, mentions.spec.ts guard). Username grammar = /^[a-z0-9_]{3,20}$/ (profile.ts:14, no dots) → make-client-match-server CORRECT. |
| jenny (a52cf40a8ae9085f9) | APPROVE | All 5 ACs MATCH, 0 drift. Username assumption CORRECT (dots disallowed both layers). Matches P-0 minimal expansion + P-1 precedent + M5 escalation. Reminders OUT, M5 not over-claimed. |
| Gemini | CONCERN → NOT-MATERIAL | head-product (ae9607bbeb30b17db): usernames exclude dots (profile.ts:14 + ProfilePage.tsx:37) → @bob.dev = mention `bob` + trailing `.dev`; server slug correctly restrictive; expanding grammar would pill a user who can't exist (regression). Gate proceeds. |

### Binding B-1 carry (both reviewers, non-blocking)
Name the shared export `MENTION_TOKEN_SLUG_RE` (the mention TOKEN slug `[a-zA-Z0-9_-]+`, which is BROADER than the username grammar `[a-z0-9_]{3,20}`), NOT "username grammar" — conflating them risks a future dev tightening the mention slug to `[a-z0-9_]` and breaking hyphen/uppercase mention tokens. Behavior-preserving (mentions.spec.ts green).

### Gate result: Phase 1 APPROVED + Phase 2 PASS → P-block gate-passed. design_gap_flag=false → B.
