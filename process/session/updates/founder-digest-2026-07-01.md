
## [wave-27 P-0] M5 needs a decision from you — the reminders feature is still waiting on one key

For the last 6 waves I've been shipping small, useful improvements to StudyHall (the newest: online-status dots on message authors, live on the site now). But the **headline of the current milestone — automatic assignment due-date reminders** — has been blocked the whole time on one thing I can't do myself: a **Resend email API key** (a free account at resend.com → API key → paste it to me). That's the one feature that most makes StudyHall "academic tooling Discord doesn't have," and it can't ship without email sending.

I've kept making progress on everything else in the meantime, but I'm now at the point where continuing to polish small things while the main feature waits isn't the best use of the build loop. **A quick decision from you unblocks it:**

- **Option A — send the Resend key:** I build the reminders feature and finish this milestone. (~3 min for you: resend.com → sign up → API Keys → create → paste it here.)
- **Option B — park it for now:** I set the assignments/reminders milestone aside and switch to a milestone I can fully build without you — drop-in voice/video study rooms, privacy & notification controls, or the offline-first capability. All of these move the product forward on their own.

Either is fine — I just need to know which way to go so I'm not spending waves on the sidelines. This wave (a small performance improvement to who's-online tracking) proceeds either way.

---

## Update (still awaiting your call) — a concrete option for the "what next" decision

Since I first flagged this, we've now shipped **eight** small polish/cleanup improvements in a row while the one feature that would really set StudyHall apart from Discord — **assignment due-date reminders** — stays parked, waiting on a Resend email key from you (a 2-minute signup, free tier).

I want to make the decision easier by naming the strongest alternative concretely, so you're choosing between two clear paths, not an open question:

- **Path A — unblock the reminders feature.** Create a free Resend account, paste me the key, and I'll build assignment reminders (students get pinged before a deadline) and finish the academic-tooling milestone. This is the "academic tools Discord doesn't have" promise.

- **Path B — pivot to drop-in voice/video study rooms.** This is the other big Discord-displacer, and I can build it end-to-end **without any account or key from you** (the video service we picked is server-side only). It's a meatier, more visible feature than the small cleanups I've been doing, and it's one of the directions you can pick outright.

Either way is good. What I want to avoid is a ninth week of minor cleanups while the bigger wins sit on the shelf. Just tell me **"A" (I'll send the key)** or **"B" (build voice/video)** — or point me somewhere else entirely.

*(Today I'm shipping one more small correctness cleanup — a display-name edge case and a dead code-path removal — because it's safe, useful, and doesn't need anything from you. But the two paths above are the real next move.)*

---

## Correction + a small ask on voice rooms (2026-07-01, later)

When you were choosing between "reminders" and "voice rooms" earlier, I told you voice/video would need **no account or key from you**. That was wrong, and I want to correct it before it costs you a surprise.

I've now built the first two pieces of voice study rooms — the part that lets a member into a room, and the "who's in the room" indicator — and they're deployed. But the **actual live voice call** runs on **LiveKit** (the video service we picked), which — like Resend for email — needs a free account + a couple of keys from you. Without them, the room screens work but no audio actually connects yet.

So a small ask, whenever you have ~3 minutes:
1. Create a free account at **livekit.io** (LiveKit Cloud — free tier).
2. Create a project → copy its **API Key**, **API Secret**, and **WebSocket URL**.
3. Paste all three to me — I'll wire them into the hosting environment (same as the Resend key).

The moment those land, everything I've built for voice comes alive and I can verify a real call end-to-end. I'll keep building the voice pieces that don't need the keys in the meantime — but I don't want to build a third or fourth voice feature that can't actually make a sound, so if I get there before the keys arrive, I'll pause and check in rather than keep stacking.
