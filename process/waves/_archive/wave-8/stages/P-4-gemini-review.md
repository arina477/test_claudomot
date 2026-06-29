CONCERN: The spec introduces a "two-tier" invite system using both a dedicated `servers.invite_code` column and a separate `invites` table. This dual-source approach is an unnecessarily complex primitive, forcing all invite resolution logic to check two locations and handle two different data models (one stateful with use counts, one stateless), which complicates implementation and future maintenance.

EVIDENCE: "ALTER `servers` ADD `invite_code` text UNIQUE ... GET /invites/:code — ... Resolve ad-hoc code OR servers.invite_code ... POST /invites/:code/join — ... conditional `UPDATE invites ...` (ad-hoc) OR resolve servers.invite_code (permanent, no use-limit)"

SUGGESTION: Unify the data model by representing all invites, including the permanent default for each server, within the single `invites` table to simplify the application logic.
