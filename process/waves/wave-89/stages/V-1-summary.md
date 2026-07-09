# Wave 89 — V-1 Summary
- **Karen: APPROVE** — all 5 source claims + antipattern verified at b27277db: DRY academicInvalid derivation + scroll/focus on the error path (ProfilePage.tsx:347-383); button `disabled={academicSaving}` only (:1081, enabled on client error → reachable, B-6 fix confirmed); 5 fields with refs+aria-invalid; deploy serves b27277db (web 200, cf2cf979); 8 real merged tests (not.toBeDisabled + toHaveFocus + scrollIntoView spy + patchProfile not-called on error path); required checks green. Non-blocking: e2e red on pre-existing unrelated flakes.
- **jenny: APPROVE (with a MAJOR spec-gap finding)** — all 5 ACs MET against deployed code (diff b27277db..HEAD empty; web /settings/profile 200). BUT the wave's premise describes an UNREACHABLE state: every academic field has a native `maxLength` == the validator cap (blocks keyboard+paste over-length) AND server Zod `.max()` mirrors it, so `academicClientError` can NEVER become truthy through real user input. The tests exercise it only via `fireEvent.change` (jsdom bypasses maxLength). So the whole fix is CORRECT + HARMLESS but a NO-OP-IN-PRACTICE. Classified spec-GAP (not drift — code matches spec; the P-0 "gap LIVE" check verified the handler lacked focus, NOT whether the error state is enterable). Routed to V-2 non-blocking + asks head-verifier to reconcile.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
spec_drift_count: 0
spec_gap_count: 1
findings:
  - {source: jenny, severity: medium, item: "wave defends an unreachable state — native maxLength on academic fields prevents academicClientError from ever firing via real input; correct+harmless but no-op-in-practice; spec-gap in the seed premise, not a code defect"}
  - {source: karen, severity: low, item: "e2e red on pre-existing unrelated flakes (non-required)"}
```
