# Design Brief — E2E DM encryption status indicator

**Wave:** 79
**Parent stage invoking:** P-1 Decompose (`design_gap_flag: true`) → carried from P-0 frame (ceo-reviewer + problem-framer named the honest indicator the make-or-break AC)
**Blocking current wave:** yes — B-3 Frontend is gated behind D-3 (per P-3 plan parallelization map: "B-3 waits on B-2 AND D-3").
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

## 1. What we need

A fail-closed trust-signal indicator in the direct-message view that tells a student, at a glance, whether a conversation (and each message in it) is genuinely end-to-end encrypted — and, just as importantly, honestly signals when it is **not**. This is the anti-security-theater surface for wave-79's server-blind E2E DM encryption: the visual language for three states — **encrypted**, **not-encrypted (plaintext fallback / group DM / no peer key)**, and **cannot-decrypt-on-this-device** — where mislabeling a plaintext message as "encrypted" is a shipped false privacy promise (ship-blocker).

## 2. Where it lives

- **Route / file path:** `apps/web` direct-message view (`apps/web/src/**/dm/*` — the DM conversation pane; mockup prior-art `design/direct-messages.html`). New client component, e.g. `apps/web/src/components/dm/E2EStatusIndicator.tsx` (per-conversation header badge) with an optional per-message micro-affordance rendered inside the existing `MessageRow`.
- **Navigation entry:** No new route. Two placements, both inside the already-shipped DM view:
  1. **Per-conversation header badge** — in the DM thread header's right-side action cluster (`design/direct-messages.html:324` — the same "Action & Connection Wedge" region that hosts the ConnectionStateIndicator pill). Establishes the conversation-level posture.
  2. **Per-message affordance** — a small, quiet glyph on/near individual message rows (reuses the `MessageRow` sub-indicator slot where "Sending…" / "Failed to send" already live, `design/direct-messages.html:395-430`). Renders ONLY on messages whose encryption status differs from, or must be proven independently of, the header (a plaintext-fallback message inside an otherwise-encrypted-capable thread; an undecryptable incoming envelope). Absent-proof = no glyph.

Rationale for both: the header answers "is THIS conversation private?"; the per-message affordance prevents the header's calm posture from implying a lock over a specific message that is actually plaintext (the exact security-theater failure the gate forbids).

## 3. Audience + state

- **Who sees it:** any authenticated student in a 1:1 DM (buyer/seller N/A — StudyHall personas: student, educator). Both sender and recipient.
- **States to design (all REQUIRED, fail-closed):**
  1. **Encrypted** — conversation/message is PROVABLY end-to-end encrypted (sent/received as a real ciphertext envelope; peer has a registered public key; local decrypt succeeded). Calm affirmative affordance (lock/shield). This is the ONLY state that may show a lock.
  2. **Not-encrypted (plaintext fallback)** — peer has no registered key yet, so the message went plaintext. Clear, calm, honest — NO lock, NO alarm-red. Reads as "not private yet," not "danger."
  3. **Not-encrypted (group DM)** — group threads (≤10) are out of encryption scope in leg-3a (P-4 binding correction). Same honest not-encrypted treatment as 2; the header states the conversation is not end-to-end encrypted.
  4. **Cannot-decrypt-on-this-device** — an incoming envelope this device has no key for (key lost / new device — the v1 no-multi-device/no-key-backup posture). Calm, non-alarming: the message content is unavailable here, but this is an expected limitation, not a breach.
  5. **Loading / establishing** — brief transient while the peer key is fetched / local keygen completes on first DM ("setting up secure messaging"). Must NOT show a lock until encryption is proven; defaults to a neutral/indeterminate treatment that resolves to state 1 or 2.
  6. **Hover / focus (tooltip)** — plain-language explanation of the current state on the header badge ("Messages in this conversation are end-to-end encrypted — only you and Dr. Aris Thorne can read them" / "Not end-to-end encrypted — <peer> hasn't set up secure messaging yet").

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:**
  - `--accent-emerald` (`#10b981`) — the PRIMARY academic/trust accent; used for the **encrypted** state (dot/glyph tint + optional 10% tint fill `accent-emerald/10` + `accent-emerald/20` hairline border), mirroring how `ConnectionStateIndicator` uses semantic tint+border pills. Emerald already = success/online/trust across the system, and `ph-shield-check` in emerald is an established trust glyph (`educator-admin-console.html:220,262`).
  - `--text-secondary` (`rgba(255,255,255,0.60)`) — the **not-encrypted (plaintext fallback / group)** state: neutral, calm, NON-alarming. This is the anti-security-theater choice — not-encrypted is quiet grey, never red. Glyph stroke matches `--text-secondary` per § 7.
  - `--text-muted` (`rgba(255,255,255,0.40)`) — **cannot-decrypt-on-this-device** placeholder text + **loading/establishing** indeterminate treatment; expresses "unavailable / not-yet," calmly.
  - `--surface-800` / `--surface-900` — the DM canvas + header fills the badge sits on (§ 1 surfaces). Badge pill background may use `--surface-700` (matches Badge/Pill primitive default) for the not-encrypted state.
  - `--border-hairline` (`rgba(255,255,255,0.06)`) — badge pill hairline border in the neutral state.
  - `--danger` / `--danger-text` — **explicitly NOT used** for any not-encrypted or cannot-decrypt state (documented anti-pattern; see § 10). Named here only to forbid it: no red alarm lock, no danger tint on "not private." (Danger stays reserved for true failures like "Failed to send," per the shipped MessageRow.)
