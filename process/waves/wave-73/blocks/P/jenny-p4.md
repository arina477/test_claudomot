# P-4 Phase-2 — Spec-drift check (jenny) — wave-73 (M10 privacy-events audit log)

**Scope:** Cross-reference the wave-73 3-block spec (privacy_events backend `156aa2ee` + shared DTO `03940edd` + read-list UI `5a2521bc`) and the P-3 plan against the M10 decomposition decisions (product-decisions.md L790–811), the data-rights journey (user-journey-map.md wave-35 / wave-72 privacy sections + M14 block bundle), and the established session-scoped/no-IDOR privacy-route pattern.

**Method:** DB spec read (`tasks.description` for the seed) + P-3-plan.md + product-decisions.md L790–811 + journey-map privacy rows (L350–366) + live codebase verification of the 4 seam methods and the reports/controller idioms.

---

## VERDICT: APPROVE

The audit-log spec aligns with the M10 decomposition decision (regime-INDEPENDENT leg; founder-reserved scope correctly fenced), matches the already-shipped data-rights surfaces in the journey map, is a coherent addition to the shipped `/settings/privacy` surface, follows the established session-scoped/no-IDOR privacy-route pattern, and leaks **no** founder-reserved compliance scope. No spec-drift found; one minor spec-gap noted (non-blocking, item 5).

---

## Per-item findings

### 1. Alignment with the M10 decomposition decision (regime-independent; scope fenced) — MATCHES

The spec is the exact slice the N-1 decomposition authored (product-decisions L804–809). Verified point-by-point:

- **Regime-INDEPENDENT:** Spec Problem statement (`This is the regime-INDEPENDENT audit-log leg of M10 — it does NOT presuppose the still-open founder compliance-regime pick`) mirrors the decomposition rationale L806 verbatim in intent. ✓
- **Sized MINIMAL, not compliance-grade:** Spec DESIGN + FENCED block explicitly scopes to "app-level event logging over already-shipped surfaces" and fences "general-purpose/compliance-grade audit infrastructure" — matches the decomposition's "sized MINIMAL … NOT a compliance-grade audit platform" (L806) and the L809 fence.
- **Founder-reserved scope NOT leaked** — the spec's FENCED section fences every founder-reserved item enumerated at L809: compliance-regime pick (soft vs hard delete), FERPA/COPPA/GDPR legal posture + retention policies, consent-management flows, deletion-hardening (email-verify / grace-period / purge), data-residency, general-purpose/compliance-grade audit infra, AND cryptographic tamper-evidence ("append-only-by-convention only"). The spec explicitly states "M10 success metric remains _TBD by founder_." **No leak.** ✓
- The first-M10-bundle fence (L801: "full audit-log infrastructure" deferred) is precisely what this bundle now delivers as its minimal slice — consistent, not a contradiction of the earlier account-erasure fence.

No conflicting prior decision. MATCHES.

### 2. The 4 logged event types vs. already-shipped surfaces — MATCHES

Enum = `['account_deleted','data_exported','privacy_settings_changed','user_blocked','user_unblocked']` (5 values, 4 seams — block/unblock share one seam). Every type maps to a real shipped surface, live-verified in code:

| Event type | Shipped surface | Seam (live-verified method) |
|---|---|---|
| `account_deleted` | Account erasure, journey L361–363, **wave-72** | `AccountDeletionService.deleteAccount(callerUserId)` — `apps/api/src/privacy/account-deletion.service.ts:12` |
| `data_exported` | Data export, journey L360, **wave-35** | `AccountDataService.exportAccountData(userId)` — `apps/api/src/privacy/account-data.service.ts:52` |
| `privacy_settings_changed` | Privacy-settings PUT, journey L359, **wave-35/70** | `PrivacyService.updatePrivacy(userId, dto)` — `apps/api/src/privacy/privacy.service.ts:38` (writes both `profile_visibility` + `who_can_dm`) |
| `user_blocked` / `user_unblocked` | Block/unblock, product-decisions L774 (M14 Block bundle), **wave-70** | `BlocksService.createBlock/removeBlock(blockerUserId, blockedUserId)` — `apps/api/src/blocks/blocks.service.ts:97,155` |

- **No shipped privacy surface is missing from the 4** that a minimal audit trail should carry: the durable, user-initiated, privacy-relevant account actions are exactly delete / export / visibility-change / block. (Profile-visibility ENFORCEMENT reads, avatar upload, notifications, etc. are not privacy-*rights* events — correctly excluded.)
- **No logged type is a non-shipped surface** — all four seams exist as real deployed code (verified: `apps/api/src/privacy/` + `apps/api/src/blocks/` present).
- One nuance, **not a drift:** the spec's `privacy_settings_changed` context references `whoCanDm from/to` in addition to `visibilityFrom/visibilityTo`. The wave-35 UI shipped the who-can-DM toggle as DISABLED/BETA (journey L355), BUT the backend `updatePrivacy` genuinely writes `who_can_dm` (privacy.service.ts:42–43) and `PUT /profile/privacy` accepts it — so logging a `whoCanDm` delta is against a real backend field, not a phantom. The spec's "and/or" phrasing correctly leaves it optional. MATCHES.

