# P-0 Problem-Framer — StudyHall wave-77 (M13 leg-2, first slice)

**Agent:** problem-framer (fresh context)
**Mode of review:** read-only, no code. Symptom-vs-cause + antipattern red-team.
**Milestone:** M13 — Institution partnerships & portable identity (`b7400254-…`, `status=in_progress`, Class `product-feature`, Horizon H3, Tier T6).
**Leg under review:** leg-2 = cross-server portable academic identity (a user-level identity/profile portable across servers).
**Bundle:** SEED `10a68f9e` (schema + self API) + `a51e281d` (shared contract) + `bf0ad2a8` (cross-server view endpoint) + `a98286cb` (web editor + member card).

---

## VERDICT: PROCEED

The problem is framed at the correct (cause) layer, at the right substrate, and reuses the shipped identity/privacy machinery correctly. One privacy-enforcement contract term MUST be pinned at P-2 (non-blocking to PROCEED, but load-bearing — a REWORK-at-spec risk if skipped). No REFRAME / RESCOPE / ESCALATE conditions fire.

---

## Seed-claim verification (PRODUCT-PRINCIPLES rules 1 & 2 — verify what exists/absent + verify the named entity is the real target)

All seed premises checked against shipped code (the app DB is a separate Railway service from the brain DB `CLAUDOMAT_DB_URL`, so verification is against schema files + service code, which is authoritative for what ships):

| Seed claim | Verified? | Evidence |
|---|---|---|
| Identity fields hang directly on `users` (not a parallel store) | TRUE | `apps/api/src/db/schema/users.ts` — `display_name`, `username`, `avatar_url`, `accent_color`, `profile_visibility`, `who_can_dm`, `deleted_at` all columns on `users`. Adding academic columns here mirrors the exact shipped precedent. |
| `profile_visibility` column exists, default `'everyone'`, NOT NULL | TRUE | `users.ts:15`. |
| `profile_visibility` enum = `everyone / server-members / nobody` | TRUE (naming drift) | `packages/shared/src/privacy.ts:3` — `PROFILE_VISIBILITY = ['everyone','server-members','nobody']`. Seed prose says "members-who-share-a-server" — that is a paraphrase of the literal `'server-members'` value, NOT a third value. **P-2 must use the literal enum token.** |
| `profile_visibility` is "shipped-but-currently-unenforced" on a cross-user profile read | TRUE | No `GET /profile/:userId` exists today. `profile.controller.ts` GET/PATCH are SELF-only (`req.session.getUserId()`, no `:userId` param). Column is only *stored/read* as a setting (`privacy.service.ts`) and *partially* filtered in one place (roster, see below). No canonical cross-server profile-read path enforces it → the seed's gap claim is accurate. |
| `user_blocks` is a directional relation usable in both directions | TRUE | `user-blocks.ts` — `blocker_id`/`blocked_id`, `UNIQUE(blocker_id,blocked_id)`, index on `blocker_id`. `BlocksService.isBlockedBetween(a,b)` already does the bidirectional check "applied at every DM seam". |
| `server_members` shared-server check is a shipped pattern | TRUE | `dm.service.ts` `enforceWhoCanDm` runs the shared-server `EXISTS`/`IN (SELECT server_id …)` query against `server_members` — the exact resolution the `'server-members'` visibility branch needs. |
| `deleted_at` soft-delete suppression exists | TRUE | `users.ts:19` `deleted_at timestamp nullable`. |
| `SessionNoVerifyGuard` is the shipped profile guard | TRUE | `profile.controller.ts:13,29,48`. |
| GET/PATCH `/profile` + `UsersService.updateProfile` + 409-on-username-conflict | TRUE | `profile.controller.ts:60-61`; conflict propagated via PG 23505. |

No false-absent or false-present premise. The named substrate (`users` profile model) IS the real identity boundary, not a look-alike.

---

## (a) Is a user-level academic-identity profile the CAUSE-level substrate for "portable identity across servers"?

**Yes.** "Portable across servers" decomposes to: *one identity record, owned by the user, readable from any server context*. The shipped model already stores identity on `users` (a single row per user, server-independent) — Discord's fragmentation is per-*guild* member profiles; StudyHall's is already user-level. Hanging academic fields on `users` means the SAME record travels into every server by construction, requiring zero per-server duplication. The bundle does not skip a more foundational layer: there is no missing "identity envelope" or "profile-ownership" primitive to build first — it already exists. This is the correct first slice: data substrate + self-service write (SEED) → contract (`a51e281d`) → cross-server read (`bf0ad2a8`) → surface (`a98286cb`). Dependency order is clean and contract-first (BUILD principle).

## (b) Does hanging fields on the existing `users` profile model (vs a parallel identity store) reuse correctly?

**Yes — this is the right call, and a parallel store would be the antipattern.** A parallel `academic_identity` table would (1) duplicate the user↔identity 1:1 relationship already modelled by columns on `users`, (2) require a JOIN on every profile read for no normalization benefit (all fields are 1:1 with the user), and (3) fragment the "one record travels with the user" invariant the leg exists to establish. The shipped `accent_color` / `profile_visibility` additions set the precedent: nullable columns, no backfill, existing rows keep NULL. SEED follows it exactly. Correct reuse, no wrong-layer store.

## (c) Cross-server profile-view endpoint honoring `profile_visibility` — privacy-leak assessment (THE KEY RISK)

This is the highest-risk surface and the seed frames it correctly, but there is ONE enforcement-completeness gap and ONE consistency risk that P-2 must close.

**What is right:**
- The endpoint spec mandates server-side enforcement, "never relies on field omission alone" — correct posture, and it matches the shared-contract task's rule that `PublicProfileSchema` never carries `email` AND visibility is enforced server-side.
- Reuses the three shipped primitives: `isBlockedBetween` (bidirectional block), the `server_members` shared-server EXISTS query (`'server-members'` branch), and `deleted_at` suppression.

