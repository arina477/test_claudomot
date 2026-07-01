# Wave 27 — B-3 Frontend (Spec B subscription lift)
**Specialist:** react-specialist. **Commit:** bd18a08. Lifted MessageList presence from per-row subscription to ONE list-level subscription (`presenceTick` + single `subscribePresence`); `AuthorPresenceDot` now a pure `React.memo` component receiving a derived `status: boolean|null` prop.
**CARRY-B preserved (per-author render-scoping):** on a presence event, presenceTick bumps → all SentRows re-derive their author's status → each memoized AuthorPresenceDot bails out unless ITS author's status changed. So user-A's dot does NOT re-render on user-B's presence event. AC1 (1 subscription for N rows) AND per-author scoping BOTH held — cleaner than a custom-comparator (which had a read-time coherence bug).
**Behavior-preserving:** online→emerald / offline→muted / unknown→no-dot / live-flip / known→unknown degrade / self-seed→online / pending-failed no-dot (CARRY-2) — all wave-26 cases green. AC4 single socket (same presenceSocket singleton).
**Tests:** presence-dots.test.tsx subscription-count 2→1; new "(CARRY-B) presence event for author-B does not change author-A dot output". web 254/254.
```yaml
skipped: false
files_implemented: [apps/web/src/shell/MessageList.tsx, apps/web/src/shell/presence-dots.test.tsx]
deviations:
  - {specialist: react-specialist, change: "memo'd scalar-prop instead of custom-comparator selector", plan_said: "per-author selector off shared tick", why: "custom comparator had a read-time coherence bug (both sides read the same current store); memo on a pre-derived scalar is more robust", adjudication: ACCEPTED}
findings: []
```
