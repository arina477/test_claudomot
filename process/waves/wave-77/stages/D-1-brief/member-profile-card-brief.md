# Design Brief — Cross-server Member Profile Card

**Wave:** 77
**Parent stage invoking:** P-1 (design_gap_flag: true)
**Blocking current wave:** yes (B-3 renders this card)
**Mode:** automatic

## 1. What we need
A read-only **member profile card** that opens when a user clicks a member in the server member roster (MemberListPanel) — it shows that member's self-declared portable academic identity (pronouns, bio, institution, program/field, academic role, academic year) fetched from GET /profile/:userId. Same canonical card viewable from ANY shared server (the "portable identity" differentiator).

## 2. Where it lives
- **File:** a new card component (apps/web/src/shell), opened from `MemberListPanel` (clicking a member).
- **Navigation:** overlay/popover/panel anchored to the member-roster click — reuse the shipped panel/overlay pattern (portal to document.body if it's a floating card — BUILD-14 transformed-ancestor lesson).

## 3. Audience + state
- **Who sees it:** any authenticated member viewing another member (subject to the server-side profile_visibility + block + soft-delete enforcement — the API returns a hidden shape when not permitted).
- **States to design:**
  - **loaded** — the profile card: name/avatar/accent + pronouns + academic identity fields laid out scannably.
  - **loading** — skeleton while GET /profile/:userId resolves.
  - **hidden** — a graceful "This profile isn't available" state (when the API returns the hidden/404 shape: visibility=nobody, blocked, or soft-deleted). NOT an error — a calm empty state.
  - **partial** — a member who filled in few academic fields (only show what's present; no empty rows).

## 4. DESIGN-SYSTEM.md references (REQUIRED)
- **Colors:** `--surface-800`/`--surface-900` (card + nested), `--surface-700`/`--border-hairline` (borders), `--text-primary`/`--text-secondary`/`--text-muted` (name / labels / placeholders), `--accent-emerald` (accent/presence), `--accent-amber` (academic-year or program accent, sparingly). Restrained palette; dark-only.
- **Typography:** name (H3-scale), field labels (uppercase tracked Label idiom), field values (Body-m). Geist (DS §2).
- **Spacing/radius:** card `rounded-lg`, `p-4 sm:p-6`, field rows `gap-2`/`gap-3` — match the ServerPlanPanel / ProfileContext idioms.
- **Shadow:** card `0 1px 2px rgba(0,0,0,0.4)` (+ elevation if floating).
- **Icons:** reuse `apps/web/src/shell/icons.tsx` inline-SVG (e.g. a user/identity icon, institution/graduation-cap if present, a lock/eye-slash for the hidden state) — NO Phosphor CDN webfont; if a needed glyph is absent, use the closest existing export.
- **Reuse:** ProfileContext avatar/accent rendering, the member-roster row, the settings-panel card chrome.

## 5. Success criteria (D-3 reviewers check)
- Dark-only; DESIGN-SYSTEM tokens exactly (no invented hex); Geist.
- Scannable academic identity — the 6 fields legible at a glance; only-present fields shown (no empty rows).
- All states (loaded / loading / hidden / partial) designed; the **hidden state is calm ("not available"), not an error**.
- **NO verification badge / trust affordance** — academic role (educator/staff) renders as PLAIN TEXT (self-declared fence — problem-framer + ceo-reviewer + jenny).
- Calm/academic/low-noise, consistent with shipped panels; accessible (WCAG AA contrast; keyboard-dismissable if overlay).

## 6. Out of scope (fenced)
- NO verification badges / "verified educator" affordance (self-declared only).
- NO edit affordance in the card (read-only; editing lives in ProfilePage).
- NO B2B2C / institution-partnership UI, NO pricing, NO success-metric surfacing.
- NO email or any non-safe field (server enforces PublicProfile; the card only renders what the API returns).
