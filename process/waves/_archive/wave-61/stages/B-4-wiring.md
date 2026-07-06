# B-4 Wiring — wave-61
HttpError change touches the shared request()/requestNoContent() (all API callers). Verified no drift:
web tsc clean; api tsc clean; FULL web vitest 477/477 (no error-handling regression across all callers); api dm/messaging 152/152.
verdict: PASS
