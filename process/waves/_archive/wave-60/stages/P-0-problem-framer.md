```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: [1]
symptom_vs_cause_check: run
reasoning: |
  Symptom-vs-cause check (mandatory) — RUN. The three DM off-token surfaces
  (ServerRail.tsx, StartDmPicker.tsx, disabled-send) do NOT consume the design
  tokens: they hardcode raw hex literals inline via style={{...}} (e.g. ServerRail
  hardcodes '#0a0a0b'=surface-950 where DESIGN-SYSTEM.md assigns sidebars
  surface-900='#121214'). The canonical tokens DO exist as consumable CSS custom
  properties in apps/web/src/styles/globals.css (--color-surface-950 ... -700) but
  nothing in the web shell references them via var(). This confirms the seed is a
  symptom (wrong shade) of a deeper cause (no component consumes the token system),
  matching antipattern #1 — so the note is mandatory. It is NOT a full REFRAME:
  the cause-fix (convert to var() consumption) spans 45 web-shell files, far beyond
  a deliberately-tiny M8-tail cosmetic drainage item, and would need its own
  milestone framing. The seed's "swap the literal to the correct canonical hex" fix
  is correct for what it targets and closes the visible drift on the three DM
  surfaces. PROCEED with the scope-note below; REFRAME here would wrongly force
  either an out-of-scope 45-file refactor or a pointless re-run round-trip on an
  item that is correctly framed for its stated intent.
scope_note: |
  ROOT CAUSE (out of scope for this tail item, flag for a future wave): the entire
  web shell (45 files, grep-confirmed) hardcodes palette hex inline instead of
  consuming globals.css tokens via var(--color-surface-*). Shade drift like F10
  will recur anywhere a developer types a literal. A dedicated "token-consumption
  migration" wave (swap inline hex -> var() across apps/web/src) is the cause-fix;
  candidate for L-2 promotion as a new project antipattern ("hardcoded palette hex
  where a consumable token exists"). Do NOT expand THIS wave to cover it.
  Implementation-scope guidance (not a HOW mandate): if the build for this item is
  going to touch those three files anyway, converting just those three surfaces to
  var() is a reasonable in-place cause-fix; a bulk migration is not.
sibling_visible: false
```

## Evidence

- Design tokens defined + consumable: `apps/web/src/styles/globals.css` lines 10-15
  (`--color-surface-950: #0a0a0b` ... `--color-surface-500: #52525b`).
- DESIGN-SYSTEM.md token->surface assignment: `design/DESIGN-SYSTEM.md` lines 14-17
  (surface-900 = sidebars incl. server rail; surface-800 = main canvas;
  surface-700 = borders/hover).
- Hardcoded-hex offenders (the seed's named surfaces):
  - `apps/web/src/shell/ServerRail.tsx` — inline `#0a0a0b`, `#1c1c1f`, `#27272a`,
    `#10b981` throughout (lines 44-281); server rail bg hardcodes surface-950 hex
    where DS assigns surface-900.
  - `apps/web/src/shell/StartDmPicker.tsx` — picker modal card inline `#1c1c1f`
    (surface-800) at line 176 where DS Modal spec assigns surface-900; disabled
    confirm-send inline `#27272a` (surface-700) at line 432.
- Scope of the cause: 45 `.tsx` files under `apps/web/src` carry hardcoded palette
  hex (grep `#(0a0a0b|121214|1c1c1f|27272a|10b981)`), none consuming `var()`.
