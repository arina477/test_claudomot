# /ui-ux-pro-max — D-3 re-review (iteration 2): voice-occupancy-indicator.html

**Reviewer:** ui-ux-pro-max (independent; no awareness of co-reviewers)
**Target:** `design/staging/voice-occupancy-indicator.html`
**Brief:** `process/waves/wave-32/stages/D-1-brief/voice-occupancy-indicator-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md` · **Prior art extended:** `design/voice-study-room.html`

---

## 1. Brief §9 success-criteria checkbox audit

| # | §9 criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Uses exactly §4 tokens; no new hex / invented tokens | **MET** | Config (html:30–56) byte-identical to adopted `voice-study-room.html`; only same-name §1/§4/§5 primitives referenced. See token audit §2. |
| 2 | Renders all four states (loading, empty, populated, error) | **MET** | Loading (html:153–193), Populated (html:199–284), Empty (html:290–324), Error/fail-soft (html:330–360). Four distinct labelled sections. |
| 3 | Count chip visually identical to in-room header chip (voice-study-room.html:278-281) | **MET** | Populated chip (html:272) class string `ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-study-900 border border-border-hairline text-xs font-medium text-text-secondary` **byte-matches** prior art; `ph-users`+count `aria-hidden`, container `aria-label="8 participants"`. Only the count value differs. |
| 4 | Populated: avatars + names, bounded cluster + "+N" overflow | **MET** | 4 avatars (html:233–256) + "+4" overflow pill (html:259–264). Bounded at the §5 tablet cap ~4; no unbounded list. |
| 5 | Empty state is calm "door's open" invitation, not alarming | **MET** | `ph-door-open` in muted study-900 circle + "Room is empty" / "No one else here yet — the door's open." (html:309–316). No danger tokens; matches prior-art alone-state copy. |
| 6 | Responsive: degrades to count-only text below 1024 | **MET** | Avatar cluster `hidden lg:flex` (html:230); below 1024 the `lg:hidden` "8 studying now" text (html:269) + count chip persist. Loading mirrors this (html:176–181). Matches §5 narrow contract. |
| 7 | `role="status"` aria-live; count in text not color-alone; avatar `alt` = display name | **MET** | `role="status" aria-live="polite"` on all four states (html:172, 223, 307, 347). Count in text (sr-only span + visible "8" / "8 studying now"). `<img>` avatars `alt`=name; initials `role="img" aria-label="Julian Davis"` (html:240); overflow `aria-label="and 4 others"` (html:260). |
| 8 | Error state fail-soft (muted, never blocks Join) | **MET** | Muted study-900/40 sub-panel + text-muted (html:349–351), `role="status" aria-live="polite"` (NOT alert). "Join Room Anyway" stays emerald + enabled (html:356). |
| 9 | All icon references are real Phosphor names | **MET** | See icon audit §3. |

**Score: 9/9 MET.**

---

## 2. DESIGN-SYSTEM token audit

Scanned every color/radius/shadow literal (config html:30–63 + inline styles html:72–124).

- **Colors — CLEAN.** `study-950…500` = surface-950…500; `accent-emerald #10b981`, `accent-amber #f59e0b`; `danger #ef4444`, `danger-text #f87171` (§1 `--danger-on-tint`), `danger.tint rgba(239,68,68,0.10)`; text primary/secondary/muted + border hairline/hover — all exact §1 values. Inline `.ds-tooltip` hex (html:95–105) are literal restatements of surface-700 / border-hairline / shadow-pop / text-primary — same values, not new colors.
- **Shadow — CLEAN.** `sm` / `pop` / `glow-focus` / `glow-danger` (§5) exact.
- **Radius — CLEAN.** `rounded-lg` panels, `rounded-md` buttons+tooltip, `rounded`/`rounded-full` chip+avatars (§4). Count chip `rounded` (radius-md) matches prior art.
- **Type scale — CLEAN.** No arbitrary `text-[Npx]` anywhere; all text on the §2 scale (`text-xs/sm/base/lg/2xl/3xl`). Bracket values present are dimensional only (`w-[34px]`, `-space-x-[10px]`, `py-[9px]`, `w-[42px]`) — sizing, not tokens/type; 34px avatar sits between §8's 32/40 stops, consistent across all avatars, acceptable as compact-cluster sizing.

**Result: PASS — no invented hex, no invented token, no off-scale type size.**

---

## 3. Phosphor icon audit

