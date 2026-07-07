# D-3 Review — Member Profile Card (`/ui-ux-pro-max` reviewer)

**Wave:** 77
**Artifact:** `design/staging/member-profile-card.html`
**Brief:** `process/waves/wave-77/stages/D-1-brief/member-profile-card-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Reviewer role:** requirement + UX + token + icon audit (read-only)

---

## VERDICT: REVISE

The canonical card is strong — all four states are designed, the hidden state is genuinely calm, the layout is scannable, and the palette largely traces to tokens. But two brief violations block adoption as-is: (1) an **invented hex** (`bg-purple-900/20` banner on the Partial state) that is not in the palette (brief §5 "no invented hex"; DS §1), and (2) **oversized numeral / color-misuse on the "Academic Year" field** — the value renders in `--accent-amber` body text, using an alert-accent color on a neutral academic field (DS §1 amber = "assignments / due-soon / warnings", not identity fields). Plus a state-model concern (loaded card omits fields the "Fully Populated" section header promises) and a demo-harness strip note for B-3. None are architectural; all are correctable inside a bounded refine loop.

---

## Checkbox results

### (1) Brief §5 success-criteria + §6 out-of-scope

- [x] **Dark-only, Geist** — `body` is `#0a0a0b`; Geist loaded (weights 400/500/600). PASS. (Note: mockup loads Geist via Google Fonts CDN; DS §2 names Geist — acceptable for staging, B-3 uses the app's bundled font. Not a blocker.)
- [ ] **DESIGN-SYSTEM tokens exactly / no invented hex** — FAIL. Partial-state banner uses `bg-purple-900/20` (§307/317, §505) — purple is nowhere in DS §1 (palette is zinc + emerald + amber + red, "No gaming-neon"). Loaded/Hidden banners use `emerald-950/30` and `surface-700/50` which trace to tokens; the purple is a one-off invented hue. **Must map to a token** (emerald-950/30 to match Loaded, or a neutral surface tint).
- [x] **Scannable academic identity, 6 fields legible** — PASS. Loaded card lays out institution / program / role / year as icon + uppercase-tracked label + body value; pronouns + bio above. Reads at a glance.
- [ ] **Only-present fields, no empty rows** — PASS in principle (Partial shows only Institution + Role, no placeholder rows), but see **Concern C** — the *inline popover* template for `loaded` (§466–501) silently drops Program and Role that the gallery card shows, so "present fields" is inconsistent between the two renderings of the same state. Cosmetic drift in the demo, but flag for B-3 so the real component renders one field set.
- [x] **All 4 states designed (loaded / loading / hidden / partial)** — PASS. All four present in the gallery.
- [x] **Hidden state is calm, not an error** — PASS, and done well. Eye-slash glyph, "Profile Unavailable", "hidden due to their visibility settings" — no danger color, no retry CTA, no alarm. Exactly the brief's calm empty state (§34, DS §8 Empty ≠ Error). Danger trio (`--danger`/`--danger-btn`/`--danger-text`) correctly NOT used anywhere.
- [x] **NO verification badge / trust affordance** — PASS. Academic role ("Graduate Student", "Undergraduate") is plain body text. No SealCheck/ShieldCheck/"verified educator" affordance anywhere. Self-declared fence held (§35, §39).
- [x] **NO edit affordance (read-only)** — PASS. No edit/pencil control on any card.
- [x] **NO email / non-safe field** — PASS. Only pronouns, bio, institution, program, role, year rendered. No email.
- [x] **NO B2B2C / pricing / success-metric** — PASS. None present.

### (2) UX flow

