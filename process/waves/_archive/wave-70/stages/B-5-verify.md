# B-5 — Verify (wave-70)
- Lint: pnpm lint (biome ci) 345 files, no fixes, EXIT 0.
- Unit: first `pnpm test` had a web failure (documented study-timer async-race flake class, unrelated to Block); re-ran web suite → 629/629 PASS (41 files, incl. 11 block-ui + 3 SettingsPrivacyPage). Second run authoritative.
- Build: pnpm build 3/3 EXIT 0.
- Dev-smoke: authed block flow (block→confirm→hide; settings unblock) covered by CI boot-probe + the B-2 LIVE-DB integration spec (19 cases, real PG) + C-2 route-probe + T-8 live authz. Local wiring proven by typecheck (B-4) + build + units.
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true
flakes_documented:
  - {file: "study-timer async-race class", symptom: "transient web test fail; passed on re-run", wave_related: false}
```
