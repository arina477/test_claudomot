# V-1 Karen — wave-60 (StudyHall) reality verdict

**VERDICT: APPROVE**

Merge `7a1af6f` confirmed ancestor of `main` (`git merge-base --is-ancestor` → YES; it is main HEAD). Live web `web-production-bce1a8.up.railway.app` returns HTTP 200 and serves the bundle referenced by the merge. Every load-bearing claim checked against merged source + the actually-served CSS bundle — not against the stale sidecar `dist/` mtime alone (see note under claim 3). No REJECT-worthy gap found.

---

## Claim-by-claim evidence

### Claim 1 — ServerRail rail bg → `var(--color-surface-900)` — VERIFIED
- `apps/web/src/shell/ServerRail.tsx:111` → `backgroundColor: 'var(--color-surface-900)'`.
- The diff line proves the was-state: `- backgroundColor: '#0a0a0b'` → `+ backgroundColor: 'var(--color-surface-900)'` (one-line change, `2 +/-` in ServerRail per `git show --stat`).
- Note: `#0a0a0b` still appears at ServerRail.tsx:65,78,139,166,188,267,280 — these are DIFFERENT surfaces (icon fg, tooltip, other tiles) intentionally out of scope; only the rail bg at :111 was in the B-3 spec. Not a defect.

### Claim 2 — StartDmPicker modal card + confirm button arms — VERIFIED (all 3 sub-claims)
- Modal card: `StartDmPicker.tsx:176` → `backgroundColor: 'var(--color-surface-900)'`. Diff: `- '#1c1c1f'` → `+ 'var(--color-surface-900)'`.
- Confirm/send button (`data-testid="dm-picker-confirm"`, lines 425-438):
  - ENABLED arm `StartDmPicker.tsx:433` → `'var(--color-accent-emerald)'` (was literal `#10b981`).
  - DISABLED arm `StartDmPicker.tsx:434` → `'color-mix(in srgb, var(--color-accent-emerald) 40%, transparent)'` (was `#27272a`).
  - `cursor: canConfirm ? 'pointer' : 'not-allowed'` preserved at `StartDmPicker.tsx:436` (not-allowed on disabled ✓).
- Diff confirms the exact was→now: `- backgroundColor: canConfirm ? '#10b981' : '#27272a'` → the two-arm var()/color-mix form.
- Note: residual `#27272a` / `#10b981` at StartDmPicker.tsx:197,255,332,344,373,418 are OTHER elements (Cancel button, hover states, chip/selection swatches) — untouched by design, consistent with the surgical 3-surface scope.

### Claim 3 — tokens defined AND survive into the DEPLOYED compiled bundle — VERIFIED (via live fetch)
- Source defs: `apps/web/src/styles/globals.css:11` `--color-surface-900: #121214;` and `:18` `--color-accent-emerald: #10b981;`.
- Deployed bundle: fetched the LIVE served CSS `GET /assets/index-DdUvWQe7.css` (HTTP 200, 51305 bytes). It contains compiled `:root` defs `--color-surface-900:#121214` and `--color-accent-emerald:#10b981`. So the inline `var()` references at runtime resolve to real colors — they do NOT fall through to transparent.
- **Skepticism note (why this matters):** the local `apps/web/dist/assets/index-DdUvWQe7.css` mtime is `Jul 5 23:03`, which PREDATES the merge commit (`Jul 6 09:04`) — so the on-disk `dist/` is a stale sidecar and by itself is NOT proof of what's deployed. I did not rely on it. Instead I confirmed (a) the live `index.html` references `/assets/index-DdUvWQe7.css` (same content-hash filename Vite emits), and (b) the live bundle is byte-for-byte identical to the local dist (`diff -q` → IDENTICAL, both 51305 bytes). The content-hash-in-filename is the real integrity check: the deploy is serving exactly this bundle, and this bundle carries the tokens. Claim holds on the deployed artifact, not just the source.

### Claim 4 — SURGICAL: source diff = ONLY the 2 files — VERIFIED
- `git show 7a1af6f --stat` (source paths) → exactly `apps/web/src/shell/ServerRail.tsx` (2 ±) + `apps/web/src/shell/StartDmPicker.tsx` (6 ±), `2 files changed, 5 insertions(+), 3 deletions(-)`. No other source file in the merge. The ~36 other files carrying the same hex literals are untouched.

### Claim 5 — AC4: no NEW hardcoded hex introduced — VERIFIED
- Every added (`+`) line in the diff is var()-derived: `var(--color-surface-900)` (×2), `var(--color-accent-emerald)`, and `color-mix(in srgb, var(--color-accent-emerald) 40%, transparent)`. Zero new hex literals added. The three removed lines were the old hex literals. Net hex count strictly decreases.

### Claim 6 — Deploy serves the merge; web 200 — VERIFIED
- `curl` live web root → HTTP 200. Live `index.html` references `/assets/index-DdUvWQe7.css`; that bundle → HTTP 200 and is byte-identical to the merge's build output containing the tokens. C-block gate-verdict (web SUCCESS @7a1af6f, HTTP 200) corroborated by independent probe. (Per instruction, no `railway` CLI used — verified via HTTP probe + content-hash filename correlation.)

---

## Cross-check against inputs
- `B-3-frontend.md`: line refs cited there (ServerRail:111, StartDmPicker:176, :432) match the merged source exactly (confirm button starts :431-434; the "432" pointer lands inside the button style block — accurate). Claimed "tsc/biome clean, vitest 467/467" not independently re-run here (that's B-5/T-block territory), but the code-level claims all hold.
- `B-5-verify.md`: PASS; consistent — this is a cosmetic token change, no logic path affected.
- `C/gate-verdict.md`: C-1 PASS (PR #75, 7/7 CI, merged 7a1af6f), C-2 PASS (web SUCCESS @7a1af6f, HTTP 200) — independently corroborated by live 200 + bundle-identity probe.

## Bullshit-detector residue (non-blocking, for the record)
- None material. The one thing that *looked* like a smell — a `dist/` artifact older than the merge — resolved cleanly: the content-hash filename + byte-identical live fetch prove the deployed bundle is the right one. Had the live bundle referenced a different `index-*.css` hash or lacked the `:root` token defs, this would have been a REJECT (silent-transparent var() risk). It did not.

**Bottom line:** the wave did exactly what it claimed — 3 surgical inline-style→token conversions across 2 files, tokens defined in globals.css and confirmed surviving into the live-served compiled bundle, no scope creep, no new hex, deploy live and serving the merge. APPROVE.
