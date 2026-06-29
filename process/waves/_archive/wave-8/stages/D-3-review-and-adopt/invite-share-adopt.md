# D-3 Adopt — Invite-create/share modal

**Surface:** in-server "Invite people" modal · **Brief:** `process/waves/wave-8/stages/D-1-brief/invite-share-brief.md`
**Adopted file:** `design/invite-share.html` (canonicalized from `design/staging/invite-share.html`)
**Disposition:** COMPOSE-ONLY from locked primitives (Modal/Button/Toast/Input); new file.

## Adoption rationale (tied to the brief's job)
The user job is: an owner/member inside a server gets a shareable link out to cohort-mates with one tap. The adopted modal composes the exact `create-server.html` Modal pattern (header + body + footer, `role="dialog"` + `aria-modal`, dimmed-app-shell-behind, side-by-side state showcase) — no new component class — so it slots into the existing chrome without fragmenting the system. It shows the full `/invite/:code` URL in a read-only Geist-Mono field with a single emerald "Copy link" primary, and confirms copy via both a `role="status"` Toast and a transient button morph. Scope is held to the minimum the wave allows: no max-uses/expiry pickers, no role/permission/revoke/kick/ban UI.

States rendered: default / copied / loading / error.

## Stage-exit checklist
- [x] One variant adopted with written rationale tied to the brief's job.
- [x] Accessibility audit run (accessibility-tester) — initial verdict FAIL (1 blocker: error-state input danger border at 0.4 alpha + opacity-60 ≈1.5:1, imperceptible). **Blocker resolved** before adoption: border raised to `rgba(239,68,68,0.8)`, `opacity-60` removed. Re-verified visually + by markup.
- [x] No new design token introduced; off-system hex scan returns only the 9 DESIGN-SYSTEM tokens.
- [x] Reachable + coherent with adjacent chrome — composes the create-server.html modal pattern verbatim; overlays the server-rail-sidebar chrome; link destination is the adopted invite-join page (visual coherence).
- [x] Gate verdict issued by a fresh reviewer (head-designer), not authored by the build/orchestrator.

## Reviewer output read
- accessibility-tester: FAIL → blocker fixed → cleared. All other patterns PASS (focus rings on every control + input, modal `role="dialog"`/`aria-modal`/`aria-labelledby`, `aria-busy` on loading, `role="status"` toast / `role="alert"` error, labelled inputs, decorative icons `aria-hidden`). Focus-trap/Esc/focus-restore documented in markup as runtime responsibility for B-3.
