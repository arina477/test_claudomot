verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  HOLD-SCOPE and not the other three. SCOPE-EXPANSION is wrong: the founder
  made an explicit "a bit of both" ruling on 2026-06-29 — do exactly two
  hardening items (auth rate-limiting + finish avatar storage) THEN move to
  M2 servers / M3 messaging. The "more is possible" question was already
  asked and answered; expanding now would override a fresh founder decision,
  not honor it. SELECTIVE-EXPANSION is wrong: there is no cheap-but-
  disproportionate addition — the bigger value lever (M2/M3 core product) is
  deliberately sequenced AFTER this wave by the founder, not foldable into it.
  SCOPE-REDUCTION / DROP is wrong: neither item is a real-bug-that-doesn't-
  matter — rate-limiting is a real wave-2 T-8 security gap that is REQUIRED
  before the public-launch / auth-frontend wave (live probe confirmed zero
  429s), and avatar storage is the last unfinished slice of an already-built
  profile feature (presign path deployed, storage unwired pending creds the
  founder is now supplying). Both are exactly the two the founder named; the
  lower-value follow-ups (branch-protection, CI node-20, version-bump,
  browser-E2E) are correctly NOT in this wave per the same ruling. The bar
  here is execution quality, not scope change.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "5a6efc9e-9de7-4594-a75d-d45e30d9a417 — M1 Foundation: app shell, auth & profiles"
proposed_scope_change: |
  None. Scope is exactly the two founder-named items.
sibling_visible: false

# Detail

## Faithfulness to the founder decision (the primary test)
The 2026-06-29 product-decision ("hardening-then-core, a bit of both") names
exactly two highest-value hardening items to do NEXT, before M2/M3:
  1. login rate-limiting  -> task 839af17f (this wave's seed)
  2. finish avatar storage -> task 84e09891 (this wave's sibling)
The wave-5 bundle is precisely {839af17f + 84e09891}, parent/child, both under
M1. No padding: the four lower-value follow-ups the founder said to defer
(478e9d43 branch-protection, a7667fb7 CI node-20, e38c306e version,
c51589cd browser-E2E) are absent from the bundle and stay tracked under M1.
The N-1 reconciliation (also 2026-06-29) cleared the stale wave_id on exactly
these two ids and parented them correctly. DB state matches the logged ruling.
=> Faithful. The "is it the right thing" question is settled by the founder;
   I confirm the wave executes that ruling and nothing more.

## Ambition / sizing
Both are right-sized for a platform-foundation milestone — neither is gold-plated:
  - Rate-limit: standard @nestjs/throttler at 10/min on signup/signin/reset,
    matching the architecture _library mandate, + a 429 verification. This is
    the documented standard, not a bespoke rate-limiter. Correctly sized.
  - Avatar storage: wire the already-built presign path to a real bucket +
    add the ONE missing server-side control (2MB enforcement via presigned
    POST content-length-range or bucket policy — jenny AC7 Medium drift).
    This finishes a feature, it does not invent one. Correctly sized.
No 3/10-when-9/10-achievable risk (this is hardening of a live, feature-
complete M1, not a feature build). No 9/10-when-3/10-sufficient risk (both
items are minimal slices). Self-use-mvp stage justifies the restraint:
rate-limit urgency is real-but-deferred-able (no public users yet), so doing
the standard throttler now — not an elaborate WAF/Redis-backed scheme — is
the right ambition for the stage.

## Sequencing flag for P-1 (not a scope concern)
The two items have asymmetric readiness:
  - 839af17f (rate-limit) is shippable NOW — no external dependency.
  - 84e09891 (avatar) is GATED on founder-supplied Railway Bucket creds
    (AWS_ACCESS_KEY_ID / SECRET / AWS_ENDPOINT_URL / STORAGE_BUCKET_NAME).
Bundling is fine — they share the M1-hardening theme and the founder named
them as one "next" step. But P-1 should size them so the credential wait on
the avatar task does NOT gate the rate-limit task: rate-limit can land + verify
independently while the bucket-creds ask is outstanding. The creds ask is
already propagated to the wave-5 checklist per the N-1 reconciliation note.
This is a sizing/sequencing note for P-1, not a reason to reduce or split scope.

## Disposition
PROCEED (HOLD-SCOPE). Unambiguously worth doing at the proposed scope:
closes a real security gap that is required before the next public-facing wave,
and completes the last unfinished slice of a shipped feature — both exactly as
the founder directed, with no padding and no gold-plating.
