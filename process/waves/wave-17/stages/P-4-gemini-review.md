CONCERN: The plan to reuse a single, shared CI Postgres database for all integration tests introduces a significant risk of test flakiness. While truncation provides isolation between serial test cases, it fails to prevent state contention if test files are ever run in parallel, undermining the "anti-flake" and "deterministic, isolated" goals.

EVIDENCE
