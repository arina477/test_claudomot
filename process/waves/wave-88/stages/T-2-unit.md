# Wave 88 — T-2 Unit
Pattern A. CI `test` job green on d0646058: 833/833 api unit incl. 5 new dm.service.spec cases (match→accept, mismatch→4xx no-insert/no-emit, no-key→fail-open, plaintext→no-check, read-path→no-revalidation). Load-bearing VERIFIED at B-5 (removing the production throw fails ONLY the mismatch case; fail-open still passes) — real tripwire, not coverage theater.
```yaml
test_pattern: ci-verified
evidence: ["CI test job green on d0646058: 833 api unit", "5 new AC unit tests + load-bearing revert-check verified B-5"]
findings: []
```
