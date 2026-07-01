# P-0 — ceo-reviewer verdict (wave-32, M6 voice occupancy)

```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The seed's scope traces cleanly to both a live bet and the active milestone, and is
  already at the correct minimal size — a simple count + identities read, poll-refreshed,
  with presence rings / speaking indicators / live-push explicitly deferred. Not
  SCOPE-EXPANSION: a 10-star occupancy indicator (real-time push, presence rings) is
  gold-plating at 0 users and the bet's leverage is the "is anyone in there" signal, which
  a poll delivers. Not SELECTIVE-EXPANSION: no cheap-but-disproportionate single addition
  clears the bar — live-push is the only candidate and it is neither cheap nor
  disproportionate for a bootstrapping product (analysed below). Not SCOPE-REDUCTION /
  DROP: occupancy is the load-bearing half of the drop-in loop (see-who's-inside → join),
  named verbatim in M6 ## Scope, and is genuinely worth doing — an empty voice channel is a
  cold-start; the occupancy signal is what makes a drop-in room inviting. The bar here is
  execution quality, not scope change — hence HOLD-SCOPE.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live') — voice study rooms are the named Discord-displacer; the 'study room door left open' drop-in model is the differentiator, and occupancy is the door-is-open signal."
milestone_traced_to: "8702a335-90ec-40ff-8c7d-a91bb7790a27 — M6 Voice/video study rooms (in_progress). M6 ## Scope names 'who's-in-room occupancy' explicitly as an in-scope drop-in signal."
proposed_scope_change: |
  None. Poll-refreshed count + identities is the correct MVP; live-push correctly deferred.
strategic_flag_for_head_product: |
  RAISE AT P-4 (not a blocking verdict, but a mandatory founder heads-up carry):
  M6's VALUE is credential-gated on the LiveKit keys, and this wave would stack the SECOND
  M6 feature that cannot be live-verified. This is the exact M5/Resend failure mode the
  studio just spent 6 waves inside. See § "Sequencing flag" below.
```

## 1. Strategic value — is occupancy the right next M6 slice? YES.

Occupancy is the correct buildable-now slice, and it is high-leverage precisely because the
product is bootstrapping voice adoption from zero. The drop-in "door left open" model —
called out by name in both the live bet and M6 ## Scope — has one fatal cold-start problem:
an empty voice channel gives a would-be joiner no reason to enter. The occupancy indicator
("3 studying") is the single signal that converts a cold channel into an inviting one. It is
the load-bearing half of the minimal drop-in loop: **see-who's-inside → join**. Wave-31
shipped the join half (token-mint + join surface); this wave ships the see-who's-inside half.
Without it, the wave-31 join surface is a door with no window — you can open it, but you
can't see whether anyone's home.

**Weighed against the alternatives (screen-share, audio-fallback):** those are *in-call*
(post-join) features. They improve the experience of a room you have already entered. But at
0 users the binding constraint is not in-call quality — it is getting anyone into a room at
all. Occupancy is a *pre-join* signal that attacks the cold-start directly; screen-share and
audio-fallback assume the room is already populated. For a product trying to earn its first
voice session, the pre-join "who's inside" signal is strictly higher-leverage than any
in-call polish. Occupancy is also small and reuses the wave-31 membership gate + server-side
creds, so it is cheap. Right slice, right time.

## 2. Ambition / scope — is poll-refreshed count + identities the right MVP? YES.

The seed defers live-push (real-time occupancy updates) and ships a bounded-poll /
on-join-leave refresh instead. That is the correct call, for two reasons:

- **The "stale poll undermines the signal" worry does not bite at this scope.** The value of
  occupancy at cold-start is coarse and binary: *is anyone in there at all, roughly how many?*
  A student deciding whether to drop in does not need sub-second freshness — a few-seconds-old
  "3 studying" answers the question the signal exists to answer. Live-push buys precision
  (watching people trickle in/out in real time) that only matters once rooms are busy enough
  for churn to be visible — which is a later-milestone problem, not a 0-user problem.
- **Live-push is neither cheap nor disproportionate here.** It means wiring room events
  (LiveKit webhooks or a Socket.IO occupancy channel on the existing /presence namespace) —
  a materially larger surface than a poll, and one that duplicates infrastructure the studio
  would build properly once occupancy has proven it earns its place. Building it now is
  shipping a 9/10 mechanism for a 3/10 need.

So the poll-vs-live-push decision is: **poll is correct for this slice; live-push is
correctly deferred to a later M6 wave** (naturally paired with presence rings / speaking
indicators, which are the other real-time voice-presence features already deferred as
gold-plating). No expansion warranted.

## 3. Sequencing flag — the LiveKit-creds gate (the one thing head-product MUST carry)

This is where I register a strategic concern, though it does not change the PROCEED verdict.

**The facts:**
- LiveKit creds (`LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`) are STILL absent —
  verified unset in shell env; wave-31 L-1 confirmed absent in Railway. Occupancy reads live
  room state via `RoomServiceClient.listParticipants`, so like the token-mint it is buildable
  and unit-verifiable credential-independent, but its LIVE value cannot be demonstrated
  without the keys.
- Wave-31 already shipped one credential-independent-but-live-gated M6 feature (token-mint,
  503-until-provided). This wave would be the **second**.
- The founder digest (2026-07-01, Option B) told the founder voice/video could be built
  "end-to-end **without any account or key from you**." The wave-31 L-1 correction proved
  that inaccurate: the *code* runs credential-free, but the *value* (live voice, live
  occupancy) is gated on founder-supplied LiveKit keys. That is a promise the studio should
  not let drift silently.

**Why this matters — the M5/Resend precedent is directly analogous and recent.** The studio
just spent waves 24–29 draining cred-blocked M5 debt (6 consecutive under-floor waves) while
M5's bet-load-bearing headline sat blocked on ONE founder-clearable Resend key. That was
escalated (correctly, and eventually sharply) as "the failure mode for a 0-user pre-launch
product." M6 is now on the same trajectory: a growing stack of voice features that cannot
demonstrate live voice, accumulating behind a single founder-clearable credential.

**My call:** PROCEED on this slice — one more credential-independent M6 increment is
legitimate (it completes the drop-in loop and is genuinely the right code), and blocking it
would be premature. But head-product MUST carry a **founder heads-up** into P-4 (this is a
disclosure, not a park-or-key fork yet — we are 2 waves in, not 6):

> "Voice study rooms are progressing — after this wave you'll have both the join surface and
> a live occupancy indicator ('who's studying right now'). One thing to flag: to actually
> hear voice and see real occupancy, I need the three LiveKit keys set up. Everything I've
> built runs without them, but the voice itself stays dark until they're in place. Earlier I
> said voice needed nothing from you — that turned out to be slightly off: the code needs no
> key to *run*, but live voice needs these keys to *work*. Want to drop them in now so the
> next voice wave can be verified live?"

**The tripwire to escalate harder:** if a THIRD consecutive M6 wave would ship
credential-independent-but-live-unverifiable code with the LiveKit keys still absent, that is
the point to convert this heads-up into a sharp park-or-key fork (mirroring the M5 resolution)
— do NOT let M6 sleepwalk into a 6-wave cred-blocked drain. Flag this tripwire to N-1 as a
carry.

## Disposition

**PROCEED** — mode HOLD-SCOPE. Occupancy is the right buildable-now next M6 slice; the
poll-refreshed count + identities MVP is correctly sized; live-push correctly deferred.
Mandatory carry to head-product / P-4: the LiveKit-creds founder heads-up + the third-wave
escalation tripwire.

*sibling_visible: false*
