# B-3 Frontend — wave-59
Specialist: react-specialist (agentId a85844b5db57afd46). Files:
- apps/web/src/shell/useTyping.ts — added `export` to buildTypingLabel (line 65; visibility only, no logic change).
- apps/web/src/shell/useTyping.test.ts — created; describe + single it.each over 6 rows (0/1/2/3/4/5 typers)
  asserting verbatim display-name strings for buckets 1-3 and the 'Several people are typing' constant for 4 AND 5
  (confirms 4+ is a true fallthrough). Import style matches neighbors.
Results: vitest 6/6 pass; tsc clean; biome clean (2 files). Deviation from plan: none.
```yaml
specialists: [react-specialist]
files: [apps/web/src/shell/useTyping.ts, apps/web/src/shell/useTyping.test.ts]
deviations: []
```
