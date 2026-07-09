# Wave 84 — P-4 Verdict

**Reviewer:** head-product (Phase 1) + karen/jenny/Gemini (Phase 2)
**Attempt:** 1

## Phase 1 — head-product: APPROVED
Escalation + BOARD 7/7 Option B handled correctly (web/api genuinely different SITES — in-code comment corroborated; cookie mode would force fragile cross-site cookies). Floor-waive legit (PRODUCT-5). 6 falsifiable ACs; AC5 (CSP-doesn't-break-SPA/fetch/WS) correctly load-bearing + T-8-testable; CSP-on-web-HTML correct (api serves JSON). Plan sound; connect-src https+wss pinned. Scope = exact BOARD mandate. Security-scope-tightened gate flagged for Phase-2.

## Phase 2 — Karen + jenny + Gemini: APPROVED (gate passes)
- **karen: APPROVE** — all load-bearing claims VERIFIED file:line (api/web Session.init gaps real; different-SITE premise documented in-code twice; 4 WS namespaces exist; wave-83 api-CSP-disabled confirms web-CSP is separate; web addresses api via VITE_API_ORIGIN). One CORRECTION (non-blocking): serving layer is `serve -s dist` not `vite preview` — folded into spec.
- **jenny: APPROVE** — all items MATCH recorded architecture (BOARD posture consistent with product-decisions line-73 items 6+10; CSP-vs-wave-83 not a contradiction; connect-src protects the wave-83-verified flow; no journey change). One REQUIRED spec-gap (folded): CSP must allowlist Google Fonts (fonts.googleapis.com style-src + fonts.gstatic.com font-src) — the ONLY external resource; a self-only CSP would break the typeface + fail AC5.
- **Gemini: UNAVAILABLE** (helper exit 3, HTTP 429). Degrades per P-4 Action 3; does not block.
- **Security-scope gate:** Phase-2 returned no BLOCK (both findings are APPROVE-with-folded-corrections, 0 blocking medium+). Single Phase-2 pass suffices.

## Footer
- verdict_complete: true
- gate_result: APPROVED (both Phase-2 corrections folded into spec: Google Fonts CSP allowlist + serve-not-vite-preview)
