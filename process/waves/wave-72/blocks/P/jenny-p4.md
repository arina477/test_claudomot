# P-4 Phase-2 spec-drift check — wave-72 (M10 account self-deletion / right-to-erasure)

**Auditor:** jenny (spec-drift lens)
**Scope:** cross-reference the wave-72 3-block spec (erasure API `9658fb0b` + shared DTO `e11f8746` + Danger-Zone UI `898490b1`) + P-3 plan against the user-journey map, product-decisions log, and the D-3-adopted `design/settings-privacy.html` (Panel 5 Danger Zone) for semantic DRIFT.

## VERDICT: **APPROVE**

The erasure spec is the faithful right-to-ERASURE half of a data-rights self-service pair whose right-to-ACCESS half already shipped LIVE (wave-35). It aligns with the adopted design, the shipped ownership model, and the recorded 2026-07-07 M10-promotion decision. The one intentional spec-gap (deferred email-verify + 30-day grace) is soundly handled because the spec makes UI copy reconciliation a hard AC (task `898490b1`). No blocking drift found. Two advisory notes below (neither blocks P-4).

---

## Evidence base (independently verified)

- **Spec** (task `9658fb0b` YAML head + prose) read from DB.
- **P-3 plan:** `process/waves/wave-72/stages/P-3-plan.md`.
- **Journey map:** `command-center/artifacts/user-journey-map.md` — data-rights rows L355 (`/settings/privacy` page-16), L360 (`GET /profile/data` + `/profile/data/export`), L363 (T-8 export IDOR-safe); ownership rows L158 (owner-lockout / transferOwnership), L160/L274 (RBAC default-deny, session-derived userId).
- **Product-decisions:** `command-center/product/product-decisions.md` L790-801 (2026-07-07 FOUNDER public-launch GO + M10 promotion; M10 first-bundle authoring; the soft-vs-hard-delete compliance-regime flag), L21/L764 (moderation launch-gate — now satisfied, M14 shipped L783).
- **Design:** `design/settings-privacy.html` Panel 5 (L557-575) + delete modal (L635-674).

---

## Per-item findings

### 1. Erasure mechanics (soft-delete + scrub + session-revoke + re-auth block + owner-guard) vs the data-rights journey + Panel 5 — **MATCHES**

- The journey (L355, L360-363) documents the SHIPPED right-to-ACCESS half: `/settings/privacy` page-16 "Your data" section + "Download my data", backed by `GET /profile/data` + `/profile/data/export` (`AccountDataService`), T-8-verified IDOR-safe (session-derived subject; `?userId=<other>` ignored). The erasure spec is the symmetric missing half — same module (`apps/api/src/privacy/`), same session-callerId idiom, same no-IDOR posture (`callerUserId = req.session.getUserId()`, no userId in path/body). This is completion of an established journey, not a new/contradictory one.
- The scrub semantics match the design's own promise: Panel 5 delete-modal copy (L650) already states *"Your messages will remain but attribute to a 'Deleted User' to preserve academic context"* — exactly the spec's authored-message tombstone convention (author resolves to scrubbed "Deleted user", no mass purge). The design and spec agree on the message-retention model.
- No prior decision is contradicted. The scrub-of-avatar_key addition (nulling `avatar_url` while leaving `avatar_key` = PII-linked residue) is a correctness tightening over the design, not a divergence.

### 2. SOFT-delete regime vs the 2026-07-07 M10-promotion decision — **MATCHES (no drift)**

- Product-decisions L800 (M10 first-bundle authoring) records the regime choice explicitly: *"Seed defaults to soft-delete+scrub+revoke (reversible, audit-friendly, matches shipped message convention) unless the founder picks strict hard-delete... surface at the first M10 P-0."* The spec implements precisely that default (SOFT-delete, `deleted_at` marker, reversible, no SuperTokens `deleteUser`), and the P-3 plan (step 1-2) carries the founder-facing compliance-regime flag forward (soft-delete-default vs hard-delete/GDPR-purge → daily checkpoint).
- This also matches the roadmap-level M10 framing (L139: "self-use-mvp → H2 default") and the FERPA-audit-retention rationale (L800). Hard-delete is correctly DEFERRED, not silently dropped — the spec names it as a later M10 slice.
- **No drift.** The soft-delete regime is the recorded default; the founder hard-delete option is preserved as a surfaced, non-blocking flag exactly as the promotion decision prescribed.

### 3. COPY reconciliation — Panel 5 "email verification + 30-day grace" vs immediate soft-delete — **spec-gap, SOUNDLY handled → MATCHES design INTENT**

