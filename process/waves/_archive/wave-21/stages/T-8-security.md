# T-8 — Security (wave-21)
**Light — frontend-only, NO new server surface; recorded.** The `?after=` catch-up route + its auth (single @Get @UseGuards(AuthGuard, ChannelMessageGuard) route-agnostic default-deny; channelId from route params; IDOR-closed) shipped wave-20 — unchanged this wave. The connection-state hook (useConnectionState.ts) is **client-local** (reads getSocketState + navigator.onLine + window events) — no authz surface, no new endpoint, no secret. The multi-page catch-up is a client-side CONSUMER of the existing route — no new authz door, no new IDOR vector. gitleaks (secret-scan) conclusion=success on merge SHA (no secret in diff). No JWT/session lifecycle change. T-8 skip-rule would permit skip (non-auth wave), but recorded explicitly given the offline/sync surface.

```yaml
test_pattern: active
skipped: false
evidence:
  - "Frontend-only; ?after= route + auth shipped wave-20 unchanged"
  - "useConnectionState client-local — no authz/secret/endpoint surface"
  - "gitleaks secret-scan conclusion=success on 106e70e"
findings: []
head_signoff: {verdict: APPROVED, stage: T-8, failed_checks: [], rationale: "No new server authz/secret surface; catch-up consumes the wave-20 default-deny ?after= route; connection-state hook is client-local; gitleaks clean. Recorded.", next_action: PROCEED}
```
