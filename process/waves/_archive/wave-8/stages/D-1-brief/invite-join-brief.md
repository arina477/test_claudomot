# D-1 Brief — Invite-join page (refine existing)

## §1 What we need
A public `/invite/:code` landing page that previews a server (name + member count **only**) and lets a visitor join, covering every state the wave-8 spec declares. `design/invite-join.html` already exists as an approved concept mockup but predates the security-tightened spec — this brief scopes the **delta** needed to bring it into spec compliance.

## §2 Where it lives
- Route: `/invite/:code` (public-reachable; unauthed → login then return to invite).
- File: `design/invite-join.html` (refine in place via `design/staging/invite-join.html`).
- Entry: external share link (the full `/invite/:code` URL), opened cold.

## §3 Audience + states
Audience: a cohort member who received an invite link (often not yet logged in / not yet verified). All in-scope states:
- **loading** — fetching the server summary.
- **valid** — server name + member count + primary **Join** button (authed+verified).
- **unauthed** — visitor not logged in → Sign up / Log in, then resume the join.
- **unverified** — logged in but email not verified → prompt to verify (EmailVerification gate); Join is NOT offered.
- **already-member** — visitor is already in this server → single **Go to server** action.
- **joining** — Join submitted; button shows in-progress (aria-busy), controls disabled.
- **joined** — success → redirect into the server (rail shows it, sidebar shows channels). Brief success affordance before redirect.
- **invalid-or-expired** — code invalid / revoked / expired / maxed → friendly error, no preview.
Explicitly OUT: offline state for this page (cold public page; no outbox), role/permission UI.

## §4 DESIGN-SYSTEM.md references (primitives consumed)
1. **Colors** — `--surface-950/900/800/700`, `--accent-emerald` (primary/Join/success), `--danger` (invalid/expired), text `--text-primary/secondary/muted` (§1).
2. **Typography** — Geist sans; `text-2xl` page/server title, `text-sm` body, `text-xs` metadata (§2). NOT Inter.
3. **Spacing** — 4px base; panel padding 16px, section gaps 24px (§3).
4. **Radius** — `--radius-lg` (card/panel), `--radius-md` (buttons/inputs), `--radius-full` (server icon, presence dot) (§4).
5. **Shadow/elevation** — `--shadow-pop` (card), `--glow-focus` emerald focus ring (§5).
6. **Motion** — calm `transition-colors 150ms` / `transition-all 300ms`; **no bouncy/back easing**; respect `prefers-reduced-motion` (§6).
7. **Icons** — Phosphor regular (`ph-books`, `ph-users`, `ph-arrow-right`, `ph-spinner-gap`, `ph-clock-user`/`ph-warning-circle`, `ph-seal-check`) (§7).
8. **Components** — **Invite preview card** (server icon + name + member count + Join CTA; error variants) and **Button** (primary/secondary/ghost, loading state) primitives (§8).

## §5 Responsive contract
Desktop-first centered card, `max-w-[440px]`. ≥1024 unchanged (single centered column — no 3-pane chrome on this public page). Card never exceeds viewport; vertical-centers; comfortable padding at 1440+.

## §6 Interaction patterns
- Join → optimistic in-progress button (spinner, label hidden, aria-busy) → success → redirect.
- Unauthed CTA routes to login/signup carrying the invite code; on return, resume at valid/joining.
- Unverified CTA routes to the verify-email gate; no Join until verified.
- Already-member → Go to server (no join call).
- Keyboard: single primary action focus-first; Esc not applicable (full page, not modal); all buttons real `<button>` with emerald focus-visible ring.

## §7 Data shape
From public `GET /invites/:code` — **name + member count only**: `{ server: { id, name, memberCount } }`. NO channel list, NO member/presence list, NO description. `POST /invites/:code/join` → `{ serverId }`. Invalid/expired/maxed → 404/410 → invalid-or-expired state.

## §8 Prior art (visual language to match)
- `design/invite-join.html` — the existing concept (structure to preserve where compliant).
- `design/email-verify.html` — verify-email gate visual language (for the unverified state).
- `design/create-server.html` — token discipline + focus-ring + state-showcase pattern reference.

## §9 Success criteria
- [ ] Preview shows server **name + member count only** — no channels, no presence avatars, no description (matches the public minimum-summary endpoint).
- [ ] All eight states present: loading / valid / unauthed / unverified / already-member / joining / joined / invalid-or-expired.
- [ ] `already-member` offers a single **Go to server** action (no Join call).
- [ ] `unverified` prompts email verification and does NOT offer Join.
- [ ] Every interactive element has a visible emerald focus-visible ring (never bare browser default) and is a real `<button>`/link.
- [ ] Text/background + Join-button contrast meets WCAG AA on the dark theme.
- [ ] Only DESIGN-SYSTEM tokens used; no bouncy/back easing; Geist (not Inter); `prefers-reduced-motion` respected.

## §10 Non-goals
No channel preview, no member list, no presence/online counts, no server description, no role/permission/kick-ban UI, no offline/outbox handling, no ad-hoc-invite generation (that lives in the share modal).

## §11 Reviewer briefing
Verify the preview cannot display anything beyond name + member count (security AC). Confirm the two new states (already-member, unverified) read clearly and route correctly. Confirm motion is calm and tokens are system-clean. Audit dark-theme contrast + focus order + keyboard reachability.

```yaml
mask_mode_signoff: PASS
signoff_note: "Refine-delta brief; existing mockup is prior art; gaps = security minimum-summary, already-member, unverified, motion/token alignment."
```
