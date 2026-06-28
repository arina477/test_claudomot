# Wave 1 — T-block findings aggregate
(no findings yet)

## T-5 (E2E)
- [low] live-browser E2E unavailable (Playwright MCP needs 'chrome' channel binary, absent in sandbox). Covered by RTL component tests (10/10 CI) + live HTTP serve (web 200 + bundle 200 + api /health 200). Recommend a CI chromium Playwright job for future UI waves.
- AC5 responsive: live-viewport check deferred (code+RTL covered).

## T-6 (Layout)
- [low] live visual-diff vs mockups not run (same browser limitation). Shell built from approved design tokens + mockups; pixel-diff deferred.
