# T-1 — Static (wave-49 study timer)

**Pattern:** A (verified-via-CI). Merge commit 3835100 (CI final green SHA b2f2bec).

## Action 1 — CI evidence
C-1 `verdict_evidence` confirms both static jobs green on the merge commit:
- **lint** (`biome ci .`) — PASS (run 28743577044).
- **typecheck** (tsc project refs) — PASS.

## Action 2 — Coverage audit
- Wave added `.ts` (api service/controller/module/gateway), `.tsx` (StudyTimerWidget), shared Zod contract — all under biome + tsc coverage; CI lint ran `biome ci .` (whole repo) so new files are covered.
- **Bypass grep on the wave diff (prod surface):** 0 bypasses in production study-timer code. The 4 grep hits are all in TEST files (`study-timer.service.spec.ts`: `db.select as unknown as MockFn` ×3, `emitter as any` mock injection) — standard mock-cast convention, acceptable, not a prod type escape.

## Action 3 — Discipline note
- biome's `noUnusedTemplateLiteral` flagged backtick SQL in the integration spec at C-1 (fixed cycle 1). No new lint rule warranted.
- **L-2 candidate (from C-1):** B-5 verify must run the CI-identical commands (`pnpm lint`==`biome ci .`, `pnpm test:ci`) before B-6 APPROVED — lint/test escapes reached C-1 this wave (B-5 deliverable was absent). Feed to L-2 / T-1.md.

## Action 4 — Mask-mode self-check
C-1 cites both lint + typecheck on merge commit ✓; bypass grep ran ✓; findings concrete ✓.

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job (biome ci .): PASS on b2f2bec"
  - "C-1 typecheck job (tsc project refs): PASS on b2f2bec"
findings: []
ts_bypasses_in_wave_diff: 0   # (prod surface; 4 test-file mock casts excluded)
```
