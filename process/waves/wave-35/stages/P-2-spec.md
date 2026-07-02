# Wave 35 — P-2 Spec (pointer)

**Source of truth:** the spec contract lives in `tasks.description` of primary task **56a50862-790e-4868-a5c5-305b08b81e40** (YAML head + `---` + prose). This file is a convenience copy.

- **wave_type:** multi-spec (4 self-contained blocks)
- **claimed_task_ids:** [56a50862 (settings-privacy), a4169fac (data view/download), d40ece71 (Sentry), 13b7ebfd (privacy/terms stubs + states)]
- **design_gap_flag:** false → B after gate
- **security_scope:** user-data-authz + data-export → T-8 + P-4 security-scope tightened gate
- **BOARD:** Path A (6/7) — profile-visibility enforced; who-can-DM persisted, no active control

## Acceptance criteria (copy for P-3/P-4 reference)
**56a50862 settings-privacy:** GET/PUT /profile/privacy persist {profileVisibility, whoCanDm} (enum everyone|server-members|nobody, defaults everyone); settings-privacy page profile-visibility selector persists+reloads; **profile-visibility ENFORCED server-side** on member-roster + profile-read (nobody hidden from all, server-members to co-members only, self always sees self); who-can-DM persisted, NOT an active toggle (disabled "applies when DMs arrive" affordance at most).

**a4169fac data view/download:** account-data read-only section (profile/memberships/activity); "download my data" -> JSON export, **self-scoped** (session userId, no param).

**d40ece71 Sentry:** init api+web, DSN from env, no-op when unset; captures exceptions+context; **beforeSend PII scrub** (sendDefaultPii=false; no emails/message-bodies/tokens).

**13b7ebfd stubs+states:** /privacy + /terms stub pages (per per-page-pd), footer/settings-linked; empty/error/loading states across feed/notifications/study-rooms/profile/assignments per DESIGN-SYSTEM §113 (skeletons not spinners; error=retry; empty=icon+headline+CTA).

## Key edge/error states
- privacy: no-row→defaults (no 500); invalid enum→400; unauth→401; self-visible-to-self; server-members hidden from non-members; B-6 negative test that member-list consumers keep needed fields.
- data-export: self-scoped only (no userId param); empty→valid empty arrays.
- Sentry: DSN-unset→no-op boot; PII keys stripped.
- states: skeletons not spinners; retry on error.

## Rework note (attempt-1)
Spec `data:` contract corrected to columns-on-`users` (matches P-3). Source of truth = tasks.description of 56a50862.
