verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Re-spawn after my prior REFRAME (wrong-layer, antipattern #2) was applied. The reframe is now faithfully in the task DB body (db3ade72; description is source of truth per rule 7 — the stale "message list" title is cosmetic residue, not a framing defect). Symptom-vs-cause check (mandatory): symptom = cold-offline empty workspace; reframed cause = ServerContext server-list + channel-tree read path has no Dexie fallback, which gates the already-shipped useMessages.ts message fallback one layer upstream. Verified in code: ServerContext.tsx fetchServers() .catch (l.119-121) sets status:'error' with no cache read, and getServerDetail() .catch (l.145-148) sets detailStatus:'error' with no cache read — both confirm the reframed cause at the correct (server/channel read) layer.
  Over-reach check: the fix is bounded to read-only hydration of already-known servers/channels (write-through on successful online fetch + read-through on failure), reuses the shipped ConnectionStateIndicator, and explicitly leaves useMessages.ts untouched. No offline server CREATE/JOIN is demanded — the invite-join sessionStorage read (l.111-116) is untouched. The Dexie vN+1 bump + dormant `channels` cache wiring + server-list cache all serve the single cold-offline hydration goal, so no scope-creep/auto-split (antipattern #5) trigger. No remaining symptom-vs-cause, wrong-layer, or config/validation-theater defect. Framing is sound.
proposed_reframe: |
  (n/a)
escalation_reason: |
  (n/a)
sibling_visible: false
