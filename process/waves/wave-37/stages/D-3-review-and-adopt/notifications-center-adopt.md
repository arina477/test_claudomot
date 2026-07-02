# Wave 37 — D-3 Adopt: notifications-center
Phase 1: dual reviewers APPROVE + APPROVE (iter-3). Phase 2: head-designer APPROVED (backstop verified token inventory, iter-3 sed fixes sound, all states + AA contrast + a11y). Canonicalized.
```yaml
adoption_complete: true
canonical_path: design/notifications-center.html
design_system_tokens_added: []
journey_map_updated: false   # bell+panel is an app-shell overlay (no new route); the 3 /me/notifications endpoints register at T-9
```
## B-4 handoff notes (non-blocking, implementation-layer)
- notification rows: use `<button>` not `<div tabindex>` (designed focus/keyboard states exist)
- register `pb-safe` (env(safe-area-inset-bottom)) for the iOS bottom-sheet
- add `prefers-reduced-motion: reduce` guard on shimmer/slide-up
- reconcile `text-primary`→`text-text-primary` Tailwind alias in prod config; add a named scrim alias for `bg-black/60`
- wire the row optimistic mark-read handler
