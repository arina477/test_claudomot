CONCERN: The plan correctly identifies client-server grammar drift as the problem but solves it by enshrining the server's restrictive grammar as the single source of truth. This fixes the consistency symptom by making the client's behavior as flawed as the server's, rather than fixing the underlying issue that the grammar itself is too limited.

EVIDENCE: "Server `parseMentions` ... slug EXCLUDES `.`. `@bob.dev` → resolves+persists `bob`." and "Out of scope: Grammar rewrite".

SUGGESTION: The mention grammar should be expanded to correctly handle common username characters like periods *before* being shared, fixing the root cause instead of propagating a limitation.
