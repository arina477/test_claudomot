verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Framing is sound and grounded in the real code. The seed's absence claims verify true against apps/api/src/db/schema/servers.ts (no is_public/description/topic columns; server_members carries the UNIQUE(server_id,user_id) join it relies on) and against servers.controller.ts (GET /servers -> findMyServers is member-scoped; no existing discover route or is_public reference). All three framing risks pass: (2) visibility is OPT-IN, not public-by-default — is_public boolean NOT NULL default false, existing servers stay private, no backfill exposes them; (3) one-click join is gated on servers.is_public=true SERVER-SIDE with 404/403 for non-public servers, reusing the real idempotent joinViaInvite membership core (INSERT ... ON CONFLICT DO NOTHING RETURNING) without weakening the invite path; (4) moderation/ranking/categories/trending are explicitly deferred to later M11 bundles. The fix operates at the cause layer (schema + directory API + membership authorization), not a surface symptom, and the three tasks form one coherent browse->see->join vertical rather than unrelated bundled changes.
proposed_reframe: |
  (n/a)
escalation_reason: |
  (n/a)
sibling_visible: false
