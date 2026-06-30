# SDK Registry

Project-local index of every external SDK / third-party service / managed API integrated into this codebase. Maintained by `claudomat-brain/rules/external-sdk-integration-rules.md`.

Each row points at the SDK doc at `command-center/dev/SDK-Docs/<Name>/<name>.md` (rendered via the SDK-doc template at research-process Step 3).

---

## Registry

| SDK | SDK Doc | Official Docs | Version | Last verified |
|-----|---------|---------------|---------|---------------|
| supertokens-node | [`command-center/dev/SDK-Docs/SuperTokens/supertokens.md`](SuperTokens/supertokens.md) | https://supertokens.com/docs/emailpassword/introduction | 24.0.2 | 2026-06-26 |
| `livekit-server-sdk` · `@livekit/components-react` · `livekit-client` | [`command-center/dev/SDK-Docs/LiveKit/livekit.md`](LiveKit/livekit.md) | https://docs.livekit.io/ | server-sdk: 2.15.5 · components-react: 2.9.21 · livekit-client: 2.20.0 | 2026-06-26 |
| `resend` | [`command-center/dev/SDK-Docs/Resend/resend.md`](Resend/resend.md) | https://resend.com/docs/send-with-nodejs | 6.15.0 | 2026-06-26 |
| `@aws-sdk/client-s3` · `@aws-sdk/s3-request-presigner` (backend: Railway Buckets / Tigris) | [`command-center/dev/SDK-Docs/ObjectStorage/object-storage.md`](ObjectStorage/object-storage.md) | https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ | 3.1076.0 (installed: ^3.1075.0) | 2026-06-30 |

---

## When to update

- **Adding a new SDK** → research process creates SDK doc + adds row here.
- **Upgrading an SDK version** → re-research, rewrite "Official API Surface" + "Platform Compatibility", append to "Integration-Specific Findings", update registry row + "Last verified".
- **Wave shipped that hit a new gotcha** → append to that SDK doc's "Integration-Specific Findings" only. Registry row unchanged.
- **SDK process itself changes** → update `claudomat-brain/rules/external-sdk-integration-rules.md`, NOT this file.

---

## Schema

| Column | Format | Notes |
|---|---|---|
| `SDK` | Free text — display name | E.g., `supertokens-node`, `Stripe`, `Phosphor Icons` |
| `SDK Doc` | Markdown link | Format: `\`command-center/dev/SDK-Docs/<Name>/<name>.md\`` |
| `Official Docs` | Markdown link to live URL | Version-specific landing page |
| `Version` | Semver / CLI version / "MCP" | The exact installed version this doc was verified against |
| `Last verified` | YYYY-MM-DD | Date the research process last ran for this SDK |
