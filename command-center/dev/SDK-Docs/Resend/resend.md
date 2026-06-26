# Resend Reference

**Last verified:** 2026-06-26
**Official docs:** https://resend.com/docs/send-with-nodejs
**GitHub:** https://github.com/resend/resend-node
**Installed version:** 6.15.0
**Install location:** `apps/api` (NestJS backend — `NotificationsModule` owner; SuperTokens Core also consumes a Resend key via its own server-side config)

---

## Official API Surface

### Public classes / functions

```ts
import { Resend } from 'resend';
```

One top-level named export: the `Resend` class.

### Constructor options

```ts
export interface ResendOptions {
  baseUrl?: string;   // override default https://api.resend.com (or RESEND_BASE_URL env var)
  userAgent?: string; // override default `resend-node:<version>` (or RESEND_USER_AGENT env var)
}

new Resend(key?: string, options?: ResendOptions)
```

- `key` — Resend API key (e.g. `re_abc123`). If omitted, falls back to `process.env.RESEND_API_KEY`. Throws `Error('Missing API key…')` if neither is present.
- Constructor sets `Authorization: Bearer <key>`, `User-Agent: resend-node:<version>`, `Content-Type: application/json` on every outbound request.

Source: [`src/resend.ts`](https://github.com/resend/resend-node/blob/main/src/resend.ts)

### Methods with signatures

#### `resend.emails.send` / `resend.emails.create`

`send` is an alias for `create`; both are equivalent.

```ts
resend.emails.send(
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions,
): Promise<CreateEmailResponse>
```

`CreateEmailOptions` (must include at least one of `react` | `html` | `text`, OR a `template` object; `from`, `to`, `subject` required for non-template sends):

```ts
{
  from:       string;               // required — "Name <addr@verified-domain.com>" or plain address
  to:         string | string[];    // required — max 50 recipients
  subject:    string;               // required
  html?:      string;
  text?:      string;
  react?:     React.ReactNode;      // rendered to HTML via @react-email/render at send time
  cc?:        string | string[];
  bcc?:       string | string[];
  replyTo?:   string | string[];
  headers?:   Record<string, string>;
  tags?:      { name: string; value: string }[];   // ASCII a-z A-Z 0-9 _ - ; max 256 chars each
  scheduledAt?: string;             // ISO 8601 — schedule future delivery
  topicId?:   string | null;        // Resend Topics feature
  attachments?: Attachment[];       // max 40 MB total per email
}
```

`Attachment`:

```ts
{
  content?:     string | Buffer;
  filename?:    string | false;
  path?:        string;
  contentType?: string;
  contentId?:   string;     // for inline (CID) references in HTML
}
```

`CreateEmailRequestOptions` extends `PostOptions` and `IdempotentRequest`:

```ts
{
  idempotencyKey?: string;   // sent as `Idempotency-Key` header
  headers?:        Record<string, string>;
}
```

`CreateEmailResponse` (all SDK responses share this shape):

```ts
type Response<T> =
  | { data: T; error: null; headers: Record<string, string> | null }
  | { data: null; error: ErrorResponse; headers: Record<string, string> | null }
```

Success:

```ts
{ data: { id: string }, error: null, headers: { ... } }
```

Error:

```ts
{ data: null, error: { name: RESEND_ERROR_CODE_KEY; statusCode: number | null; message: string }, headers: { ... } }
```

The SDK **never throws**. Check `error !== null` on every call.

Source: [`src/emails/emails.ts`](https://github.com/resend/resend-node/blob/main/src/emails/emails.ts), [`src/emails/interfaces/create-email-options.interface.ts`](https://github.com/resend/resend-node/blob/main/src/emails/interfaces/create-email-options.interface.ts)

#### `resend.batch.send` / `resend.batch.create`

```ts
resend.batch.send(
  payload: CreateBatchEmailOptions[],   // array of email objects; no attachments, no scheduledAt
  options?: CreateBatchRequestOptions,
): Promise<CreateBatchResponse>
```

`CreateBatchRequestOptions`:

```ts
{
  idempotencyKey?:   string;
  batchValidation?:  'strict' | 'permissive';  // default 'strict'
}
```

Success shape:

```ts
{ data: { data: { id: string }[] }, error: null, headers: { ... } }
```

In `permissive` mode, `data.errors[{ index, message }]` is also present for per-email failures.

Limitations (from official docs): batch does not support `attachments` or `scheduledAt`.

Source: [`src/batch/batch.ts`](https://github.com/resend/resend-node/blob/main/src/batch/batch.ts), [`src/batch/interfaces/create-batch-options.interface.ts`](https://github.com/resend/resend-node/blob/main/src/batch/interfaces/create-batch-options.interface.ts)

#### `resend.domains.*` — domain verification API

```ts
resend.domains.create({ name: 'studyhall.app', region?: DomainRegion })
resend.domains.get(id: string)
resend.domains.list()
resend.domains.verify(id: string)   // trigger DNS re-check
resend.domains.update({ id, clickTracking?, openTracking?, tls? })
resend.domains.remove(id: string)
```

`DomainRegion`: `'us-east-1' | 'eu-west-1' | 'sa-east-1' | 'ap-northeast-1'`

`domains.create` response includes `records: DomainRecords[]` — the SPF, DKIM, and optionally MX DNS records to add at the registrar. `DomainStatus` values: `'pending' | 'verified' | 'failed' | 'not_started' | 'partially_verified' | 'partially_failed'`.

Source: [`src/domains/domains.ts`](https://github.com/resend/resend-node/blob/main/src/domains/domains.ts), [`src/domains/interfaces/domain.ts`](https://github.com/resend/resend-node/blob/main/src/domains/interfaces/domain.ts)

#### `resend.webhooks.*` — webhook management + verification

Webhook signature verification uses the `standardwebhooks` library (bundled as a direct dep). The SDK's `Webhooks` class wraps it:

```ts
resend.webhooks.verify({
  payload:       string,              // raw request body string
  headers:       { id, timestamp, signature },
  webhookSecret: string,              // from RESEND_WEBHOOK_SECRET env var
})
```

Source: [`src/webhooks/webhooks.ts`](https://github.com/resend/resend-node/blob/main/src/webhooks/webhooks.ts)

---

### Runtime literals table

Values the SDK owns at runtime. Hardcoding any of these wrong = silent prod failure.

| Category | Value | Source / Citation |
|---|---|---|
| **Env var — API key** | `RESEND_API_KEY` — read by constructor when no key argument is passed | [`src/resend.ts` line `process.env.RESEND_API_KEY`](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **Env var — base URL override** | `RESEND_BASE_URL` — overrides `https://api.resend.com` for the SDK instance | [`src/resend.ts` `getDefaultBaseUrl()`](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **Env var — user-agent override** | `RESEND_USER_AGENT` — overrides `resend-node:<version>` for the SDK instance | [`src/resend.ts` `getDefaultUserAgent()`](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **StudyHall-specific env vars** | `RESEND_API_KEY_AUTH` (key for SuperTokens Core email config) and `RESEND_API_KEY_NOTIFY` (key for `NotificationsModule`) — TWO separate Resend API keys per the v6b architecture decision; see `command-center/dev/architecture/sdks.md` § R-SDK-8 and cross-branch decision 9 | Architecture decision recorded in `command-center/dev/architecture/_library.md` § Cross-domain resolved decisions |
| **Env var — from address config** | `RESEND_FROM_ADDRESS` — project-defined; value must be an address on a domain verified in the Resend dashboard (e.g. `noreply@studyhall.app`) | Project convention; enforced by Resend API at send time |
| **Env var — webhook secret** | `RESEND_WEBHOOK_SECRET` — project-defined; optional at MVP; used in `resend.webhooks.verify()` | Project convention per `sdks.md` |
| **API base URL** | `https://api.resend.com` (global endpoint; no per-region send endpoint) | [`src/resend.ts`](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **API key prefix** | `re_` — all Resend API keys begin with `re_` (observed in official test suite and docs) | [`src/resend.spec.ts`](https://github.com/resend/resend-node/blob/main/src/resend.spec.ts) |
| **HTTP headers set by SDK** | `Authorization: Bearer <key>`, `User-Agent: resend-node:<version>`, `Content-Type: application/json` | [`src/resend.ts` constructor](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **Idempotency header** | `Idempotency-Key` — set on `POST /emails` and `POST /emails/batch` when `idempotencyKey` option is provided | [`src/resend.ts` `post()` method](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **Batch validation header** | `x-batch-validation: strict` (default) or `permissive` — set on `POST /emails/batch` | [`src/batch/batch.ts`](https://github.com/resend/resend-node/blob/main/src/batch/batch.ts) |
| **Cookie names** | N/A — verified SDK does not own any cookies | N/A |
| **Cookie prefixes** | N/A — verified SDK does not set cookies | N/A |
| **JWT/JWE claims** | N/A — verified SDK does not issue or verify JWTs | N/A |
| **Error codes (RESEND_ERROR_CODE_KEY)** | `invalid_idempotency_key`, `validation_error`, `missing_api_key`, `restricted_api_key`, `invalid_api_key`, `not_found`, `method_not_allowed`, `invalid_idempotent_request`, `concurrent_idempotent_requests`, `invalid_attachment`, `invalid_from_address`, `invalid_access`, `invalid_parameter`, `invalid_region`, `missing_required_field`, `monthly_quota_exceeded`, `daily_quota_exceeded`, `rate_limit_exceeded`, `security_error`, `application_error`, `internal_server_error` | [`src/interfaces.ts`](https://github.com/resend/resend-node/blob/main/src/interfaces.ts) |
| **Rate-limit headers** | The SDK passes all response headers through to the caller in `result.headers`. The Resend API returns standard rate-limit headers (documented at `https://resend.com/docs/api-reference/introduction#rate-limit`) — headers are surfaced to the caller but the SDK does not parse or act on them automatically; callers inspect `result.headers` directly | [`src/resend.ts` `fetchRequest`](https://github.com/resend/resend-node/blob/main/src/resend.ts) — `Object.fromEntries(response.headers.entries())` |
| **Version negotiation string** | `User-Agent: resend-node:<version>` — sent on every API request (e.g. `resend-node:6.15.0`) | [`src/resend.ts` `defaultUserAgent`](https://github.com/resend/resend-node/blob/main/src/resend.ts) |
| **Log line formats** | N/A — verified SDK does not emit structured logs; no `console.log`/`pino` calls in SDK source | N/A |
| **Default ports / paths / callbacks** | API base path: `https://api.resend.com`; endpoint paths: `/emails`, `/emails/batch`, `/emails/:id`, `/domains`, `/domains/:id/verify`, `/webhooks` — no configurable callback URL for sending | [`src/resend.ts`](https://github.com/resend/resend-node/blob/main/src/resend.ts), endpoint paths in each resource class |

---

## Platform Compatibility

### Railway (Node.js / NestJS server runtime — `apps/api`)

The `resend` package requires **Node.js >= 20** (declared in `engines` in `package.json`). The project pins Node v22 (`.nvmrc`), which satisfies this constraint.

The SDK uses the native `fetch` API internally (no `node-fetch` or `axios` dependency). Node v22 ships native `fetch`; no polyfill needed.

**NestJS initialization pattern** — `NotificationsModule` instantiates a single `Resend` client as an `@Injectable()` provider:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendClient {
  readonly client: Resend;

  constructor(config: ConfigService) {
    this.client = new Resend(config.get<string>('RESEND_API_KEY_NOTIFY'));
  }
}
```

**Env var injection on Railway:** Set `RESEND_API_KEY_AUTH` and `RESEND_API_KEY_NOTIFY` as Railway service environment variables (Railway dashboard → api service → Variables). The SDK picks up `RESEND_API_KEY` automatically only when the key argument is omitted; for the two-key pattern, pass the key explicitly from `ConfigService`.

**SuperTokens Core email config:** SuperTokens Core is a separate Railway service. Configure it with `RESEND_API_KEY_AUTH` via the SuperTokens Core dashboard or Core config file. This is a Core-side config step (not a NestJS code change). See SuperTokens docs at https://supertokens.com/docs/emailpassword/email-delivery/resend for the Core + Resend integration.

**DNS records required before sending** from `studyhall.app`:

| Record type | Purpose | Added by |
|---|---|---|
| `SPF` (TXT at root) | Authorizes Resend to send on behalf of `studyhall.app` | Founder at domain registrar |
| `DKIM` (CNAME or TXT — Resend provides the values after domain creation) | Cryptographically signs outbound messages | Founder at domain registrar |
| `DMARC` (TXT at `_dmarc.studyhall.app`) | Policy for SPF/DKIM failures — recommended for deliverability | Founder at domain registrar |

DNS record exact values are returned by `resend.domains.create({ name: 'studyhall.app' })` in the `records` array. Domain verification is checked with `resend.domains.verify(domainId)` or via the Resend dashboard.

**Temporary from address for first deploy (pre-verification):** Resend provides `onboarding@resend.dev` as a no-verify-required sending address for test/dev. Must be replaced with a verified `studyhall.app` address before any external cohort receives email. See `sdks.md` § R-SDK-2.

---

## Known Gotchas

**1. Domain verification is mandatory before sending from a custom domain.**
Sending `from` an address on an unverified domain returns `{ error: { name: 'invalid_from_address', ... } }`. The Resend dashboard and `resend.domains.*` API both surface the domain status. `onboarding@resend.dev` bypasses this for initial testing but is not for production use.
Source: https://resend.com/docs/send-with-nodejs (note in README) and official API error codes.

**2. `from` address format — domain must match a verified domain exactly.**
`"StudyHall <noreply@studyhall.app>"` is valid if `studyhall.app` is verified. Subdomains (`mail.studyhall.app`) require separate domain verification records. Mismatch → `invalid_from_address` error.
Source: [`create-email-options.interface.ts` JSDoc comment](https://github.com/resend/resend-node/blob/main/src/emails/interfaces/create-email-options.interface.ts)

**3. The SDK never throws — always check `error !== null`.**
All methods return `{ data, error }`. An error response from the API, a network failure, or a JSON parse error all surface via `error`, not via a thrown exception. Only `new Resend()` throws (missing API key). Wrap all calls with `if (error)` branches.
Source: [`src/resend.ts` `fetchRequest`](https://github.com/resend/resend-node/blob/main/src/resend.ts)

**4. Rate limits — free plan: 100 emails/day, 3,000/month.**
Exceeding the daily limit returns `{ error: { name: 'daily_quota_exceeded' } }`. Exceeding the monthly limit returns `{ error: { name: 'monthly_quota_exceeded' } }`. For `rate_limit_exceeded` (burst rate limiting), the API returns HTTP 429 and surfaces as `{ error: { name: 'rate_limit_exceeded' } }`. The SDK surfaces all response headers in `result.headers` — callers can inspect Resend's rate-limit headers there if needed (exact header names: documented at https://resend.com/docs/api-reference/introduction#rate-limit).
Source: [`src/interfaces.ts` RESEND_ERROR_CODE_KEY enum](https://github.com/resend/resend-node/blob/main/src/interfaces.ts)

**5. Batch send does not support `attachments` or `scheduledAt`.**
These fields are omitted from `CreateBatchEmailOptions` (Omit type). Passing them has no effect. Use individual `emails.send()` calls for emails that require attachments.
Source: [`src/batch/interfaces/create-batch-options.interface.ts` JSDoc + Omit type](https://github.com/resend/resend-node/blob/main/src/batch/interfaces/create-batch-options.interface.ts)

**6. `react` body rendering happens at call time, not at construction.**
If `payload.react` is provided, the SDK calls `@react-email/render` to produce HTML synchronously before the API call. `@react-email/render` is a peer dependency — it must be installed separately (`pnpm add @react-email/components @react-email/render`). In `.ts` / `.js` files without JSX transpilation, use `import { jsx } from 'react/jsx-runtime'` instead of JSX syntax.
Source: [`src/emails/emails.ts`](https://github.com/resend/resend-node/blob/main/src/emails/emails.ts), readme.md note

**7. `audiences` property is deprecated in favor of `segments`.**
`resend.audiences` still exists but is marked `@deprecated`. Use `resend.segments` for managing contact lists.
Source: [`src/resend.ts`](https://github.com/resend/resend-node/blob/main/src/resend.ts)

**8. Node.js >= 20 required (native `fetch`).**
The SDK relies on the native `fetch` API. Node 18 ships an experimental `fetch` behind a flag; Node 20+ ships it stable. StudyHall uses Node 22, so this is satisfied. Do not run the SDK on Node 18 in production.
Source: [`package.json` `engines.node`](https://registry.npmjs.org/resend/6.15.0)

**9. Two Resend API keys for StudyHall (architecture decision).**
The v6b architecture calls for `RESEND_API_KEY_AUTH` (used by SuperTokens Core) and `RESEND_API_KEY_NOTIFY` (used by `NotificationsModule`). This is a StudyHall convention, not an SDK requirement. The SDK has no awareness of multiple keys — each `new Resend(key)` instance is scoped to the key it was initialized with.
Source: `command-center/dev/architecture/_library.md` § Resolved cross-branch decisions, decision 9 and 19; `sdks.md` § R-SDK-8.

---

## Documentation Links

- Getting Started (Node.js): https://resend.com/docs/send-with-nodejs
- API Reference — Send Email: https://resend.com/docs/api-reference/emails/send-email
- API Reference — Batch Send: https://resend.com/docs/api-reference/emails/send-batch-emails
- Domain Verification: https://resend.com/docs/dashboard/domains/introduction
- Rate Limits: https://resend.com/docs/api-reference/introduction#rate-limit
- Webhooks: https://resend.com/docs/dashboard/webhooks/introduction
- React Email (templating): https://react.email/docs/introduction
- SuperTokens + Resend Core config: https://supertokens.com/docs/emailpassword/email-delivery/resend
- GitHub repository: https://github.com/resend/resend-node
- GitHub Releases (CHANGELOG): https://github.com/resend/resend-node/releases
- npm: https://www.npmjs.com/package/resend

---

## Integration-Specific Findings

(Populated during and after implementation — what StudyHall learned from shipping.)

### Our adapter patterns

*(to be filled at B-block when `NotificationsModule` is implemented)*

### Env var configuration on our platforms

*(to be filled at B-block — Railway env var names, which service gets which key)*

### Bugs we hit and how we solved them

*(to be filled at L-1 Docs after wave ships)*

### What differed from the official docs

*(to be filled at L-1 Docs after wave ships)*
