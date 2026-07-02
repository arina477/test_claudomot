# Wave 35 — P-1 Decompose

**Bundle (from N-2):** seed 56a50862 (settings-privacy: profile-visibility enforced + who-can-DM persisted) + siblings a4169fac (account data view/download), d40ece71 (Sentry api+web), 13b7ebfd (privacy/terms stubs + empty/error/loading states). **claimed_task_ids.length = 4.**

## Maximum size rubric (split when over) — no threshold trips
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~25 (privacy schema/migration, settings service+controller, roster/profile enforcement, DTO/Zod, settings-privacy page + data-view section, data-export service+endpoint, Sentry init ×2, 2 stub pages, state components across ~5 surfaces, tests) | no |
| New primitives | > 60 | ~15 (privacy_settings table + 2 enums, settings GET/PUT, data-export endpoint, settings-privacy page, data-view/download components, 2 stub pages, Sentry init ×2, ~5 state components) | no |
| Estimated net LOC | > 5,000 | ~2,550 | no |
| Stage-4 working set | > 350K tokens | ~120K (plan + Sentry SDK doc + 4 per-task briefs) | no |

→ **No RESCOPE-AUTO-SPLIT.**

## Wave type
`claimed_task_ids.length = 4` → **`wave_type: multi-spec`**.

## Minimum floor (multi-spec: net LOC > 2,500 OR length ≥ 6)
- length = 4 (not ≥ 6) → LOC gate applies.
- **Net LOC estimate ~2,550** — itemized: seed settings-privacy w/ server-side profile-visibility enforcement on roster+profile-read + persisted who-can-DM enum + migration + page UI + tests (~1,270); a4169fac data-export aggregation service + view/download UI + tests (~590); d40ece71 Sentry ×2 w/ PII scrub (~200); 13b7ebfd 2 stub pages + empty/error/loading across ~5 surfaces + tests (~490).
- **> 2,500 → floor CLEARS.** (Estimate is close to the floor; real enforcement + data-export aggregation + cross-surface state work make it defensibly ≥2,500. If it drifted under during P-3 file-level planning, MERGE would pull notifications-polish from M7 scope — not needed here.)

→ **Verdict: PROCEED.** `floor_merge_attempt: 0`.

## design_gap_flag — FALSE
Rubric §3: a surface is a gap only if it lacks BOTH a mockup AND a token/pattern reference. Walk:
| Surface | Prior art | Gap? |
|---|---|---|
| settings-privacy page (profile-visibility selector, data view/download/export sections) | `design/settings-privacy.html` — covers Data/Download/Export/Visibility (grep-verified) | no |
| who-can-DM (persisted, no active control per BOARD) | N/A — not a rendered interactive control (Path A) | no |
| empty / error / loading states across ~5 surfaces | `DESIGN-SYSTEM.md` §113 — concrete Empty/Error/Loading patterns ("Every list/panel defines all three") | no |
| /privacy, /terms stub pages | content: `per-page-pd/{privacy,terms}.md`; layout: DESIGN-SYSTEM.md typography scale (text-2xl title / text-base body) — trivial static-text pages, full token reference | no |
| Sentry (d40ece71) | backend/infra — no UI | no |

```yaml
design_gap_flag: false
missing_surfaces: []   # every touched surface has a full mockup or complete token/pattern reference
```

→ **Next block after P-4: B (Build)** — no D-block.

```yaml
wave_type: multi-spec
verdict: PROCEED
claimed_task_ids: [56a50862, a4169fac, d40ece71, 13b7ebfd]
floor_merge_attempt: 0
design_gap_flag: false
```
