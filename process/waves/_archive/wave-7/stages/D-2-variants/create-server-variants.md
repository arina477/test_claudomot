# D-2 Variants — create-server

**Staging file:** `design/staging/create-server.html`
**Generation approach:** Authored directly (RECOVERY — design lost in worker restart; target known from prior APPROVED run). Re-scoped from the reverted 3-step wizard to a single-step name modal matching `POST /servers { name }`.
**Variant decision encoded:** single-step modal (one name input → Create) vs. the wrong multi-step wizard. The meaningful decision — "ask only for what the API takes" — is settled by the spec; the mockup renders all six required states (default / valid-input / validation-error / loading / server-error / success) as a state gallery over a dimmed shell.
**Token discipline:** Tailwind config maps surface.950/900/800/700/600/500, accent.emerald, accent.amber, danger to DESIGN-SYSTEM hex. Text/borders via CSS vars (--text-primary/secondary/muted, --border-hairline/hover). Scrim/shadows from DESIGN-SYSTEM §5. No invented hex.
**`/aidesigner` warnings:** n/a (authored directly).
