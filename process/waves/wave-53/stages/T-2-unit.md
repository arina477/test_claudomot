# T-2 — Unit (wave-53) — Pattern A (CI-verified)

- **C-1 evidence:** CI `test` job (run 28758318294) pass — unit portion `vitest run` green. Locally 717 api unit tests passed incl. the wave-53 cases.
- **New-surface coverage (audit):** the fix added dedicated unit cases —
  - `apps/api/src/common/uuid.util.spec.ts`: 8 cases (valid v4 → true; "abc"/""/"123"/SQL-ish/near-miss → false).
  - `apps/api/src/study-room/study-room.gateway.spec.ts`: UUID-1a/1b/1c (non-UUID serverId → generic join_error, no leak, DB-not-called), UUID-2 (create), UUID-3 (valid-UUID non-member → exact ForbiddenException), UUID-4 (unknown error → generic + logger detail, not `[object Object]`), UUID-4b (ConflictException message forwarded), UUID-5 (member regression), UUID-6 (join).
- **Honesty:** the no-leak assertions name the exact tokens that must be ABSENT (SQL text, table/column, userId); DB-not-called proves parse-layer rejection (not mock-the-SUT). Verified by karen + head-builder + code-reviewer.

```yaml
mask_mode_signoff: PASS
signoff_note: "unit suite green on CI; new fix cases assert no-leak + DB-not-called + HttpException forwarding"
test_pattern: ci-verified
evidence:
  - "C-1 test job (unit): run 28758318294 green; 717 api unit local"
findings: []
```
