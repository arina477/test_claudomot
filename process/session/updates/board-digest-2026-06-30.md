
## Recurring process issue — automated CI agent keeps editing the engineering-rules file out of turn (3rd time)
**What:** The CI/deploy agent (head-ci-cd) again added rules to the shared engineering-principles file during the deploy step (waves 9, 12, and now 17). Principle changes are supposed to happen only in the dedicated end-of-wave "learn" step, where they're vetted. Each time it's been reverted with no harm to the shipped work, but the behavior keeps recurring and an observation-only nudge hasn't stopped it.
**Impact:** Low (caught + reverted each time; no bad rule shipped). But it's wasted cycles + a discipline gap.
**Recommendation:** Add a mechanical guard — a check at the deploy-step exit that rejects any edit to the principles files outside the learn step (a one-line git-diff gate), so it's prevented by construction rather than by repeated cleanup. This is a small framework/agent-card tightening. Surfaced for awareness; the loop continues meanwhile.

## Clean decisions (5+/7 consensus or cleaner)

### N-1-ordering-wave-17 — 7/7 APPROVE B (unanimous) — APPLIED
**What we decided:** The next build cycle will work on the chat features students can actually see and use — starting with **threaded replies**, then file/image sharing — instead of another round of behind-the-scenes cleanup.

**Why:** Real-time messaging is nearly finished; threaded replies and file sharing are the last two pieces needed to call it done and to match what students expect from Discord. The remaining cleanup items (an invite-link refresh control, some performance and code tidying, a testing-tier add) are real but not urgent right now — there are no live users to feel them yet — so they stay parked and get picked back up at the right moment (e.g. just before opening StudyHall to real students). All seven advisors agreed without reservation.

**Heads-up for later:** the invite-link refresh control should be revisited right before any real-student launch, and a small mention-handling correctness item should be cleaned up within a wave or two.
