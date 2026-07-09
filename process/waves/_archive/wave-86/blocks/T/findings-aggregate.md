# Wave 86 — T findings aggregate

## T-8 (Security, live) — NO security findings
Forged cookie-only cross-site POST rejected 401 (airtight same-route control); login unregressed; foreign-origin CORS rejected; antiCsrf:'NONE' live-correct. wave-49 F-2 resolved.
Operational (out-of-scope, filed to backlog): PATCH /servers/:id 500-on-malformed-body + no server-delete route + a benign leftover test row.
