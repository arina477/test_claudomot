# Founder checkpoint — non-blocking (2026-07-03)

_Surfaced at wave-41 close (N-1). Does NOT block current work — the loop is continuing on the next educator-tools slice. Read at your next check-in._

## 1. Set a success measure for the Educator Tools milestone
The educator-tools milestone (its first pieces are now live: an educator role + light moderation, and next up is assignment collect/return) still has no concrete "what does success look like" measure — it currently reads _to be decided by you_.

- **Why it matters now:** it's a bit overdue — we've already shipped work under this milestone, so a target would help. It does **not** block the assignment work now in progress (that's core, clearly in scope).
- **Where it will matter more:** the *optional* later pieces of this milestone (study-group spaces, direct messages, in-app search) compete for priority, and without a success measure we can't confidently rank them. A one-liner like "X% of class servers post at least one assignment per week" (or whatever outcome you care about) is enough.

**Nothing to do today — just a heads-up so it's on your radar before we get to the optional educator features.**

## 2. Two small moderation follow-ups parked for later
From the moderation work this wave, two minor polish items are tracked but intentionally parked (so they don't jump ahead of the assignment work):
- muted-member indicator spacing polish (`8828484f`)
- an end-to-end test for the delete-any-message moderator action (`ca43eb12`)

They'll be picked up when we next schedule moderation polish. No action needed.
