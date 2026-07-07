# Wave 77 — T-6 Layout

Pattern B (active). UI wave (member profile card + ProfilePage editor). Diffed live card vs adopted design/member-profile-card.html.

## Surfaces audited
- **MemberProfileCard** (live, via portal) — computed-style probe:
  - bg `rgb(18,18,20)` (dark surface), text `rgba(255,255,255,0.92)` (DS text token), borderRadius `8px` (system radius), position `fixed`, z-index `120`.
  - **Portal confirmed**: direct body child (depthToBody 1), ancestorClipped=false — NOT clipped by MemberListPanel overflow (BUILD-14). Edge-clamped 320×417 fully on-screen.
  - 4 states present (B-3): loaded / loading skeleton / hidden "Profile Unavailable" / partial. Loaded state verified live.
  - Icons render (GraduationCap/User inline-SVG, no CDN). NO verification badge; academicRole = plain text.
- **ProfilePage editor** — screenshot wave-77-T6-profile-editor-1440.png; dark theme consistent, labeled form fields.

## Token compliance
Card colors + radius trace to DESIGN-SYSTEM dark tokens (no invented hex, no off-token radius). Dark-only theme honored.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [MemberProfileCard, ProfilePage academic editor]
breakpoints: [1440]
diffs:
  - {surface: MemberProfileCard, breakpoint: 1440, diff_pct: "n/a (computed-style + visual match to adopted design)", verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings: []
```
