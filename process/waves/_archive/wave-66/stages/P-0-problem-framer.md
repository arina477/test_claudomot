verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause check PASSES: the ERROR-worded "Couldn't load channels." copy is the symptom;
  the seed correctly targets the cause — a single detailStatus==='error' branch (ChannelSidebar.tsx:335-341)
  that conflates two distinct states (offline-never-synced cold cache miss vs. genuine online API failure).
  Wrong-layer check PASSES: fix is presentation-only, gated on an already-existing app-level connection
  signal (useConnectionState() → 'online'|'reconnecting'|'offline'), no logic/schema/API change. All cited
  locations verified against the code. The offline-vs-online distinction the seed names is real and
  load-bearing and the reuse signal already exists — this is a sound, well-scoped copy/UX-state polish.
proposed_reframe: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false

# Framing refinement (affirm, not reframe)
# The seed already names the critical nuance and it is correct: the empty-state copy MUST be
# offline-AWARE, not offline-UNCONDITIONAL. Neutral wording ("This server isn't available offline yet —
# reconnect to load its channels.") applies ONLY when useConnectionState() reports 'offline' (and arguably
# 'reconnecting'); a genuine online failure (state === 'online' + detailStatus === 'error') MUST still read
# as an error. Without this gate the change would wrongly reassure the user during a real online failure —
# a false-comfort inversion of the current false-alarm. Verified reusable signal: apps/web/src/shell/
# useConnectionState.ts. Verified target branch: apps/web/src/shell/ChannelSidebar.tsx:335-341. Existing test
# to update: apps/web/src/shell/shell-components.test.tsx:290.
#
# Note on antipatterns catalog: command-center/principles/PRODUCT-PRINCIPLES.md has no § Antipatterns
# section, so the universal catalog was applied. No entry matches — this is a genuine cause-layer,
# correct-layer polish, not a symptom/wrong-layer/demo-path/validation-theater smell.
