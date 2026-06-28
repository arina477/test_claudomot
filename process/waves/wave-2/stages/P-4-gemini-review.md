CONCERN: The user creation process is not atomic across services. A failure in the post-signup hook to create the local `users` row, after the SuperTokens user has already been created, will result in data inconsistency and a partially-provisioned user who may be unable to use the application.

EVIDENCE: "UsersModule (new, owns users table): a post-signup hook (EmailPassword `signUpPOST`/`functions` override OR an init `override`) inserts the `users` row (id = SuperTokens userId) via UsersModule."

SUGGESTION: The hook must handle this failure mode, for instance by implementing compensation logic to delete the SuperTokens user if the local database transaction fails.
