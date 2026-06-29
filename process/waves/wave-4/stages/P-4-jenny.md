# P-4 Phase 2 — Spec-drift verification (jenny)

**Wave:** wave-4 — Profile customization (username + avatar + accent)
**Spec task:** `2a655960-a429-432d-8633-e8f149368ca3`
**Verdict:** **APPROVE**

Spec is faithful to the wave-3 founder-approved split, the locked storage architecture, and M1's named profile scope. No spec-drift found. Two non-blocking cosmetic/reconciliation notes and three correctly-marked intentional deferrals documented below.

---

## Per-item findings

### 1. Completes the wave-3 founder-approved split — **MATCHES**
- `product-decisions.md:137` (wave-3 entry): *"username/avatar-upload/accent-color split to task 2a655960 (next wave)."*
- Spec head targets exactly `claimed_task_ids: [2a655960...]`; spec body title is *"Profile customization — username + avatar + accent (M1 wave-4)"* and prose calls it *"the wave-3 split sibling."* The three deferred items (username, avatar, accent) are exactly the three this wave delivers — no fourth item added, none dropped.
- Sequencing is the logged decision honored, not a re-cut or scope creep. **MATCHES.** No conflicting decision.

### 2. Storage approach matches locked architecture — **MATCHES**
- `_library.md` § SDKs (line 206) + resolution **#16** (line 583): S3-compatible (Railway Buckets/Tigris), `AWS_*` env vars; § Security (line 321): *"Pre-signed PUT to Railway Buckets … server-controlled object key … single-use expiring URL."* FilesModule (`_library.md:64`) owns pre-signed URL generation.
- Spec `sdk:` block: `@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner (S3-compatible Railway Buckets/Tigris); presigned PUT. FilesModule wraps it.` AC for `POST /profile/avatar/presign` requires server-controlled user-scoped key, short TTL, MIME allowlist, 2MB cap, client PUTs direct, *"the api never streams the binary."*
- No drift to multipart-through-api or any other upload pattern — P-3 plan line 9 explicitly records and rejects the multipart alternative ("presign pattern is LOCKED"). **MATCHES.** No conflicting decision.

### 3. username on the single `users` table — **MATCHES**
- `_library.md` resolution **#5** (line 572): *"single `users` table … No separate `profiles`/`privacy_settings` tables."* `product-decisions.md:36` decision (2) same.
- Spec `data:` block + P-3 plan line 5: `users +username(unique)/avatar_url/accent_color` — all three columns added to `users`; no new profile table. Current schema (`apps/api/src/db/schema/users.ts`) is a single `users` table the migration extends. **MATCHES.** No conflicting decision.

### 4. accent_color naming reconciliation — **MATCHES (cosmetic, documented, consistent)**
- Branch file `databases.md:41` names the column **`avatar_color`** ("Hex fallback when no avatar"). Spec + P-3 plan use **`accent_color`** on `users`.
- This is the exact divergence the prompt flagged. It is **not drift**: the spec body explicitly states *"accent_color naming reconciled to the live /profile-on-users convention"* and the spec is internally consistent — `accent_color` is used uniformly across the data AC, contracts (`accentColor`), edge cases, and ProfileResponse shape. `_library.md` is the authoritative integrated reference and **wins on any branch conflict** (`_library.md:5`); `_library.md` does not contradict `accent_color`. The losing branch token `avatar_color` in `databases.md` is stale expanded-detail, superseded by the canonical-authority rule.
- **Recommendation (non-blocking):** at B-0/B-1 confirm the chosen name is `accent_color` end-to-end (column, Drizzle field, Zod `accentColor`, ProfileResponse). Optionally amend `databases.md:41` so the branch file stops carrying the stale `avatar_color` token — proportional cleanup, not a gate. **MATCHES.**

