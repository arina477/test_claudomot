# Landing Page — StudyHall

**Route:** `/`  
**Related features:** 1 (auth), 3 (dark theme), 5 (servers), 7 (messaging), 13 (voice/video), 12 (offline-first), 15 (assignments)

---

## Purpose

The public landing page is the first surface a prospective student sees when opening the StudyHall desktop app. It introduces StudyHall's core positioning ("the single tool that replaces Notion + Discord, built for unreliable connectivity") and converts a visitor into a signed-up account holder joining their first study server.

---

## Audience

**Primary persona:** Prospective student (anon, unauthenticated)  
**Secondary:** Existing members inviting peers  
**Auth state:** None — no session required; CTA leads to signup flow (F1)  
**Entry point:** First-run app launch; direct link share from existing member

---

## Entry Points

1. **First-run launch** — Desktop app opens for the first time; the home screen routes to landing.md if user is not authenticated.
2. **Invite share link** — Existing member shares `studyhall.app/join/<invite_code>` (lands at landing → invite preview → signup fast-track).
3. **Direct navigation** — `/` explicitly, e.g., a school marketing email linking to the public landing.

---

## Content Sections (Page Anatomy)

### Header
- **StudyHall logo** (mark + wordmark, left-aligned)
- **Right CTA:** "Sign up" button (primary, bright accent) and "Already a member? Sign in" (secondary text link)

### Hero Section
- **Headline:** "The single tool that replaces Notion + Discord, built for unreliable connectivity."
- **Subheadline:** "Study over voice, track assignments, and stay connected — even when the internet isn't."
- **Hero visual:** Atmospheric dark-themed mockup of a study server (server rail, channel list, assignment panel visible, one voice room active). Include a subtle connection indicator showing "offline" to reinforce the wedge.
- **CTA:** "Create a free account" (primary button, centered below visual)

### Feature Highlights (3–4 short cards, icon + headline + 1-line description)

**Card 1: Study Servers & Voice Rooms**
- Icon: Server/channels silhouette
- Headline: "Study servers you own"
- Description: "Create a study server, invite your cohort, and drop into voice study rooms anytime — no scheduling needed."
- Visual: small server rail thumbnail

**Card 2: Assignments in One Place**
- Icon: Checklist / assignment
- Headline: "Track coursework, not two apps"
- Description: "View assignments, due dates, and check them off alongside the people you're studying with — no Notion tab switch."
- Visual: assignment panel thumbnail

**Card 3: Works Offline**
- Icon: WiFi off / sync arrows
- Headline: "Unreliable internet? Still works."
- Description: "Compose messages, read channels, and track assignments offline. They sync automatically when you reconnect."
- Visual: connection-state indicator (offline → reconnecting → online states animated)

**Card 4: Your Privacy, Your Data** (optional; if messaging/copy budget allows)
- Icon: Shield / privacy
- Headline: "You control who sees what"
- Description: "Choose who can find you, who can message you, and download your data anytime. No ads, no data brokers."
- Visual: privacy settings modal thumbnail

### Social Proof / Trust Section (lightweight, MVP-appropriate)
- **Placeholder:** "Trusted by [X] study groups across [Y] schools"
- **Logos:** 3–4 placeholder partner/school logos (to be filled in with early adopters; e.g., "Stanford Study Collective," "MIT Remote Cohort")
- **Quote card (optional):** Student testimonial: "Finally, we can stop context-switching between Discord and our assignment tracker. StudyHall just works — especially when our WiFi doesn't." — Alex, Remote Learner

### Call-to-Action Section (mid-page or before footer)
- **Large button:** "Get started for free" (primary)
- **Subtext:** "No credit card required. Create your first study server in 30 seconds."

### Footer
- **Left section:** "StudyHall" (company name, year) + copyright
- **Right section:** Links to `/privacy` (Product Privacy Controls) + `/terms` (Terms of Service) + `@studyhall.social` (social media placeholder)
- **Legal disclaimer (small):** "StudyHall is built for students. We don't track you for ads or sell your data. See our privacy policy."

---

