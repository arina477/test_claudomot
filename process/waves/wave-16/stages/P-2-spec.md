# Wave 16 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 46f16288 (YAML head + --- + prose). single-spec. design_gap_flag false.
**claimed_task_ids:** [46f16288]
## AC summary
- Authed Playwright E2E: sign in as verified fixture → create server (unique name) → assert server in rail + #general in sidebar.
- Authed-session harness (storageState global-setup OR in-test sign-in) using gitignored verified fixtures; suite previously unauthenticated-only.
- Anti-flake: web-first assertions, NO sleeps, deterministic, NO retry-masking. Unique server name per run. Green in CI + local; existing smoke spec untouched.