- The adopted mockup over-promises relative to what ships: Panel 5 body (L568) says *"requires email verification and initiates a 30-day grace period"* and the modal CTA (L670) reads *"Send Verification Email"*. The spec implements immediate soft-delete with email-verify + 30-day-grace-then-purge explicitly DEFERRED (task `9658fb0b` edge-cases; task `898490b1` COPY RECONCILIATION AC).
- This is a **spec-gap, not a spec-drift**, and it is handled correctly: task `898490b1`'s third AC makes copy reconciliation a hard requirement — *"adjust the UI copy to match what ships... so the UI does not promise unimplemented behavior. Keep the acknowledgment + typed/checkbox confirm."* The design INTENT (a gated, acknowledgment-required, danger-styled destructive flow) is preserved; only the unshipped specifics of the *mechanism* (email round-trip + fixed 30-day window) are dropped from copy. The mockup itself is explicitly reference-not-contract per the v9 design decision (product-decisions L111: "mockups are reference, not pixel-copy").
- The acknowledgment gate (`design/settings-privacy.html` L660-664 checkbox "I understand my account will be permanently deleted...", disabled-until-checked `deleteBtn`) is retained by the spec — the load-bearing accidental-deletion guard survives. **Sound.** (Advisory A below on the "permanently" wording.)

### 4. Owned-server block-if-owner vs the ownership model in the journey — **MATCHES**

- The journey's ownership invariant (L158, L274; shipped wave-10 owner-lockout, refined through wave-20/21) is *last-owner-cannot-orphan*: a last-owner demote/remove/leave → `409 ConflictException`, transactional (`SELECT FOR UPDATE`), with an atomic `transferOwnership` as the sanctioned escape. The spec's block-if-owner (reject deletion with 409 + the blocking-server list when `servers.owner_id = callerId`, requiring transfer/delete first) is the **same never-orphan-a-server principle applied to the account-deletion path** — it reuses the existing `transferOwnership` primitive as the user's unblock route rather than inventing orphan/cascade semantics.
- Consistent with the P-0 problem-framer finding embedded in the spec and with the RBAC `owner_id` superuser model (L160). Transfer/cascade-on-delete is correctly fenced to a later M10 slice. **No drift** — this is the conservative, model-consistent first slice (409-block over an unbuilt auto-transfer), mirroring how owner-lockout itself shipped block-first.

### 5. New semantic divergence / data-rights gap — does soft-delete+scrub satisfy the user-facing "delete my account" expectation? — **MATCHES (with one advisory)**

- The user-facing promise the journey/design sets is: *your profile/PII is wiped, you're removed from all servers, you can no longer be found by name, and you cannot get back in.* The spec delivers all of that: PII scrub (display_name/username/email/avatar_url/avatar_key → anonymized/nulled), leave-all-servers + presence clear, session-revoke (immediate logout), AND — the load-bearing P-0 finding — a `deleted_at` re-auth block on BOTH doors (SuperTokens `signIn` override AND the session-verify path), so a scrubbed account genuinely cannot re-authenticate via a replayed/refreshed token. Functionally, from the user's vantage, the account is gone and unrecoverable-by-them. This satisfies the "delete my account" expectation at the behavior level.
- The only semantic nuance: it is a *deactivation + PII-erasure* (reversible by an operator clearing `deleted_at`), not a byte-level hard purge. That gap is (a) a deliberate, founder-flagged regime choice (item 2), and (b) reconciled in copy (item 3) so the UI won't claim more than ships. **No unhandled data-rights gap.** For a self-use→newly-public product with FERPA-audit retention as the stated rationale, soft-delete-with-scrub is a defensible right-to-erasure posture for this first slice.

---

## Advisory notes (non-blocking — for B-3 / T-8, not P-4 blockers)

- **Advisory A (copy honesty — reinforces item 3):** when B-3 reconciles Panel 5 copy, ensure the acknowledgment checkbox text (`design/settings-privacy.html` L662: "permanently deleted") is also softened to match the reversible soft-delete reality (e.g. "deactivated and my data scrubbed; recoverable only via support within a grace window"). The AC covers the panel/CTA copy; flag the *checkbox* string explicitly so "permanently" isn't left promising hard-delete. Keep the gate itself.
- **Advisory B (T-8 load-bearing):** the dual re-auth block (signIn override AND session-verify guard, AND-not-OR) is the single highest-risk correctness surface — session-revoke alone leaves the session door open. This is the P-0 CRITICAL finding and must be independently T-8-verified on BOTH doors (replayed pre-deletion token + refresh rotation must NOT re-authenticate). Already correctly flagged in the spec and P-3 plan; noting for downstream so it is not treated as one guard.

## Drift ledger (summary)

| # | Item | Class | Prior decision cross-ref |
|---|------|-------|--------------------------|
| 1 | Erasure mechanics vs data-rights journey + Panel 5 | MATCHES | journey L355/L360-363; design L650 |
| 2 | SOFT-delete regime vs M10-promotion default | MATCHES | product-decisions L800 |
| 3 | Copy: email-verify + 30-day-grace deferred | **spec-gap** (soundly handled) | design L568/L670; recon AC in `898490b1`; v9 "mockups are reference" L111 |
| 4 | Owned-server block-if-owner vs ownership model | MATCHES | journey L158/L274 (owner-lockout, transferOwnership) |
| 5 | Soft-delete satisfies "delete my account" | MATCHES | journey L360-363; product-decisions L800 |

**No spec-drift. One deferred-behavior spec-gap, correctly bounded by a mandatory copy-reconciliation AC. APPROVE.**
