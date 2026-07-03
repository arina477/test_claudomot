# Wave 38 — V-2 Triage

Both V-1 reviewers APPROVE; all 7 ACs pass live. No blocking findings — the wave is spec-conformant. F1 is a real UX gap but PRE-EXISTING + out-of-spec-scope (wave-38 spec is entirely backend/HTTP; crux works via the app's real fetch pipeline) → tracked, not blocking.

## Triage table
| ID | Source | Severity | Bucket | Disposition |
|---|---|---|---|---|
| F1 | T-5 + jenny | MAJOR | non-blocking | Task **c208e91e** (M7): wire profile-settings entry so avatar upload is reachable. Launch-relevant; likely next-wave seed. |
| F-T8-1 | T-8 | LOW | non-blocking | Task **7525b759** (M7): ParseUUIDPipe on GET /users/:id/avatar (NUL-byte → 500). |
| F-T8-2 | T-8 | LOW | non-blocking | Task **7525b759** (M7, bundled): catch missing-object on confirm (never-uploaded key → 500). |
| F3 | T-5 | LOW | noise | Orphaned oversize objects pre-confirm-reject — documented known-debt in files.service.ts (no GC by design). No task. |
| F2 | T-5 | INFRA | noise | Playwright MCP chrome-channel absent (recurring cross-wave, host-side .mcp.json fix). Not product. No task. |
| K-C2-overclaim | Karen | MEDIUM | noise | C-2 "404-proves-storage-live" reasoning flawed (404 fires before storage call). Storage-live IS authoritatively proven at T-5 + V-1 jenny (real anon round-trip). C-2 doc-text corrected inline. No functional impact. |

```yaml
findings_input_count: 6
findings_blocking: []
findings_non_blocking:
  - {id: F1, source: T5+jenny, summary: "avatar upload UI unreachable (dead settings button)", task_id: c208e91e, milestone_id: 6e2f68d8}
  - {id: F-T8-1+2, source: T8, summary: "avatar endpoints 500 on malformed/edge input", task_id: 7525b759, milestone_id: 6e2f68d8}
findings_noise:
  - {id: F3, rationale: "documented known-debt (orphan objects, no GC by design)"}
  - {id: F2, rationale: "host-side test-infra (Playwright MCP chrome channel), recurring cross-wave, not product"}
  - {id: K-C2-overclaim, rationale: "C-2 doc-text reasoning nit; storage-live authoritatively proven at T-5/V-1 jenny; text corrected inline"}
fast_fix_queue: []
b_block_re_entry_required: []
```