- [x] **Opens from member roster** — PASS. Left-pane roster rows are real `<button>`s; click spawns the popover anchored near the click target (`calculateTop` from `getBoundingClientRect`). Matches brief §2 "anchored to the member-roster click".
- [x] **loaded → loading → hidden → partial coherent** — PASS. Roster rows carry `data-state` and map to the four templates; presence dots (emerald/amber/surface-500) are consistent between roster and card.
- [x] **Dismiss** — PASS. Click-outside on the canvas clears the popover and de-activates the row. (Concern D: no keyboard/Esc dismiss in the mockup — brief §36 requires "keyboard-dismissable if overlay". Flag for B-3; DS §8 Popover a11y mandates "focus management + Esc". Not a design-adoption blocker since it's behavior, but must be in the port.)

### (3) DESIGN-SYSTEM token audit

- [x] **Surfaces** — `surface-950/900/800/700` and `border-hairline`/`border-hover` all match DS §1 hex exactly (config block §21–25). PASS.
- [x] **Text** — `text-primary` 0.92 / `text-secondary` 0.60 / `text-muted` 0.40 match DS §1 exactly. PASS.
- [x] **Radius** — card `rounded-lg` (DS §4 lg = cards/panels); avatar/presence `rounded-full`. PASS.
- [x] **Shadow** — card uses `shadow-pop` (`0 8px 24px rgba(0,0,0,0.5)`) which matches DS §5 `--shadow-pop` for popovers (correct — this IS a floating popover, §4 brief). PASS. (Brief §27 mentions `shadow-sm` as the base + elevation-if-floating; since this is a popover, shadow-pop is the right call.)
- [ ] **Color — amber misuse on Academic Year** — FAIL. §292–297 render the Year icon AND value in `text-accent-amber`. DS §1 defines amber strictly as "assignments / due-soon, reconnecting, warnings" — it is a *semantic alert* accent. "Academic Year: Year 3" is a neutral identity field, not a due-soon/warning signal. Coloring it amber (a) misuses the semantic token and (b) draws the eye to the least-important field. **Year value should be `text-text-primary`** like every other field value; drop the amber icon tint too (use `text-text-muted` to match the other three field icons). Also the label text "Year 3 **Tracker**" injects a due-date/tracker connotation not in the brief's field list (brief §9 field is "academic year") — trim to "Year 3".
- [x] **No oversized numerals** — PASS. No stat/numeral typography abuse; name is `text-xl` (DS §2 xl = 20px page/section titles — acceptable for a card H3), labels `text-[10px]` uppercase tracked (Label idiom, brief §4), values `text-sm` (DS body-min). Type scale is disciplined.
- [x] **Danger trio correct** — PASS (trio not used; hidden state correctly avoids danger — see §5 above).
- [ ] **Invented hex** — FAIL (purple banner, same finding as §5). Also minor: `emerald-950` / `purple-900` are raw Tailwind palette classes, not DS tokens — `emerald-950/30` is defensible as an emerald-derived tint (brief §26 "subtle accent derivation") but should be documented; `purple-900` has no derivation path and must go.

### (4) Icon audit

Target set: `apps/web/src/shell/icons.tsx` (inline-SVG, Phosphor-family). Confirmed exports include `UsersIcon`, `LockKeyIcon`, `EyeSlashIcon`, `ClockIcon`, `BooksIcon`, `UserAddIcon`, `ShieldCheckIcon`, etc.

- [x] **Hidden-state eye-slash** — maps cleanly to on-set `EyeSlashIcon`. PASS. (Mockup uses inline eye-slash SVG; equivalent exists.) Note: hidden-state also has a plain user glyph in the avatar well — maps to `UsersIcon`/a user glyph on-set. PASS.
- [x] **Role field (users/people glyph)** — maps to on-set `UsersIcon`. PASS.
- [x] **Year field (clock-in-circle)** — maps to on-set `ClockIcon`. PASS.
- [~] **Institution field (graduation-cap glyph)** — **B-3 PORT NOTE, not a blocker.** The mockup draws a graduation-cap/mortarboard SVG (§260). The on-set inventory has **no** `GraduationCapIcon` / `StudentIcon` — closest existing exports are `BooksIcon` (academic) or `CompassIcon`. Brief §4 explicitly permits this: "institution/graduation-cap if present … if a needed glyph is absent, use the closest existing export." So B-3 either (a) uses `BooksIcon` for institution, or (b) adds a `GraduationCapIcon` Phosphor export (Phosphor DOES ship `GraduationCap`, so it's a trivial on-family addition). Prefer (b) — graduation-cap is the more legible academic-institution signal and stays on the Phosphor family (DS §7). Flagged as a port decision for head-designer/B-3; does NOT block adoption.
- [~] **Program/Field (open-notebook glyph)** — **B-3 PORT NOTE.** Mockup uses a notebook/journal SVG (§271). Closest on-set is `BooksIcon`. If institution takes graduation-cap, program can take `BooksIcon`; distinct enough. Not a blocker.
- [x] **No demo-only icon libraries pulled into the component** — the card SVGs are all inline (portable to icons.tsx). No Phosphor *webfont* CDN is loaded (brief §28 "NO Phosphor CDN webfont"); the only CDN is Tailwind + Google Fonts, both staging-only. PASS.

### (5) Demo-scaffold / leftover-overlay check

- [~] **Demo overlays / state-switchers left in** — **STRIP NOTE for B-3 (not an adoption blocker).** The mockup is a two-pane spec harness: the LEFT pane is a fake channel view + fake member roster + "System Architecture Demo" caption + click-to-spawn interactive popover, and the RIGHT pane is a "Component State Registry · V7 Dark" gallery with `State:` section dividers. **None of this ships** — the deliverable (brief §2) is a single card component opened from the real `MemberListPanel`. The gallery dividers, the fake roster, the "Interactive Member Roster" hero, the `waterfall-render` stagger, and the entire `<script>` demo harness are presentation scaffolding. This is expected for a D-2/D-3 staging mockup and is the norm, but I'm flagging it explicitly so B-3 ports ONLY the card frame (banner + floating avatar + presence dot + identity core + field stack + the 4 state bodies) and discards the harness. Not counted against the verdict.

---

## Concerns (cited)

- **A — Invented purple hex (BLOCKER; brief §5, DS §1).** `bg-purple-900/20` on the Partial-state banner. Purple is not in the restrained zinc+emerald+amber+red palette. Remap to `emerald-950/30` (match Loaded) or a neutral `surface-700/50` tint. Refine-loop fix.
- **B — Amber on Academic Year (BLOCKER; DS §1 semantic tokens).** Year field icon + value both use `--accent-amber`, which DS reserves for due-soon/warnings/reconnecting. An identity field colored with an alert accent both misuses the token and mis-prioritizes attention. Set value to `--text-primary`, icon to `--text-muted`; trim label value "Year 3 Tracker" → "Year 3" (the "Tracker" wording imports a due-date connotation absent from the brief's field list §9).
- **C — Field-set drift between gallery card and popover template (fix at B-3).** Gallery Loaded card shows 4 fields (institution/program/role/year); the JS `loaded` popover template (§466) shows only institution + year. The shipped component must render one deterministic present-fields set. Cosmetic in the mockup; note for the port so "only-present-fields" (brief §33) is honored consistently.
- **D — No Esc / keyboard dismiss (fix at B-3; brief §36, DS §8).** Mockup dismisses only on canvas click-outside. Brief requires keyboard-dismissable overlay; DS §8 Popover a11y mandates focus management + Esc. Behavior, not visual — must land in the B-3 port, and T-4/T-8 should cover it. Also confirm portal-to-body per brief §13 (BUILD-14 transformed-ancestor lesson) since the mockup positions the popover with an absolute container rather than a portal.
- **E — Institution/program glyphs off-set (B-3 PORT NOTE, non-blocking; brief §4/§28).** Graduation-cap and open-notebook have no direct icons.tsx export. Recommend adding a Phosphor `GraduationCapIcon` (on-family, trivial) for institution and reusing `BooksIcon` for program; fallback is `BooksIcon` + `CompassIcon`. Brief explicitly sanctions closest-existing-export, so this is a port decision, not a REVISE trigger on its own.

---

## Summary for head-designer

REVISE on **two** independently-sufficient design blockers — the invented purple banner (A) and the amber-on-identity-field token misuse (B) — both correctable in a single bounded refine iteration without touching structure. Everything else is strong: all four states present, hidden state genuinely calm, self-declared fence held (no trust badge), read-only, no email, palette otherwise on-token, type scale disciplined, danger trio correctly absent. Concerns C/D are B-3 port obligations (field-set consistency, Esc/keyboard + portal), and E plus the demo-harness strip are non-blocking port notes. After A and B are fixed, this is adoptable.