### 3. Read-list "Your privacy activity" on /settings/privacy — MATCHES

Coherent addition, not a contradiction:
- `/settings/privacy` (page-16) already hosts the data-rights cluster: profile-visibility control, "Your data" export/download (wave-35, journey L355/L360), and the Danger-Zone account-delete (wave-72, journey L361). Blocked-users management is the established sibling-panel chrome (spec references `BlockedUsersPanel`).
- A read-only reverse-chron "Your privacy activity" panel is the natural fifth panel on the same surface — it turns the invisible audit plumbing into the user-facing trust signal the ceo-reviewer SELECTIVE-EXPANSION committed (spec DESIGN block; the "artifact the founder points at when a paying-school requirement lands"). Consistent with the M10 credibility bet (product-decisions L793).
- Spec correctly specifies empty state, loading skeleton (not spinner), error+retry, dark-theme, DS-panel reuse — matches the shipped settings-privacy chrome conventions. MATCHES.

### 4. no-IDOR on GET /profile/privacy-events vs established pattern — MATCHES

The spec's requirement ("guarded, session-only callerId — NO userId param, no-IDOR … Reuse the privacy.controller + SessionNoVerifyGuard idiom") is the exact established pattern, live-verified:
- `privacy.controller.ts` uses `@UseGuards(SessionNoVerifyGuard)` + `req.session.getUserId()` on every route (getPrivacy/updatePrivacy/getData/delete/export), with a standing code comment (line 78): "callerId is ALWAYS taken from req.session.getUserId() — no userId param."
- Journey confirms the precedent holds LIVE: wave-35 data-export "`?userId=<other>` silently ignored (no IDOR)" (L360); wave-72 delete "callerId ALWAYS from session (no userId param → no-IDOR)" (L362); the wave-15 `GET /me/mentions` sets the same session-derived, IDOR-closed convention.
- `GET /profile/privacy-events` returning ONLY the caller's own events, session-derived, ordered desc, limit ~100, is a clean continuation. MATCHES.

### 5. New semantic divergence / spec-gap — one MINOR spec-gap (non-blocking)

- **"tamper-evident-by-convention" vs append-only-by-convention:** The N-1 seed language and the spec both make cryptographic tamper-evidence a FENCED / out-of-scope item and describe the table as APPEND-ONLY by convention (service exposes only `append()`, no update/delete; `context jsonb` minimal non-PII). This is **internally consistent** — the spec does NOT claim cryptographic tamper-evidence, so append-only-by-convention satisfies its own stated bar. No drift. (Note for downstream: "append-only" is enforced at the SERVICE layer only — there is no DB-level GRANT/trigger preventing an UPDATE/DELETE; that is acceptable and explicitly within the minimal, non-compliance-grade scope, but B-6/T-8 should confirm the service genuinely exposes no mutating method, per the spec AC "no update/delete methods exist on the service.")
- **SPEC-GAP (MINOR, non-blocking) — minimal-non-PII context constraint is well-stated but not mechanically enforced:** The spec is admirably explicit ("context jsonb nullable — minimal non-PII only — e.g. {visibilityFrom,visibilityTo}; NEVER message bodies/emails/tokens") and repeats it in edge-cases. However the constraint is a convention on the 4 call-sites, not a schema/service guard — a future 5th hook could pass PII. For a MINIMAL slice this is acceptable (the 4 seams are hand-authored and reviewed), but flag for B-2/T-8: verify each of the 4 hook call-sites passes ONLY the documented non-PII deltas (`account_deleted` → null context; `data_exported` → null/minimal; `privacy_settings_changed` → from/to enum values only, NOT email; block/unblock → targetId only, the blocked user id, which is a user id not PII-payload). This is a review-checklist item, not a spec defect. **Recommend @task-completion-validator confirm the live-DB per-seam integration test (spec's binding refinement) also asserts context carries no PII field.**
- **Best-effort/non-blocking semantics** are clearly specified (after-commit, caught+logged, MUST NOT roll back the user action; mirrors deleteAccount's post-commit best-effort revoke) and consistent with the shipped wave-72 delete idiom. No gap.

---

## Summary

- **Critical:** none.
- **Spec-drift:** none. All 4 event types map to real shipped surfaces; the read-list, the no-IDOR route, and the fenced scope all align with prior M10 decisions and the established session-scoped privacy pattern.
- **Spec-gap (Minor, non-blocking):** minimal-non-PII context is convention-enforced at call-sites only — B-2/T-8 review-checklist item (verify per-seam context payloads carry no PII; extend the binding live-DB integration test to assert it).
- **Founder-reserved scope leak:** none — regime pick, FERPA/COPPA/GDPR posture, consent, deletion-hardening, compliance-grade audit infra, and crypto tamper-evidence are all explicitly fenced.

**APPROVE.**
