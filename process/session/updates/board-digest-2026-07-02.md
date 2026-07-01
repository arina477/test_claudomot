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
