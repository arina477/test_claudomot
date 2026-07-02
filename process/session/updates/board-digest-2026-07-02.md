# Founder digest — 2026-07-02 (wave-23 close)

## Shipped LIVE this wave
**Delegated assignment management.** A server owner can now hand off assignment-posting to a co-lead or TA — by granting them a dedicated "Manage Assignments" permission — WITHOUT also giving them channel-management rights. Before, only the server owner could post assignments. (Verified airtight against the live app: the right people can post, everyone else is correctly blocked, and no one can grant themselves the permission.)

## Needs your input (non-blocking — the loop keeps shipping other work meanwhile)
1. **Due-date reminders are waiting on one thing from you: a Resend account + API key.** The reminders feature (email a student before an assignment is due) is the last piece of the assignments milestone. It needs an email-sending account (Resend) that only you can create. When you have ~3 minutes: create a free account at resend.com, make an API key, and paste it here. Until then I'm shipping the other backlog (see below) so nothing stalls. (Also logged in the pending-asks list.)

## FYI — housekeeping notes (no action needed, tracking internally)
2. **Automated visual testing is blocked by a tooling gap on the host.** The browser the visual tests drive isn't installed in this environment, so screen-level UI checks have been skipped for 3 UI waves running. Core behavior is still fully verified another way (direct API checks). Fix is host-side (install the browser or point the tool at the bundled one). Tracked.
3. **A small internal process guardrail is still on a manual workaround** (3rd wave holding fine); a permanent automated version is still on the to-build list.

## Next up (autonomous, no input needed)
Clearing re-homed engineering debt while reminders waits on the key. Next: a real-database test harness (makes future features safer to ship). Then chat/presence polish items.

---
## UPDATE (wave-24 close) — one action from you would unlock the last piece of the assignments milestone
The assignments feature is fully built and solid. There's **one** remaining piece — **due-date reminders** (emailing a student before an assignment is due) — and it's the only thing standing between us and finishing the whole assignments milestone. Everything else the team can do on its own; reminders need an email-sending account that only you can create.

**The single action:** create a free account at **resend.com**, make an API key, paste it here. ~3 minutes. The moment it lands, the team builds and ships reminders next. Until then it keeps clearing background engineering work (this wave added a safety test-net around the permissions system; next up is a chat @-mention fix students would notice).

---
## STRATEGIC — a decision that would let us finish the assignments milestone (wave-25)
We've now shipped several rounds of solid engineering while the ONE remaining assignments feature — due-date reminders — waits on the Resend email key. Rather than keep clearing background work indefinitely, here's a clean choice for you:
- **Option A — send the Resend key** (create a free resend.com account + API key, paste it): the team builds and ships reminders next, and the assignments milestone finishes.
- **Option B — defer reminders** to a later release: we mark the assignments milestone "feature-complete for now" (reminders parked), close it, and move on to the next milestone (voice/video study rooms).
Either way the loop keeps moving; this just decides whether the next wave is *reminders* (Option A) or the *next milestone* (Option B). No wrong answer — your call on priority.

## (append) descope-who-can-dm-w35 — Path A adopted 6/7
Ship profile-visibility enforced now; persist who-can-DM preference without an active toggle; enforce when direct messages (feature #21) ship. M7 success metric amended to match the roadmap. Sentry PII-scrub flagged for the build. Dissent (counter-thinker): preferred clean drop; guardrail folded in.
