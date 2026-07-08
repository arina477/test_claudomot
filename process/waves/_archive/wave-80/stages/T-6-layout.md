# T-6 — Layout (wave-80, presence toggle DS token discipline)

**Pattern:** B — Active-execution. Live probes against deployed SettingsPrivacyPage.

## Surface: SettingsPrivacyPage /settings/privacy — the presence toggle
No new design/<feature>.html canonicalized (design_gap_flag: false — reused the shipped privacy-toggle pattern). Audit = the new control vs the existing privacy-toggle pattern + DS token compliance.

## Action 1/4 — Live control audit (Fixture A, 1440px)
Probed `document.querySelector('[role="switch"]')` computed styles live:

| Property | ON state | OFF state | DS token | Verdict |
|---|---|---|---|---|
| role | switch | switch | — | REAL control (not disabled affordance) |
| aria-checked | true | false | — | binary state reflected |
| aria-disabled | null | null | — | ENABLED (not the whoCanDm-Beta aria-disabled pattern) |
| disabled | false | false | — | ENABLED |
| pointer-events | auto | auto | — | interactive (not pointer-events:none) |
| opacity | 1 | 1 | — | full (not dimmed 0.55 Beta look) |
| backgroundColor | rgb(16,185,129) = #10b981 | rgb(82,82,91) = #52525b | emerald / grey | MATCHES DESIGN-SYSTEM tokens |

Exactly ONE switch on the page (the presence toggle). It is the REAL enabled emerald-on/grey-off control patterned on profileVisibility, NOT the disabled whoCanDm-Beta affordance.

## Copy audit (P-4 correction 4 — binary online, no last-seen)
Live page text: "Show my online status" / "When on, classmates can see when you're online. Turn it off to appear offline to everyone." + "Show when I'm online to others / Classmates can see when you're online."
- Binary online/offline framing. `hasLastSeen` regex over full page body = **false** — no last-seen timestamp language. P-4 correction 4 HONORED.

## Persistence (state hydration)
- UI click OFF → server showPresence=false (GET confirmed). Reload → toggle hydrates `aria-checked=false` grey from server. Default reflects server. No client-only optimistic drift after reload.

## Diffs
No layout regression: single control, consistent with sibling privacy controls. No off-token colors (both states are DS primitives). No token violations.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [/settings/privacy presence toggle]
breakpoints: [1440]
diffs: []
token_violations: []
fix_up_cycles: 0
findings: []
```
