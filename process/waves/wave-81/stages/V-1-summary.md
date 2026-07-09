# Wave 81 — V-1 summary
Karen + jenny parallel, no shared context. Both APPROVE. wave-81 (/settings/profile scroll fix + study-timer CI stabilization, LIVE e659b0a).
## Karen (source-claim) — APPROVE (6/6, 0 REJECT)
FullPageScroll on merge tree (h-dvh overflow-y-auto, no transform/filter/contain); 5 pages wrapped (ProfilePage both returns); globals.css overflow:hidden UNCHANGED (empty diff); shell routes NOT wrapped; LandingPage fixed-nav safe; **deployed bundle index-R5obJ0iu.js has the fix (8× h-dvh, 32× overflow-y-auto)**; CI run 29008456214 all 7 green; study-timer is a REAL stabilization (0 skipped/.only/retry-masking). **SW gap CONFIRMED but bounded:** deployed sw.js already has skipWaiting+clientsClaim+cleanupOutdatedCaches → self-heals in one navigation.
## jenny (spec-semantic) — APPROVE (0 DRIFT; 1 GAP)
All 7 ACs met LIVE (scroll top→bottom to "Save academic identity"; privacy→"Delete account"; landing fixed-nav; global overflow untouched; no double-scroll; DS scrollbar; no churn). **SW-cache = spec GAP (not DRIFT)** — the spec scoped the fix at the component level; the fix IS deployed/referenced/precached/auto-updating; worst case = one reload. **The wave DOES satisfy the founder's request.** Disposition: ACCEPT-WITH-NOTE.
## Findings → V-2
- F-T5-1 (HIGH→self-healing): SW serves stale bundle for ONE navigation until the new SW (skipWaiting+clientsClaim, already present) activates. ACCEPT-WITH-NOTE + fast-follow SW-update toast.
- F-T2-1 (LOW): no standalone ProfilePage-root unit (covered by sibling + LIVE T-5).