All 5 `ph-*` classes are real Phosphor names; every decorative icon correctly hidden:
- `ph-hash` (html:135 — staging header) ✓
- `ph-speaker-high` (html:165, 212, 300, 340 — voice glyph, §7) ✓
- `ph-users` (html:273 — count chip, matches prior-art voice-study-room.html:279), `aria-hidden="true"` ✓
- `ph-door-open` (html:310 — empty) ✓
- `ph-warning-circle` (html:350 — error): `<i class="ph ph-warning-circle text-base" aria-hidden="true"></i>` — **`aria-hidden` is a proper attribute OUTSIDE the class value, correctly formed.** This resolves the iteration-1 malformed-attribute defect. ✓

**Result: PASS — all 5 icon names real; error warning icon correctly aria-hidden and well-formed.**

---

## 4. UX flow

- **Pull-to-hop-in:** Populated leads with a face cluster + "+4" + an "8" count chip, emerald Join CTA directly below (html:280). Hierarchy identities → count → CTA delivers the social-proof-before-commit cold-start affordance §1 asks for. ✓
- **Join reachable in every state:** "Join Room" (loading html:189 / populated html:280), "Be the First to Join" (empty html:321), "Join Room Anyway" (error html:356). Never blocked, including fail-soft error. ✓
- **Keep-OUT leakage (§10) — CLEAN:**
  - Presence rings/dots — pre-join avatars are plain bordered circles; no per-avatar emerald presence dot. The `animate-ping` emerald dot (html:201–203) is a **staging section-label indicator**, not on any participant avatar. ✓
  - Join-from-avatar — avatars are `tabindex="0"` for tooltip focus only; tooltips `pointer-events-none`; no button/href/onClick join affordance. ✓
  - Websocket push — no socket code; bounded-poll framing preserved. ✓
  - Occupancy history — none. ✓
  - Motion — calm `animate-pulse` skeletons + 200ms tooltip fade, no bounce. ✓

---

## 5. Accessibility

- **role=status aria-live=polite on error (not alert):** PASS (html:347). Correct for a non-critical fail-soft state — a deliberate, correct divergence from voice-study-room.html:417's `role="alert"` (that was a hard join-failure).
- **Avatar alt / aria-label = display name:** PASS. `<img>` `alt` (html:234, 248, 254); initials `role="img" aria-label="Julian Davis"` (html:240); overflow `aria-label="and 4 others"` (html:260).
- **Member names in announced text + retained below 1024:** PASS. Single contiguous `sr-only` span (html:224) lives OUTSIDE the `aria-hidden="true"` visual tree (html:227), so the roster is announced identically at all viewports — names survive the <1024 degrade for AT users. Resolves the iteration-1 viewport-data-loss concern.
- **Keyboard focus reveals name tooltips (focus parity with hover):** PASS. Each `.avatar-wrapper` is `tabindex="0"` with `focus-visible:ring-2 ring-accent-emerald`; CSS `.avatar-wrapper:focus-within .ds-tooltip` (html:109) reveals the tooltip on focus exactly as on hover. Resolves the iteration-1 focus-parity nit.
- **prefers-reduced-motion:** PASS. `@media (prefers-reduced-motion: reduce)` (html:122–124) zeroes animation + transition durations, disabling skeleton pulse, emerald ping, and tooltip/lift transitions.
- **Contrast note (non-blocking):** error message `text-muted` (0.40) on study-900/40 is faint, but the same information is announced via the `role=status` region, so it is not conveyed by faint text alone — acceptable for de-emphasized fail-soft copy.

**A11y result: PASS.**

---

## Concerns summary (cited)

All five iteration-1 concerns are resolved: (1) count-chip parity — byte-match confirmed (§1 row 3); (2) presence-dot leakage — gone (§4); (3) missing initials alt — added (§5); (4) error `role=alert` → `role=status` polite (§5); (5) names-not-in-live-region — contiguous sr-only span outside aria-hidden tree (§5). The iteration-1 blocking defect — malformed `aria-hidden` on the error icon (html:350) — is **FIXED**; attribute is now correctly outside the class value (§3). The iteration-1 tooltip focus-parity nit is also **FIXED** via `:focus-within` + `tabindex=0` (§5).

No token violations, no invented icons, no off-scale type, no state/flow gaps, no keep-OUT leakage, no outstanding a11y defect.

---

## VERDICT

**APPROVE**
