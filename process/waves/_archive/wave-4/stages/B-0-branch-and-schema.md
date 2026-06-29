# Wave 4 — B-0 Branch & schema
- Task 2a655960 claimed in_progress. Branch wave-4-profile-customization.
- Deps (api): @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner ^3.1075.0 (ff4516d).
- **Schema migration (a4d7eb2):** users += username text (UNIQUE case-insensitive via uniqueIndex on lower(username); nullable), avatar_url text null, accent_color text null. Migration apps/api/drizzle/migrations/0001_graceful_vin_gonzales.sql. typecheck+build green. Applies at deploy.
- **Storage: FOUNDER CREDENTIAL REQUIRED.** Project token cannot create a Railway Bucket (account-level gated; `bucketCreate` → Bad Access). Founder must: Railway dashboard → project ae55c191 → +New → Database → Railway Bucket (Tigris) `studyhall-avatars` → copy S3 creds → provide AWS_ACCESS_KEY_ID/SECRET/ENDPOINT_URL + STORAGE_BUCKET_NAME (set on api service, never committed). Surfaced to founder. RUNTIME credential — build proceeds without it; avatar-upload verification (C-2/T) needs it. Rest of wave (username/accent/profile API/upload UI) is creds-independent (graceful no-creds 503 on presign until configured).
```yaml
branch: wave-4-profile-customization
deps_added: ["@aws-sdk/client-s3","@aws-sdk/s3-request-presigner"]
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0001_graceful_vin_gonzales.sql]
storage: founder-credential-required (Railway Bucket; runtime; surfaced)
env_vars_pending_founder: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL, STORAGE_BUCKET_NAME]
```
