# D-3 Adopt — timer-duration-config

- **Canonical path:** `design/timer-duration-config.html` (git mv from staging).
- **Phase-1 reviewers:** ui-designer APPROVE + accessibility-tester APPROVE (iteration 1, after one REVISE→refine).
- **Phase-2 head-designer:** APPROVED (aa503c8308c422e5c) — token-disciplined, scope-fenced (inline slim reveal, no settings panel), 5 states legible, F-1 coherent, no new tokens.

## B-block implementation-spec notes (non-blocking carries → B-3)
1. Wire the mobile/slim reveal-row inputs with the SAME aria-invalid + aria-describedby + aria-live validation chain as the desktop form.
2. The F-1 slim-bar 2px left-border must switch emerald(Work)↔amber(Break) by phase at the component level (the mockup shows emerald; the component toggles it).
3. Locked-state "/" separator: use `--text-muted` rather than `--border-hairline`.

```yaml
adoption_complete: true
canonical_path: design/timer-duration-config.html
design_system_tokens_added: []
journey_map_updated: false   # no new route/screen — in-widget affordance on the existing study-timer surface; the custom-durations flow annotates the journey map at wave-50 T-9
```
