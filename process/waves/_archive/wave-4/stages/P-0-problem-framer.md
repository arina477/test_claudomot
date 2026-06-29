```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): SOUND. The task is not symptom-framed — it correctly names
  the cause-layer (schema columns + API + a storage subsystem) rather than papering over the
  disabled "coming soon" controls shipped in wave-3. Framing matches live code: users table
  is id/email/display_name only (apps/api/src/db/schema/users.ts); profile API is a thin
  GET/PATCH over display_name (apps/api/src/profile/profile.controller.ts); the wave-3
  username/avatar/accent controls render disabled. Completing them needs exactly the layers
  named. No wrong-layer, no premature abstraction (FilesModule is the FIRST consumer of an
  already-specced shared module, not a speculative framework), no demo-path tunnel vision
  (≤2MB cap, image validation, uniqueness collision are all named). No spec contradiction:
  the storage stack and the 2MB avatar cap are pre-decided in the architecture library
  (command-center/dev/architecture/sdks.md §4, databases.md), so the task is consistent with
  prior decisions, not in conflict. Antipattern #5 (scope-coupling) was the live risk and is
  the only close call — addressed below; it does not rise to RESCOPE-AUTO-SPLIT.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

## Antipattern #5 (scope-coupling) — evaluated, NOT triggered

The framing question posed was whether avatar+storage should split from username+accent.
I considered RESCOPE-AUTO-SPLIT and declined. Rationale:

- These are not "2+ unrelated changes bundled while we're in there." They are one coherent
  product slice — "the profile a user customizes" — that the founder already approved as the
  wave-3 RESCOPE-AUTO-SPLIT sibling. Splitting again would re-split an already-split unit.
- The avatar/storage piece IS the heaviest part (new FilesModule, presign issuance, bucket
  provisioning, client uploader, post-upload existence validation), but its design is fully
  pre-decided in the architecture library — it is integration work against a locked contract,
  not net-new subsystem design. That lowers its risk profile below the auto-split threshold.
- Sizing is P-1's job, not P-0's. If P-1's rubric finds the avatar/storage subsystem exceeds
  one wave's build budget, P-1 owns the split (seed = username+accent column/API adds, which
  are trivial; sibling = avatar+FilesModule). I am flagging the natural seam for P-1 — I am
  not asserting it must split.

## Flags for P-2 / P-3 (framing observations, not decisions)

1. **Upload pattern already decided — do NOT re-litigate.** The "presign vs. direct multipart
   through the API" question is settled in command-center/dev/architecture/sdks.md §4 and the
   convention block: "Pre-signed URL generation is the only server-to-storage interaction at
   runtime. The NestJS server never streams binary data through itself." Presign is the locked
   pattern. P-2/P-3 should consume it, not reopen it. (If the spec wants direct-multipart for
   self-use-mvp simplicity, that is an architecture-decision reversal and must route through the
   architecture owner, not be silently chosen in the spec.)

2. **FilesModule is shared, avatar is one purpose.** The architecture library specs a single
   File Upload Module with POST /uploads/presign + /uploads/confirm carrying a
   `purpose: 'avatar'|'attachment'` discriminator (modules.md §11), serving both avatars and
   (future) message attachments. The task's "FilesModule for avatar upload" is the avatar slice.
   P-2 should build the module with the avatar purpose only, leaving the attachment purpose for
   the messaging wave — not hard-code an avatar-only module that messaging later has to rework.

3. **Naming drift to reconcile (cosmetic).** Task says `accent_color`; databases.md line 41 says
   `avatar_color`. Task says GET/PATCH /profile (extends existing); modules.md §2 sketches
   /users/me/profile and a separate `profiles` table. P-2 picks one and aligns the spec — the
   existing live code uses /profile on the `users` table, which is the lower-churn choice.

4. **Hidden external dependency — surfaced, not blocking.** The storage credentials
   (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT_URL / STORAGE_BUCKET_NAME /
   STORAGE_CDN_URL) are account-issued: founder must create the Railway Bucket resource and copy
   the keys from the dashboard (sdks.md "Credential ownership"). This is the one dependency that
   cannot be self-generated per always-on rule 6. P-3 should plan a founder-credential request
   (or a MONITOR for bucket provisioning) so the C/T blocks are not blocked late on a missing key.

## Disposition

PROCEED. Framing is sound and consistent with the locked architecture. The only structural risk
(scope-coupling of a storage subsystem with trivial column adds) is deferred to P-1 sizing with
the seam named; it does not warrant a P-0 reframe.