- **Typography (§ 2):** `text-xs` (12px, medium 500) for badge label + per-message micro-label (matches ConnectionStateIndicator pill + "Sending…"/"Failed" labels); `text-sm` (14px) for any tooltip/popover body; Geist family; tooltip body line-height 1.5.
- **Spacing / radius (§ 3, § 4):** badge pill padding `px-3 py-1.5` (matches connection-wedge `direct-messages.html:326`); `gap-2`/`gap-1.5` between dot/glyph and label; `--radius-full` (9999px) for the header pill + status dot; `--radius-md` (6px) for the hover tooltip/popover. 4px base spacing scale.
- **Shadows (§ 5):** `--shadow-pop` (`0 8px 24px rgba(0,0,0,0.5)`) for the hover tooltip/popover; `--glow-focus` (`0 0 0 2px rgba(16,185,129,0.4)`) emerald focus ring on the badge when it is keyboard-focusable/interactive. No heavy drop-shadow on the badge itself (dark UI leans on borders per § 5).
- **Icons (§ 7 — Phosphor, line weight regular, 16–20px):**
  - `ph-shield-check` (or `ph-lock`) — **encrypted** state. Filled variant (`ph-fill ph-shield-check`) permitted only for the active/proven-encrypted state per § 7 ("Filled variants only for active/selected states"). Emerald stroke/fill. Precedent: `educator-admin-console.html:220,262`.
  - `ph-lock-open` (or `ph-shield` outline / `ph-shield-slash`) — **not-encrypted (plaintext fallback / group)**. Regular weight, `--text-secondary` stroke. Signals "open/not-secured" without alarm.
  - `ph-key` or `ph-lock-key` with a muted/indeterminate treatment — **cannot-decrypt-on-this-device**. `--text-muted` stroke; reads "no key on this device."
  - `ph-circle-notch` (spin) or a neutral pulsing dot — **loading/establishing** ("setting up secure messaging"). Must resolve before any lock appears.
  - All icon names MUST be real Phosphor glyphs; aidesigner must not invent glyph names.
- **Components to reuse:**
  - **ConnectionStateIndicator** (§ 8 StudyHall primitive; live at `direct-messages.html:326`) — the direct structural + a11y template: a slim `role="status"` `aria-live="polite"` pill (dot + label) in the thread-header action cluster with a 200ms color fade between states. The E2E header badge is its sibling and MUST match its size, radius, padding, and a11y pattern.
  - **Badge / Pill / Tag** (§ 8 standard primitive) — `radius-full`, 11–12px, `--surface-700` default with semantic fills; governs the header badge shell.
  - **Tooltip / Popover** (§ 8) — `--surface-700`, `--radius-md`, `--shadow-pop`, 12px text, hover/focus delay 400ms, Esc to dismiss — governs the plain-language explanation.
  - **MessageRow** (§ 8 StudyHall primitive) — the per-message affordance slot; it already renders amber "Sending…" and danger "Failed to send" sub-indicators (`direct-messages.html:411,423`). The per-message E2E micro-affordance renders in the same slot with the SAME visual weight (quiet, `text-xs`), never louder.

## 5. Responsive contract

Per `design/DESIGN-SYSTEM.md` § 9 (desktop app; breakpoints 1024 / 1280 / 1440+):
- **Desktop full (1440+):** header badge shows glyph + full text label (e.g. "End-to-end encrypted" / "Not encrypted"). Per-message affordance shows glyph + short label where relevant.
- **Desktop default (1280):** identical — glyph + label. All three panes visible; badge sits in the thread-header action cluster left of the search/member-list controls.
- **Desktop compact (1024):** member list collapses to a toggle; the E2E header badge MAY collapse label → glyph-only with the full text moved into the hover/focus tooltip (space priority to participant name). The dot/glyph colour still conveys state; tooltip carries the words. State must remain distinguishable icon-only (shape differs across states, not colour alone — see § 6 a11y).
- **Narrow (<1024, overlay-drawer mode):** header badge is glyph-only (tooltip on tap/focus). Per-message affordance stays glyph + label since it is inline in the message column. Touch target ≥44px for the badge and any tooltip trigger.

