# D-3 Adopted — wave-18 (M3 threads UI)
- **Adopted:** design/staging/server-channel-view.html → design/server-channel-view.html (canonical) — thread-view panel + in-list thread affordance, composed onto the channel view (all 9 message rows + member-list panel + composer preserved).
- **Verdicts:** ui-designer APPROVE (54/60, after iter1 contrast fix), accessibility-tester APPROVE (contrast 7.27:1/5.79:1 ≥4.5:1), head-designer APPROVED (token discipline clean, structural integrity intact).
- **Refine cycles:** 1 (fixed rule-1 contrast on thread labels zinc-500→zinc-400 + added panel failed-reply state + role=dialog).
## B-block adoption carries (non-blocking JS — staging is the visual contract; verify at ui-comprehensive-tester):
1. Focus trap when panel open (≤1024 modal).
2. Esc handler → close panel + restore focus to the originating affordance.
3. reply_count==0 → hide affordance (data-binding).
4. List semantics: replies in <ol role="list">/<li>.
5. aria-live="polite" on the replies container for realtime appends.
