# P-4 Phase-2 Drift Verification — wave-86 (jenny)

**Scope:** Cross-reference wave-86 SPEC (task `f8fb8023`) + PLAN (`P-3-plan.md`) against prior decisions (`product-decisions.md`) + the journey map for DRIFT. Per-item MATCHES/DRIFTS below. I do NOT see karen's output.

**Wave (REFRAMED):** Make SuperTokens `antiCsrf` EXPLICIT to the header-correct value (NONE or VIA_CUSTOM_HEADER, NOT the seed's cookie-mode VIA_TOKEN) + a cookie-only-forged-POST regression test + CSRF-safety documentation.

**Verdict: APPROVE** — no blocking drift. One non-blocking gap (spec-adequate at P-2, pinned to B-block) + one advisory note.

---

## Item 1 — REFRAME vs wave-84 header-transport decision → **MATCHES**

wave-84 BOARD decision (product-decisions.md:907-911, Tier-3 7/7 unanimous B): **keep SuperTokens HEADER token transport** for the cross-SITE SPA; do NOT switch to httpOnly cookies. Recorded config-drift + migration trigger (:910): before GA / first real external users, revisit httpOnly-via-custom-domain/reverse-proxy (would restore SameSite=Lax cookies).

The wave-86 reframe **keeps** header transport and sets `antiCsrf` to the value CORRECT for header transport — it switches NOTHING. Verified against live code: `apps/api/src/auth/supertokens.config.ts:123` has `getTokenTransferMethod: () => 'header'` live, `cookieSameSite` at :153, and NO `antiCsrf` key currently (matches the spec's "no antiCsrf currently" claim, :Refs). Setting `antiCsrf` explicitly to the header-correct value is fully consistent with — not a contradiction of — the wave-84 header-transport posture. In header mode CSRF is structural (bearer not auto-attached cross-site; token read from the Authorization header), so `NONE` is the correct+safe explicit value, not a weakening.

Additionally the spec (AC4) + plan (:10) **cross-reference wave-84's pre-GA cookie-migration trigger** — the exact scenario (:910) where `antiCsrf` becomes load-bearing and the regression test becomes the guard. This is architecturally faithful: the wave anticipates the recorded migration path rather than ignoring it. **MATCHES.**

## Item 2 — Consistency with wave-49 F-2 finding + pen-test (no live vuln) → **MATCHES (honest framing)**

The seed (wave-49 T-8 F-2, journey-map wave-49 note line 24) recorded anti-csrf as **"implicit-not-explicit (PRE-EXISTING project-wide, non-exploitable — live blocks forged POSTs)"**, i.e. **no live CSRF vulnerability** (wave-49 pen-test confirmed the forged cookie-only POST → 401). The spec preface states this verbatim: "There is NO live CSRF vuln (wave-49 pen-test confirmed)."

The reframed scope is **make-explicit + regression-lock**, NOT fix-a-vuln. The spec's framing — "makes the posture EXPLICIT + LEGIBLE + regression-locked (not the seed's literal VIA_TOKEN)" — correctly reflects that there is no live vulnerability. The wave does NOT overstate a security fix: it is legibility (kill the silent/implicit state that could regress) + a permanent regression guard, honestly labelled. This is the same posture wave-49 already verified live. **The "no live vuln, this is legibility + regression-guard" framing is honest. MATCHES.**

## Item 3 — No route/screen/endpoint/user-flow change → **MATCHES**

Spec `contracts` block: `types: []`, `data: []`, `api: ["No endpoint path/method/schema change. SuperTokens Session.init antiCsrf option only."]`, `design_gap_flag: false`. Plan "Data model / API contracts / deps: None. No endpoint/type/schema change." confirmed.

Journey-map cross-check: no wave-84/85/86 route entries exist; the last route additions were `/discover` + `PATCH /servers/:id` (wave-67/68). Auth config is not a journey surface — it is invisible to the user. The wave touches only `supertokens.config.ts` (Session.init option + comment), an optional one-line ws-auth.ts cross-ref comment, a test file, and docs. **No user-visible surface changes. MATCHES.**

## Item 4 — Spec-gap: realistic cookie-only forgery + WS cookie-path interaction → **ADEQUATE (non-blocking gap correctly deferred)**

The spec DOES flag the exact edge the prompt names, in its `edge-cases` block:
- **Cookie-set reality:** "In header transport mode, does SuperTokens even SET an sAccessToken cookie? (Likely not…). The regression test must construct a realistic cookie-only forgery: if no cookie is ever set, the test asserts a request with a fabricated/prior sAccessToken cookie + no Authorization header → 401 (no valid token read). supertokens-integration confirms the exact mechanics against the deployed behavior." — this is the correct construction: the test must not depend on a cookie the header-mode server never sets; it forges one and asserts rejection.
- **WS cookie-path interaction:** the second edge-case explicitly names `ws-auth.ts:50-54` (reads sAccessToken cookie first, handshake.auth fallback) + `:72` (CSRF-safe handshake comment) and requires the explicit `antiCsrf` value + doc **not change WS auth behavior**. Verified live: ws-auth.ts:50-54 reads `parsed.sAccessToken` cookie-first with handshake.auth fallback, and the :72 comment ("no CSRF risk on WS upgrade… one-time authenticated handshake, not a form-submittable request") is present exactly as the spec describes. AC4 requires cross-referencing that comment; AC3 requires the WS handshake still authenticates.

**Gap assessment (drift vs gap — this is a GAP, non-blocking):** the exact test mechanics (does header mode set an sAccessToken cookie? construct fabricated-cookie-no-header vs cookie-plus-header?) are left to supertokens-integration at B-block, verified against installed supertokens-node@24 + deployed behavior (spec SDK checklist + plan :19). This is the **correct** disposition — pinning exact wire mechanics at P-2 would be speculative against un-verified SDK behavior; the SDK-doc/verify-before-code rule mandates B-block verification. The spec names the required PROPERTY the test must prove (cookie-only forgery → 401/403) unambiguously; only the construction detail is deferred, and it is deferred to the right owner with the right verification gate. **Adequate — no rework needed.** The WS interaction is adequately covered (explicitly called out as a must-not-break-behavior edge with the exact file:line + the CSRF-safe comment to cross-ref).

## Item 5 — Any prior decision expecting VIA_TOKEN / CSRF-token protection that antiCsrf=NONE would drift from → **NO DRIFT (none exists)**

Exhaustive grep of `product-decisions.md` for `antiCsrf | anti-csrf | VIA_TOKEN | CSRF` outside the wave-84/86 entries returns **zero** results. There is NO recorded architectural expectation of `VIA_TOKEN`, cookie-mode CSRF tokens, or token-based CSRF protection anywhere in the decision log. The only place `VIA_TOKEN` appears is the wave-49 **seed's** ask, which both wave-86 P-0 reviewers already REFRAMED as predating wave-84's header transport (spec preface: "VIA_TOKEN (a cookie-mode value) would be config drift/theater").

The recorded architecture (product-decisions line-73 item (6) short-lived-JWT-cross-origin-fallback + item (10) SameSite=Lax, continued by wave-84) is a **header/bearer** posture, for which `NONE` is the correct value. `antiCsrf=NONE` (or `VIA_CUSTOM_HEADER` for WS defense-in-depth) for header mode contradicts NO recorded security requirement. **No DRIFT.**

---

## Summary

- **Verdict: APPROVE.** SPEC + PLAN MATCH the recorded architecture on all 5 checks. The reframe (keep header transport, set antiCsrf to the header-correct value, switch nothing) is consistent with the wave-84 header-transport decision and anticipates its pre-GA cookie-migration trigger.
- **Honesty check (item 2): PASS** — framed as legibility + regression-guard, NOT a vuln fix; consistent with wave-49's no-live-vuln pen-test finding. No security overstatement.
- **No user-visible surface change (item 3): CONFIRMED** against journey map (auth config, a test, docs).
- **No contradicting VIA_TOKEN/CSRF-token expectation exists (item 5): CONFIRMED** by exhaustive grep — NONE-for-header-mode drifts from nothing.
- **One non-blocking GAP (item 4, not drift):** exact regression-test wire mechanics (fabricated-cookie construction; does header mode set sAccessToken?) deferred to supertokens-integration at B-block against supertokens-node@24 + deployed behavior. This is the correct owner + gate; the spec names the property to prove unambiguously and flags both the cookie-set-reality edge and the WS-cookie-path interaction (ws-auth.ts:50-54/:72) adequately. No P-2 rework required.
- **Advisory (non-blocking):** the NONE-vs-VIA_CUSTOM_HEADER choice is correctly left to B-block; either value is header-mode-safe. Ensure the AC1 code comment makes explicit that NONE is CORRECT-not-weakened so a future reviewer does not "fix" it back to VIA_TOKEN (spec edge-case 3 already mandates this — verified present).
