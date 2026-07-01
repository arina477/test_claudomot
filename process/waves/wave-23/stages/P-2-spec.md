# Wave 23 — P-2 Spec (pointer)

**Spec contract lives in the DB:** `tasks.description` of primary task `8aa67564-a142-4628-b658-f020d4d2872c` (YAML head + `---` + prose). This file is a convenience pointer.

**wave_type:** multi-spec (2 self-contained spec blocks). **claimed_task_ids:** [8aa67564 (seed), edbdea8f (sibling)]. **design_gap_flag:** false.

## Spec 1 — 8aa67564: dedicated manage_assignments permission
ACs (falsifiable): Permission union 4→5; role with manage_assignments (+owner) can post/patch/delete assignments + attachments; no-flag role → 403 on all organizer routes; roles column manage_assignments NOT NULL DEFAULT false (migration 0011 additive); backfill manage_assignments=true where manage_channels=true (no silent privilege loss); role create/update DTOs + roleToDto carry the flag + persist; can() fail-closed on absent flag; single call-site swap.
Edge: no-flag→403 (B-6 P2 + T-8 reproduce); owner→200 superuser; absent column mid-deploy→deny no-500; migrated manage_channels role still posts; default Member→403.

## Spec 2 — edbdea8f: /me effective-permissions + CTA gate
ACs: GET /servers/:serverId/me/permissions → caller's effective perms, SESSION-derived only; non-member→403; never reads client userId (IDOR-safe); assignments CTA visible iff owner OR manage_assignments (replaces owner-only gate); non-owner w/ permission sees CTA + posts end-to-end; member without it: no CTA, honest 403 if forced.
Edge: non-member→403; ?userId ignored (T-8 IDOR); owner→CTA; revoked→CTA disappears next load; force-POST→honest 403 not dead button.

## BOARD conditions carried (binding on B/T)
Migration no-silent-privilege-loss backfill + can() fail-closed; /me session-scoped IDOR (T-8); honest 403 CTA; owner-lockout guardrails extend; reminders deferred behind Resend key (ship as build-quality, not validated-demand).

→ P-3 Plan.