### 5. Scope held — no gold-plating, no M2+ pull-forward — **MATCHES**
- Spec body: *"NO image resize/transcode/multi-size/CDN"* (matches P-0 ceo HOLD-SCOPE). No CDN, no thumbnail pipeline, no Sharp/transcode dependency in `sdk:` or `deps`. P-3 plan line 7 same.
- File caps held to `_library.md` #15 (2MB avatar). FilesModule is shaped `purpose: 'avatar'|'attachment'` so M3 attachments reuse it — this is *forward-compatible shaping the architecture already mandates* (`_library.md:64`, resolution implied by the shared FilesModule), **not** implementing M3: AC explicitly says *"this wave implements the 'avatar' purpose"* only. No messaging/attachment behavior pulled forward. **MATCHES.** No conflicting decision.

### 6. Completes M1's named profile scope — **MATCHES**
- `product-decisions.md:102` (v10 roadmap): M1 = *"Foundation (shell/auth/profiles)."* `product-decisions.md:114`: M1 bundle includes *"Auth + profile frontend pages."* The profile pillar's full scope is display name + username + avatar + accent.
- Display name shipped wave-3; this wave adds username + avatar + accent, completing the profile pillar. settings-profile.html mockup (`design/settings-profile.html`) wires exactly these four: Avatar section (line 310, file input `accept="image/png, image/jpeg, image/webp"` line 338), Username (line 351, `*` required), Display Name (line 389), Accent Color radiogroup (line 411). Spec AC requires replacing the wave-3 "coming soon" stubs with all three. **Milestone-faithful. MATCHES.** No conflicting decision.

---

## Drift vs gap vs intentional-deferral classification

- **Intentional deferral (correct, not gap):**
  - **Storage credentials → B-0.** Spec + P-3 plan line 21 route the `AWS_*`/bucket credential acquisition to B-0 (self-provision via project token if creatable, else founder-ask per rule 6). Correctly sequenced so C/T don't block late. Not a spec gap.
  - **Orphan-object cleanup → deferred hardening.** Spec edge-case (Gemini): presign+PUT without confirm leaves an unreferenced object; *"Acceptable for self-use-mvp … Note as a deferred hardening, not a blocker."* Correctly classed as deferral, with two named mitigation options. Not a gap.
  - **Graceful no-creds boot.** Spec AC + edge-case require the api to boot without the bucket configured (presign returns handled 503; username/accent/display_name still work). This is a *required* behavior this wave (not deferred) and is specced — correctly distinguishes "avatar needs creds" from "rest of profile does not."

- **No spec-drift detected.** Every architecture-touching claim traces to `_library.md` canonical resolutions or the wave-3 split decision.

- **No spec-gap detected** against the six verification items. All ACs are present and verifiable; non-happy paths (collision, case-fold, concurrent claim, oversized, wrong-MIME, expired presign, absent creds, path-traversal) are enumerated.

---

## Non-blocking notes for B-block (not gate-failing)

1. **accent_color vs avatar_color (item 4):** reconcile the column name to `accent_color` end-to-end; optionally fix the stale `databases.md:41` token.
2. **username length bound mismatch (cosmetic):** spec validation says `3-20 chars`; `design/settings-profile.html:379` shows a `10/32` counter and the field is marked required (`*`, line 352). The mockup is reference, not contract (per `product-decisions.md:74`), and the spec correctly treats username as nullable-until-set in the data model while the UI may present it as required-to-save. **Recommendation:** at B-1/B-3 align the frontend max-length and helper-text to the specced `3-20` bound (or have P-3/spec confirm the intended cap) so the availability-check UI and the Zod rule agree. Not drift — flagging so the build doesn't ship a 32-char input against a 20-char validator (would surface as a 400 the user can't predict).

---

## Verdict

**APPROVE.** The spec completes the wave-3 founder-approved split with correct sequencing, holds to the locked storage architecture (presigned PUT, server-controlled key, FilesModule shared shape, 2MB/MIME caps, no resize/CDN), keeps profile on the single `users` table per decision #5, and finishes M1's named profile pillar. The accent_color naming is a consistent, documented reconciliation (canonical-authority rule resolves it), not drift. Storage creds (B-0) and orphan cleanup (deferred hardening) are correctly classified deferrals. Two non-blocking build-time alignment notes carried forward.

@head-product: APPROVE from spec-drift lens — proceed to P-4 gate verdict.
