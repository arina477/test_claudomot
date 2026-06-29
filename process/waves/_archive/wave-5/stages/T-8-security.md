# Wave 5 — T-8 Security (active — MANDATORY, security-tightened gate)
The rate-limit gap flagged at wave-2/wave-4 T-8 is now CLOSED + live-verified.
```yaml
test_pattern: active
applicable_probes: [rate_limit, file_upload, secret_grep, auth_smoke]
results:
  - "Rate-limit (839af17f, headline): LIVE-verified — >10 rapid POST /auth/signin → 200×10 then 429×8; /health unthrottled (200). In-memory sliding-window keyed on real client IP (XFF[0], behind Railway 2-hop proxy). PASS (closes the wave-2/wave-4 T-8 finding)."
  - "Avatar upload (84e09891): server-controlled user-scoped key, MIME allowlist (png/jpeg/webp), server-side 2MB (confirm-time HEAD → 413), caller-scoped confirm (wave-4 f7b205a). Code+unit verified; live upload pending founder bucket creds. PASS (code); live-deferred."
  - "Secret grep (wave-5 diff): clean (no committed creds; AWS_* env placeholders)."
  - "Auth smoke: signin wrong-creds → WRONG_CREDENTIALS (unchanged); session/cookies httpOnly+SameSite=None+Secure (wave-3)."
findings:
  - {severity: info, category: rate-limit, description: "in-memory store single-pod (horizontal-scale → H2 shared store, _library L423; Gemini-flagged, documented deferral)"}
  - {severity: info, category: avatar, description: "live upload verify pending founder Railway Bucket creds (84e09891)"}
```
T-8 PASS: rate-limit 429 LIVE (the security win); avatar surface secured (code); secrets clean. No critical/high.
