# Wave 15 — B-4 Wiring
```yaml
typecheck_passed: true
routes_registered:
  - "GET /me/mentions (MentionsController, registered in messaging.module)"
  - "message_mentions migration 0007 (applied at deploy)"
  - "MentionAutocomplete wired into MessageComposer; mention-pill in MessageList; unread badge in ChannelSidebar"
env_vars_wired: []
drift_defects:
  - "RESOLVED: B-2↔B-3 username drift — autocomplete inserted displayName-derived handle vs resolver matching users.username. Fixed: threaded username through ServerMember + listServerMembers + autocomplete insert + null-username exclusion. Chain closes end-to-end."
```
Repo typecheck 4/4 PASS. The integration check caught + fixed the load-bearing drift (autocomplete→resolver chain). 280 api + 135 web tests.
