# T-2 — Unit (wave-52)
**Pattern:** A (CI-verified).
- CI `test` job PASS on merge — api **690** (40 study-room service: create/join/leave, roster dedup, empty-room removal, non-member 403, **in-memory CAS idempotency (arm/fire-twice/one-advance)**, timeout cleanup, room-timer-not-touching-server-timer, creator-auto-join count 1 + removed-on-leave/disconnect; wave-49 study-timer 36/36 intact = parity) + web **448** (26: studyRoomSocket namespace assertion + reconnect, FocusRoomPanel states/create→joined/roster-live/leave/room-vanished/a11y).
- Coverage: every new surface + the 3 MUST-locks + the in-memory CAS + creator-auto-join covered. No new flakes (socket-autoconnect flake documented at B-5; CI per-package authoritative).
```yaml
test_pattern: ci-verified
skipped: false
evidence: ["C-1 test job PASS — api 690 + web 448"]
modules_audited: [study-room.service, study-room.gateway, FocusRoomPanel, studyRoomSocket]
new_flakes: []
findings: []
```
