# Wave 86 — P-2 Spec (pointer)
**Source of truth:** task f8fb8023 description. spec-id wave-86-spec · single-spec (auth, security-scope) · design_gap_flag false.
## ACs (copy)
1. Session.init sets antiCsrf EXPLICITLY to the header-correct value (NONE or VIA_CUSTOM_HEADER — NOT VIA_TOKEN; supertokens-integration determines vs supertokens-node@24) + documented rationale.
2. REGRESSION TEST: a cookie-only forged cross-site POST (session cookie, no Authorization/anti-CSRF header) is REJECTED 401/403 (load-bearing permanent guard).
3. Legitimate bearer-authed request still 200; WS handshake still authenticates (no regression).
4. Documentation: why header transport is CSRF-safe + cross-ref wave-84 migration trigger + the ws-auth handshake CSRF-safety.
Reframed from the seed's wrong VIA_TOKEN (cookie-mode value post-header-transport). No live vuln. P-4 security-scope gate + T-8 live forged-POST verification apply.
