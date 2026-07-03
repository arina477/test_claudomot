# Wave 42 — B-0 Branch & schema

- **Branch:** wave-42-assignment-submissions (from main, incl. P/D artifacts). Pushed to origin.
- **Tasks claimed:** db8e082a, 1746f72a, b859984b → in_progress.
- **Env:** no new env vars.
- **Deps:** none added.
- **Schema (sql-pro):** NEW `assignment_submissions` table in apps/api/src/db/schema/assignments.ts. Columns: id/assignment_id(FK→assignments ON DELETE CASCADE)/user_id(text, FK→users)/text/object_key/filename/content_type/size_bytes/submitted_at/returned_at(NULL)/organizer_comment(NULL)/created_at/updated_at. UNIQUE(assignment_id,user_id) + INDEX(assignment_id). returned_at + organizer_comment folded into initial CREATE (P-0 finding #2 — single migration).
- **Migration:** apps/api/drizzle/migrations/0019_sturdy_psylocke.sql (generated). Not applied to remote (applies at C-2).
- **Typecheck:** api tsc clean.
- **Deviations:** none.

```yaml
branch: wave-42-assignment-submissions
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0019_sturdy_psylocke.sql]
orm_models_changed: [apps/api/src/db/schema/assignments.ts]
backfill_ran: false
deviations: []
```
