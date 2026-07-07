```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): the symptom is the Report affordance rendering on the
  viewer's own member row; the proposed fix threads profile.userId into MemberListPanel and
  adds an isSelf guard in MemberItem. That IS the cause layer — MemberItem receives no viewer
  identity, so it cannot suppress self-actions; the fix supplies the identity and gates the
  affordance. It is not a symptom-layer patch (no CSS-hide, no click-intercept). All three
  seed claims verified against apps/web/src/shell/MemberListPanel.tsx: (a) MemberListPanel's
  props are {serverId, canModerateMembers} — no viewer userId threaded; (b) MemberItem renders
  the Report button (data-testid report-member-btn-<userId>) unconditionally with no isSelf
  guard; (c) it therefore shows on every row including the viewer's own. No antipattern fires:
  the fix is right-layer, cause-targeted, not a premature abstraction, not a config knob, not
  validation theater (seed correctly notes reporter_id is session-derived server-side, so this
  is UX correctness not a security hole), not a compat shim. The critical framing check — is
  the missing guard SYSTEMATIC (identity wiring absent across many panels) or a ONE-OFF? — the
  seed frames it as one panel, and code confirms that framing: MessageList (onReport gated by
  !isOwn), FocusRoomPanel (selfUserId + isSelf), and DmConversationList (currentUserId filter)
  ALL already implement the identity-guard convention correctly. MemberItem is a lone regression
  against an established, consistently-applied pattern — NOT an architectural gap. So the fix
  must stay narrow (make the one non-conforming panel match the existing convention via the
  ready useProfile() hook); expanding into cross-panel identity plumbing would be gold-plating.
proposed_reframe: |
  (not applicable — PROCEED)
escalation_reason: |
  (not applicable — PROCEED)
merge_note: |
  RESCOPE-UP signal for P-1 (not RESCOPE-AUTO-SPLIT — that is for over-large waves). The seed is
  a ~15-25 LOC thin loose end and is auto-merge-eligible per the P-1 RESCOPE-AUTO-MERGE protocol.
  The coherent M14 slice to merge it into is the unshipped Block feature (blocking another user so
  their DMs/content are hidden, cross-server, directory-safe), which is the substantive remaining
  M14 (Trust & Safety) scope after wave-69 shipped the reporting primitive. Confirmed context: the
  Block feature does NOT yet exist in the frontend (no BlockButton / block API / blocked-users
  list); SettingsPrivacyPage's "Who can message you?" is an explicitly-disabled BETA affordance,
  not a working control — so Block is greenfield, not a wire-up. Merging seed + Block gives P-1 a
  milestone-critical bundle that also lets the shared "act on another user, never on yourself"
  identity-guard convention be applied consistently. Framing of the seed itself is sound either
  way; whether it ships solo or bundled is P-1's sizing call, not a framing defect.
sibling_visible: false
```

## Evidence trail

Investigation (read-only) confirmed every seed premise and resolved the one-off-vs-systematic question:

- `apps/web/src/shell/MemberListPanel.tsx` — MemberListPanel props are `{ serverId, canModerateMembers }`; no viewer userId threaded to the `MemberItem` map. MemberItem renders the Report button (`data-testid=report-member-btn-<userId>`) with no `isSelf` guard. **Both seed claims true.**
- `apps/web/src/shell/MessageList.tsx` — `onReport={!isOwn ? ... : null}` — self-action already correctly suppressed.
- `apps/web/src/shell/FocusRoomPanel.tsx` — passes `selfUserId`, computes `const isSelf = viewer.userId === selfUserId` — convention present.
- `apps/web/src/shell/DmConversationList.tsx` — filters self via `currentUserId` — convention present.
- `apps/web/src/shell/ProfileContext.tsx` — `useProfile()` → `profile?.userId` is the ready viewer-identity source MemberListPanel can consume (used across DmHome, MessageList, DmConversationList already).
- Block feature: absent in frontend today; `SettingsPrivacyPage.tsx` "Who can message you?" is a deliberately-inactive BETA panel, not enforcement.

**Disposition:** PROCEED. Seed is correctly framed (right problem, cause-layer fix, no antipattern). The missing `isSelf` guard is a genuine one-off regression against an already-established convention — fix stays narrow. The thinness of the seed is a merge-UP signal handed to P-1 (RESCOPE-AUTO-MERGE with the Block feature), not a framing defect and not a split.
