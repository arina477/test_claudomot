# Wave 35 — T-2 Unit (Pattern A — ci-verified)
CI test job green on merge commit: **326/327** (1 pre-existing server-roles flake, wave-35-untouched, passes in isolation — documented B-5). Coverage audit: **no NEW unit tests added for the wave's privacy logic** (toUiVisibility mapping, updatePrivacy, account-data aggregation, beforeSend PII scrub). Finding recorded (coverage-gap, MEDIUM) → findings-aggregate.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green 326/327 (0c71585)"]
findings: [{severity: MEDIUM, location: "privacy module + SettingsPrivacyPage", description: "no new unit tests for wave privacy logic"}]
