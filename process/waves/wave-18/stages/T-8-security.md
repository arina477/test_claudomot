# Wave 18 — T-8 Security (auto-promoted — wave touched channel authz)
```yaml
test_pattern: active
skipped: false
auto_promoted: true
auth_smoke: {negative: ["POST reply unauth 401", "GET replies unauth 401", "POST message unauth 401"]}
secret_grep_findings: []
findings:
  - {severity: resolved, category: idor, description: "createReply (L751) + listThreadReplies (L877) authz parent-derived canViewChannelById(userId, parent.channel_id); ?channelId= can't bypass (cross-channel mismatch → 400 first); 3 IDOR unit tests assert parent-channel call arg; live 401 on all thread routes. No residual IDOR."}
```
