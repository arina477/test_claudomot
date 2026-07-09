# Wave 82 — T-2 Unit
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence:
  - "C-1 PR #101 test job: pass (2m4s) — 762 web tests, 57 files"
  - "14 new: refreshAndRetry.test.ts (11) + AuthGuard.test.tsx (3, incl. dominant-path NOT_EXISTS-then-settle + genuine-logout + bounded)"
findings: []
```
Coverage audit: the new machinery is unit-covered on the PRODUCTION-DOMINANT path (attemptRefresh→false→settle→doesSessionExist true → no redirect), genuine-logout (stays false → redirect), single-flight (N concurrent → 1 refresh), retry-once, resolution-to-200, 429/offline pass-through. B-6 attempt-1 REWORK specifically added the dominant-path test that the original suite missed.
