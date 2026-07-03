verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1]
reasoning: |
  Symptom-vs-cause (mandatory): the seed's "confirm/implement server-side 2MB
  enforcement if missing" is a FALSE-ABSENT premise. checkAvatarSize() is already
  fully implemented and wired into POST /profile/avatar/confirm (files.service.ts
  L165-188, files.controller.ts L97-101), with passing unit tests covering the
  1MB / 3MB / boundary / exactly-2MB cases (files.service.spec.ts L133-174). The
  wave-4 V-2 "jenny AC7 Medium drift" note is stale prose from before that fix
  landed. Antipattern #1 (symptom-vs-cause / stale false-absent premise) + PRODUCT-
  PRINCIPLES rule 1 (verify seed absence claims at P-0). Leaving item (2) as
  "implement if missing" invites redundant rebuild of shipped, tested code. The
  root work is genuinely ops+verify, not code: (1) set 4 creds on Railway api +
  redeploy, (3) verify presign->PUT->confirm->render end-to-end against the real
  Tigris bucket. Framing is otherwise sound — this is a one-line correction, hence
  REFRAME not PROCEED.
proposed_reframe: |
  Drop the "implement if missing" phrasing on the size-cap item. Corrected scope:
    (1) OPS (C-block): set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY /
        AWS_ENDPOINT_URL (https://t3.storageapi.dev) / STORAGE_BUCKET_NAME
        (studyhall-avatars-ngavql0) on the Railway api service; redeploy.
    (2) VERIFY-ONLY (T/V): server-side 2MB enforcement is ALREADY shipped
        (checkAvatarSize HEAD-check at /confirm, tests green). No code change —
        add ONE live-integration AC that a >2MB PUT is rejected 413 against the
        real bucket; do NOT rebuild.
    (3) VERIFY end-to-end against the real bucket: presign -> PUT -> confirm ->
        render, with the render step exercising the actual stored avatar_url.

  RENDER-PATH RISK to fold into item (3)'s ACs (not a reframe blocker — surfaces
  at T/V, flagging so it is not tunnel-visioned past): avatars are persisted and
  served as STATIC PUBLIC URLs via resolvePublicUrl() (files.service.ts L194-201;
  consumed by profile, server member roster, privacy data-export). The SAME
  codebase's attachment path explicitly documents that "Railway Buckets are
  PRIVATE — static public URLs do not work" and requires presigned GETs
  (files.service.ts L351). If the provisioned Tigris bucket serves objects only
  over authenticated/presigned GET (i.e. is private), every rendered avatar URL
  will 403 and the feature fails end-to-end despite presign+PUT+confirm all
  succeeding. The end-to-end verify (item 3) MUST assert the rendered avatar URL
  returns 200 to an anonymous GET; if it 403s, the real fix is either a
  public-read bucket/prefix policy on avatars/ OR migrating avatar render to
  presigned-GET (matching the attachment model) — a scope the wave must be ready
  to absorb. This is the actual cause-layer risk the size-cap symptom was masking.
escalation_reason: |
  (n/a)
sibling_visible: false
