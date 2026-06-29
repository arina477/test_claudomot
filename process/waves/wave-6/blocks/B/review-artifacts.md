# Wave 6 — B-block review artifacts (single-spec)
**Block:** B · **Wave topic:** CI compiled-artifact boot probe · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-6-ci-boot-probe; claimed da242f6b; no deps; no schema |
| B-2/B-4/B-5 | pending | devops adds the boot-probe CI job |
| B-6 | done | head-builder APPROVED; real proof = PR CI boot-probe run |
## Context
- claimed [da242f6b]. single-spec. No app code (CI-only). CARRY: boot env PORT + DATABASE_URL(throwaway PG) + dummy SUPERTOKENS_CONNECTION_URI; node dist vehicle; make boot-probe a required check.
