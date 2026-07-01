# Wave 28 — T-3 Contract (SKIPPED)

**Skip reason:** no shared contract surface. B-1 skipped — the rotate endpoint returns an inline DTO `{ invite_code: string }` on ServersController; no `@studyhall/shared` type, no Zod schema, no OpenAPI/GraphQL, no SDK. No client consumer this wave (regenerate-link UI is keep-OUT / demand-gated). There is nothing for a contract test to assert a parse-valid/parse-invalid case against.

```yaml
test_pattern: skipped
skipped: true
skip_reason: "no contract surface — inline DTO, B-1 skipped, no Zod/OpenAPI/shared-type/SDK change"
findings: []
```
