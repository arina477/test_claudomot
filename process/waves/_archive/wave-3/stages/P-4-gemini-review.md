CONCERN: The per-route override of a global security policy is a band-aid that treats a symptom. While maintaining a "fail-closed" default is a good principle, creating special exceptions for core endpoints complicates the authorization model, making it harder to reason about security guarantees without auditing every route's configuration.

EVIDENCE: "KEEP EmailVerification mode:'REQUIRED' (global fail-closed default for future routes); add per-route `overrideGlobalClaimValidators:()=>[]` on the /me + /profile verifySession guards ONLY (do NOT flip to OPTIONAL)"

SUGGESTION: Adopt a globally `OPTIONAL` verification mode and explicitly apply the verification requirement to all sensitive routes, making the security policy declarative and consistent rather than implicit with overrides.
