```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  Scope is exactly right — neither expand nor reduce. Not SCOPE-EXPANSION: the two
  fixes complete M4's already-shipped spine; pulling more (presence-debt, attachments
  polish, fancy reconnect UX) would dilute a tight UX-completion wave without serving
  the wedge's unmet metric. Not SELECTIVE-EXPANSION: no single cheap-but-disproportionate
  add exists — pending/failed UI is already shipped (wave-20), and broadening
  connection-state to every surface is gold-plating, not leverage. Not SCOPE-REDUCTION /
  DROP: both items trace directly to M4's "no data loss" success metric — a dead indicator
  makes the wedge invisible and a one-page catch-up silently loses messages; neither is a
  real-bug-that-doesn't-matter. A focused two-fix-plus-tests wave that completes the
  visible/trustworthy offline UX on top of shipped components is correctly sized.
bet_traced_to: Academic tools + offline-first win students from Discord (status='live')
milestone_traced_to: eb2a1688-c6b5-416c-84b4-3ede41d07b4c — M4 — Offline-first reliability (the wedge)
proposed_scope_change: |
  None. HOLD-SCOPE.
sibling_visible: false
```

## Judge (brief)

**Right thing now? YES.** M4 is THE founder wedge (the sole live bet's offline-first
leg). Wave-20 shipped the spine (exactly-once + in-order outbox, LIVE) but left two gaps
that directly undercut the milestone's own success metric ("keeps reading cached
channels... on reconnect every queued message sends exactly once in order with **no data
loss**"):
- **Dead connection-state indicator** — component is built + wired but `AppHome.tsx:39`
  hardcodes `connectionState="online"`. The wedge's visible payoff (the felt offline-first
  experience) is invisible to users. Completing the spine without this means the
  differentiator never shows.
- **One-page catch-up** — client ignores `nextCursor`, so any offline window >50 messages
  silently loses data on reconnect. This is a direct violation of the "no data loss"
  metric, not cosmetic. Trust-load-bearing.

No reason to jump to M5 — M4's success metric is not yet fully met until these land. This is
roadmap-following, not drift.

**Ambition calibration: CORRECTLY SIZED (smaller-than-spine is right).** A UX-completion
wave that reuses shipped components (ConnectionStateIndicator, Dexie store, outbox,
`?after=` cursor, `getMessagesAfter`) and adds no new visual surface SHOULD be smaller than
the spine wave. Not everything must be a big slice — this completes the felt experience and
closes a data-completeness hole. Verified against the decomposition record: the bundle was
already premise-corrected (two of three originally-framed items were found already shipped
in wave-20 and dropped), so the wave is now exactly the genuine residual gaps. No
under-ambition (the two fixes are the right two), no over-reach (no connection-state-
everywhere, no reconnect animations, no offline indicators on every surface).

**"Real but doesn't matter" risk: NONE.** Both gaps directly attack the wedge — an
invisible differentiator and silent data loss are precisely the failures that would falsify
the offline-first bet in front of a real student on bad internet.

**One light note for downstream (not a blocker):** P-block should confirm no D-block is
warranted — the indicator's visual spec (design-system §8) and component are already
adopted, so this is a data-source + non-visual loop, not a new design surface. The
decomposition note already flags this as "likely NOT" a D-block. Concur.
