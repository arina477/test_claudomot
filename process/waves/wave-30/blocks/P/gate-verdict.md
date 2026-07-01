# Wave 30 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase 1)
**Reviewed against:** process/waves/wave-30/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is the M5 milestone-defining wave (assignment due-date reminders, unblocked via founder Path A + the Resend key), and the spec+plan are build-ready. The three specs ladder to exactly one live founder bet / active milestone (M5 success-metric clause 3, "members get a reminder before it is due") — no orphan wave. Every acceptance criterion across all three blocks is independently falsifiable and observable, and — critically for this feature — the hard 20% is specified, not glossed: the LEFT JOIN done-exclusion is AC #2 of the cron task verbatim (with the correct rationale that a member with no status row defaults to `todo` and MUST be reminded — an inner join is called out as WRONG), insert-tracking-before-send is AC #3 (send only when the insert created a row → send-once across ticks/instances/crashes), and E1 (UTC window, fixed 24h constant), E2 (`due_date > now()` past-due guard), and E3 (bounded first-deploy burst + late-joiner) are all explicit edge-case ACs. The plan maps every AC to a step and its integration test genuinely proves the correctness-critical cases — no-status member reminded, done member skipped, send-once on re-tick, past-due and out-of-window excluded — rather than asserting presence of code. Scope discipline holds: the keep-OUT list (opt-out, configurable window, digest, SMS, in-app center, history UI, multi-reminder) is respected with no gold-plating, and email-only is correctly the pre-decided M5 channel (not a founder re-poll; in-app = M7). The under-floor override-ship is legitimately the mvp-critical-right-size basis (expansion is reviewer-excluded gold-plating, `floor_merge_attempt: 0`), distinct from the w23-w29 debt precedent, and needs no fresh escalation because the strategic decision is already founder-resolved. The new dep (@nestjs/schedule) is the NestJS-standard in-process cron correct for single-instance Railway, and Resend is reused via the existing EmailService.sendEmail with no new surface. Security scope introduces no auth/session/cookie/CSRF/rate-limit surface, so the tightened P-4 security gate does not force a second Phase 2 iteration; the three real concerns — no double-send, no cross-server leak, no PII over-exposure — are each covered by the spec (UNIQUE + insert-before-send, server-scoped recipient resolution, and an email body limited to assignment title + due date + server name). Every P-block stage-exit checkbox ticks from a concrete artifact. Proceed to Phase 2 (Karen + jenny + Gemini).

## Detailed check (per gate axis)

**1. Spec quality — PASS.** ACs across all 3 blocks are enumerated and each independently verifiable. LEFT JOIN done-exclusion correctly specified (cron AC #2, inner-join-is-WRONG called out, no-status→todo rationale present). Insert-tracking-before-send correctly specified (cron AC #3, "only when the insert created a row"). E1/E2/E3 are explicit edge-case ACs on the cron task; plus null-email skip and cron-overlap single-flight. The correctness-critical hard 20% is present, not omitted.

**2. Plan soundness — PASS.** P-3 Action 8 self-consistency sweep maps every AC to a step. Specialist routing correct (postgres-pro schema, node-specialist module/cron/email — both in AGENTS.md). Integration test (step 8) proves the five correctness cases (a) no-status member reminded, (b) done member skipped, (c) send-once on second tick = 0 new rows, (d) past-due excluded, (e) out-of-window excluded — behavioral, not presence-of-code.

**3. Scope discipline — PASS.** keep-OUT list respected end-to-end (P-0 → P-1 → spec prose); no gold-plating in the plan. Email-only correctly NOT re-polled (M5 `## Scope` = "via Resend"; in-app = M7). Fixed 24h window, not an organizer setting.

**4. Under-floor override-ship — PASS (legitimate basis).** "mvp-critical minimal metric-satisfying set; expansion is reviewer-excluded gold-plating" with `floor_merge_attempt: 0` is distinct from the w23-w29 debt precedent. Expanding to hit an arbitrary LOC floor would ship the exact gold-plating the P-0 reviewers excluded. Strategic decision already founder-resolved (Path A) → no fresh escalation.

**5. External SDK / new dep — PASS.** @nestjs/schedule (new) = NestJS-standard `ScheduleModule.forRoot()` + `@Cron(CronExpression.EVERY_HOUR)`, in-process cron right for single-instance Railway; version-verify at B-0. Resend (reused) via existing sendEmail, no new surface; SDK docs referenced.

**6. Security-scope — PASS.** `wave_touches ∩ {auth, payments, sessions, csrf, rate-limit, user-creation} = ∅` → tightened gate does not force a 2nd Phase 2 iteration. Three concerns covered: no double-send (UNIQUE + insert-before-send), no cross-server leak (server-scoped recipient resolution + per-server isolation), no PII over-exposure (email body limited to assignment title + due date + server name — member's own data). T-8 will re-verify at test time; the spec carries them adequately at the P-block gate.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 30 — P-4 Verdict (Phase 2 — Karen + jenny + Gemini merged)
**Phase:** 2

## Per-reviewer status
| Reviewer | Verdict | Detail |
|---|---|---|
| **karen** | **APPROVE** | All 8 load-bearing claims VERIFIED: EmailService sendEmail:21/key:11/non-throw:34-37; assignments due_date:36/is_deleted:37/index:43/assignment_status.state:71; **the LEFT-JOIN linchpin confirmed at assignments.service.ts:184 (`?? 'todo'`)**; server_members UNIQUE + users.email (user_id is `text` — assignment_reminder.user_id must be text); @nestjs/schedule absent; assignment_reminder/notifications dir don't exist; Resend docs present; specialists in AGENTS.md. Send-once sound. **B-note (not blocking):** "insert affected a row" must read the INSERT RETURNING/rowCount, NOT a SELECT-then-insert (TOCTOU). Only low citation-drift on some line numbers. |
| **jenny** | **APPROVE** | 6/6 drift checks MATCH: delivers M5 `## Scope` exactly (cron+NotificationsModule+Resend, reminder-before-due); executes founder Path A (product-decisions 349-361, not a re-poll); email-only settled (in-app=M7); fixed-24h contradicts nothing; journey F6/F9 already anchor the reminders node (**T-9 must flip it LIVE + inventory the email touchpoint**); metric-closes M5 but **N-block must dispose M5's 6 open non-seed tasks before flipping in_progress→done** (Invariant #3). |
| **Gemini** | **UNAVAILABLE** | helper exit=3, HTTP 429; degradable per Action 3 — does NOT block; gate proceeds on Karen + jenny. |

## Merged Phase 2 verdict: PASS
head-product APPROVED + karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE → **P-block gate PASSED**.

## Carries to downstream
- **B:** LEFT-JOIN done-exclusion (not inner); insert-tracking-before-send reading INSERT rowCount/RETURNING (NOT SELECT-then-insert — TOCTOU); assignment_reminder.user_id = `text` (match users.id); E1/E2/E3; fixed 24h; keep-OUT (no gold-plating — code-quality-pragmatist at B-6 to hold the line).
- **T-9:** flip journey F6/F9 reminders node LIVE + add the email touchpoint to the F6 inventory.
- **N-block:** dispose M5's 6 open non-seed tasks (5 assignments debt + fdb444fc) before flipping M5→done.

## Footer
- verdict_complete: true · phase2_complete: true · gate: PASSED · design_gap_flag: false → B-0 (skip D)
