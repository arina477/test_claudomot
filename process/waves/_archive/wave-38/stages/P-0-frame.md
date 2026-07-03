# Wave 38 — P-0 Frame

## Discover section

- **wave_db_id:** afe06a89-bf6f-4aea-9ea1-bd84633f7de0 (wave_number 38)
- **Prior-work citation:** wave-4 built + deployed the avatar upload path (presign→S3 PUT→confirm→render) with graceful 503 STORAGE_NOT_CONFIGURED when creds absent; task 84e09891 deferred bucket provisioning to founder ops. wave-19 (task 20db0c16, done) built the message-attachment storage path on the identical S3-compatible pattern, also graceful-503, also never wired.
- **Roadmap milestone:** M7 (6e2f68d8) — "Privacy controls, notifications & launch polish", in_progress, class=`product-polish`. Wave milestone_id backfilled.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (84e09891 description is prose "Source: wave-4 C-2…", no fenced YAML head). Full P-1..P-3 run.
- **Product-decision resolutions:** none (Tier-3 none). This is founder-directed launch-ops: founder resolved the wave-37 M7-disposition pause by choosing Path A and supplying the 4 Tigris S3 credentials (access key, secret, endpoint `https://t3.storageapi.dev`, bucket `studyhall-avatars-ngavql0`). The Resend email domain (task a1299e88) was NOT supplied — stays blocked; M7 fully closes only when it lands too.

## Reframe section

- **Original task framing:** wire founder-provided Tigris S3 creds into the built+deployed avatar upload path, redeploy, verify presign→PUT→confirm→render E2E; plus (stale wave-4 note) "implement server-side 2MB cap if missing".
- **problem-framer verdict:** REFRAME (verdict file: `P-0-problem-framer.md`; matched antipattern #1 — false-absent seed premise). Two findings: (1) `checkAvatarSize()` (files.service.ts:165-188) IS already implemented + wired into confirm + unit-tested (files.service.spec.ts:133-174) → the 2MB item is VERIFY-ONLY, not implement; the wave-4 "jenny AC7 Medium drift" note is stale. (2) **Cause-layer risk:** avatars render as static public URLs via `resolvePublicUrl()`, but the same codebase's attachment path documents "Railway Buckets are PRIVATE — static public URLs do not work" (files.service.ts:351, requires presigned GET). If the Tigris bucket serves objects only over presigned/authenticated GET, every rendered avatar URL 403s → feature fails E2E despite presign+PUT+confirm succeeding. The E2E verify MUST assert the rendered avatar URL returns 200 to an anonymous GET; a 403 means the real fix is a public-read policy on the `avatars/` prefix OR migrating avatar render to presigned-GET — a scope the wave must be ready to absorb.
- **ceo-reviewer verdict:** SELECTIVE-EXPANSION (verdict file: `P-0-ceo-review.md`). Avatar work is PROCEED at proposed scope (worth doing, traces to live bet + M7, founder-directed). One bounded addition: message-attachment storage (task 20db0c16, done wave-19) is silently DEAD in prod (storage never wired) and shares the EXACT same Tigris creds + S3 path — wiring for avatars activates attachments for free. Add one bounded attachment E2E verify pass + ≤10MB cap confirmation (verify-only, no new code/creds/SDK). If B-block finds attachments need non-trivial rework, downgrade to avatar-only PROCEED + re-file attachments as its own task.
- **mvp-thinner verdict:** not spawned (M7 class=`product-polish`, not `product-feature`).
- **Mediation outcome:** head-product merge. problem-framer REFRAME is corrective/additive (both reviewers concur the core "wire creds + verify E2E" is the correct root work — not a wrong-problem reframe), so no full reviewer re-spawn; corrections are folded into the final framing and P-4's fresh Karen/jenny/head-product reviewers re-validate. ceo SELECTIVE-EXPANSION accepted as a bounded verify-only sibling (attachment path shares the activated creds; launching with a dead core messaging feature is a real launch-readiness gap). Both siblings trace to M7 launch-polish.
- **Sibling task IDs created:** none new — attachment verify folds onto existing done task 20db0c16 as a re-verification (P-1 will decide whether to claim it as a sibling in claimed_task_ids or track it as an in-wave verify pass).
- **Disposition:** REFRAMED (corrected + selectively expanded).

### Final framing (rest of P-block uses this)

**Wave-38 = Avatar storage go-live + attachment activation-verify (M7 launch-ops).**

1. **Wire the 4 founder-supplied Tigris S3 creds** onto the Railway `api` service + redeploy [C-block]. (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL=`https://t3.storageapi.dev`, STORAGE_BUCKET_NAME=`studyhall-avatars-ngavql0`.)
2. **Server-side 2MB avatar cap = VERIFY-ONLY** (already shipped + tested). Add a live AC: >2MB confirm is rejected 413 against the real bucket. No code change.
3. **Verify avatar upload E2E** presign→PUT→confirm→**render**, where the render assertion exercises the actual anonymous/public GET of the stored `avatar_url`. **Crux risk:** if the Tigris bucket is private (serves only presigned GET), the static-public-URL render 403s → wave absorbs the fix (public-read policy on `avatars/` prefix, OR migrate avatar render to presigned-GET matching the attachment model). Determine bucket public/private behavior early (P-3/B).
4. **Attachment path activation-verify (bounded, verify-only):** one E2E message-attachment upload→download pass against the now-wired bucket + ≤10MB server-side cap confirmation. Same private/public GET consideration applies (attachments already use presigned GET per files.service.ts:351, so likely fine). If it needs real rework beyond wiring, drop to avatar-only + re-file.
