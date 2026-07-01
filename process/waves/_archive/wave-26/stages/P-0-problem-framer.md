verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1]
reasoning: |
  Symptom-vs-cause (mandatory) result: AC1 and AC3 are correctly framed as
  "consume the existing shared presence store at a new render site" — verified
  as-is, no hidden refactor. The presence socket is a true module-level singleton
  (apps/web/src/shell/presenceSocket.ts:84-141, `getPresenceSocket()` lazy `if
  (!_socket)` guard); `usePresence` is a pure consumer of that one store
  (usePresence.ts:16,40-42) and the message-row author avatar is a real attach
  site (MessageList.tsx:1013-1020, keyed on msg.authorId). So AC3 "no second
  socket" is architecturally guaranteed and the stated cause ("single presence
  subscription powering every indicator") holds.
  BUT AC2 rests on a FALSE-PRESENT premise (violates PRODUCT-PRINCIPLES rule 1):
  the seed asserts a "SHARED presence-dot primitive/token (no second styling
  source)" already exists and the References line names a "presence-dot
  primitive". It does not. There is no PresenceDot component anywhere in
  apps/web/src, and the member-panel dot is inline JSX with hard-coded hex colors
  (MemberListPanel.tsx:91-101: `#10b981` online / `#52525b` offline / `#121214`
  ring) — NOT bound to the `--color-accent-emerald` token in globals.css:18.
  Therefore satisfying AC2 literally is not "consume an existing primitive"; it
  first requires EXTRACTING a shared PresenceDot component + token binding out of
  the member panel, then consuming it at both sites. That extraction step is
  in-scope work the seed hides as a pre-existing dependency (antipattern #1,
  symptom-vs-cause at the AC2 layer). This is recoverable and small — the store
  is genuinely reusable, so NO store-unification surgery is hidden (not RESCOPE);
  the fix is to make the primitive-extraction an explicit step of this same task.
proposed_reframe: |
  Keep the goal (live presence dot on message-row author avatars from the one
  shared /presence store, no second socket). Correct AC2's false premise: the
  shared presence-dot primitive does NOT yet exist — the member-panel dot is
  inline JSX with hard-coded hexes (MemberListPanel.tsx:91-101). So this task's
  scope is:
    (a) Extract the member-panel's inline dot into a single reusable PresenceDot
        component and bind its colors to the existing token
        (--color-accent-emerald in globals.css:18) instead of hard-coded
        `#10b981`/`#52525b`; refactor MemberListPanel.MemberItem to consume it
        (no visual change to the member panel).
    (b) Render that same PresenceDot on the message-row author avatar
        (MessageList.tsx:1013-1020), driven by usePresence()/getPresenceStatus
        keyed on the author's userId.
  Retain AC3 as-is (verified true): both sites share the one getPresenceSocket()
  singleton store — no new /presence socket. Retain the graceful-degradation AC:
  authors whose presence is unknown (not current co-members, or authorId not a
  presence-store key) render with no dot / offline default, never an error.
  Note for P-2 spec: confirm the identity mapping between msg.authorId and the
  presence store's userId key — the member panel keys on member.userId; if
  authorId is a display handle rather than a userId, the "unknown author" path
  (AC degrade) is the common case, not the edge case.
escalation_reason: |
  (n/a)
sibling_visible: false
