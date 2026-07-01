# P-0 — ceo-reviewer verdict (wave-25)

```yaml
verdict: SCOPE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SCOPE-EXPANSION
mode_rationale: |
  Not HOLD-SCOPE because the seed as written (client tokenizer hand-synced to the
  server grammar + a txn wrap) fixes the symptom but leaves the root cause — two
  independent copies of the mention grammar — free to re-drift on the next edit to
  either side. Not SCOPE-REDUCTION / DROP because the bug is genuinely user-visible
  (a mention renders as a pill server-side and plain text client-side for
  interior-punctuation handles like @bob.dev; students in group study chat notice
  the inconsistency) and chat correctness is table-stakes for the displace-Discord
  bet — this is not a real-bug-that-doesn't-matter. Not SELECTIVE-EXPANSION because
  the highest-leverage addition is not a cheap bolt-on feature but a structural
  relocation of the existing grammar; it changes the shape of the fix, not its size
  by much. The right ambition here is the durable fix, not the patch.

bet_traced_to: "Academic tools + offline-first win students from Discord (ad1a3685, live) — INDIRECT trace: chat-quality correctness is table-stakes for the displace-Discord leg, not net-new differentiation. This remains build-quality/debt at 0 users; reminders (cred-blocked on the founder Resend key) is the real M5 progress."
milestone_traced_to: "a5232e16 — M5 — Academic tooling: assignments (in_progress). NOTE: task c18b8089 is M3-origin messaging debt re-homed M3→M4→M5 across waves 19/21; it is independent top-level backlog under M5, NOT M5 assignments-feature scope. Milestone trace is by-home, not by-theme."

proposed_scope_change: |
  EXPAND the seed from "hand-sync the client MessageList tokenizer to the server
  parseMentions grammar" to "extract the mention grammar to a single shared module
  and have BOTH client and server import it."

  Concretely:
  - Move the mention tokenizer/grammar out of apps/api/src/messaging/mentions.ts
    into packages/shared (which already exists and already houses the shared Zod
    contracts — this is the established home, no new surface).
  - apps/api parseMentions imports the shared grammar (behavior-preserving refactor;
    the existing mentions.spec.ts must stay green as the regression guard).
  - The client MessageList renderer imports the SAME shared grammar instead of its
    own re-implementation. Client render parity falls out for free — @bob.dev now
    renders identically on both sides because there is one grammar, not two.
  - Keep seed item (2) as-is: wrap editMessage's mention-diff delete-then-insert on
    message_mentions in a transaction. Small, correct, ride-along robustness fix.

  WHY the expansion is worth it (1.2x cost, disproportionate value): the seed's own
  root-cause statement is "the client tokenizer DIVERGES from the server
  parseMentions." A hand-sync closes today's divergence but re-arms it — the next
  edit to either grammar silently re-drifts, and this exact class of bug already
  survived four milestones of deferral (wave-15 V-2 → M3 → M4 → M5). A single shared
  source-of-truth makes re-drift structurally impossible. packages/shared already
  exists, so the durable fix adds a relocation + two imports, not a new package or
  build-graph change. This is the difference between shipping a 3/10 (the drift
  will recur) and a 9/10 (it cannot) for marginal extra cost.

  BOUNDS (guard against over-reach — mvp-thinner will hold the AC-level line):
  - Behavior-preserving only. Do NOT change the grammar's matching rules, expand
    what counts as a mention, or touch resolution/persistence/fan-out. The observed
    server behavior (interior-punctuation handles resolve + persist) is the contract;
    the client is brought INTO conformance with it, nothing else moves.
  - No new mention features (no rich-text, no cross-channel, no @everyone). Those
    are net-new scope with their own bet trace, not this debt fix.
  - Scope ceiling is the extraction + the two imports + the txn wrap. If B-block
    finds the client renderer's grammar is entangled with unrelated MessageList
    render concerns such that clean extraction balloons past the seed's size class,
    fall back to the hand-sync (seed as originally written) and file a follow-up —
    do not gold-plate the refactor.

escalation_reason: |
  (not an escalation)

sibling_visible: false
```

## Narrative (for head-product P-0 merge)

**Is it worth doing at all? Yes — but as debt, honestly labelled.** The bug is real and
user-visible (pill vs. plain-text inconsistency for interior-punctuation handles in group
study chat), and chat correctness is table-stakes for the displace-Discord bet. It is NOT a
real-bug-that-doesn't-matter, so DROP is wrong. But the bet trace is INDIRECT (build-quality,
not differentiation) and the strategic reality is unchanged: **M5's real progress is the
reminder arc, which is cred-blocked on the founder Resend key** (escalated 3× across
waves 22–24). This wave does not unblock M5; it spends readiness on user-visible polish while
the true unblock waits on a founder-clearable key. head-next's pivot to user-visible work
(after 3 straight infra/debt waves) is defensible — but the Resend-key escalation must stay
loud (carry it into P-4 per the wave-24 BOARD carry).

**Is the ambition right? The seed is too patchy — expand it.** The seed's own root cause is
grammar duplication. A hand-sync re-arms the exact drift that already survived four
milestones. The durable fix — one shared grammar in the already-existing `packages/shared` —
is only marginally larger and makes recurrence structurally impossible. That is the correct
ambition lift for a fix whose whole point is "these two must not diverge." **head-product
should mediate this against mvp-thinner:** M5's `## Class` reads `product-feature`, so
mvp-thinner is spawned — but note c18b8089 is re-homed M3 *debt*, not M5 feature scope, so
mvp-thinner's AC-thinning lens applies weakly. The real tension is expansion (durable shared
extraction) vs. thinness (don't refactor more than the bug requires); the BOUNDS above
resolve it — behavior-preserving extraction only, with a hand-sync fallback if extraction
balloons.

**Was this the right priority vs. the de-ranked alternatives?** Runner-up was invite-rotation
(d058283d, security). I do not REJECT in its favor: at 0 prod servers the irrevocable-permanent-
link exposure is real-but-zero-current-blast-radius (per product-decisions 2026-06-29), and its
own trigger is "first real external users / pre-launch link distribution" — not yet fired.
Presence-perf is a 0-user non-issue. Mention-parity is the correct pick among the three because
it is the only one with a present-tense user-perceivable symptom. **But push harder on the
Resend key in parallel** — it is the single highest-value unblock on the board and no amount of
debt-clearing substitutes for it.
```
```
