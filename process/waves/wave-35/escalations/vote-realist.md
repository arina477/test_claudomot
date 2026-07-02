# BOARD vote — realist — descope-who-can-dm-w35

## Vote
APPROVE Path A

## Rationale (≤150 words)
Both load-bearing claims verified in code, not taken on faith:
1. **DM feature genuinely absent.** Messaging is channel-scoped only — `messages.controller.ts:66` `@Controller('channels/:channelId/messages')`, plus `me` mentions and threaded `messages/:parentId/replies`. Grep for `directMessage|conversationId|dmChannel|direct_message` across `apps/api/src/` returns zero. `feature-list.md:43` #21 DMs = H2-deferred. So who-can-DM gates a non-existent target → unenforceable today.
2. **Profile-visibility has real targets:** `servers.controller.ts:76` `GET /servers/:id/members` (visibility-filtered, service.ts:144/182) and `profile.controller.ts:24`.

Path B's load-bearing assumption — "cohort demands DMs now" (feature-list.md:43 "if cohort demands") — is untested: StudyHall is pre-launch, self-use-mvp, zero usage data. Building DMs on assumed demand is Webvan/Juicero (build-it-and-they-will-come). Path A is the two-way door: persist the preference honestly, enforce when DMs ship, amend the metric to match reality.

## Hard-stop?
none
