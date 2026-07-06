# P-2 Spec — wave-59 (pointer)

**Spec contract source of truth:** `tasks.description` of f8eb49c1-5758-462d-93a7-60ca9e11d44b (YAML head + `---` + prose).
This file is the convenience pointer copy.

wave_type: single-spec
claimed_task_ids: [f8eb49c1-5758-462d-93a7-60ca9e11d44b]
design_gap_flag: false

## Acceptance criteria (copy)
- 0 typers → '' (empty string)
- 1 typer → '<name> is typing'
- 2 typers → '<a> and <b> are typing'
- 3 typers → '<a>, <b> and <c> are typing'
- 4+ typers → 'Several people are typing'
- table-driven single test over all 5 buckets; drift fails deterministically

Contracts: test-only against apps/web/src/shell/useTyping.ts buildTypingLabel (assert behavior, do not modify the function).