## 6. Interaction patterns

- **Hover/focus (header badge):** reveals the Tooltip/Popover with the plain-language state explanation (400ms hover delay per § 8; immediate on keyboard focus). Esc dismisses if it is a click-popover variant.
- **State transition:** 200ms colour fade between states (§ 6 motion; matches ConnectionStateIndicator), never abrupt. Loading → resolved must animate calmly; the lock must NOT "pop" in before proof (fail-closed: default to not-encrypted/indeterminate, upgrade to encrypted only on proof).
- **No destructive/primary actions** — the indicator is read-only signal; it is NOT a button that toggles encryption. (If a future affordance lets a user prompt a keyless peer to set up keys, that is out of scope here — § 10.)
- **Keyboard accessibility:** header badge is focusable (`tabindex`/native) so the tooltip is reachable without a mouse; focus-visible emerald ring (`--glow-focus`). Tab order: after participant name, before search. `role="status"` + `aria-live="polite"` on the live-updating region so a state change (e.g. peer registers a key mid-conversation → conversation becomes encrypted) is announced calmly, not interruptively.
- **Colour-independence (load-bearing a11y):** each state MUST be distinguishable by GLYPH SHAPE and TEXT, not colour alone (§ 8 ConnectionStateIndicator a11y: "state in text, not color alone"; DESIGN-PRINCIPLES rule 1 contrast discipline). A colour-blind or grayscale user must still tell encrypted (closed shield/lock) from not-encrypted (open lock / slashed shield) from cannot-decrypt (key glyph).
- **Reduced motion:** respect `prefers-reduced-motion` — disable the fade/spin, snap between states (§ 6).

## 7. Data shape

The indicator is a pure function of client-side crypto state (no dedicated endpoint — it reads state the DM view already computes at B-3):
- **Per-conversation:** derived from `getPeerEncryptionKey(peerUserId)` result (from `GET /profile/:userId/encryption-key` → `PublicKeyResponseSchema` on 200 = peer has a key; uniform 404 = no key / not permitted → plaintext fallback) AND thread type (1:1 vs group). `{ conversationEncryptable: boolean, isGroup: boolean }`.
- **Per-message:** derived from the message envelope the DM view already holds — `{ ciphertext: string | null, senderKeyRef: string | null, envelopeVersion: number | null, content: string | null }`. Encrypted-and-decrypted → state 1; `content` present + `ciphertext` null → state 2 (plaintext fallback); `ciphertext` present but local decrypt failed / no key in IndexedDB → state 4 (cannot-decrypt).
- **No PII, no key material** rendered — the indicator shows STATUS only, never the key, never the ciphertext.
- **Fail-closed default:** any indeterminate/loading/error in resolving the above → render NOT-encrypted (or cannot-decrypt for the message case), NEVER encrypted. Absence of proof = not encrypted.

## 8. Prior art (match this visual language)

- **Header badge structure + a11y + placement → match `design/direct-messages.html:324-338`** (the "Action & Connection Wedge" ConnectionStateIndicator pill: `flex items-center gap-2 px-3 py-1.5 rounded-full ... role="status" aria-live="polite"`, dot + `text-xs font-medium` label, sits in the thread-header right cluster). The E2E badge is its visual sibling — same pill geometry, emerald tint for the affirmative state exactly as the connection pill uses semantic tints.
- **Per-message affordance weight → match `design/direct-messages.html:406-430`** (the grouped-message "Sending…" amber `ph-clock` + "Failed to send" danger `ph-warning`+Retry sub-indicators: `mt-1 flex items-center gap-1.5 text-xs font-medium`). The E2E micro-affordance uses the identical quiet inline treatment — same size, same slot, never louder.
- **Trust-glyph precedent → match `design/educator-admin-console.html:220,262`** (`ph-shield-check` / `ph-fill ph-shield-check` in `--accent-emerald` as the established verified/trust signal) and the member-profile-card popover shell (`design/member-profile-card.html:107` — `rounded-lg bg-surface-900 border border-border-hairline shadow-pop`) for the hover-tooltip/popover styling.

## 9. Success criteria (APPROVE checklist)

