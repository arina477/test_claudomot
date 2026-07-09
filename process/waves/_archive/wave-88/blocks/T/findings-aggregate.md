# Wave 88 — T-block findings aggregate

| # | Severity | Layer | Finding | Blocking? |
|---|---|---|---|---|
| 1 | low | T-5/e2e | Pre-existing non-required e2e sign-in flake (delete-any-message.spec.ts, rule-11); failed on #109 but e2e is not branch-protection-required; unrelated to wave-88. Already tracked (task 5cc59349). | non-blocking |
| 2 | info | T-8 | Web client surfaces the new mismatch-400 as a visible failed-send (not silent); an auto-re-register-on-keyref-mismatch retry is a marginal future UX enhancement (rare stale-post-rotation trigger). | non-blocking |

No critical/high. Security properties CI-proven (integration + unit). Wave shipped + live at d0646058.
