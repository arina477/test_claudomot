# Wave 19 — D-block review artifacts
**Block:** D (Design) | **Wave topic:** M3 attachments UI — composer attachment + message-row attachment render | **Gate:** D-3 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| D-1 | stages/D-1-brief/{composer-attachment,message-row-attachment}-brief.md | done (2 briefs, mask PASS) |
| D-2 | stages/D-2-variants/* | done (attachment surfaces composed; checkpoint skipped automatic) |
| D-3 | stages/D-3-review-and-adopt/* | done (both APPROVE, 1 refine; head-designer APPROVED; canonicalized) |
## Context
- 2 gaps, both compose onto design/server-channel-view.html (canonical; now has threads + all prior surfaces).
- DESIGN-PRINCIPLES rule 1 (contrast ≥4.5:1 by calc).
- Scope: image inline-preview (click-to-full) + file chip; ≤10MB; OUT video/CDN/PDF-render.
## Gate verdict log
<appended by head-designer at D-3>

## Block exit handoff
```yaml
design_block_status: complete
adopted: design/server-channel-view.html (composer attachment + message-row attachment render)
refine_cycles: 1
b_block_carries: [hidden-input-bind, upload-progress, lightbox-focustrap/esc/backdrop, img-onerror-fallback, aria-live-staged-strip, chip/retry-aria]
ready_for_build: true
```
