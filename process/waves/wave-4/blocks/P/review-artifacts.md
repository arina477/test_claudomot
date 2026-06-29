# Wave 4 — P-block review artifacts
**Block:** P · **Wave topic:** Profile customization — username + avatar upload (object storage) + accent color (M1 completion) · **Gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | PROCEED (both reviewers); storage cred founder-ask flagged for B-0 |
| P-1 | stages/P-1-decompose.md | pending | |
| P-2 | stages/P-2-spec.md | pending | |
| P-3 | stages/P-3-plan.md | pending | |
| P-4 | blocks/P/gate-verdict.md | pending | |
## Context
- wave_db_id 82387899 (wave 4); M1; seed 2a655960 (split from wave-3). no-prior-spec → full P-1..P-3.
- Scope: users +username(unique)/avatar_url/accent_color + profile GET/PATCH (extends wave-3 /profile) + FilesModule (avatar upload, Railway Buckets/S3 presign, 2MB, image-validate) + wire settings-profile avatar/username/accent controls (currently 'coming soon').
- **Object storage:** AWS_*/Railway Buckets — provision at B-0 (Railway Buckets may be self-provisionable via project token like Postgres; if S3 keys are account-issued → founder-ask at B-block, like Resend).
- Design: settings-profile.html mockup exists (has avatar/username/accent) → design_gap_flag likely false.
- Security: avatar upload = file-upload surface (size/type validation, no SSRF/path-traversal) → T-8 relevant.
- Autonomous mode: automatic.
