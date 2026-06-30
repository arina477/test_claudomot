CONCERN: Reusing the `manage_channels` permission for assignment organizers is a classic band-aid solution that conflates unrelated responsibilities. This creates immediate role-management confusion and technical debt by granting channel-editing powers to users who may only need to manage assignments, violating the principle of least privilege.

EVIDENCE: "Default: reuse manage_channels this wave (owner always passes; a manage_channels role = organizer) — document; the dedicated flag is a follow-on."

SUGGESTION: Introduce the cleaner, dedicated `manage_assignments` permission now; the minor, one-time cost of a roles migration is far lower than the long-term cost of a confusing and incorrect permission model.