**Privacy-leak gaps to pin at P-2 (load-bearing, REWORK-at-V-block risk if unspecified):**

1. **`'server-members'` semantics MUST be viewer↔target-scoped, not roster-scoped.** The ONE place `profile_visibility` is filtered today (`servers.service.ts:278-283`, `listServerMembers`) only special-cases `'nobody'` and treats `'everyone'`+`'server-members'` as identically visible *because the viewer is already a proven co-member of that specific server*. The new `GET /profile/:userId` has NO such ambient guarantee — a caller can request ANY userId from any context. So the endpoint MUST resolve `'server-members'` via an explicit `isBlockedBetween`-style shared-server check between *viewer and target* (the `dm.service.ts` `enforceWhoCanDm` pattern), NOT copy the roster filter's "co-member ⇒ visible" shortcut. Copying the roster shortcut would leak a `'server-members'` profile to any authenticated stranger. The seed's acceptance criteria DO state this ("resolves via a shared-server check against server_members") — P-2 must make it a hard AC with a test, and must NOT let B-block reuse the roster helper verbatim.

2. **Enum value discipline.** Enforce against the literal `'server-members'` token (`privacy.ts`), not the prose paraphrase. A typo'd branch that never matches would silently fall through to visible → leak. P-2 spec + T-3 integration matrix (visibility × block × soft-delete, which the seed already calls for) must key off the shipped constant.

3. **Default-deny on unknown/anomalous visibility.** `privacy.service.ts` defaults a missing row to `'everyone'` (a *self*-read, safe). For a *cross-user* read, an unexpected/NULL visibility value must default to HIDDEN, not visible. P-2 should state the fail-closed direction explicitly.

With those three pinned, the privacy posture is sound and actually *improves* on today's state (it operationalizes a column that is currently only half-enforced). No leak is designed-in; the risk is entirely in under-specification, which P-2 resolves.

## (d) Is the self-declared-only / no-verification fence honored?

**Yes.** SEED AC explicitly states fields are SELF-DECLARED, no verification, no authority claim; the shared-contract task models `academic role` as a `z.enum(['student','educator','staff'])` **with NO pgEnum and no trust semantics** — it is a free self-label, not a granted role. No task in the bundle reads these fields for authorization, gates any capability on `academic role`, or surfaces a verification badge. The milestone's "institution/educator identity VERIFICATION is OUT OF SCOPE for this leg" fence is respected. One watch-item for P-2/D-block: the web member card (`a98286cb`) must render `educator`/`staff` as plain self-declared text with NO badge/checkmark/authority affordance that would *imply* verification — a UI-only trap, flagged for D-block brief.

## (e) Scope-creep / wrong-layer risks?

**None material.** The bundle is tightly scoped to the leg-2 substrate and stops at it:
- Does NOT touch the fenced B2B2C go-to-market or the founder-reserved success metric (correctly surfaced-not-blocked per milestone).
- Does NOT pull leg-3's "richer privacy/E2E posture" forward — it only *operationalizes* the existing `profile_visibility` column, which the seed correctly frames as "dovetailing into leg-3," not implementing it.
- Does NOT add verification (fenced).
- No gold-plating: nullable columns, no backfill, no new store, reuses guards/blocks/shared-server checks.
- 4 tasks = data+API / contract / read-endpoint / UI — the minimum coherent vertical slice; each has a distinct layer, none is severable without breaking the leg's "self-edit → cross-server view" loop.

The one scope note (not creep): `bf0ad2a8` is where the privacy-enforcement weight sits; it is correctly a sibling of, not folded into, the SEED — keeping the enforcement matrix testable in isolation.

---

## Antipattern red-team (PRODUCT-PRINCIPLES § Antipatterns + rules 1–4)

- **Symptom-vs-cause (rule 2):** PASS. The wave builds the *cause* (a portable user-level record) rather than patching a *symptom* (e.g., copying identity per-server). Named entity (`users`) verified as the real identity boundary.
- **False-absent / false-present premise (rule 1):** PASS. Every "exists / is unenforced" claim verified in code; the `profile_visibility` "unenforced on cross-user read" claim is true.
- **State-unreachable claim (rule 4):** N/A — no "unreachable state" premise; but the analogous trap (a visibility branch unreachable due to enum drift) is flagged in (c).
- **Demo-path tunnel vision:** PASS. Spec mandates the full visibility × block × soft-delete integration matrix and server-side enforcement, not a happy-path `everyone` demo.
- **Wrong-layer fix:** PASS. Enforcement is server-side at the endpoint, never client field-omission.

---

## Handoff to P-1 / P-2

**PROCEED.** Carry these three P-2 spec obligations forward (all in `bf0ad2a8` / `a51e281d` scope, non-blocking to PROCEED but each a REWORK risk if dropped):

1. `'server-members'` visibility MUST resolve via an explicit viewer↔target shared-server check (`dm.service.ts` `enforceWhoCanDm` pattern) — do NOT reuse `servers.service.listServerMembers`'s co-member shortcut, which assumes an ambient membership the new endpoint lacks.
2. Branch on the literal shipped enum tokens (`packages/shared/src/privacy.ts` `PROFILE_VISIBILITY`); make the visibility × block × soft-delete matrix a hard T-3 integration AC.
3. Fail-closed: any missing/unknown visibility on a cross-user read defaults to HIDDEN (contrast the self-read `everyone` default in `privacy.service.ts`).
4. (D-block watch) Web member card renders `educator`/`staff` as plain self-declared text — no badge/verification affordance (honors the no-verification fence at the UI layer).
