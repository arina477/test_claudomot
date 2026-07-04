verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): The proposed fix targets the TRUE cause, not a
  symptom. Verified in code: DmHome.tsx:23 binds serverId to useServers().selectedId
  (always null on DM home), passes it to StartDmPicker.tsx:105; the picker's ONLY
  candidate source is getServerMembers(serverId), hard-gated on non-null serverId
  (StartDmPicker.tsx:109) → the "Join a server to find people to message" empty-state
  (line 281-286) is structurally unreachable-past. Confirmed NO /dm/candidates endpoint
  exists in apps/api/src. The deeper cause the framing already names is correct: DmHome
  was built with a SERVER-SCOPED candidate source for a CROSS-SERVER/serverless surface.
  Fix (candidate SOURCE + endpoint + picker rebuild) attacks that entity/data-flow root,
  not the serverId=null symptom. This satisfies PRODUCT-PRINCIPLES rules 1+2 (named
  entity is the real output boundary; absence claim verified).

  Sibling F7 (379978a4): also cause-layer. DmHome.tsx:25 keys currentUserId to
  profile?.username while participant/member ids are opaque users.id text — a genuine
  id-space mismatch causing self-exclusion + "Unknown user". Keying self on true users.id
  is the correct-layer fix, not a display patch.

  Antipattern sweep: (1) green-by-guessing — NOT present in the FRAMING because the
  framing correctly REFUSES to guess the candidate source and routes it as a product
  decision. It becomes green-by-guessing ONLY if P-1/P-2 lets the build pick a source
  without a resolved decision. Flag forward: the candidate-source decision MUST be
  resolved BEFORE the picker is rebuilt (spec-time, not build-time). (2) scope-creep —
  none; the 2-task bundle is tightly coupled to one entry-point defect, not "while we're
  in there" bundling. (3) wrong-layer — none; backend endpoint + data-flow fix are at
  the correct layers.

  CANDIDATE-SOURCE ROUTING (explicit read): BOARD-resolvable under automatic mode with
  default = server-co-members (union of members across servers the caller shares),
  who_can_dm-filtered. This is NOT founder-reserved. Rationale: the substrate already
  encodes the safe answer — who_can_dm enum ships a 'server-members' value, enforced at
  conversation-create; server-membership is queryable; the academic/coursework wedge and
  "displace Discord for coursework" bet make co-members the natural social graph. Option
  (b) global directory = stranger-DM surface for a student app = the genuinely
  founder-reserved / novel-safety call, and it is the one to REJECT by default, not adopt.
  Because a safe, precedented, bet-aligned default exists AND the risky alternative is the
  one being declined, this clears the automatic-mode BOARD bar (no novel social-model call
  with no precedent). Recommend BOARD ratifies server-co-members + who_can_dm filter as
  the P-2 contract; escalate to founder ONLY if BOARD splits or someone argues for the
  global-directory expansion.
sibling_visible: false
