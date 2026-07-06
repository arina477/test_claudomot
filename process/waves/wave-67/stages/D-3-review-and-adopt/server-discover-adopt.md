# D-3 Adopt — /discover
Canonical: design/server-discover.html (git mv from staging). Phase 1: Reviewer A APPROVE (54/60, iter 3) + Reviewer B APPROVE (all WCAG AA pass, iter 3). Phase 2: head-designer APPROVED (aeb26196). 3 D-2 iterations (typeface/hues/contrast → primary-button AA). 
DESIGN-SYSTEM §8 update BLESSED + applied: primary button descriptor "emerald fill, white text" → "emerald fill, surface-950 (dark) text" (AA-correct; resolves §8's white-text-vs-≥4.5:1 contradiction; no new token). 
Follow-up filed (bug-design): existing white-on-emerald primary buttons app-wide → converge to dark-on-emerald per updated §8.
B-block impl notes (non-blocking, from reviewers): visible results-count line; skeleton height parity with real card; register emerald nav-glow token; load-more spinner flex wrap; aria-describedby search↔results binding.
```yaml
adoption_complete: true
canonical_path: design/server-discover.html
design_system_tokens_added: ["§8 primary-button descriptor: white text → surface-950 dark text (blessed)"]
journey_map_updated: true
```
