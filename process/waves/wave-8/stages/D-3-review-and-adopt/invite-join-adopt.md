# D-3 Adopt — Invite-join page

**Surface:** public `/invite/:code` landing page · **Brief:** `process/waves/wave-8/stages/D-1-brief/invite-join-brief.md`
**Adopted file:** `design/invite-join.html` (canonicalized from `design/staging/invite-join.html`)
**Disposition:** REFINE of the pre-existing approved concept (delta), not regen.

## Adoption rationale (tied to the brief's job)
The user job is: a cohort member opens an invite link cold and decides whether/how to join — across auth states they may arrive in. The adopted refine keeps the original concept's calm centered-card structure (which the team already approved) and closes the three gaps that made the prior mockup non-compliant with the security-tightened wave-8 spec:

1. **Security minimum-summary enforced.** The prior concept leaked a Visible-channels list, presence avatars, an online count, and a server description — a direct violation of the public `GET /invites/:code` minimum-summary AC (name + member count only). All of it is removed; the preview now renders server icon + name + a single member-count metadatum and nothing else. This is load-bearing: the design can no longer display data the public endpoint must not return.
2. **Two missing in-scope states added.** `already-member` (single "Go to server" action, no join call) and `unverified` (email-verification prompt, Join withheld) are now first-class states. All eight spec states are present: loading / valid / unauthed / unverified / already-member / joining / joined / invalid-or-expired.
3. **Token + motion alignment.** Inter swapped for Geist; bouncy/back spring easing replaced with the system's calm 150ms/300ms ease; `prefers-reduced-motion` honored.

## Stage-exit checklist
- [x] One variant adopted with written rationale tied to the brief's job.
- [x] Accessibility audit run (accessibility-tester) — verdict PASS, zero blockers.
- [x] No new design token introduced; off-system hex scan returns only the 9 DESIGN-SYSTEM tokens.
- [x] Reachable + coherent with adjacent chrome — joined state redirects into the server (rail + sidebar), consistent with `server-rail-sidebar.html` / `server-channel-view.html`; public page intentionally has no 3-pane chrome.
- [x] Gate verdict issued by a fresh reviewer (head-designer) on read accessibility-tester output, not authored by the build/orchestrator.

## Reviewer output read
- accessibility-tester (contrast/focus/keyboard/ARIA): **PASS** — emerald primaries use `text-surface-950` (≈16.5:1), all controls carry the emerald focus-visible ring, `role="status"`/`role="alert"`/`aria-busy` applied correctly, decorative icons `aria-hidden`. One minor note (text-muted guidance ~4.1:1) recorded as non-blocking.
