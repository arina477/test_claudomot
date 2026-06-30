# T-3 — Contract (wave-21)
**Pattern A — project-internal, no new contract surface.** Wave reuses the wave-20 contracts verbatim: the `connectionState` 3-state union ('online'|'reconnecting'|'offline') from getSocketState(), the MessagesAfterResponse shape ({items, nextCursor}) from the wave-20 `?after=` route. No new shared Zod schema, no new route, no DTO change. ConnectionState type is co-located (ConnectionStateIndicator.tsx:14) and consumed by both the hook and the indicator — single source. No contract drift: B-6 cross-referenced the server cursor contract (messages.service.ts listMessagesAfter, strictly-> keyset, nextCursor=last-returned-row) and confirmed the client cursor decode matches.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "No new shared schema/route; reuses wave-20 MessagesAfterResponse + getSocketState 3-state union"
  - "B-6 confirmed client/server cursor contract match (strictly-> keyset)"
findings: []
head_signoff: {verdict: APPROVED, stage: T-3, failed_checks: [], rationale: "No new contract surface this wave; reused contracts verified consistent at B-6. Recorded, no gap.", next_action: PROCEED}
```