The design is approved only when ALL of these hold:
- [ ] Uses exactly the DESIGN-SYSTEM.md tokens listed in § 4 — no new hex values, no invented tokens, dark-only.
- [ ] Renders ALL states in § 3: encrypted, not-encrypted (plaintext fallback), not-encrypted (group DM), cannot-decrypt-on-this-device, loading/establishing, and the hover/focus tooltip.
- [ ] Responsive per § 5 (label→glyph-only collapse at ≤1024 with tooltip carrying the words; ≥44px touch target).
- [ ] Matches prior-art visual language from § 8 (ConnectionStateIndicator pill geometry + MessageRow sub-indicator weight + emerald `ph-shield-check` trust glyph).
- [ ] Interaction patterns per § 6 (hover/focus tooltip, 200ms state fade, keyboard-reachable, `role="status"` aria-live, reduced-motion).
- [ ] All icon references are real Phosphor glyph names (`ph-shield-check`, `ph-lock`, `ph-lock-open`/`ph-shield-slash`, `ph-key`/`ph-lock-key`, `ph-circle-notch`) — none invented.
- [ ] **FAIL-CLOSED (ship-blocker):** the lock/shield "encrypted" affordance appears ONLY in the provably-encrypted state. A plaintext-fallback message, a group DM, and any loading/indeterminate/error state show a clear NON-lock, NON-alarm treatment. There is NO code path or rendered variant in which a padlock can appear over a plaintext or fallback message.
- [ ] **NON-ALARMING (brand):** the not-encrypted and cannot-decrypt states use `--text-secondary` / `--text-muted` (calm grey), NOT `--danger`/red. No security-theater red-lock; no cutesy affordance. Calm, academic, honest.
- [ ] **UNAMBIGUOUS-AT-A-GLANCE + colour-independent:** encrypted vs not-encrypted vs cannot-decrypt are distinguishable by glyph SHAPE and TEXT, not colour alone (grayscale-safe).
- [ ] Contrast: any text/glyph tint computes ≥ WCAG AA 4.5:1 on its surface (DESIGN-PRINCIPLES rule 1 — verify emerald/secondary/muted on `--surface-800`/`--surface-900`).

## 10. Non-goals

- **DM key-setup / first-use flow as a bespoke screen** — assessed at D-1 audit and FOLDED, not a separate gap. First DM triggers silent client-side keygen (Web Crypto, B-3); the only user-visible surface is the transient "loading/establishing" state (§ 3.5) inside THIS indicator's states. No separate onboarding modal, no key-management dashboard, no "verify safety number" fingerprint-comparison UI (Signal-grade out of scope for v1 per P-3).
- **Key-loss recovery / multi-device / key backup UI** — v1 posture is browser-only key with honest degrade (P-3 accepted constraints, logged to product-decisions). The "cannot-decrypt-on-this-device" state is the ONLY surface for this; no recovery flow is designed here.
- **A toggle to turn encryption on/off** — encryption is automatic-when-possible; the indicator is read-only signal, not a control.
- **Group-DM encryption UI** — group threads are plaintext-fallback in leg-3a; this brief only designs their honest not-encrypted indicator, not any group-crypto affordance.
- **Server-side / educator-visible encryption status** — server is blind by invariant; no admin console surface here.

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` should score: visual hierarchy (does the encrypted state read as calm-affirmative, not loud?), spacing rhythm (badge matches connection-pill geometry), brand coherence (calm/academic/dark-only; no red-lock security-theater; no cutesy), edge-case handling (all 6 states + loading + reduced-motion + ≤1024 collapse), accessibility (colour-independent, `role="status"`, contrast ≥4.5:1, keyboard-reachable tooltip), responsive behaviour.

`/ui-ux-pro-max` should verify: every § 9 criterion as a checkbox; DESIGN-SYSTEM.md token audit (no invented hex, dark-only, exact § 4 tokens); Phosphor glyph audit (all names real); UX-flow sensibility (does a student correctly read "private" vs "not private yet" without misreading?). **HARD GATE:** REVISE/REJECT any variant in which a lock/shield could render over a plaintext-fallback, group-DM, loading, or cannot-decrypt state — that is the fail-closed ship-blocker and overrides any aesthetic merit.

---

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced. §4 cites 10+ DESIGN-SYSTEM primitives (5 colour tokens + typography + spacing/radius + shadows + Phosphor icons + 4 reused components). §8 names 3 prior-art mockups with line ranges (direct-messages.html header + MessageRow, educator-admin-console.html trust glyph, member-profile-card.html popover). §9 has 10 checkboxes including the fail-closed, non-alarming, colour-independent, and contrast checks. DM key-setup gap AUDITED → FOLDED (silent keygen; only visible surface is this indicator's loading/establishing state) — not a separate gap. Group-DM out-of-scope confirmed plaintext-fallback per P-4 binding correction."
```
