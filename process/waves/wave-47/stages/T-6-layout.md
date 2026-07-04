# Wave 47 — T-6 Layout

**Block:** T · **Stage:** T-6 · **Pattern:** B (active, reduced) · **Mode:** automatic
**wave_type includes ui → T-6 does NOT skip on type rule. But no NEW design surface was canonicalized this wave (design_gap_flag=false; D-block skipped).**

## Scope determination
The 4db10675 diff to StartDmPicker.tsx is PURELY a data-source rewire:
- `getServerMembers(serverId)` → `getDmCandidates()`; `ServerMember[]`/`members` → `DmCandidate[]`/`candidates`; removed `serverId` prop + null-server gate.
- Zero changes to chrome: every `style={{ backgroundColor, border, boxShadow, color }}` value (dark modal #1c1c1f, emerald selection tokens, borders rgba(255,255,255,0.06)) is byte-identical to wave-46, which passed T-6. No token surface, spacing, or icon changed.

So there is no diffable new `design/<feature>.html` and no new token-consuming component. T-6 runs as a render-confirmation on the two data-affected surfaces using live evidence.

## Action 1 — Live render confirmation (from T-5 tester screenshots @ ~1280 desktop, dark theme)
| surface | breakpoint | verdict | evidence |
|---|---|---|---|
| picker populated candidate list (fixture B option, avatar initials, emerald selection) | desktop (~1280) | PASS — renders correctly, no crush/overflow | run1-populated-picker.png (T-5 tester A) |
| picker filtered empty state ("No people match \"zzzznobody\"") | desktop (~1280) | PASS — centered calm empty text, dark-on-dark legible | run-search-empty-state.png (T-5 tester A) |
| DM thread with sent message (author row) | desktop (~1280) | PASS — message row + author render correctly | run1-thread-with-message.png (T-5 tester A) |

## Action 4 — Token compliance
No new token-consuming component introduced (chrome unchanged). Existing picker tokens carried unchanged from wave-46 T-6-passed baseline. No off-token hex / fabricated shadow / non-system radius introduced by this wave. No violations.

```yaml
test_pattern: active
skipped: false
skip_note: "ui wave but no new D-3 surface; StartDmPicker chrome byte-identical to wave-46 (data-source-only change). Run reduced to live render-confirmation of the 2 data-affected surfaces."
surfaces_audited: [dm-picker-populated, dm-picker-empty-state, dm-thread]
breakpoints: [1280]
diffs:
  - {surface: dm-picker-populated, breakpoint: 1280, diff_pct: "n/a (no new baseline)", verdict: PASS-render}
  - {surface: dm-picker-empty-state, breakpoint: 1280, diff_pct: "n/a", verdict: PASS-render}
token_violations: []
fix_up_cycles: 0
findings: []
```
