CONCERN: The "best-effort" cleanup strategy for test-created servers in the production environment is a band-aid that masks a future, inevitable failure mode. While unique naming prevents assertion collisions, it allows state to accumulate until the test account hits a product limit (e.g., max servers), at which point the test will deterministically fail.

EVIDENCE: "Cleanup-on-prod is best-effort/tolerated — unique names keep runs independent; a teardown that deletes the created server is a nice-to-have if a delete-server affordance exists, else accept accumulation of uniquely-named test servers."

SUGGESTION: Mandate a global teardown or after-each hook that deletes the created server to guarantee a clean fixture state for every test run.
