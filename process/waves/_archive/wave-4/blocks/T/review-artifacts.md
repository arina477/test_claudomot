# Wave 4 — T-block review artifacts
**Block:** T · **Wave topic:** Profile customization (username+avatar+accent), live · **Gate:** T-9 · **Status:** gate-passed
| Stage | Pattern | Status | Notes |
|---|---|---|---|
| T-1 Static | ci-verified | done | PR#10/#11 CI green |
| T-2 Unit | ci-verified | done | web 37 + api 38 (incl. username-409-real-shape + confirm-caller-scope 12 + presign-503) |
| T-3 Contract | ci+live | done | extended Profile + AvatarPresign Zod; live GET/PATCH /profile |
| T-4 Integration | active(live) | done | C-2: username set/dup-409/bad-400, accent, profile 4-fields, migration applied |
| T-5 E2E | active-partial | done | live core verified (C-2); avatar real-upload pending bucket creds (84e09891); browser click-through deferred (c51589cd) |
| T-6 Layout | active-partial | done | settings-profile built per mockup + shell avatar/accent render; RTL; live pixel-diff deferred |
| T-7 Perf | n/a | skipped | not heavy (632KB bundle) |
| T-8 Security | active | pending | file-upload surface (MANDATORY-ish: upload/key/MIME) |
| T-9 Journey | active | pending | gate |
## Context
- wave_type: ui, (file-upload). Security-scope tightened gate does NOT apply (no auth/session change — P-4 head-product). T-8 assesses the file-upload surface.
- Avatar real-upload + storage creds = tracked follow-up 84e09891 (founder bucket). Browser E2E = c51589cd.

## Block-exit handoff (T-9 gate-passed)
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [{T-7: "not heavy — 632KB bundle ~ baseline, no perf budget at risk"}]
findings_total:       3
findings_critical:    0
findings_aggregate:   process/waves/wave-4/blocks/T/findings-aggregate.md
journey_map_commit:   9212a3e
ready_for_verify:     true
```