## Interactions (Elements → Side-effects)

### "Create a free account" (hero CTA)
- Click → route to F1 signup flow (`/auth/signup`)
- Loading state: button shows spinner, disabled
- Error fallback: "Something went wrong. Try again." (toast, retry available)

### "Already a member? Sign in" (header link)
- Click → route to signin flow (`/auth/signin`)

### Feature cards (hover on desktop)
- Desktop: card lifts slightly (box-shadow increase), accent color highlights the icon
- Mobile (if supported in future): tap highlight, no hover

### "Get started for free" (CTA button)
- Same as hero CTA; routes to signup
- Analytics event: `click_cta_midpage`

### Footer links
- "/privacy" → routes to static privacy controls documentation (feature 16 policy page; not legal)
- "/terms" → routes to terms of service
- Social icons → external links (placeholder)

---

## Data Requirements

### API endpoints (not called on landing itself, but context)
- No authenticated endpoints needed on this page.
- **Analytics event endpoints** (optional, if analytics already integrated):
  - `POST /api/events` — `{ event: 'landing_view', timestamp, source: 'first_run' | 'invite_link' | 'direct' }`
  - `POST /api/events` — `{ event: 'click_cta_hero', variant: 'create_account' | 'signin' }`

### Static content
- Hero visual (dark-themed mockup): design/landing-hero.png (or embedded SVG)
- Feature card icons: design/icons/*.svg (or icon font)
- Partner/school logos: design/logos-partner/*.svg (placeholder set; will vary per deployment region)
- Testimonial quote: TBD; collected from early adopter feedback

---

## Empty / Error / Loading States

### First load (cold app start)
- Page loads with hero section visible immediately (assets inline or cached).
- Spinner overlay fades out once feature card section loads (2–3 seconds).
- If app detects user is logged in (e.g., session cookie persists), skip landing and route to home (server rail) instead.

### Offline (no internet on app start)
- Landing still renders (assets cached or bundled).
- CTA buttons ("Create account" / "Sign in") disabled with tooltip: "Go online to create an account."
- Connection-state indicator at footer shows "Offline" (gray indicator, "Reconnect" button).

### Slow network
- Hero visual lazy-loads; placeholder gray box shown until image ready.
- Feature card section load staggered (card 1 visible first, then 2–4 cascade in).

### Invite link preview (if deep-link to invite)
- Landing loads, but server preview overlay appears: "Join [Server Name]?" with member count + visible channels. CTA: "Sign up to join" (routes to signup with `invite_code` pre-filled in the auth form).

---

## Responsive Breakpoints

### Desktop (app window ≥960px wide)
- Hero section: two-column layout (text left, visual right).
- Feature cards: 4-column grid (or 2×2 if only 4 cards).
- Header: inline logo + centered nav.

### Tablet / Narrow desktop (600–960px)
- Hero section: single-column stack (text above visual).
- Feature cards: 2-column grid.
- Header: logo + hamburger nav (if space constrained).

### Mobile (if supported in future; <600px)
- Single-column layout throughout.
- Feature cards: 1-column stack.
- Hero visual scales down; may swap to smaller thumbnail or simplified illustration.
- **Note:** Out of scope for MVP. Landing may include `display: none` for mobile or a "Download desktop app" upsell.

---

## Success Metrics

### Conversion funnel
1. **Landing page view** (session start) → baseline
2. **Click CTA ("Create account")** → conversion rate target: ≥25% of landing viewers
3. **Complete signup (F1 finish)** → target: ≥60% of CTA clickers
4. **Join a server (F2)** → target: ≥75% of new signups within 7 days
5. **Send first message or view assignments** → retention proxy; target ≥50%

### Engagement metrics
- **Time on page:** median ≥3 seconds (suggests meaningful read, not bounce)
- **Feature card scroll depth:** ≥80% of viewers see 3+ cards (scroll engagement)
- **Invite-link conversion uplift:** users arriving via invite link should have ≥40% higher signup-to-join conversion vs. cold landing view

### Business metrics (post-MVP)
- **Organic landing traffic** (growth signal)
- **Signup source attribution** (which channels drive most account creation)
- **Study server adoption rate** (server creation within 7 days of signup)

---

## Competitor Comparison

### vs. Discord landing
- **Discord's approach:** Brand awareness + game streaming highlights + community use cases (streamers, guilds). CTA leads to "Download" + "Open in browser."
- **StudyHall's wedge:** Academic-first positioning + offline-first + privacy control highlights. Emphasize "assignments in one place" (Discord has zero). Dark theme is table-stakes (match Discord's 4 themes as design system matures; use single dark MVP).
- **Key difference:** StudyHall's landing *names* the problem (Notion+Discord two-app seam; offline unreliability) vs. Discord's generic community pitch.

### vs. Notion landing (education section)
- **Notion's approach:** "All-in-one workspace" + template showcase + collaborative editing highlight. Position as productivity backbone.
- **StudyHall's wedge:** "Communication + coursework together, built for real-time." Emphasize voice study rooms (Notion has zero) + offline (Notion's offline is partial/paid-only).
- **Key difference:** StudyHall's landing positions as a *complement* to note-taking (students still use Notion for long-form notes) but the *replacement* for Discord + fragmented assignment tracking.

### vs. Microsoft Teams landing
- **Teams' approach:** Enterprise + education institution positioning; sign-in-via-school-account. Emphasizes security + FERPA compliance + integration with Canvas/Blackboard.
- **StudyHall's wedge:** Student-native, bottom-up (no IT provisioning required). Free. Privacy controls visible on landing (not buried in compliance docs). Dark theme + voice rooms as social, not just functional.
- **Key difference:** Teams requires institutional buy-in; StudyHall lands on a student's laptop today.

### Privacy positioning (vs Discord's weak posture)
- **Discord:** "Trusted by 150M+ users" (brand trust, not privacy). Sep 2025 data acquisition policy is a liability (students may not know). Landing doesn't mention privacy.
- **StudyHall's wedge:** Proactive privacy mention in hero card + footer legal note ("No ads, no data brokers"). Optional testimonial-style trust signal: "Your data stays yours." This is a real differentiator vs Discord's advertising infrastructure.

---

## Implementation Notes (for design + dev)

### Design system token usage
- **Typography:** Hero headline = H1 (largest weight). Subheadline = Body Large. Feature card headings = H3 (bold). Footer = Caption (smallest).
- **Color:** All text on dark background (near-black #0a0e27 or dark gray #1a1f3a). Accent color (e.g., #7c3aed or #06b6d4, TBD by design system) used sparingly in CTAs and highlights.
- **Dark theme:** Landing shipped in dark mode only (MVP). Light-mode variant can follow if brand expands.

### Asset optimization
- Hero mockup should be SVG or optimized PNG (<500KB) to keep cold-start fast.
- Lazy-load feature card images (non-critical path).
- Bundle footer links as static HTML (no runtime data fetch).

### Analytics instrumentation (optional for MVP, required for H2 growth tracking)
- Inject Google Analytics 4 or Plausible client-side.
- Events: `landing_view`, `cta_click_hero`, `cta_click_midpage`, `footer_link_click`, `invite_preview_shown`, `invite_cta_click`.

### Invitation deep-link behavior (if invite code in URL)
- Detect `studyhall.app/?invite=<code>` or `studyhall.app/join/<code>` in URL.
- Show invite preview overlay on top of landing (server name, icon, member count, visible channels).
- CTA: "Join [Server]" → routes to signup with `?invite=<code>` pre-filled; after signup (F1), auto-complete join flow (F2).
- This is a key conversion lever for cohort growth.

---

## Ownership & Review Checklist

- **Design review:** D-block gate (design system tokens used consistently).
- **Copy review:** Brand/tone aligned; no overclaim on features.
- **Analytics:** Events defined; tracking IDs assigned.
- **A/B testing readiness:** CTA copy variants (e.g., "Get started" vs. "Create a free account") + feature card order testable post-MVP.
- **Accessibility:** Text contrast ≥4.5:1 on dark theme; hero visual alt text; focus states on buttons.
