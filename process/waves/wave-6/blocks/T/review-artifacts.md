# Wave 6 — T-block review artifacts
**Block:** T · **Wave topic:** CI boot-probe (CI-only) · **Gate:** T-9 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI green (lint/typecheck PR#16) |
| T-2 Unit | skip | no app code changed (CI-config only) |
| T-3 Contract | skip | no contract change |
| T-4 Integration | done | the boot-probe job IS an integration-grade check — ran GREEN (boots compiled dist + /health 200) |
| T-5 E2E | done | e2e job green (PR#16) |
| T-6 Layout | skip | no UI |
| T-7 Perf | skip | not heavy |
| T-8 Security | done | no auth change; secret-grep clean (only throwaway test PG pw) |
| T-9 Journey | pending | gate |
## Context
- CI-only change; the boot-probe (the deliverable) ran green + proven real in CI. No app-behavior change. No journey/UI surface change.
