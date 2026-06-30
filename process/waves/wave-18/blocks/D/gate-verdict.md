# D-3 Gate Verdict — wave-18 (M3 threads UI: thread-view panel + in-list affordance)

**Head:** head-designer (Design Director / Principal Product Designer)
**Block:** D (Design)
**Stage:** D-3 Review & adopt
**Date:** 2026-06-30
**Verdict source:** fresh-reviewer gate (this verdict authored by the head; the two D-3 reviews authored by fresh subagents)

---

## VERDICT: APPROVED

Adopted variant: the composed staging `design/staging/server-channel-view.html` → canonicalized to `design/server-channel-view.html`.

design_gap_id: wave-18 / M3 threads UI (thread-view side panel + in-list thread affordance)
adopted_variant_id: server-channel-view-thread-surfaces (additive composition onto the canonical channel view)

---

## Stage-exit checklist (D-3)

- [x] **Exactly one variant adopted with a written rationale tied to the brief's job.** The thread surfaces are an additive composition onto the canonical channel view; rationale below ties to both briefs' jobs.
- [x] **Accessibility audit run; blocking findings resolved before adoption.** accessibility-tester (B) audited and APPROVED; the iteration-1 rule-1 contrast blockers (3.87:1, 3.08:1) were fixed and re-verified at 5.79–7.30:1.
- [x] **No new token introduced.** Hex audit confirmed — every literal resolves to a DESIGN-SYSTEM §1 primitive (`#0a0a0b/#121214/#1c1c1f/#27272a/#3f3f46/#52525b/#10b981/#f59e0b/#ef4444`). No invented hex. No new token promoted (none needed).
- [x] **Adopted variant reachable and consistent with adjacent chrome.** Panel reads as the member-list sidebar family (`bg-study-900`, hairline left border, 11px-uppercase header matching member-list L612); server rail / channel sidebar / main canvas / member list all preserved and coherent. Affordance lives inside the message-row, consistent with the row-actions/reaction-pill chrome.
- [x] **Gate verdict issued by a fresh reviewer, not the orchestrator.** Two fresh subagents (ui-designer A, accessibility-tester B) authored the D-3 reviews; the head gates on top.

All checkboxes ticked → APPROVED.

---

## Independent head verification (not deferral to reviewers)

**Refine cycle soundness.** The iteration-1 REVISE was substantive, not cosmetic: it caught two genuine DESIGN-PRINCIPLES rule-1 failures (thread wayfinding labels zinc-500 = 3.87:1 on study-900; affordance separator dot zinc-500 = 3.08:1 on study-700) plus a missing panel failed-reply state required by thread-panel-brief §3/§9. Reviewer B missed the zinc-500 wayfinding labels in pass 1; A caught them — the reconciliation correctly aggregated A's concerns and routed to a D-2 refine.

**Fixes verified against the actual HTML (line-checked):**
- L473 panel-header "THREAD", L486 "Thread on:" h3, L503 "4 Replies" divider → `text-zinc-400` = 7.30:1 on study-900. PASS.
- L240-241 affordance separator dot → `text-zinc-400` = 5.81:1 on study-700. PASS.
- L469 panel → `role="dialog" aria-modal="true" aria-label="Thread"`, paired with affordance `aria-controls="thread-panel"`. PASS for ≤1024 overlay semantics.
- L554-558 nested failed-reply demo (`role="alert"`, danger/40 border, danger/10 bg, red-300 label, Retry button w/ red-500/60 focus ring) — mirrors main-canvas article row 9. PASS.

**Brief jobs satisfied.**
- thread-panel-brief: parent pinned at top (surface-800 raised block + "Thread on:" label) → replies oldest-first → composer at foot; sidebar family confirmed; loading/empty/tombstone/pending/failed states present (live or commented); ≤1024 overlay/drawer with close button + shadow-pop.
- thread-affordance-brief: "N replies · last reply <time>" shown only at reply_count>0 (present on exactly the 2 qualifying rows, absent on 7); emerald accent restrained to icon+count; distinct from reaction-pill (rounded-md no-border vs rounded-full bordered); keyboard-operable native button with emerald focus-visible ring.

**Structural integrity.** All 9 `<article>` rows confirmed by line number (213, 252, 282, 302, 325, 342, 352, 376, 388); member-list panel (L609-679), main composer (L449-463), thread composer (L591-603) all intact. Thread surfaces are strictly additive.

**Anti-pattern scan.** No job-less brief (both briefs name the user job). No token fragmentation (hex audit clean). No pseudo-variants (additive-composition adoption, not competing restyles). No happy-state-only design (all in-scope states covered). No dark-theme contrast failure (resolved + recomputed ≥4.5:1). No missing focus design (emerald focus-visible rings throughout; JS focus-trap is a B-block carry). No AI-slop hierarchy (tiered, on-grid, restrained accent). No local-screen blindness (sidebar-family + chrome coherence verified). No rationale-less adoption (this document). No self-issued gate (fresh reviewers authored the reviews).

---

## B-block adoption carries (non-blocking JS / implementation items)

The staging HTML is the **visual contract**. The following are interactive behaviors both reviewers flagged as non-blocking and that B-block MUST implement (they are not design-surface defects):

1. **Focus trap** when the panel is open (modal pattern at ≤1024px overlay; `role="dialog" aria-modal="true"` already declared).
2. **Esc handler** to close the panel and **restore focus to the originating affordance button** (`aria-expanded` toggle already wired).
3. **`reply_count==0` hide logic** for the affordance (CSS-ready; data-binding only — affordance renders only when `MessageResponse.replyCount > 0`).
4. **List semantics**: wrap thread replies in `<ol role="list" aria-label="Thread replies">` with `<li>` items (currently flex `<div>`s) for screen-reader item navigation.
5. **Live region**: `aria-live="polite"` on the replies container so realtime-appended replies are announced.

These carry forward to B-block and should be verified at the T-block / live-verification (ui-comprehensive-tester) stage.

---

## Reviewer matrix

| Reviewer | Role | Iter-1 | Iter-2 | Score |
|---|---|---|---|---|
| ui-designer (A) | pixel-craft / design-system | REVISE (contrast + failed-reply gap) | APPROVE | 54/60 |
| accessibility-tester (B) | contrast / focus / ARIA / keyboard | APPROVE | APPROVE (re-verified) | 7/7 contrast pass |

Reconciliation: `process/waves/wave-18/stages/D-3-review-and-adopt/server-channel-view-reconciliation.md`

---

head_signoff:
  verdict: APPROVED
  stage: D-3
  reviewers: { ui-designer: APPROVE (54/60, iter-2), accessibility-tester: APPROVE (7/7 contrast, iter-2) }
  failed_checks: []
  rationale: >
    Both fresh reviewers APPROVE after one substantive refine cycle that resolved two
    genuine DESIGN-PRINCIPLES rule-1 contrast failures (3.87:1 / 3.08:1 → 5.79–7.30:1) and
    added the brief-required panel failed-reply state. Head independently line-verified the
    fixes, the hex/token cleanliness (no invented tokens), the additive structural integrity
    (9 article rows + member-list + both composers preserved), the sidebar-family/chrome
    coherence, and full in-scope state coverage. The thread panel and in-list affordance
    satisfy both briefs' user jobs (read/write thread replies; "open the thread" cue distinct
    from the reaction-pill). Remaining focus-trap / Esc / list-semantics / live-region /
    reply_count==0-hide items are correctly classified as non-blocking B-block JS carries,
    not design defects.
  next_action: PROCEED_TO_B
