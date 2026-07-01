# Wave 26 — P-2 Spec (pointer)

**Spec contract source of truth:** `tasks.description` of **10b9d18e-5071-41dc-85de-ef257b9dfde0** (YAML head + `---` + prose). This file is a convenience pointer.

**wave_type:** single-spec. **claimed_task_ids:** [10b9d18e]. **design_gap_flag:** false.

## Acceptance criteria (copy for P-3/P-4 reference)
1. Each message-row author avatar in server-channel-view renders a presence dot reflecting the author's current /presence status, updating live (no reload) on presence change.
2. A single shared `PresenceDot` component renders the dot at BOTH the member panel AND message-row author avatars; both derive color from the shared presence token (`--color-accent-emerald`), not hard-coded hexes — exactly one dot-styling source.
3. Unknown-presence author (not a co-member / not in store) → NO dot (graceful degrade, no error, no default-online).
4. No additional /presence socket for author dots — message-row dots + member panel share one presence client/store (exactly one presence socket at runtime).
5. Member-panel dot refactored onto the shared `PresenceDot` — no behavioral regression.

## Contracts
- types: NEW `PresenceDot` web component (props: online-state + optional size), consuming existing usePresence/presenceSocket singleton + presence token; replaces MemberListPanel inline dot.
- api / data / sdk: none (reuses wave-14 /presence; no schema change).

## Edge cases
self-author (own presence), unknown/non-co-member (no dot), live online↔offline flip, same-author multi-message consistency, tombstone rows (dot only where an avatar renders), authorId=userId identity (direct presence lookup).

## Out of scope
DM/mention/hover affordances (sibling fdb444fc); hover cards; study-status beyond online/offline; animation.
