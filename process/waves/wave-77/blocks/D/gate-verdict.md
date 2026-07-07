# Wave 77 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn, agentId head-designer-wave77-D3)
**Reviewed against:** process/waves/wave-77/blocks/D/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale

The single gap — the cross-server member profile card (M13 leg-2) — clears the bar. I did not rely on the Phase-1 reviewers' word; I independently re-verified the three load-bearing risk classes against the staged HTML. **Brief §6 fences all hold:** the academic role renders as plain body text ("Graduate Student" `:170`, "Undergraduate" `:240`) under an "Academic Role" label with no badge/shield/seal/"verified" affordance anywhere — a grep for `badge|verif|shield|seal|trusted` returns only the comment confirming absence; there is no edit/pencil/button/input control in any of the four state templates (read-only held); and no email/mailto/handle or other non-safe field appears — only pronouns, bio, institution, program, role, year, matching the PublicProfile shape. This self-declared fence is the highest-value check and it is clean. **Token discipline holds:** an independent hex scan finds only DS §1-sanctioned values; the words "purple" and "emerald-950" survive only as inline comments documenting the first-pass fix (banners are now `bg-surface-800`); amber appears in exactly two places — the config declaration and the State-2 *idle presence dot* (`:207`), which is the sanctioned `--presence-idle → --accent-amber` mapping — and is correctly absent from the Academic Year field (`:174-183` uses `text-muted` icon + `text-primary` value, identical neutral treatment to the other three fields). **The four states are all designed and correctly toned:** loaded, partial (only-present-fields, no empty rows), loading shimmer, and a genuinely *calm* hidden state — a gentle eye-slash on a neutral `surface-700/50` chip with "Profile Unavailable" and no danger color, retry CTA, or alarm (the danger trio is defined in config but correctly unused). Dark-only, Geist-first, `rounded-lg`/`shadow-pop` popover, `ease-out` 200ms with no bounce, `prefers-reduced-motion` guarded, and Esc-dismiss wired. Hierarchy reads at a glance (avatar+name anchor, unlabeled bio, then icon+uppercase-label+value field stack) with no AI-slop flatness or decoration-without-purpose. Contrast passes AA — secondary-alpha labels on `surface-900` compute ≈6.4:1. Icons are inline SVG mapping to on-family Phosphor names (GraduationCap/BookOpen/Users/Clock/User/EyeSlash) that B-3 will source from `apps/web/src/shell/icons.tsx`, so the build inherits the shipped visual language rather than inventing one, consistent with the settings-panel/ProfileContext idioms the brief §4 cites for reuse. **Iteration discipline is sound:** the two reviewers ran independently and both first returned REVISE (converging on the same surface-level DS/a11y drift — invented purple, amber-on-year, overshoot easing, missing reduced-motion/Esc, sub-12px labels), the D-2 refine addressed every item, and both APPROVE at iteration 1 — one cycle, well within the 3-cap, with all fences held throughout. Nothing in the residual observations rises to a blocker; they are routine D→B port obligations carried below as canonicalization notes, not adoption conditions.

## Canonicalization notes (Phase 3 follows on APPROVED)

Phase 3 proceeds per D-3 Actions 6–8:

1. **Canonicalize (Action 6):** `git mv design/staging/member-profile-card.html design/member-profile-card.html`; annotate `stages/D-3-review-and-adopt/member-profile-card-adopt.md` with the canonical path + both APPROVE verdicts; commit `docs(design): D-3 adopt — member-profile-card for wave-77`.

2. **Journey-map update (Action 7 — CONDITIONAL, fires):** the member profile card is a new surface opened from `MemberListPanel` (overlay/popover on member-roster click, GET /profile/:userId). It is not yet in `command-center/artifacts/user-journey-map.md`. Add an entry for the card surface + its four states (loaded/loading/hidden/partial) per the file's existing schema; commit `docs(journey): D-3 — register member-profile-card for wave-77`.

3. **DESIGN-SYSTEM token additions (Action 8): NONE.** I bless no new token. The adopted design introduces zero tokens absent from `design/DESIGN-SYSTEM.md` — it consumes existing surfaces, text-alpha, `accent-emerald`, `accent-amber`, `border-hairline`, `radius-lg`, `shadow-pop`, and the Empty-state/Popover primitives verbatim. `design_system_tokens_added: []`. Do not extend DESIGN-SYSTEM.md.

4. **B-3 port obligations (non-blocking; carry into Build, NOT adoption conditions):** strip the `cdn.tailwindcss.com` + Google-Fonts CDN links (B-3 uses the bundled Geist/Tailwind pipeline); ship ONE card portalled to `document.body` per the BUILD-14 transformed-ancestor lesson (drop the `waterfall-render` gallery wrapper + stagger; keep only the per-card `fade-in-scale` 200ms popover animation); add bottom-edge flip/clamp so a member near the roster bottom does not render the 320px card off-screen; add `aria-busy="true"` on the loading skeleton; add an `aria-label`/`title` on the presence dot so status is not color-only (DS §8 MemberListItem "not color alone"); Esc handler should unmount + restore focus to the roster trigger (DS §8), not just fade in place; snap the two off-4px-scale values (`gap-2.5` `:141`, `min-h-[220px]` `:318`) to the DS §3 scale; B-3 must NOT lighten the secondary-alpha field labels further (they sit at the AA floor).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
