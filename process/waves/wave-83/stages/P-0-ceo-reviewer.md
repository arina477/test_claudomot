# Wave-83 P-0 — ceo-reviewer verdict (strategic-value + ambition)

> RE-SEEDED wave. The original wave-83 seed (ParseUUIDPipe / uuid-param-500) was
> DROPPED at P-0 because its premise had evaporated (already closed by wave-33's
> global filter + wave-40's REFRAME + regression test). This verdict is for the
> NEW seed 875b97f4 (API security-headers hardening). The prior SCOPE-REDUCTION
> verdict above the re-seed in git history pertains to the dropped ParseUUIDPipe
> seed and does not carry.

```yaml
verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Not HOLD-SCOPE: helmet is being ADDED to main.ts anyway for HSTS, and the same
  one-line helmet() call ships the other cheap response-header defaults (X-Content-Type-Options:
  nosniff, X-Frame-Options/frame-ancestors, Referrer-Policy) at zero marginal cost.
  Shipping HSTS-only while deliberately leaving the sibling headers off — when the
  wiring that grants them is in the same PR — is the "3/10 when a 9/10 was one arg
  away" trap. Not SCOPE-EXPANSION: the disproportionate add here is a SMALL, bounded
  set of header defaults, not a new capability or a milestone-sized lift — SELECTIVE
  (cherry-pick the one cheap multiplier) is the honest altitude, not EXPANSION.
  Not SCOPE-REDUCTION / DROP: unlike the dropped ParseUUIDPipe seed, this premise is
  verified LIVE (x-powered-by:Express present, no Strict-Transport-Security, no helmet
  in main.ts) — all three items are genuinely unaddressed, so there is real, non-theatre
  work. The expansion is bounded and gated (see the over-reach guard in proposed_scope_change).
bet_traced_to: "Academic tools + offline-first win students from Discord (only live bet)"
milestone_traced_to: "unassigned — all 14 milestones shipped; roadmap terminal; founder bug-fix-phase directive (product-decisions 2026-07-09, lines 899/901). Cross-cutting infra hardening → milestone stays NULL, valid terminal state."
proposed_scope_change: |
  HOLD the seed's 3 items (HSTS via helmet + generic 429 body + disable x-powered-by)
  and LIFT to a coherent "API security-headers baseline" by letting the helmet() call
  that is ALREADY being added for HSTS also emit its cheap, safe response-header
  defaults in the same wave:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options / frame-ancestors (clickjacking; the API renders no HTML but a
      DENY/none default is free and correct for a JSON API)
    - Referrer-Policy (helmet default)
  Rationale for folding them in NOW rather than a future wave: the enabling change
  (adding helmet) is identical; these are on-by-default in helmet; splitting them into
  a separate backlog item pays the review/deploy/T-8-probe cost twice for a one-line delta.

  OVER-REACH GUARD (this is the load-bearing constraint, not a nice-to-have):
    - This API serves JSON to a separate SPA origin (web and api are different Railway
      origins — see task 9535895f). helmet's DEFAULTS include a strict Content-Security-Policy
      and Cross-Origin-Resource-Policy: same-origin that are tuned for HTML-serving
      same-origin apps and CAN break a cross-origin JSON API (blocked fetches, CORS
      interaction). Do NOT ship helmet's full CSP for the API blind.
    - Therefore: EXCLUDE a bespoke API CSP from this wave (the seed's "minimal CSP for
      the API" idea is the part that carries per-endpoint tuning risk — defer it). Configure
      helmet to enable only the flat, no-tuning headers above, and either disable helmet's
      default contentSecurityPolicy / crossOriginResourcePolicy or set them explicitly to
      values verified not to break the existing web→api fetch path.
    - T-8 must probe that a normal authenticated web→api request STILL succeeds after
      helmet lands (no CORS/CORP/CSP regression) — that negative check is the real risk
      here, not the header presence itself.

  Net: the wave grows from 3 headers to ~5-6 flat headers + x-powered-by off + generic
  429 body, all from one helmet() wiring, with the CSP/CORP-tuning surface explicitly
  fenced OUT. Same cost, materially better baseline, bounded risk.
drop_rationale: |
  (n/a — not DROP)
escalation_reason: |
  (n/a — no strategic conflict beyond ceo authority. Bug-fix directive is founder-set;
  no bet/milestone tension. The httpOnly/CSRF sequencing note below is a SOFT flag to
  N-1/founder, not an ESCALATE — reprioritizing the backlog is their call, not mine to force.)
sibling_visible: false
```

## Strategic reasoning (audit detail)

**1. Worth doing? Yes — and it clears the bar higher than the dropped seed did.**
The self-scoped "LOW / no-exploit / defense-in-depth" label is HONEST — none of the
three items is a live exploit (HSTS matters only on a downgrade/MITM attempt; a leaked
`ThrottlerException` class name and `x-powered-by: Express` are fingerprinting, not a
breach). But LOW-but-REAL clears the floor in a deliberate hardening/bug-fix phase for
three reasons: (a) the premise is verified LIVE, not assumed — this is not the
evaporated-premise trap that killed the ParseUUIDPipe seed and the wave-54 item; (b)
security-header hygiene on a real deployed product is exactly the "defense-in-depth"
class I previously soft-ranked ABOVE cosmetic backlog items — this seed IS one of those
items; (c) it is founder-queued and closeable cheaply. It is a legitimate wave.

**2. Ambition altitude — the seed is a hair UNDER, and the fix is SELECTIVE, not full expansion.**
The seed proposes exactly the three headers whose absence was probed. But the mechanism
it adds — `helmet()` — is a package whose *entire value* is emitting a whole family of
safe response headers from one call. Shipping HSTS-only out of a freshly-added helmet is
leaving free, correct headers (`nosniff`, frame-ancestors, Referrer-Policy) on the table
for no reason. That is a 3/10-shaped slice of a 9/10 that costs the same. So ambition
goes slightly UP — but only to the flat, on-by-default header set.

The part that must NOT be lifted is a bespoke **API CSP**. That is where over-reach bites:
helmet's defaults (strict CSP, `Cross-Origin-Resource-Policy: same-origin`) are built for
HTML same-origin apps and can silently break a cross-origin JSON API — and StudyHall's web
and api ARE different origins. A blind helmet-defaults ship is the inverse failure: a 9/10
grandiose sweep that regresses live traffic. So the disciplined altitude is: take every
FLAT header, fence OUT the CSP/CORP tuning surface, and make T-8 prove the web→api fetch
path still works. SELECTIVE-EXPANSION, not EXPANSION, captures exactly that "cherry-pick
the one cheap multiplier, refuse the risky bundle" call.

**3. Reprioritization — the single most important strategic point.**
There are two HIGHER-severity security items sitting in the same unassigned queue, both
`todo`, both pre-existing, both ranked above this seed on user-facing risk:
  - **9535895f — httpOnly session-token storage (MEDIUM):** session tokens arrive as
    JS-readable response headers instead of httpOnly cookies → a real XSS token-exfil
    surface. This is the strongest security pick in the queue and outranks header hygiene.
  - **f8fb8023 — explicit anti-CSRF (VIA_TOKEN):** no live vuln today (SuperTokens implicit
    default already rejects forged POSTs, penetration-tester-verified at wave-49); pure
    legibility/regression-lock. Roughly PEER to this seed, arguably below it.

My call: this wave is FINE to run as the cheap header baseline — it is bounded, verified,
and closes a genuine gap. But if the founder/N-1 wants to sequence the security backlog by
impact, **httpOnly (9535895f) is the higher-leverage security wave and should go before or
right after this one.** I flag that as a soft note, NOT an ESCALATE — backlog ordering in a
founder-directed bug-fix phase is N-1/founder's call, and there is no bet/milestone conflict
forcing my hand. The header baseline and the httpOnly change are independent surfaces
(response headers vs. token transport), so doing this one first strands nothing.

**Precedent alignment.** This respects the project's own hardening discipline: line 664
DROPPED a defense-in-depth `isUuid` add because it "wasn't worth the LOC" when the class was
already closed. The inverse logic applies here — the sibling headers ARE worth the (near-zero)
LOC precisely because the enabling helmet wiring is being paid for anyway, and unlike that
case the gap is verified OPEN, not already-closed. Same rule, opposite direction, same author.

**Disposition:** SELECTIVE-EXPANSION — ship the 3 seed items PLUS the flat helmet header
defaults from the same wiring; fence OUT any bespoke API CSP / CORP tuning (over-reach risk
on the cross-origin JSON API); make T-8 prove the web→api fetch path survives helmet. Soft
note to N-1/founder: httpOnly session cookies (9535895f) is the higher-impact security wave
and a strong candidate to sequence next.
