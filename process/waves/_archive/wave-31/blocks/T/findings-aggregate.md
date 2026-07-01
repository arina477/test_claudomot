# Wave 31 — T-block findings aggregate (V-2 input)
| id | sev | finding | disposition |
|---|---|---|---|
| F-31-T-1 | MEDIUM | malformed non-UUID channelId → HTTP 500 (canViewChannelById uuid-column 22P02) — PRE-EXISTING/wave-wide (same on wave-12 messages); no leak, no auth bypass | V-2 bug-security backlog; tracked task 4a92327c (ParseUUIDPipe project-wide). NOT a hard-stop (predates wave). |
| F-31-T-2 | LOW | controller spec "404 missing channel" asserts a path the SUT can't produce (now uniform 403) | L-1 reconciliation (404→403) |
| F-31-T-3 | LOW | controller JSDoc + useVoiceToken.ts still document/handle a 404 | L-1 doc reconciliation |
| F-31-T-4 | LOW | web tests query testId over role; weak anti-pattern-guard assertion (grep independently proves the guard) | T-2 principle candidate (L-2) |
