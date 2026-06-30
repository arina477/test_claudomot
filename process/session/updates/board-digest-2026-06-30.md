
## Recurring process issue — automated CI agent keeps editing the engineering-rules file out of turn (3rd time)
**What:** The CI/deploy agent (head-ci-cd) again added rules to the shared engineering-principles file during the deploy step (waves 9, 12, and now 17). Principle changes are supposed to happen only in the dedicated end-of-wave "learn" step, where they're vetted. Each time it's been reverted with no harm to the shipped work, but the behavior keeps recurring and an observation-only nudge hasn't stopped it.
**Impact:** Low (caught + reverted each time; no bad rule shipped). But it's wasted cycles + a discipline gap.
**Recommendation:** Add a mechanical guard — a check at the deploy-step exit that rejects any edit to the principles files outside the learn step (a one-line git-diff gate), so it's prevented by construction rather than by repeated cleanup. This is a small framework/agent-card tightening. Surfaced for awareness; the loop continues meanwhile.

## Clean decisions (5+/7 consensus or cleaner)

### N-1-ordering-wave-17 — 7/7 APPROVE B (unanimous) — APPLIED
**What we decided:** The next build cycle will work on the chat features students can actually see and use — starting with **threaded replies**, then file/image sharing — instead of another round of behind-the-scenes cleanup.

**Why:** Real-time messaging is nearly finished; threaded replies and file sharing are the last two pieces needed to call it done and to match what students expect from Discord. The remaining cleanup items (an invite-link refresh control, some performance and code tidying, a testing-tier add) are real but not urgent right now — there are no live users to feel them yet — so they stay parked and get picked back up at the right moment (e.g. just before opening StudyHall to real students). All seven advisors agreed without reservation.

**Heads-up for later:** the invite-link refresh control should be revisited right before any real-student launch, and a small mention-handling correctness item should be cleaned up within a wave or two.

## Recurring process issue (UPDATE — now 4th instance): CI agent edited the rules file out of turn again
Wave-18: the CI/deploy agent again added a rule to the engineering-principles file during the deploy step (now waves 9, 12, 17, 18). Reverted again — no bad rule shipped, the work is unaffected. The migration-before-cutover lesson it tried to add IS legitimate + recurring (waves 13/15/18) and will be evaluated properly at the end-of-wave learn step. The recommendation stands: a one-line mechanical guard at the deploy-step exit that rejects principles-file edits outside the learn step would end this loop. Surfaced for awareness; loop continues.

## Recurring process issue (5th instance, now wider): a gate agent edited the engineering-rules file out of turn again
Wave-19: the verify-step agent staged rule candidates into the VERIFY-principles file (previously it was the deploy agent + the CI-principles file, waves 9/12/17). Reverted again — no bad rule shipped. The pattern now spans two different steps + two different rule files, so a one-file guard isn't enough. Recommendation (unchanged + reinforced): a mechanical check at EVERY gated step's exit that rejects edits to the principles files outside the end-of-wave learn step. Small framework/agent-card tightening; surfaced for awareness, loop continues.
